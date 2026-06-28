import { buildPushHTTPRequest } from '@pushforge/builder'

/** Tekst powiadomienia o włączeniu/wyłączeniu klimy. */
export function formatAcPowerPushMessage({ action, deviceName, outdoorTemp, source }) {
  const on = action === 'on'
  const title = on ? 'Klimatyzacja włączona' : 'Klimatyzacja wyłączona'
  const device = deviceName?.trim() || 'Klima'
  const tempPart =
    outdoorTemp != null && Number.isFinite(Number(outdoorTemp))
      ? ` · ${Number(outdoorTemp).toFixed(1).replace(/\.0$/, '')}°C na zewnątrz`
      : ''
  const sourcePart =
    source === 'thermostat'
      ? ' (termostat)'
      : source === 'timer'
        ? ' (wyłącznik czasowy)'
        : source === 'manual'
          ? ' (ręcznie)'
          : ''
  const body = `${device}${tempPart}${sourcePart}`
  return { title, body }
}

/** Tekst powiadomienia o zakończeniu cyklu AGD. */
export function formatCycleCompletePushMessage({ deviceName, deviceType }) {
  const typeLabel =
    deviceType === 'dryer' ? 'Suszarka'
      : deviceType === 'dishwasher' ? 'Zmywarka'
        : 'Pralka'
  const title = `${typeLabel} — cykl zakończony`
  const device = deviceName?.trim() || typeLabel
  const body = `${device} zakończyła pracę.`
  return { title, body }
}

/** Tekst powiadomienia o progu mocy gniazdka (powyżej / poniżej). */
export function formatPlugPowerPushMessage({ deviceName, powerW, thresholdW, direction = 'above' }) {
  const above = direction !== 'below'
  const title = above ? 'Gniazdko — wysoki pobór mocy' : 'Gniazdko — niski pobór mocy'
  const device = deviceName?.trim() || 'Gniazdko'
  const w = Number(powerW)
  const t = Number(thresholdW)
  const powerPart = Number.isFinite(w) ? `${Math.round(w)} W` : '—'
  const thresholdPart = Number.isFinite(t) ? `${Math.round(t)} W` : '—'
  const cmp = above ? '>' : '<'
  const body = `${device}: ${powerPart} (${cmp} ${thresholdPart})`
  return { title, body }
}

function parsePrivateJwk(raw) {
  if (!raw?.trim()) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function pushConfigured(env) {
  return Boolean(env?.VAPID_PUBLIC_KEY?.trim() && parsePrivateJwk(env?.VAPID_PRIVATE_JWK))
}

async function sendPushToSubscriptions(sql, env, rows, { title, body, url, tag = 'ac-power' }) {
  if (!rows.length) return { sent: 0, failed: 0, removed: 0, reason: 'no_subscriptions' }

  const privateJWK = parsePrivateJwk(env.VAPID_PRIVATE_JWK)
  const adminContact = env.PUSH_ADMIN_CONTACT?.trim() || 'mailto:support@homecashflow.org'

  let sent = 0
  let failed = 0
  const staleIds = []

  for (const row of rows) {
    try {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      }
      const { endpoint, headers, body: reqBody } = await buildPushHTTPRequest({
        privateJWK,
        subscription,
        message: {
          payload: { title, body, url, tag },
          adminContact,
          options: { urgency: 'normal', ttl: 86400, topic: tag },
        },
      })
      const res = await fetch(endpoint, { method: 'POST', headers, body: reqBody })
      if (res.ok || res.status === 201) {
        sent++
        continue
      }
      if (res.status === 404 || res.status === 410) {
        staleIds.push(row.id)
        continue
      }
      console.warn('[push] delivery failed', res.status, row.endpoint?.slice(0, 60))
      failed++
    } catch (err) {
      console.warn('[push] send error', err)
      failed++
    }
  }

  if (staleIds.length) {
    await sql`DELETE FROM push_subscriptions WHERE id = ANY(${staleIds}::uuid[])`
  }

  return { sent, failed, removed: staleIds.length }
}

/**
 * Powiadomienie testowe / pojedynczego użytkownika.
 */
