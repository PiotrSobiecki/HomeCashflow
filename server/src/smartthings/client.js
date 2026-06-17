/**
 * Cienki klient REST SmartThings (granica I/O — w testach mockowany).
 * Czyste normalizacje (typ, etykieta) siedzą w devices.js i są pokryte testami osobno.
 *
 * @see https://developer.smartthings.com/docs/api/public#operation/getDevices
 */

const SMARTTHINGS_API_BASE = 'https://api.smartthings.com/v1'

async function stGet(ctx, path) {
  const res = await fetch(`${SMARTTHINGS_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${ctx.accessToken}`, Accept: 'application/json' },
  })
  if (!res.ok) {
    const body = await res.text()
    const err = new Error(`SmartThings ${path} → ${res.status} ${res.statusText}`)
    err.status = res.status
    err.body = body
    throw err
  }
  return res.json()
}

/** Lista urządzeń z konta (surowe obiekty `items`). */
export async function getStDevices(ctx) {
  const json = await stGet(ctx, '/devices')
  return json?.items ?? []
}

/** Pojedyncze urządzenie wraz z komponentami/capabilities (snapshot przy dodaniu). */
export async function getStDevice(ctx, deviceId) {
  return stGet(ctx, `/devices/${deviceId}`)
}

/** Pełny status urządzenia (components → capabilities → atrybuty). Wejście mappera. */
export async function getStDeviceStatus(ctx, deviceId) {
  return stGet(ctx, `/devices/${deviceId}/status`)
}
