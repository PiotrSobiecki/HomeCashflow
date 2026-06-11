/**
 * Cienki klient Tuya IoT Open API v1.0 dla Cloudflare Workers (Web Crypto).
 * Port logiki ze spike `kopalnie_krypto/crm/scripts/tuya-spike.mjs`,
 * z `node:crypto` przepisanym na `crypto.subtle`.
 *
 * Slice 1 używa tylko getToken (weryfikacja poświadczeń). Status/komendy/funkcje
 * dochodzą w kolejnych slice'ach.
 *
 * @see https://developer.tuya.com/en/docs/iot/singnature
 */

const DATACENTERS = {
  eu: 'https://openapi.tuyaeu.com',
  us: 'https://openapi.tuyaus.com',
  cn: 'https://openapi.tuyacn.com',
  in: 'https://openapi.tuyain.com',
}

/** Base URL dla regionu; nieznany → EU. */
export function tuyaBaseUrl(datacenter) {
  return DATACENTERS[String(datacenter || '').toLowerCase()] ?? DATACENTERS.eu
}

function toHex(buf) {
  const bytes = new Uint8Array(buf)
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0')
  }
  return out
}

/** SHA256 hex (pusty body → stały hash pustego stringa). */
async function sha256Hex(data) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  return toHex(buf)
}

/**
 * stringToSign = METHOD + "\n" + Content-SHA256 + "\n" + Headers + "\n" + URL
 * (Headers pusty — nie podpisujemy nagłówków opcjonalnych.)
 */
async function buildStringToSign(method, path, bodyStr = '') {
  const contentHash = await sha256Hex(bodyStr)
  return `${method}\n${contentHash}\n\n${path}`
}

