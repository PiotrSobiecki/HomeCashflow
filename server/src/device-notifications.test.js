import { describe, it, expect } from 'vitest'
import { shouldNotifyCycleComplete, shouldNotifyPowerAbove, shouldNotifyPowerBelow } from './device-notifications.js'

describe('shouldNotifyCycleComplete', () => {
  it('powiadamia przy running → finished', () => {
    expect(shouldNotifyCycleComplete('running', 'finished')).toBe(true)
  })

  it('powiadamia przy paused → finished', () => {
    expect(shouldNotifyCycleComplete('paused', 'finished')).toBe(true)
  })

  it('nie powiadamia przy idle → finished', () => {
    expect(shouldNotifyCycleComplete('idle', 'finished')).toBe(false)
  })

  it('nie powiadamia ponownie gdy już finished', () => {
    expect(shouldNotifyCycleComplete('finished', 'finished')).toBe(false)
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
