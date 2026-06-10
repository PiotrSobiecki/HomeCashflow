import { describe, it, expect } from 'vitest'
import { validateCommands } from './commands.js'

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