async function calcSign(secret, clientId, accessToken, t, n, stringToSign) {
  const str = accessToken
    ? `${clientId}${accessToken}${t}${n}${stringToSign}`
    : `${clientId}${t}${n}${stringToSign}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(str))
  return toHex(sigBuf).toUpperCase()
}

function nonce() {
  return crypto.randomUUID().replace(/-/g, '')
}

/**
 * Podpisany request do Tuya. Rzuca gdy `success !== true`.
 * @returns {Promise<unknown>} pole `result` z odpowiedzi
 */
async function tuyaFetch({ baseUrl, clientId, clientSecret, accessToken = null, method, path, body }) {
  const t = String(Date.now())
  const n = nonce()
  const bodyStr = body ? JSON.stringify(body) : ''
  const stringToSign = await buildStringToSign(method, path, bodyStr)
  const sig = await calcSign(clientSecret, clientId, accessToken, t, n, stringToSign)

  const headers = {
    client_id: clientId,
    sign: sig,
    t,
    sign_method: 'HMAC-SHA256',
    nonce: n,
    'Content-Type': 'application/json',
  }
  if (accessToken) headers.access_token = accessToken

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: bodyStr || undefined,
  })
  const json = await res.json()
  if (!json || json.success !== true) {
    const code = json?.code ?? '?'
    const msg = json?.msg ?? 'unknown error'
    throw new Error(`Tuya API ${path}: [${code}] ${msg}`)
  }
  return json.result
}

/**
 * Pobiera access token (grant_type=1). Sukces = poświadczenia poprawne.
 * @param {{ clientId: string, clientSecret: string, datacenter?: string }} creds
 * @returns {Promise<{ accessToken: string, expireTime: number }>}
 */
export async function getTuyaToken({ clientId, clientSecret, datacenter }) {
  const result = await tuyaFetch({
    baseUrl: tuyaBaseUrl(datacenter),
    clientId,
    clientSecret,
    method: 'GET',
    path: '/v1.0/token?grant_type=1',
  })
  return {
    accessToken: result.access_token,
    expireTime: result.expire_time,
  }
}

/**
 * Wywołanie podpisane tokenem dostępu — używane przez endpointy urządzeń.
 * @param {{ clientId, clientSecret, datacenter, accessToken }} ctx
 */
function tuyaFetchWithToken(ctx, method, path, body) {
  return tuyaFetch({
    baseUrl: tuyaBaseUrl(ctx.datacenter),
    clientId: ctx.clientId,
    clientSecret: ctx.clientSecret,
    accessToken: ctx.accessToken,
    method,
    path,
    body,
  })
}

export function getDeviceInfo(ctx, deviceId) {
  return tuyaFetchWithToken(ctx, 'GET', `/v1.0/iot-03/devices/${deviceId}`)
}

export function getDeviceStatus(ctx, deviceId) {
  return tuyaFetchWithToken(ctx, 'GET', `/v1.0/iot-03/devices/${deviceId}/status`)
}

/**
 * Stan "cienia" urządzenia z czasem ostatniego raportu per DP (`time`, ms epoch).
 * Kluczowe dla energii: `add_ele` to przyrost zdarzeniowy — bez `time` nie da się
 * odróżnić nowego raportu od zatrzaśniętej starej wartości oddawanej między raportami.
 * @returns {Promise<{ properties: Array<{ code: string, value: unknown, time?: number }> }>}
 */
export function getDeviceProperties(ctx, deviceId) {
  return tuyaFetchWithToken(ctx, 'GET', `/v2.0/cloud/thing/${deviceId}/shadow/properties`)
}

/**
 * Logi raportów DP (type=7) w oknie [startMs, endMs]. Zwraca KAŻDĄ paczkę add_ele
 * z jej event_time — bez gubienia (w przeciwieństwie do pollowania cienia).
 * `codes` filtruje DP (np. 'add_ele'). Tuya stronicuje przez `last_row_key`.
 * @returns {Promise<{ logs: Array<{ code, value, event_time }>, has_more?: boolean, last_row_key?: string }>}
 */
export function getDeviceLogs(ctx, deviceId, { startMs, endMs, codes = 'add_ele', size = 100, lastRowKey } = {}) {
  const qs = new URLSearchParams({
    type: '7',
    codes,
    start_time: String(startMs),
    end_time: String(endMs),
    size: String(size),
  })
  if (lastRowKey) qs.set('last_row_key', lastRowKey)
  qs.sort() // Tuya podpisuje URL z parametrami posortowanymi alfabetycznie po kluczu
  return tuyaFetchWithToken(ctx, 'GET', `/v1.0/devices/${deviceId}/logs?${qs.toString()}`)
}

/**
 * Wszystkie paczki add_ele w oknie [startMs, endMs] (z paginacją), znormalizowane.
 * To dokładne źródło zużycia — każda paczka z event_time, bez gubienia jak przy
 * pollowaniu cienia. UWAGA: retencja logów Tuya jest krótka (~doba), więc trzeba
 * zaciągać przyrostowo i składować lokalnie.
 * @returns {Promise<Array<{ eventMs: number, kwh: number }>>}
 */
export async function getAddEleEvents(ctx, deviceId, { startMs, endMs, maxPages = 50 } = {}) {
  const out = []
  let lastRowKey
  for (let page = 0; page < maxPages; page++) {
    const r = await getDeviceLogs(ctx, deviceId, { startMs, endMs, codes: 'add_ele', size: 100, lastRowKey })
    for (const l of r?.logs ?? []) {
      const eventMs = num(l.event_time)
      const raw = num(l.value)
      if (eventMs !== undefined && raw !== undefined) out.push({ eventMs, kwh: raw / 1000 })
    }
    if (!r?.has_more || !r?.last_row_key) break
    lastRowKey = r.last_row_key
  }
  return out
}

export function getDeviceFunctions(ctx, deviceId) {
  return tuyaFetchWithToken(ctx, 'GET', `/v1.0/iot-03/devices/${deviceId}/functions`)
}

/** Discover: urządzenia powiązane z projektem chmurowym (bez uid). */
export function listProjectDevices(ctx) {
  return tuyaFetchWithToken(ctx, 'GET', '/v1.0/iot-01/associated-users/devices')
}

/** Wysyła komendy sterujące. `commands` = [{ code, value }]. Zwraca result (zwykle true). */
export function sendCommands(ctx, deviceId, commands) {
  return tuyaFetchWithToken(ctx, 'POST', `/v1.0/iot-03/devices/${deviceId}/commands`, { commands })
}

function round(n, decimals) {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

function num(v) {
  if (v === undefined || v === null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

/**
 * Normalizacja surowego statusu Tuya do ludzkich jednostek.
 * cur_power ×0.1 W, cur_voltage ×0.1 V, cur_current ×0.001 A, add_ele ×0.001 kWh (Wh).
 * @see https://developer.tuya.com/en/docs/iot/standarddescription?id=K9i5ql6waswzq
 */
export function formatStatuses(statuses) {
  const map = Object.fromEntries((statuses ?? []).map((s) => [s.code, s.value]))
  return formatMap(map)
}

/**
 * Jak formatStatuses, ale z tablicy properties (shadow) — dodatkowo wyciąga
 * `energyReportedAt`: czas ostatniego raportu DP `add_ele` (Date z pola `time` ms).
 * To on pozwala policzyć każdy przyrost energii dokładnie raz.
 */
export function formatProperties(result) {
  const props = result?.properties ?? result ?? []
  const map = Object.fromEntries(props.map((p) => [p.code, p.value]))
  const addEle = props.find((p) => p.code === 'add_ele')
  const t = num(addEle?.time)
  return {
    ...formatMap(map),
    energyReportedAt: t !== undefined ? new Date(t) : undefined,
  }
}

function formatMap(map) {
  const rawVoltage = num(map.cur_voltage)
  const rawPower = num(map.cur_power)
  const rawCurrent = num(map.cur_current)
  const rawEnergy = num(map.add_ele)
  return {
    switchOn: map.switch_1 ?? map.switch ?? map.switch_led,
    voltageV: rawVoltage !== undefined ? round(rawVoltage / 10, 1) : undefined,
    powerW: rawPower !== undefined ? round(rawPower / 10, 1) : undefined,
    currentA: rawCurrent !== undefined ? round(rawCurrent / 1000, 3) : undefined,
    energyKwh: rawEnergy !== undefined ? round(rawEnergy / 1000, 3) : undefined,
    raw: map,
  }
}
