import { describe, it, expect, vi, afterEach } from 'vitest'
import { getOutdoorTemp, getOutdoorWeather, geocodeCity } from './weather.js'

// Granica: zewnętrzne API pogodowe. Mockujemy global fetch — ten test nie dotyka DB,
// więc podmiana fetch nie koliduje z Neon.
afterEach(() => { vi.unstubAllGlobals() })

function stubFetch(impl) {
  vi.stubGlobal('fetch', vi.fn(impl))
}

describe('getOutdoorWeather — Google jako główne źródło', () => {
  it('odpytuje Google gdy podano apiKey i zwraca temperaturę + warunek', async () => {
    stubFetch(async (url) => {
      expect(String(url)).toContain('weather.googleapis.com')
      expect(String(url)).toContain('key=secret-key')
      expect(String(url)).toContain('location.latitude=51.1')
      expect(String(url)).toContain('location.longitude=17.03')
      return {
        ok: true,
        json: async () => ({
          temperature: { degrees: 23.7, unit: 'CELSIUS' },
          isDaytime: true,
          weatherCondition: { type: 'PARTLY_CLOUDY' },
        }),
      }
    })

    const w = await getOutdoorWeather({ lat: 51.1, lon: 17.03 }, { apiKey: 'secret-key' })
    expect(w.temp).toBe(23.7)
    expect(w.condition).toMatchObject({ code: 'partly-cloudy', isDay: true })
  })

  it('mapuje typ Google na śnieg i wariant nocny', async () => {
    stubFetch(async () => ({
      ok: true,
      json: async () => ({
        temperature: { degrees: -2 },
        isDaytime: false,
        weatherCondition: { type: 'HEAVY_SNOW' },
      }),
    }))
    const w = await getOutdoorWeather({ lat: 51, lon: 17 }, { apiKey: 'k' })
    expect(w.condition).toMatchObject({ code: 'snow', isDay: false })
  })

  it('spada na Open-Meteo gdy Google zwróci błąd HTTP (np. 403 referrer)', async () => {
    let calls = 0
    stubFetch(async (url) => {
      calls++
      if (String(url).includes('googleapis.com')) {
        return { ok: false, status: 403, json: async () => ({}) }
      }
      expect(String(url)).toContain('open-meteo.com')
      expect(String(url)).toContain('weather_code')
      return { ok: true, json: async () => ({ current: { temperature_2m: 19.4, weather_code: 61, is_day: 1 } }) }
    })

    const w = await getOutdoorWeather({ lat: 51, lon: 17 }, { apiKey: 'k' })
    expect(calls).toBe(2)
    expect(w.temp).toBe(19.4)
    expect(w.condition).toMatchObject({ code: 'rain' })
  })

  it('bez apiKey idzie prosto do Open-Meteo', async () => {
    stubFetch(async (url) => {
      expect(String(url)).toContain('open-meteo.com')
      return { ok: true, json: async () => ({ current: { temperature_2m: 12, weather_code: 0, is_day: 1 } }) }
    })
    const w = await getOutdoorWeather({ lat: 51, lon: 17 })
    expect(w.temp).toBe(12)
    expect(w.condition).toMatchObject({ code: 'clear' })
  })
})

describe('getOutdoorTemp — cienka nakładka zwracająca samą temperaturę', () => {
  it('zwraca liczbę dla runnera termostatu (Open-Meteo)', async () => {
    stubFetch(async () => ({ ok: true, json: async () => ({ current: { temperature_2m: 23.7, weather_code: 1 } }) }))
    expect(await getOutdoorTemp({ lat: 51.1, lon: 17.03 })).toBe(23.7)
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

describe('geocodeCity — miasto → współrzędne (Open-Meteo Geocoding)', () => {
  it('zwraca lat/lon i czytelną etykietę dla znanego miasta', async () => {
    stubFetch(async (url) => {
      expect(String(url)).toContain('geocoding-api.open-meteo.com')
      expect(String(url)).toContain('name=Wroc')
      return {
        ok: true,
        json: async () => ({
          results: [{ name: 'Wrocław', latitude: 51.1, longitude: 17.03, country: 'Polska', admin1: 'Dolnośląskie' }],
        }),
      }
    })

    const r = await geocodeCity('Wrocław')
    expect(r).toMatchObject({ lat: 51.1, lon: 17.03 })
    expect(r.label).toContain('Wrocław')
    expect(r.label).toContain('Polska')
  })

  it('zwraca null gdy brak wyników', async () => {
    stubFetch(async () => ({ ok: true, json: async () => ({}) }))
    expect(await geocodeCity('Xyzzyland')).toBe(null)
  })

  it('zwraca null dla pustej nazwy bez wołania API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await geocodeCity('   ')).toBe(null)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rzuca błędem przy odpowiedzi HTTP != 2xx', async () => {
    stubFetch(async () => ({ ok: false, status: 500, json: async () => ({}) }))
    await expect(geocodeCity('Wrocław')).rejects.toThrow()
  })
})
