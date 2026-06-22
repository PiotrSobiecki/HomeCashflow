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

  it('nie wysyła powtórnej komendy, gdy klima już jest w docelowym stanie', () => {
    // już włączona, nadal gorąco → nie ponawiaj "on"
    expect(decide({ temp: 28, tempOn: 26, tempOff: 24, lastAction: 'on' })).toBe(null)
    // już wyłączona, nadal chłodno → nie ponawiaj "off"
    expect(decide({ temp: 22, tempOn: 26, tempOff: 24, lastAction: 'off' })).toBe(null)
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
