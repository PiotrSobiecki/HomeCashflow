import { describe, it, expect, vi, afterEach } from 'vitest'
import { getOutdoorTemp } from './weather.js'

// Granica: Open-Meteo (zewnętrzne API). Mockujemy global fetch — ten test nie dotyka DB,
// więc podmiana fetch nie koliduje z Neon.
afterEach(() => { vi.unstubAllGlobals() })

function stubFetch(impl) {
  vi.stubGlobal('fetch', vi.fn(impl))
}

describe('getOutdoorTemp — odczyt temperatury z Open-Meteo', () => {
  it('zwraca bieżącą temperaturę 2 m dla podanych współrzędnych', async () => {
    stubFetch(async (url) => {
      expect(String(url)).toContain('latitude=51.1')
      expect(String(url)).toContain('longitude=17.03')
      expect(String(url)).toContain('temperature_2m')
      return { ok: true, json: async () => ({ current: { temperature_2m: 23.7 } }) }
    })

    const temp = await getOutdoorTemp({ lat: 51.1, lon: 17.03 })
    expect(temp).toBe(23.7)
  })

  it('rzuca błędem przy odpowiedzi HTTP != 2xx (runner pominie wpis)', async () => {
    stubFetch(async () => ({ ok: false, status: 503, json: async () => ({}) }))
    await expect(getOutdoorTemp({ lat: 51, lon: 17 })).rejects.toThrow()
  })

  it('zwraca null gdy w odpowiedzi brakuje temperatury', async () => {
    stubFetch(async () => ({ ok: true, json: async () => ({ current: {} }) }))
    expect(await getOutdoorTemp({ lat: 51, lon: 17 })).toBe(null)
  })
})
