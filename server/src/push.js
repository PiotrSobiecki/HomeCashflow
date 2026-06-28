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

/**
 * @param {import('@neondatabase/serverless').NeonQueryFunction} sql
 * @param {{ VAPID_PUBLIC_KEY?: string, VAPID_PRIVATE_JWK?: string, PUSH_ADMIN_CONTACT?: string }} env
 * @param {{ householdId: string, action: 'on'|'off', deviceName?: string, outdoorTemp?: number|null, source?: string }} payload
 */
export async function notifyHouseholdAcPower(sql, env, payload) {
  if (!pushConfigured(env)) return { sent: 0, skipped: true }

  const { householdId, action, deviceName, outdoorTemp, source } = payload
  if (action !== 'on' && action !== 'off') return { sent: 0, skipped: true }

  const rows = await sql`
    SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
    FROM push_subscriptions ps
    JOIN household_members hm ON hm.user_id = ps.user_id
    WHERE hm.household_id = ${householdId}
      AND ps.ac_power_notify = true
  `
  if (!rows.length) return { sent: 0, failed: 0 }

  const privateJWK = parsePrivateJwk(env.VAPID_PRIVATE_JWK)
  const { title, body } = formatAcPowerPushMessage({ action, deviceName, outdoorTemp, source })
  const adminContact = env.PUSH_ADMIN_CONTACT?.trim() || 'mailto:support@homecashflow.org'
  const url = '/?view=urzadzenia'

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
          payload: { title, body, url, tag: 'ac-power', action },
          adminContact,
          options: { urgency: 'normal', ttl: 86400, topic: 'ac-power' },
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

export { pushConfigured }
