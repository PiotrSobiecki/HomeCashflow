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
