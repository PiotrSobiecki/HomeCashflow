import { describe, it, expect } from 'vitest'
import { formatAcPowerPushMessage, formatCycleCompletePushMessage, formatPlugPowerPushMessage } from './push.js'

describe('formatAcPowerPushMessage', () => {
  it('formatuje włączenie z termostatu i temperaturą', () => {
    const m = formatAcPowerPushMessage({
      action: 'on',
      deviceName: 'Klima salon',
      outdoorTemp: 28.3,
      source: 'thermostat',
    })
    expect(m.title).toBe('Klimatyzacja włączona')
    expect(m.body).toContain('Klima salon')
    expect(m.body).toContain('28.3°C')
    expect(m.body).toContain('termostat')
  })

  it('formatuje wyłączenie ręczne bez temp', () => {
    const m = formatAcPowerPushMessage({
      action: 'off',
      deviceName: 'AC',
      source: 'manual',
    })
    expect(m.title).toBe('Klimatyzacja wyłączona')
    expect(m.body).toContain('(ręcznie)')
    expect(m.body).not.toContain('°C')
  })

  it('formatuje wyłącznik czasowy', () => {
    const m = formatAcPowerPushMessage({
      action: 'off',
      source: 'timer',
    })
    expect(m.body).toContain('Klima')
    expect(m.body).toContain('wyłącznik czasowy')
  })
})

describe('formatCycleCompletePushMessage', () => {
  it('formatuje pralkę', () => {
    const m = formatCycleCompletePushMessage({ deviceName: 'Pralka łazienka', deviceType: 'washer' })
    expect(m.title).toContain('Pralka')
    expect(m.body).toContain('Pralka łazienka')
  })
})

describe('formatPlugPowerPushMessage', () => {
  it('formatuje przekroczenie progu w górę', () => {
    const m = formatPlugPowerPushMessage({ deviceName: 'Tv szafka', powerW: 650, thresholdW: 500, direction: 'above' })
    expect(m.title).toContain('wysoki')
    expect(m.body).toContain('> 500 W')
  })

  it('formatuje spadek poniżej progu', () => {
    const m = formatPlugPowerPushMessage({ deviceName: 'Tv szafka', powerW: 5, thresholdW: 20, direction: 'below' })
    expect(m.title).toContain('niski')
    expect(m.body).toContain('< 20 W')
  })
})
