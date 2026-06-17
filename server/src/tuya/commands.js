/**
 * Walidacja komend sterujących względem zapisywalnych funkcji DP urządzenia
 * (snapshot `functions_json` z getDeviceFunctions). Pilnujemy, żeby do Tuya
 * poszły tylko dozwolone kody i wartości w zakresie — nie wymyślamy funkcji.
 *
 * Kształt funkcji (Tuya /functions): { functions: [{ code, type, values }] }
 * `values` bywa JSON-stringiem ('{"range":[...]}' / '{"min":..,"max":..}') albo obiektem.
 */

function parseValues(values) {
  if (values == null) return {}
  if (typeof values === 'object') return values
  try {
    return JSON.parse(values)
  } catch {
    return {}
  }
}

/**
 * @returns {string | null} null = ok, inaczej kod błędu (string)
 */
export function validateCommands(functionsJson, commands) {
  if (!Array.isArray(commands) || commands.length === 0) return 'commands_required'

  const fns = functionsJson?.functions
  if (!Array.isArray(fns) || fns.length === 0) return 'no_functions_snapshot'

  const byCode = new Map(fns.map((f) => [f.code, f]))

  for (const cmd of commands) {
    if (!cmd || typeof cmd.code !== 'string') return 'command_not_allowed'
    const fn = byCode.get(cmd.code)
    if (!fn) return 'command_not_allowed'

    const value = cmd.value
    const type = String(fn.type || '').toLowerCase()

    if (type === 'boolean') {
      if (typeof value !== 'boolean') return 'invalid_value'
    } else if (type === 'enum') {
      const range = parseValues(fn.values).range
      if (!Array.isArray(range) || !range.includes(value)) return 'invalid_value'
    } else if (type === 'integer') {
      const { min, max } = parseValues(fn.values)
      if (typeof value !== 'number' || !Number.isFinite(value)) return 'invalid_value'
      if (typeof min === 'number' && value < min) return 'invalid_value'
      if (typeof max === 'number' && value > max) return 'invalid_value'
    }
    // String / Json / Raw i nieznane typy — przepuszczamy (best-effort, Tuya zweryfikuje).
  }

  return null
}

// ====== Klima na podczerwień (Smart IR) ======
//
// IR AC chodzi osobnym API i przyjmuje wartości liczbowe (nie boolean/enum jak DP).
// Zakresy wg standardowego zestawu instrukcji Tuya (potwierdzone w panelu urządzenia):
//   power 0/1, mode 0–4, temp 16–30, wind 0–3.
export const AC_CODES = {
  power: { min: 0, max: 1 },
  mode: { min: 0, max: 4 },
  temp: { min: 16, max: 30 },
  wind: { min: 0, max: 3 },
}

/**
 * Czy snapshot funkcji wygląda na klimę IR (ma power+mode+temp+wind).
 * @returns {boolean}
 */
export function looksLikeIrAc(functionsJson) {
  const codes = new Set((functionsJson?.functions ?? []).map((f) => f.code))
  return ['power', 'mode', 'temp', 'wind'].every((c) => codes.has(c))
}

/**
 * Walidacja komend klimy IR względem stałego modelu AC.
 * @returns {string | null} null = ok, inaczej kod błędu
 */
export function validateAcCommands(commands) {
  if (!Array.isArray(commands) || commands.length === 0) return 'commands_required'
  for (const cmd of commands) {
    if (!cmd || typeof cmd.code !== 'string') return 'command_not_allowed'
    const spec = AC_CODES[cmd.code]
    if (!spec) return 'command_not_allowed'
    const value = cmd.value
    if (typeof value !== 'number' || !Number.isFinite(value)) return 'invalid_value'
    if (value < spec.min || value > spec.max) return 'invalid_value'
  }
  return null
}
