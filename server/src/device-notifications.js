/**
 * Powiadomienia push: koniec cyklu AGD (SmartThings) + próg mocy gniazdka (Tuya).
 * Cron woła pollCycleDevices co 5 min; progi mocy sprawdzane w collectEnergySnapshots co 15 min.
 */
import { getFreshAccessToken } from './smartthings/credentials.js'
import { getStDeviceStatus } from './smartthings/client.js'
import { mapStStatus } from './smartthings/status.js'

const CYCLE_TYPES = new Set(['washer', 'dryer', 'dishwasher'])

const CYCLE_TYPE_LABEL = {
  washer: 'Pralka',
  dryer: 'Suszarka',
  dishwasher: 'Zmywarka',
}

/** Edge-trigger: powiadom tylko przy przejściu z pracy/pauzy na „gotowe". */
export function shouldNotifyCycleComplete(prevState, newState) {
  return newState === 'finished' && (prevState === 'running' || prevState === 'paused')
}

/** Edge-trigger: powiadom gdy moc przekroczyła próg (poprzednio była poniżej). */
export function shouldNotifyPowerAbove(prevAbove, nowAbove) {
  return nowAbove === true && prevAbove !== true
}

/** Edge-trigger: powiadom gdy moc spadła poniżej progu (poprzednio była powyżej). */
export function shouldNotifyPowerBelow(prevBelow, nowBelow) {
  return nowBelow === true && prevBelow !== true
}

/**
 * Odpytuje aktywne urządzenia ST z włączonymi alertami cyklu.
 * @param {import('@neondatabase/serverless').NeonQueryFunction} sql
 * @param {Uint8Array} rawKey
 * @param {{ clientId: string, clientSecret: string, notifyCycleComplete?: (payload: object) => Promise<object> }} deps
 */
export async function pollCycleDevices(sql, rawKey, { clientId, clientSecret, notifyCycleComplete }) {
  const devices = await sql`
    SELECT sd.id, sd.household_id, sd.external_device_id, sd.display_name, sd.device_type,
           sd.last_cycle_state, sd.cycle_labels
    FROM smart_devices sd
    WHERE sd.is_active = true
      AND sd.provider = 'smartthings'
      AND sd.cycle_notify_enabled = true
      AND sd.device_type IN ('washer', 'dryer', 'dishwasher')
  `

  const ctxByHousehold = new Map()
  let checked = 0
  let notified = 0
  let failed = 0

  for (const d of devices) {
    try {
      let accessToken = ctxByHousehold.get(d.household_id)
      if (accessToken === undefined) {
        accessToken = await getFreshAccessToken(sql, {
          householdId: d.household_id,
          clientId,
          clientSecret,
          rawKey,
        })
        ctxByHousehold.set(d.household_id, accessToken)
      }
      if (!accessToken) {
        failed++
        continue
      }

      const status = await getStDeviceStatus({ accessToken }, d.external_device_id)
      const labels = d.cycle_labels && typeof d.cycle_labels === 'object'
        ? d.cycle_labels
        : d.cycle_labels
          ? JSON.parse(d.cycle_labels)
          : null
      const mapped = mapStStatus(status, d.device_type, labels)
      const newState = mapped.state || 'unknown'
      const prevState = d.last_cycle_state

      if (shouldNotifyCycleComplete(prevState, newState) && notifyCycleComplete) {
        await notifyCycleComplete({
          householdId: d.household_id,
          deviceName: d.display_name,
          deviceType: d.device_type,
        })
        notified++
      }

      if (newState !== prevState) {
        await sql`
          UPDATE smart_devices SET last_cycle_state = ${newState}, updated_at = NOW()
          WHERE id = ${d.id}
        `
      }
      checked++
    } catch (err) {
      console.warn('[cycle-notify] device skipped', d.external_device_id, err)
      failed++
    }
  }

  return { checked, notified, failed }
}

export { CYCLE_TYPES, CYCLE_TYPE_LABEL }
