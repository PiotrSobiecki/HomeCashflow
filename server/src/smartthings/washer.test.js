import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readWasherSettings, allowedWasherSettings } from './washer.js'
import { buildStSettingCommand, allowedStSetting } from './commands.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name) => JSON.parse(readFileSync(join(here, 'fixtures', name), 'utf8'))

function status(main) {
  return { components: { main } }
}

describe('readWasherSettings', () => {
  it('reads current values + labeled options from the real washer fixture', () => {
    const s = readWasherSettings(fixture('washer-status.json'))
    expect(s.temperature.value).toBe('40')
    expect(s.temperature.options).toContainEqual({ value: '40', label: '40°C' })
    expect(s.temperature.options.map((o) => o.value)).not.toContain('none') // „none" odfiltrowane
    expect(s.spin.value).toBe('1400')
    expect(s.spin.options).toContainEqual({ value: 'noSpin', label: 'Bez wirowania' })
    expect(s.rinse.value).toBe('2')
    expect(s.rinse.options).toContainEqual({ value: '0', label: 'Bez płukania' })
    expect(s.bubbleSoak).toMatchObject({ value: 'off' })
    // Program: kod kursu wyłuskany z "Table_02_Course_1C"
    expect(s.cycle.value).toBe('1C')
    expect(s.cycle.options.map((o) => o.value)).toContain('25')
  })

  it('returns null when the device exposes no washer settings', () => {
    expect(readWasherSettings(status({ washerOperatingState: { machineState: { value: 'run' } } }))).toBeNull()
  })
})

describe('allowedWasherSettings', () => {
  it('lists supported raw values per setting', () => {
    const a = allowedWasherSettings(fixture('washer-status.json'))
    expect(a.temperature).toEqual(['cold', '20', '30', '40', '60', '90'])
    expect(a.spin).toContain('1400')
    expect(a.bubbleSoak).toEqual(['off', 'on'])
  })
})

describe('buildStSettingCommand', () => {
  it('builds the right capability/command per setting', () => {
    expect(buildStSettingCommand('washer', 'temperature', '60')).toEqual({
      component: 'main', capability: 'custom.washerWaterTemperature', command: 'setWasherWaterTemperature', arguments: ['60'],
    })
    expect(buildStSettingCommand('washer', 'spin', 1200).arguments).toEqual(['1200']) // liczba → string
    expect(buildStSettingCommand('washer', 'cycle', '25').command).toBe('setWasherCycle')
  })

  it('returns null for non-washer or unknown setting', () => {
    expect(buildStSettingCommand('dryer', 'temperature', '60')).toBeNull()
    expect(buildStSettingCommand('washer', 'nonsense', 'x')).toBeNull()
  })
})

describe('allowedStSetting', () => {
  const withRemote = (on) => {
    const s = fixture('washer-status.json')
    s.components.main.remoteControlStatus = { remoteControlEnabled: { value: on ? 'true' : 'false' } }
    return s
  }

  it('accepts a supported value when remote control is on', () => {
    expect(allowedStSetting('washer', withRemote(true), 'temperature', '60')).toMatchObject({ ok: true })
  })

  it('rejects a value outside the supported list', () => {
    expect(allowedStSetting('washer', withRemote(true), 'temperature', '999')).toMatchObject({ ok: false, reason: 'value_not_supported' })
  })

  it('rejects when remote control is disabled', () => {
    expect(allowedStSetting('washer', withRemote(false), 'temperature', '60')).toMatchObject({ ok: false, reason: 'remote_control_disabled' })
  })
})
