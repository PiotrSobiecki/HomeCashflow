import { describe, it, expect } from 'vitest'
import { validateCommands, validateAcCommands, looksLikeIrAc } from './commands.js'

const FUNCTIONS = {
  functions: [
    { code: 'switch_1', type: 'Boolean' },
    { code: 'work_mode', type: 'Enum', values: '{"range":["white","colour","scene"]}' },
    { code: 'bright_value', type: 'Integer', values: '{"min":10,"max":1000,"scale":0,"step":1}' },
  ],
}

describe('validateCommands', () => {
  it('rejects an empty command list', () => {
    expect(validateCommands(FUNCTIONS, [])).not.toBeNull()
    expect(validateCommands(FUNCTIONS, undefined)).not.toBeNull()
  })

  it('rejects a code that is not a writable DP of the device', () => {
    expect(validateCommands(FUNCTIONS, [{ code: 'unknown', value: true }])).not.toBeNull()
  })

  it('accepts a valid boolean command', () => {
    expect(validateCommands(FUNCTIONS, [{ code: 'switch_1', value: true }])).toBeNull()
  })

  it('rejects a non-boolean value for a Boolean DP', () => {
    expect(validateCommands(FUNCTIONS, [{ code: 'switch_1', value: 'on' }])).not.toBeNull()
  })

  it('accepts an enum value within range and rejects one outside', () => {
    expect(validateCommands(FUNCTIONS, [{ code: 'work_mode', value: 'colour' }])).toBeNull()
    expect(validateCommands(FUNCTIONS, [{ code: 'work_mode', value: 'disco' }])).not.toBeNull()
  })

  it('accepts an integer within range and rejects out-of-range / non-number', () => {
    expect(validateCommands(FUNCTIONS, [{ code: 'bright_value', value: 500 }])).toBeNull()
    expect(validateCommands(FUNCTIONS, [{ code: 'bright_value', value: 5 }])).not.toBeNull()
    expect(validateCommands(FUNCTIONS, [{ code: 'bright_value', value: 2000 }])).not.toBeNull()
    expect(validateCommands(FUNCTIONS, [{ code: 'bright_value', value: 'x' }])).not.toBeNull()
  })

  it('rejects the whole batch if any single command is invalid', () => {
    const cmds = [{ code: 'switch_1', value: true }, { code: 'bright_value', value: 99999 }]
    expect(validateCommands(FUNCTIONS, cmds)).not.toBeNull()
  })

  it('tolerates functions values given as already-parsed objects', () => {
    const fns = { functions: [{ code: 'work_mode', type: 'Enum', values: { range: ['a', 'b'] } }] }
    expect(validateCommands(fns, [{ code: 'work_mode', value: 'a' }])).toBeNull()
    expect(validateCommands(fns, [{ code: 'work_mode', value: 'z' }])).not.toBeNull()
  })

  it('rejects when the device has no functions snapshot', () => {
    expect(validateCommands(null, [{ code: 'switch_1', value: true }])).not.toBeNull()
  })
})

describe('looksLikeIrAc', () => {
  it('detects an IR AC (power+mode+temp+wind present)', () => {
    const fns = { functions: [
      { code: 'power', type: 'Boolean' }, { code: 'mode', type: 'Enum' },
      { code: 'temp', type: 'Enum' }, { code: 'wind', type: 'Enum' },
    ] }
    expect(looksLikeIrAc(fns)).toBe(true)
  })

  it('is false for a plain plug', () => {
    expect(looksLikeIrAc({ functions: [{ code: 'switch_1' }] })).toBe(false)
    expect(looksLikeIrAc(null)).toBe(false)
  })
})

describe('validateAcCommands', () => {
  it('accepts in-range numeric commands', () => {
    expect(validateAcCommands([{ code: 'power', value: 1 }])).toBeNull()
    expect(validateAcCommands([{ code: 'temp', value: 24 }])).toBeNull()
    expect(validateAcCommands([{ code: 'mode', value: 4 }])).toBeNull()
    expect(validateAcCommands([{ code: 'wind', value: 0 }])).toBeNull()
  })

  it('rejects out-of-range, unknown code, non-number and empty', () => {
    expect(validateAcCommands([{ code: 'temp', value: 40 }])).not.toBeNull()
    expect(validateAcCommands([{ code: 'temp', value: 10 }])).not.toBeNull()
    expect(validateAcCommands([{ code: 'mode', value: 9 }])).not.toBeNull()
    expect(validateAcCommands([{ code: 'switch_1', value: 1 }])).not.toBeNull()
    expect(validateAcCommands([{ code: 'power', value: true }])).not.toBeNull()
    expect(validateAcCommands([])).not.toBeNull()
  })
})
