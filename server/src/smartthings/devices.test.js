import { describe, it, expect } from 'vitest'
import { summarizeDevices } from './devices.js'

describe('summarizeDevices', () => {
  it('maps each item to its deviceId and label', () => {
    const response = {
      items: [
        { deviceId: 'abc-1', label: 'Pralka', components: [] },
        { deviceId: 'abc-2', label: 'Suszarka', components: [] },
      ],
    }
    expect(summarizeDevices(response)).toEqual([
      { deviceId: 'abc-1', label: 'Pralka', type: 'other' },
      { deviceId: 'abc-2', label: 'Suszarka', type: 'other' },
    ])
  })

  it('infers AGD type from a cycle capability across components', () => {
    const response = {
      items: [
        {
          deviceId: 'w1',
          label: 'Pralka Samsung',
          components: [{ id: 'main', capabilities: [{ id: 'switch' }, { id: 'washerOperatingState' }] }],
        },
        {
          deviceId: 'f1',
          label: 'Lodówka',
          components: [{ id: 'main', capabilities: [{ id: 'refrigeration' }] }],
        },
      ],
    }
    const out = summarizeDevices(response)
    expect(out[0].type).toBe('washer')
    expect(out[1].type).toBe('fridge')
  })

  it('falls back to name then placeholder when label is missing', () => {
    const response = { items: [{ deviceId: 'x', name: 'Device X' }, { deviceId: 'y' }] }
    const out = summarizeDevices(response)
    expect(out[0].label).toBe('Device X')
    expect(out[1].label).toBe('(bez nazwy)')
  })
})
