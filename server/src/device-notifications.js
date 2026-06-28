/**
 * Powiadomienia push: koniec cyklu AGD (SmartThings) + próg mocy gniazdka (Tuya).
 * Cron woła pollCycleDevices co 5 min; progi mocy sprawdzane w collectEnergySnapshots co 15 min.
 */
import { getFreshAccessToken } from './smartthings/credentials.js'
import { getStDeviceStatus } from './smartthings/client.js'
import {
  extractCycleSignals,
  isCycleActivelyRunning,
  isCycleJobComplete,
  mapStStatus,
} from './smartthings/status.js'

const CYCLE_TYPES = new Set(['washer', 'dryer', 'dishwasher'])

const CYCLE_TYPE_LABEL = {
  washer: 'Pralka',
  dryer: 'Suszarka',
  dishwasher: 'Zmywarka',
}

/** @param {object|null|undefined} raw jsonb z last_cycle_snapshot */
export function parseCycleSnapshot(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    machineState: raw.machineState ?? null,
    jobState: raw.jobState ?? null,
    operatingState: raw.operatingState ?? null,
  }
}

function snapshotsEqual(a, b) {
  if (!a && !b) return true
  if (!a || !b) return false
  return a.machineState === b.machineState
    && a.jobState === b.jobState
    && a.operatingState === b.operatingState
}

/**
 * Edge-trigger na surowych sygnałach ST (Samsung: `finish` → `none` w sekundach).
 * Łapie też run→stop gdy faza job zdąży wrócić do `none` przed kolejnym pollem.
 */
export function shouldNotifyCycleComplete(prev, curr) {
  if (!curr || !prev) return false

  const prevActive = isCycleActivelyRunning(prev)
  const currComplete = isCycleJobComplete(curr.jobState, curr.operatingState)
  const prevComplete = isCycleJobComplete(prev.jobState, prev.operatingState)

  if (currComplete && !prevComplete && prevActive) return true
  if (curr.operatingState === 'finished' && prev.operatingState !== 'finished' && prevActive) return true

  if (
    prevActive &&
    !isCycleActivelyRunning(curr) &&
    (prev.machineState === 'run' || prev.machineState === 'pause') &&
    curr.machineState === 'stop'
  ) {
    return true
  }

  return false
}

/** UI-state do last_cycle_state (CHECK constraint w DB). */
export function cycleUiStateFromSignals(signals) {
  if (!signals) return 'unknown'
  if (signals.machineState === 'run') return 'running'
  if (signals.machineState === 'pause') return 'paused'
  if (isCycleJobComplete(signals.jobState, signals.operatingState)) return 'finished'
  return 'idle'
}

/**
 * Aktualizuje snapshot cyklu i ewentualnie wysyła push o końcu prania.
 * @returns {Promise<{ notified: boolean }>}
 */
export async function applyCycleStateUpdate(sql, device, rawStStatus, notifyCycleComplete) {
  const type = device.device_type
  if (!CYCLE_TYPES.has(type)) return { notified: false }

  const curr = extractCycleSignals(rawStStatus, type)
  if (!curr) return { notified: false }

  const prev = parseCycleSnapshot(device.last_cycle_snapshot)
  let notified = false

  if (
    device.cycle_notify_enabled &&
    shouldNotifyCycleComplete(prev, curr) &&
    notifyCycleComplete
  ) {
    await notifyCycleComplete({
      householdId: device.household_id,
      deviceName: device.display_name,
      deviceType: type,
    })
    notified = true
  }

  const uiState = cycleUiStateFromSignals(curr)
  const snapshotJson = JSON.stringify(curr)

  if (!snapshotsEqual(prev, curr) || device.last_cycle_state !== uiState) {
    await sql`
      UPDATE smart_devices
      SET last_cycle_snapshot = ${snapshotJson}::jsonb,
          last_cycle_state = ${uiState},
          updated_at = NOW()
      WHERE id = ${device.id}
    `
  }

  return { notified }
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
           sd.last_cycle_state, sd.last_cycle_snapshot, sd.cycle_notify_enabled, sd.cycle_labels
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
      const { notified: n } = await applyCycleStateUpdate(sql, d, status, notifyCycleComplete)
      if (n) notified++

      checked++
    } catch (err) {
      console.warn('[cycle-notify] device skipped', d.external_device_id, err)
      failed++
    }
  }

  return { checked, notified, failed }
}

export { CYCLE_TYPES, CYCLE_TYPE_LABEL }
