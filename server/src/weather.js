// Open-Meteo: darmowe, bez klucza API. Bieżąca temperatura 2 m dla współrzędnych.
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FETCH_TIMEOUT_MS = 8000

/**
 * Dostawca pogody (deep module) — granica między automatyką a Open-Meteo.
 *
 * Zwraca bieżącą temperaturę zewnętrzną (2 m) dla lat/lon. Błąd HTTP/sieci → wyjątek
 * (runner łapie i pomija wpis, nie ruszając klimy). Brak pola temperatury w odpowiedzi
 * → null (też pominięcie). Bez klucza API.
 *
 * @param {{ lat:number, lon:number }} coords
 * @returns {Promise<number|null>} temperatura w °C lub null gdy brak danych
 */
export async function getOutdoorTemp({ lat, lon }) {
  const url = `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m`
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`)
  const data = await res.json()
  const temp = data?.current?.temperature_2m
  if (typeof temp !== 'number' || !Number.isFinite(temp)) return null
  return temp
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
