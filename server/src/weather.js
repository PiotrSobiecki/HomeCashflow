// Dostawca pogody (deep module) — granica między automatyką a zewnętrznym API pogodowym.
//
// Główne źródło: Google Weather API (currentConditions:lookup) — wymaga klucza
// WEATHER_GOOGLE_API_KEY i zwraca temperaturę + warunek (do ikonki w UI).
// Fallback (bez klucza lub gdy Google padnie): Open-Meteo — darmowe, bez klucza.
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast'
const GOOGLE_WEATHER_URL = 'https://weather.googleapis.com/v1/currentConditions:lookup'
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FETCH_TIMEOUT_MS = 8000

/**
 * Normalizujemy warunek pogodowy do małego, stabilnego zbioru kodów, które front
 * mapuje na ikonki (lucide). `isDay` rozróżnia słońce/księżyc dla bezchmurnego nieba.
 * @typedef {{ code:string, isDay:boolean, label:string }} Condition
 */
const CONDITION_LABELS = {
  clear: 'Bezchmurnie',
  'partly-cloudy': 'Częściowe zachmurzenie',
  cloudy: 'Zachmurzenie',
  fog: 'Mgła',
  drizzle: 'Mżawka',
  rain: 'Deszcz',
  sleet: 'Deszcz ze śniegiem',
  snow: 'Śnieg',
  thunder: 'Burza',
}

function makeCondition(code, isDay) {
  const safe = CONDITION_LABELS[code] ? code : 'cloudy'
  return { code: safe, isDay: isDay !== false, label: CONDITION_LABELS[safe] }
}

/** Enum Google Weather `weatherCondition.type` → nasz kod (po podłańcuchach, odporne na warianty). */
function googleTypeToCode(type) {
  const t = String(type || '').toUpperCase()
  if (t.includes('THUNDER')) return 'thunder'
  if (t.includes('RAIN_AND_SNOW') || t.includes('SLEET')) return 'sleet'
  if (t.includes('SNOW') || t.includes('HAIL') || t.includes('BLIZZARD')) return 'snow'
  if (t.includes('DRIZZLE')) return 'drizzle'
  if (t.includes('RAIN') || t.includes('SHOWER')) return 'rain'
  if (t.includes('FOG') || t.includes('MIST') || t.includes('HAZE')) return 'fog'
  if (t.includes('CLOUDY')) return t.includes('PARTLY') ? 'partly-cloudy' : 'cloudy'
  if (t.includes('MOSTLY_CLEAR') || t.includes('PARTLY')) return 'partly-cloudy'
  if (t.includes('CLEAR')) return 'clear'
  return 'cloudy'
}

/** Kod pogody WMO (Open-Meteo `weather_code`) → nasz kod. */
function wmoToCode(wmo) {
  const c = Number(wmo)
  if (c === 0) return 'clear'
  if (c === 1 || c === 2) return 'partly-cloudy'
  if (c === 3) return 'cloudy'
  if (c === 45 || c === 48) return 'fog'
  if (c >= 51 && c <= 57) return 'drizzle'
  if ((c >= 61 && c <= 65) || (c >= 80 && c <= 82)) return 'rain'
  if (c === 66 || c === 67) return 'sleet'
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'snow'
  if (c >= 95) return 'thunder'
  return 'cloudy'
}

async function fetchOutdoorWeatherGoogle({ lat, lon }, apiKey) {
  const url =
    `${GOOGLE_WEATHER_URL}?key=${encodeURIComponent(apiKey)}` +
    `&location.latitude=${lat}&location.longitude=${lon}` +
    `&unitsSystem=METRIC&languageCode=pl`
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`Google Weather HTTP ${res.status}`)
  const data = await res.json()

  const temp = data?.temperature?.degrees
  if (typeof temp !== 'number' || !Number.isFinite(temp)) return null

  const wc = data?.weatherCondition
  const condition = wc?.type
    ? makeCondition(googleTypeToCode(wc.type), data?.isDaytime)
    : null
  return { temp, condition }
}

async function fetchOutdoorWeatherOpenMeteo({ lat, lon }) {
  const url =
    `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,is_day`
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`)
  const data = await res.json()

  const temp = data?.current?.temperature_2m
  if (typeof temp !== 'number' || !Number.isFinite(temp)) return null

  const code = data?.current?.weather_code
  const condition = code == null ? null : makeCondition(wmoToCode(code), data?.current?.is_day !== 0)
  return { temp, condition }
}

/**
 * Bieżąca pogoda zewnętrzna (temperatura + warunek) dla lat/lon.
 *
 * Google jako główne źródło (gdy podano `apiKey`); przy błędzie sieci/HTTP/braku klucza
 * spada na Open-Meteo. Gdy oba zawiodą → wyjątek (runner łapie i pomija wpis, nie
 * ruszając klimy). Brak pola temperatury w odpowiedzi → null (też pominięcie).
 *
 * @param {{ lat:number, lon:number }} coords
 * @param {{ apiKey?:string }} [opts]
 * @returns {Promise<{ temp:number, condition:Condition|null }|null>}
 */
export async function getOutdoorWeather({ lat, lon }, { apiKey } = {}) {
  if (apiKey) {
    try {
      return await fetchOutdoorWeatherGoogle({ lat, lon }, apiKey)
    } catch (err) {
      console.warn('[weather] Google Weather failed, fallback to Open-Meteo', err)
    }
  }
  return fetchOutdoorWeatherOpenMeteo({ lat, lon })
}

/**
 * Sama bieżąca temperatura zewnętrzna (2 m) — używana przez runner termostatu, któremu
 * warunek pogodowy jest niepotrzebny. Cienka nakładka na `getOutdoorWeather`.
 *
 * @param {{ lat:number, lon:number }} coords
 * @param {{ apiKey?:string }} [opts]
 * @returns {Promise<number|null>} temperatura w °C lub null gdy brak danych
 */
export async function getOutdoorTemp({ lat, lon }, opts) {
  const w = await getOutdoorWeather({ lat, lon }, opts)
  return w ? w.temp : null
}

/**
 * Geocoding nazwy miejscowości → współrzędne + czytelna etykieta (Open-Meteo Geocoding API).
 * Wołane raz przy zapisie konfiguracji termostatu; wynik (lat/lon) utrwalany w bazie.
 *
 * @param {string} name — nazwa miasta
 * @returns {Promise<{lat:number, lon:number, label:string}|null>} null = brak/pusta nazwa
 */
export async function geocodeCity(name) {
  const q = (name ?? '').trim()
  if (!q) return null

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(q)}&count=1&language=pl&format=json`
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`Open-Meteo Geocoding HTTP ${res.status}`)
  const data = await res.json()
  const hit = data?.results?.[0]
  if (!hit || typeof hit.latitude !== 'number' || typeof hit.longitude !== 'number') return null

  const label = [hit.name, hit.admin1, hit.country].filter(Boolean).join(', ')
  return { lat: hit.latitude, lon: hit.longitude, label }
}
