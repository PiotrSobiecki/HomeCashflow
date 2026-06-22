import { describe, it, expect } from 'vitest'
import { decide } from './ac-thermostat.js'

describe('decide — termostat zewnętrzny klimy IR (histereza + edge-trigger)', () => {
  it('włącza, gdy temp osiąga górny próg, a klima była wyłączona', () => {
    expect(decide({ temp: 27, tempOn: 26, tempOff: 24, lastAction: 'off' })).toBe('on')
  })

  it('wyłącza, gdy temp spada do dolnego progu, a klima była włączona', () => {
    expect(decide({ temp: 23, tempOn: 26, tempOff: 24, lastAction: 'on' })).toBe('off')
  })

  it('nie rusza klimy w strefie martwej (między progami) — niezależnie od ostatniej akcji', () => {
    expect(decide({ temp: 25, tempOn: 26, tempOff: 24, lastAction: 'on' })).toBe(null)
    expect(decide({ temp: 25, tempOn: 26, tempOff: 24, lastAction: 'off' })).toBe(null)
    expect(decide({ temp: 25, tempOn: 26, tempOff: 24, lastAction: null })).toBe(null)
  })

  it('nie wysyła powtórnej komendy, gdy klima już jest w docelowym stanie (last_action)', () => {
    expect(decide({ temp: 28, tempOn: 26, tempOff: 24, lastAction: 'on' })).toBe(null)
    expect(decide({ temp: 22, tempOn: 26, tempOff: 24, lastAction: 'off' })).toBe(null)
  })

  it('nie wysyła komendy, gdy rzeczywisty stan z Tuya już odpowiada progowi (nawet gdy last_action się różni)', () => {
    // last_action='on', ale klima już wyłączona ręcznie — nie ponawiaj „off"
    expect(decide({ temp: 22, tempOn: 26, tempOff: 24, lastAction: 'on', acPowerOn: false })).toBe(null)
    // last_action='off', ale klima już włączona — nie ponawiaj „on"
    expect(decide({ temp: 28, tempOn: 26, tempOff: 24, lastAction: 'off', acPowerOn: true })).toBe(null)
  })

  it('wysyła komendę wg stanu Tuya, nie tylko last_action', () => {
    expect(decide({ temp: 22, tempOn: 26, tempOff: 24, lastAction: 'off', acPowerOn: true })).toBe('off')
    expect(decide({ temp: 28, tempOn: 26, tempOff: 24, lastAction: 'on', acPowerOn: false })).toBe('on')
  })

  it('po starcie automatyki (lastAction=null) działa dopiero po przekroczeniu progu', () => {
    // w strefie martwej czeka
    expect(decide({ temp: 25, tempOn: 26, tempOff: 24, lastAction: null })).toBe(null)
    // poza strefą — od razu odpowiednia akcja
    expect(decide({ temp: 27, tempOn: 26, tempOff: 24, lastAction: null })).toBe('on')
    expect(decide({ temp: 23, tempOn: 26, tempOff: 24, lastAction: null })).toBe('off')
  })

  it('granice progów włączają akcję (temp == tempOn → on, temp == tempOff → off)', () => {
    expect(decide({ temp: 26, tempOn: 26, tempOff: 24, lastAction: 'off' })).toBe('on')
    expect(decide({ temp: 24, tempOn: 26, tempOff: 24, lastAction: 'on' })).toBe('off')
  })
})

describe('decide — tryb grzania (odwrócone progi)', () => {
  it('włącza, gdy temp spada do dolnego progu włączenia', () => {
    expect(decide({ temp: 4, tempOn: 5, tempOff: 8, lastAction: 'off', mode: 'heat' })).toBe('on')
  })

  it('wyłącza, gdy temp rośnie do górnego progu wyłączenia', () => {
    expect(decide({ temp: 9, tempOn: 5, tempOff: 8, lastAction: 'on', mode: 'heat' })).toBe('off')
  })

  it('nie rusza klimy w strefie martwej między progami', () => {
    expect(decide({ temp: 6.5, tempOn: 5, tempOff: 8, lastAction: 'on', mode: 'heat' })).toBe(null)
  })

  it('granice progów: temp == tempOn → on, temp == tempOff → off', () => {
    expect(decide({ temp: 5, tempOn: 5, tempOff: 8, lastAction: 'off', mode: 'heat' })).toBe('on')
    expect(decide({ temp: 8, tempOn: 5, tempOff: 8, lastAction: 'on', mode: 'heat' })).toBe('off')
  })
})
