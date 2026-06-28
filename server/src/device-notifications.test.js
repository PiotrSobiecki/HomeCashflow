import { describe, it, expect } from 'vitest'
import {
  shouldNotifyCycleComplete,
  shouldNotifyPowerAbove,
  shouldNotifyPowerBelow,
} from './device-notifications.js'
import { isCycleJobComplete, isCycleActivelyRunning } from './smartthings/status.js'

describe('isCycleJobComplete', () => {
  it('rozpoznaje Samsung finish i standard finished', () => {
    expect(isCycleJobComplete('finish', null)).toBe(true)
    expect(isCycleJobComplete('finished', null)).toBe(true)
    expect(isCycleJobComplete(null, 'finished')).toBe(true)
    expect(isCycleJobComplete('none', 'ready')).toBe(false)
  })
})

describe('shouldNotifyCycleComplete (sygnały ST)', () => {
  it('powiadamia przy finish po aktywnym cyklu', () => {
    expect(shouldNotifyCycleComplete(
      { machineState: 'run', jobState: 'wash', operatingState: 'running' },
      { machineState: 'stop', jobState: 'finish', operatingState: 'ready' },
    )).toBe(true)
  })

  it('powiadamia przy run→stop gdy job zdąży wrócić do none (Samsung)', () => {
    expect(shouldNotifyCycleComplete(
      { machineState: 'run', jobState: 'spin', operatingState: 'running' },
      { machineState: 'stop', jobState: 'none', operatingState: 'ready' },
    )).toBe(true)
  })

  it('nie powiadamia przy pierwszym odczycie (brak prev)', () => {
    expect(shouldNotifyCycleComplete(
      null,
      { machineState: 'stop', jobState: 'none', operatingState: 'ready' },
    )).toBe(false)
  })

  it('nie powiadamia gdy pralka cały czas bezczynna', () => {
    expect(shouldNotifyCycleComplete(
      { machineState: 'stop', jobState: 'none', operatingState: 'ready' },
      { machineState: 'stop', jobState: 'none', operatingState: 'ready' },
    )).toBe(false)
  })

  it('nie powiadamia ponownie gdy już było finished', () => {
    expect(shouldNotifyCycleComplete(
      { machineState: 'stop', jobState: 'finished', operatingState: 'finished' },
      { machineState: 'stop', jobState: 'finished', operatingState: 'finished' },
    )).toBe(false)
  })
})

describe('isCycleActivelyRunning', () => {
  it('traktuje fazę wash jako aktywny cykl', () => {
    expect(isCycleActivelyRunning({ machineState: 'stop', jobState: 'wash', operatingState: 'ready' })).toBe(true)
  })
})

describe('shouldNotifyPowerAbove', () => {
  it('powiadamia przy pierwszym przekroczeniu progu', () => {
    expect(shouldNotifyPowerAbove(false, true)).toBe(true)
    expect(shouldNotifyPowerAbove(null, true)).toBe(true)
  })

  it('nie powiadamia gdy nadal powyżej progu', () => {
    expect(shouldNotifyPowerAbove(true, true)).toBe(false)
  })
})

describe('shouldNotifyPowerBelow', () => {
  it('powiadamia gdy moc spadła poniżej progu', () => {
    expect(shouldNotifyPowerBelow(false, true)).toBe(true)
  })

  it('nie powiadamia gdy nadal poniżej progu', () => {
    expect(shouldNotifyPowerBelow(true, true)).toBe(false)
  })
})