export async function notifyUserPush(sql, env, userId, { title, body, url = '/?view=urzadzenia' }) {
  if (!pushConfigured(env)) return { sent: 0, skipped: true, reason: 'not_configured' }

  const rows = await sql`
    SELECT id, endpoint, p256dh, auth
    FROM push_subscriptions
    WHERE user_id = ${userId} AND ac_power_notify = true
  `
  return sendPushToSubscriptions(sql, env, rows, { title, body, url, tag: 'push-test' })
}

/**
 * @param {import('@neondatabase/serverless').NeonQueryFunction} sql
 * @param {{ VAPID_PUBLIC_KEY?: string, VAPID_PRIVATE_JWK?: string, PUSH_ADMIN_CONTACT?: string }} env
 * @param {{ householdId: string, action: 'on'|'off', deviceName?: string, outdoorTemp?: number|null, source?: string }} payload
 */
export async function notifyHouseholdAcPower(sql, env, payload) {
  if (!pushConfigured(env)) return { sent: 0, skipped: true, reason: 'not_configured' }

  const { householdId, action, deviceName, outdoorTemp, source } = payload
  if (action !== 'on' && action !== 'off') return { sent: 0, skipped: true, reason: 'invalid_action' }

  const rows = await sql`
    SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
    FROM push_subscriptions ps
    JOIN household_members hm ON hm.user_id = ps.user_id
    WHERE hm.household_id = ${householdId}
      AND ps.ac_power_notify = true
  `
  const { title, body } = formatAcPowerPushMessage({ action, deviceName, outdoorTemp, source })
  const result = await sendPushToSubscriptions(sql, env, rows, {
    title,
    body,
    url: '/?view=urzadzenia',
    tag: 'ac-power',
  })
  if (result.sent === 0 && !result.skipped) {
    console.warn('[push] ac-power: nothing delivered', { householdId, action, ...result })
  }
  return result
}

/**
 * @param {import('@neondatabase/serverless').NeonQueryFunction} sql
 * @param {{ VAPID_PUBLIC_KEY?: string, VAPID_PRIVATE_JWK?: string, PUSH_ADMIN_CONTACT?: string }} env
 * @param {{ householdId: string, deviceName?: string, deviceType?: string }} payload
 */
export async function notifyHouseholdCycleComplete(sql, env, payload) {
  if (!pushConfigured(env)) return { sent: 0, skipped: true, reason: 'not_configured' }

  const { householdId, deviceName, deviceType } = payload
  const rows = await sql`
    SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
    FROM push_subscriptions ps
    JOIN household_members hm ON hm.user_id = ps.user_id
    WHERE hm.household_id = ${householdId}
      AND ps.washer_cycle_notify = true
  `
  const { title, body } = formatCycleCompletePushMessage({ deviceName, deviceType })
  const result = await sendPushToSubscriptions(sql, env, rows, {
    title,
    body,
    url: '/?view=urzadzenia',
    tag: 'washer-cycle',
  })
  if (result.sent === 0 && !result.skipped) {
    console.warn('[push] cycle-complete: nothing delivered', { householdId, ...result })
  }
  return result
}

/**
 * @param {import('@neondatabase/serverless').NeonQueryFunction} sql
 * @param {{ VAPID_PUBLIC_KEY?: string, VAPID_PRIVATE_JWK?: string, PUSH_ADMIN_CONTACT?: string }} env
 * @param {{ householdId: string, deviceName?: string, powerW: number, thresholdW: number, direction?: 'above'|'below' }} payload
 */
export async function notifyHouseholdPlugPower(sql, env, payload) {
  if (!pushConfigured(env)) return { sent: 0, skipped: true, reason: 'not_configured' }

  const { householdId, deviceName, powerW, thresholdW, direction = 'above' } = payload
  const rows = await sql`
    SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
    FROM push_subscriptions ps
    JOIN household_members hm ON hm.user_id = ps.user_id
    WHERE hm.household_id = ${householdId}
      AND ps.plug_power_notify = true
  `
  const { title, body } = formatPlugPowerPushMessage({ deviceName, powerW, thresholdW, direction })
  const tag = direction === 'below' ? 'plug-power-below' : 'plug-power-above'
  const result = await sendPushToSubscriptions(sql, env, rows, {
    title,
    body,
    url: '/?view=urzadzenia',
    tag,
  })
  if (result.sent === 0 && !result.skipped) {
    console.warn('[push] plug-power: nothing delivered', { householdId, ...result })
  }
  return result
}

export { pushConfigured }
