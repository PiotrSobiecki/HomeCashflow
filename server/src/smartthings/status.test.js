import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mapStStatus } from './status.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name) => JSON.parse(readFileSync(join(here, 'fixtures', name), 'utf8'))

/** Minimalny status ST: components.main z podanymi capability → atrybuty. */
function status(main) {
  return { components: { main } }
}

describe('mapStStatus — washer', () => {
  it('maps a running washer to "W trakcie" with remaining time and completion', () => {
    const s = status({
      washerOperatingState: {
        machineState: { value: 'run' },
        completionTime: { value: '2026-06-17T19:25:22Z' },
      },
      'samsungce.washerOperatingState': {
        remainingTime: { value: 164, unit: 'min' },
      },
    })

    const ui = mapStStatus(s, 'washer')
    expect(ui).toMatchObject({
      type: 'washer',
      state: 'running',
      label: 'W trakcie',
      remainingMin: 164,
      completionTime: '2026-06-17T19:25:22Z',
    })
  })

  it('maps a paused washer to "Pauza"', () => {
    const s = status({ washerOperatingState: { machineState: { value: 'pause' } } })
    expect(mapStStatus(s, 'washer')).toMatchObject({ state: 'paused', label: 'Pauza' })
  })

  it('maps a just-finished washer (stop + jobState finished) to "Gotowe"', () => {
    const s = status({
      washerOperatingState: { machineState: { value: 'stop' }, washerJobState: { value: 'finished' } },
    })
    expect(mapStStatus(s, 'washer')).toMatchObject({ state: 'finished', label: 'Gotowe' })
  })

  it('maps the real washer fixture (stopped, idle job) to "Bezczynna"', () => {
    const ui = mapStStatus(fixture('washer-status.json'), 'washer')
    expect(ui).toMatchObject({ type: 'washer', state: 'idle', label: 'Bezczynna' })
  })
})

describe('mapStStatus — dryer & dishwasher', () => {
  it('maps a running dryer fixture to "W trakcie" with remaining time', () => {
    const ui = mapStStatus(fixture('dryer-status.json'), 'dryer')
    expect(ui).toMatchObject({ type: 'dryer', state: 'running', label: 'W trakcie', remainingMin: 80 })
  })

  it('maps a finished dishwasher fixture to "Gotowe"', () => {
    const ui = mapStStatus(fixture('dishwasher-status.json'), 'dishwasher')
    expect(ui).toMatchObject({ type: 'dishwasher', state: 'finished', label: 'Gotowe' })
  })
})

describe('mapStStatus — fridge', () => {
  it('maps a closed fridge to a basic running state with temperature', () => {
    const ui = mapStStatus(fixture('fridge-status.json'), 'fridge')
    expect(ui).toMatchObject({ type: 'fridge', state: 'on', label: 'Działa', door: 'closed', tempC: 4 })
  })

  it('flags an open door', () => {
    const s = status({ contactSensor: { contact: { value: 'open' } } })
    expect(mapStStatus(s, 'fridge')).toMatchObject({ type: 'fridge', state: 'on', label: 'Drzwi otwarte', door: 'open' })
  })
})

describe('mapStStatus — AC', () => {
  it('maps a cooling AC fixture to on with mode and setpoint', () => {
    const ui = mapStStatus(fixture('ac-status.json'), 'ac')
    expect(ui).toMatchObject({ type: 'ac', state: 'on', label: 'Chłodzenie', mode: 'cool', targetTempC: 22, tempC: 25 })
  })

  it('maps an off AC to "Wyłączona"', () => {
    const s = status({ switch: { switch: { value: 'off' } }, airConditionerMode: { airConditionerMode: { value: 'cool' } } })
    expect(mapStStatus(s, 'ac')).toMatchObject({ type: 'ac', state: 'off', label: 'Wyłączona' })
  })
})

describe('mapStStatus — TV', () => {
  it('maps an on TV fixture to "Włączony" with volume', () => {
    const ui = mapStStatus(fixture('tv-status.json'), 'tv')
    expect(ui).toMatchObject({ type: 'tv', state: 'on', label: 'Włączony', volume: 15 })
  })

  it('maps an off TV to "Wyłączony"', () => {
    const s = status({ switch: { switch: { value: 'off' } } })
    expect(mapStStatus(s, 'tv')).toMatchObject({ type: 'tv', state: 'off', label: 'Wyłączony' })
  })
})

describe('mapStStatus — unknown / fallback', () => {
  it('returns a safe fallback for an unsupported device type', () => {
    const ui = mapStStatus(status({ someWeirdCapability: { x: { value: 1 } } }), 'other')
    expect(ui).toMatchObject({ type: 'other', state: 'unknown', fallback: true })
    expect(ui.label).toBeTruthy()
  })

  it('does not throw on an empty/garbage status', () => {
    expect(() => mapStStatus({}, 'washer')).not.toThrow()
    expect(() => mapStStatus(null, 'ac')).not.toThrow()
    expect(mapStStatus(null, 'washer')).toMatchObject({ type: 'washer', state: 'idle' })
  })
})
