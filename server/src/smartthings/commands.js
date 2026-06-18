/**
 * Sterowanie urządzeniami SmartThings (Faza 4) — czyste budowanie/walidacja komend.
 * Wysyłka (I/O) siedzi w client.js; egzekwowanie capabilities + remoteControl w app.js.
 *
 * @see https://developer.smartthings.com/docs/api/public#operation/executeDeviceCommands
 */

import { WASHER_SETTINGS, allowedWasherSettings } from './washer.js'

// Capability maszyny stanu cyklu per typ AGD (sterowane setMachineState).
const CYCLE_CAPABILITY = {
  washer: 'washerOperatingState',
  dryer: 'dryerOperatingState',
  dishwasher: 'dishwasherOperatingState',
}

// Akcja UI → argument setMachineState ST.
const ACTION_TO_STATE = { start: 'run', pause: 'pause', stop: 'stop' }

/**
 * Buduje komendę ST dla akcji start/pauza/stop. Zwraca null gdy typ urządzenia nie ma
 * cyklu (np. lodówka/TV) lub akcja jest nieznana — wołający odrzuca takie żądanie (400).
 */
export function buildStCommand(deviceType, action) {
  const capability = CYCLE_CAPABILITY[deviceType]
  const stateArg = ACTION_TO_STATE[action]
  if (!capability || !stateArg) return null
  return { component: 'main', capability, command: 'setMachineState', arguments: [stateArg] }
}

/** Wartość atrybutu capability z komponentu `main`. */
function attr(status, capability, attribute) {
  return status?.components?.main?.[capability]?.[attribute]?.value ?? null
}

// Akcje sensowne w danym stanie maszyny (UI rysuje tylko te).
const ACTIONS_BY_STATE = {
  run: ['pause', 'stop'],
  pause: ['start', 'stop'],
  stop: ['start'],
}

/**
 * Co user może teraz zrobić z urządzeniem ST: lista akcji wg machineState + flaga
 * zdalnego sterowania. remoteControlEnabled=false (Samsung domyślnie) → zero akcji,
 * dopóki user fizycznie nie włączy zdalnego sterowania na pralce. Typ bez cyklu → zero.
 */
export function allowedStActions(deviceType, status) {
  const capability = CYCLE_CAPABILITY[deviceType]
  const remoteControlEnabled = attr(status, 'remoteControlStatus', 'remoteControlEnabled') === 'true'
  if (!capability || !remoteControlEnabled) {
    return { remoteControlEnabled, actions: [] }
  }
  const machineState = attr(status, capability, 'machineState')
  return { remoteControlEnabled, actions: ACTIONS_BY_STATE[machineState] ?? ['start'] }
}

/**
 * Buduje komendę ST dla zmiany ustawienia cyklu pralki (temperatura/wirowanie/płukanie/
 * namaczanie/program). Zwraca null gdy typ nie jest pralką lub ustawienie nieznane —
 * wołający odrzuca takie żądanie (400). Wartość bierzemy jako string (ST tak oczekuje).
 */
export function buildStSettingCommand(deviceType, setting, value) {
  if (deviceType !== 'washer') return null
  const def = WASHER_SETTINGS[setting]
  if (!def || value == null) return null
  return { component: 'main', capability: def.capability, command: def.command, arguments: [String(value)] }
}

/**
 * Czy zmianę ustawienia da się teraz wykonać: bramka zdalnego sterowania + czy wartość
 * jest na liście wspieranych przez urządzenie (twardo odrzucamy spoza zakresu, żeby nie
 * wysłać pralce nieprawidłowej komendy). settings = mapa { ustawienie: [wspierane] }.
 */
export function allowedStSetting(deviceType, status, setting, value) {
  if (deviceType !== 'washer') return { ok: false, reason: 'unsupported' }
  const remoteControlEnabled = attr(status, 'remoteControlStatus', 'remoteControlEnabled') === 'true'
  if (!remoteControlEnabled) return { ok: false, reason: 'remote_control_disabled', remoteControlEnabled }
  const supported = allowedWasherSettings(status)[setting]
  if (!supported) return { ok: false, reason: 'unsupported', remoteControlEnabled }
  if (!supported.includes(String(value))) return { ok: false, reason: 'value_not_supported', remoteControlEnabled }
  return { ok: true, remoteControlEnabled }
}
