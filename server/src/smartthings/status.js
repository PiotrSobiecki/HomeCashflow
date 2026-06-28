/**
 * Deep module: surowy status SmartThings (GET /v1/devices/{id}/status) → jednolity
 * UI-model stanu. Czysta funkcja (testowalna na fixture'ach, bez sieci).
 * Sterowanie/komendy NIE tutaj — to Faza 4.
 *
 * @see https://developer.smartthings.com/docs/api/public#operation/getDeviceStatus
 */

import { readWasherSettings } from './washer.js'

/** Wartość atrybutu capability z komponentu `main` (lub null gdy brak). */
function attr(status, capability, attribute) {
  return status?.components?.main?.[capability]?.[attribute]?.value ?? null
}

// Capability cyklu per typ AGD (standardowa + samsungce z czasem pozostałym).
const CYCLE_CAPABILITY = {
  washer: 'washerOperatingState',
  dryer: 'dryerOperatingState',
  dishwasher: 'dishwasherOperatingState',
}

/** Samsung CE: jobState to fazy (`wash`, `finish`, `none`); standard ST używa `finished`. */
export function isCycleJobComplete(jobState, operatingState) {
  if (jobState === 'finished' || jobState === 'finish') return true
  if (operatingState === 'finished') return true
  return false
}

const ACTIVE_JOB_PHASES = new Set([
  'wash', 'washing', 'rinse', 'rinsing', 'spin', 'dry', 'drying', 'prewash', 'cooling', 'airwash',
])

/** Czy cykl AGD jest aktywnie w trakcie (Samsung + standard ST). */
export function isCycleActivelyRunning(signals) {
  if (!signals) return false
  const { machineState, jobState, operatingState } = signals
  if (machineState === 'run' || machineState === 'pause') return true
  if (operatingState === 'running' || operatingState === 'paused') return true
  if (jobState && ACTIVE_JOB_PHASES.has(jobState)) return true
  return false
}

/** Surowe sygnały cyklu AGD z odpowiedzi GET /devices/{id}/status (do edge-trigger push). */
export function extractCycleSignals(status, type) {
  const cap = CYCLE_CAPABILITY[type]
  if (!cap) return null
  const samsungCap = `samsungce.${cap}`
  return {
    machineState: attr(status, cap, 'machineState'),
    jobState: attr(status, samsungCap, `${type}JobState`) ?? attr(status, cap, `${type}JobState`),
    operatingState: attr(status, samsungCap, 'operatingState'),
  }
}

/** Mapowanie maszyny stanu AGD na UI-model (run/pause/stop). */
function mapCycleDevice(status, type, cycleLabels) {
  const cap = CYCLE_CAPABILITY[type]
  const samsungCap = `samsungce.${cap}`
  const signals = extractCycleSignals(status, type)
  const machineState = signals?.machineState
  const jobState = signals?.jobState
  const operatingState = signals?.operatingState
  const remainingMin = attr(status, samsungCap, 'remainingTime')
  const completionTime = attr(status, cap, 'completionTime')
  // Ustawienia cyklu (temperatura/wirowanie/płukanie/namaczanie/program) — tylko pralka.
  const settings = type === 'washer' ? readWasherSettings(status, cycleLabels) : null

  if (machineState === 'run') {
    return { type, state: 'running', label: 'W trakcie', remainingMin, completionTime, settings }
  }
  if (machineState === 'pause') {
    return { type, state: 'paused', label: 'Pauza', remainingMin, completionTime, settings }
  }
  // stop: świeżo zakończony cykl (jobState finish/finished lub operatingState finished) → „Gotowe".
  if (isCycleJobComplete(jobState, operatingState)) {
    return { type, state: 'finished', label: 'Gotowe', remainingMin: null, completionTime: null, settings }
  }
  return { type, state: 'idle', label: 'Bezczynna', remainingMin: null, completionTime: null, settings }
}

/**
 * @param {object} status surowy status ST (kształt z /devices/{id}/status)
 * @param {string} deviceType typ z bazy (washer|dryer|dishwasher|fridge|ac|tv|other)
 * @returns {{type:string,state:string,label:string,remainingMin:?number,completionTime:?string}}
 */
/** Lodówka: zawsze „on"; pokazujemy temperaturę i ostrzegamy o otwartych drzwiach. */
function mapFridge(status) {
  const door = attr(status, 'contactSensor', 'contact')
  const tempC = attr(status, 'temperatureMeasurement', 'temperature')
  return {
    type: 'fridge',
    state: 'on',
    label: door === 'open' ? 'Drzwi otwarte' : 'Działa',
    door,
    tempC,
  }
}

// Tryby klimatyzatora ST → czytelna etykieta PL.
const AC_MODE_LABEL = {
  cool: 'Chłodzenie', heat: 'Grzanie', dry: 'Osuszanie', wind: 'Wentylacja',
  fanOnly: 'Wentylacja', auto: 'Auto',
}

/** Klima: on/off ze switcha; gdy on — tryb + zadana/aktualna temperatura. */
function mapAc(status) {
  const on = attr(status, 'switch', 'switch') === 'on'
  const mode = attr(status, 'airConditionerMode', 'airConditionerMode')
  return {
    type: 'ac',
    state: on ? 'on' : 'off',
    label: on ? (AC_MODE_LABEL[mode] || 'Włączona') : 'Wyłączona',
    mode,
    targetTempC: attr(status, 'thermostatCoolingSetpoint', 'coolingSetpoint'),
    tempC: attr(status, 'temperatureMeasurement', 'temperature'),
  }
}

/** TV: on/off ze switcha; gdy on — głośność (kanał opcjonalnie). */
function mapTv(status) {
  const on = attr(status, 'switch', 'switch') === 'on'
  return {
    type: 'tv',
    state: on ? 'on' : 'off',
    label: on ? 'Włączony' : 'Wyłączony',
    volume: attr(status, 'audioVolume', 'volume'),
    channel: attr(status, 'tvChannel', 'tvChannelName') ?? attr(status, 'tvChannel', 'tvChannel'),
  }
}

/**
 * Natywny pomiar mocy/energii urządzenia ST (powerConsumptionReport — pralki Samsung
 * wystawiają go same). Pozwala pokazać pobór bez wiązania z gniazdkiem Tuya (Faza 5).
 * energy jest skumulowane w Wh → przeliczamy na kWh.
 */
function nativePower(status) {
  const pcr = attr(status, 'powerConsumptionReport', 'powerConsumption')
  if (!pcr || typeof pcr !== 'object') return null
  return {
    ...(pcr.power != null ? { nativeW: pcr.power } : {}),
    ...(pcr.energy != null ? { nativeEnergyKwh: pcr.energy / 1000 } : {}),
  }
}

export function mapStStatus(status, deviceType, cycleLabels) {
  const base = mapStType(status, deviceType, cycleLabels)
  const native = nativePower(status)
  return native ? { ...base, ...native } : base
}

function mapStType(status, deviceType, cycleLabels) {
  if (CYCLE_CAPABILITY[deviceType]) {
    return mapCycleDevice(status, deviceType, cycleLabels)
  }
  if (deviceType === 'fridge') {
    return mapFridge(status)
  }
  if (deviceType === 'ac') {
    return mapAc(status)
  }
  if (deviceType === 'tv') {
    return mapTv(status)
  }
  return { type: deviceType || 'other', state: 'unknown', label: 'Nieznany stan', remainingMin: null, completionTime: null, fallback: true }
}
