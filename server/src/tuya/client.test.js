import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  getTuyaToken, getDeviceInfo, getDeviceStatus, getDeviceFunctions,
  listProjectDevices, formatStatuses, sendCommands,
} from './client.js'

const CTX = { clientId: 'cid', clientSecret: 'secret', datacenter: 'eu', accessToken: 'tok' }

afterEach(() => vi.unstubAllGlobals())

function mockTuya(jsonBody) {
  const fetchMock = vi.fn(async () => ({ json: async () => jsonBody }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('getTuyaToken', () => {
  it('returns access token and expiry on success', async () => {
    const fetchMock = mockTuya({
      success: true,
      result: { access_token: 'abc123', expire_time: 7200 },
    })

    const res = await getTuyaToken({ clientId: 'cid', clientSecret: 'secret', datacenter: 'eu' })

    expect(res).toEqual({ accessToken: 'abc123', expireTime: 7200 })
  })

  it('hits the EU token endpoint with signed headers', async () => {
    const fetchMock = mockTuya({
      success: true,
      result: { access_token: 'x', expire_time: 1 },
    })

    await getTuyaToken({ clientId: 'cid', clientSecret: 'secret', datacenter: 'eu' })

    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('https://openapi.tuyaeu.com/v1.0/token?grant_type=1')
    expect(opts.method).toBe('GET')
    expect(opts.headers.client_id).toBe('cid')
    expect(opts.headers.sign_method).toBe('HMAC-SHA256')
    // podpis to uppercase hex HMAC-SHA256
    expect(opts.headers.sign).toMatch(/^[0-9A-F]{64}$/)
    expect(opts.headers.t).toMatch(/^\d+$/)
    expect(typeof opts.headers.nonce).toBe('string')
    expect(opts.headers.nonce.length).toBeGreaterThan(0)
  })

  it('routes to the US datacenter when specified', async () => {
    const fetchMock = mockTuya({ success: true, result: { access_token: 'x', expire_time: 1 } })
    await getTuyaToken({ clientId: 'cid', clientSecret: 's', datacenter: 'us' })
    expect(fetchMock.mock.calls[0][0]).toContain('openapi.tuyaus.com')
  })

  it('defaults to the EU datacenter for an unknown region', async () => {
    const fetchMock = mockTuya({ success: true, result: { access_token: 'x', expire_time: 1 } })
    await getTuyaToken({ clientId: 'cid', clientSecret: 's', datacenter: 'zz' })
    expect(fetchMock.mock.calls[0][0]).toContain('openapi.tuyaeu.com')
  })

  it('throws with the Tuya error code and message on failure', async () => {
    mockTuya({ success: false, code: 1004, msg: 'sign invalid' })
    await expect(
      getTuyaToken({ clientId: 'cid', clientSecret: 'bad', datacenter: 'eu' }),
    ).rejects.toThrow(/1004/)
  })
})

describe('formatStatuses', () => {
  it('scales raw Tuya values to human units', () => {
    const out = formatStatuses([
      { code: 'switch_1', value: true },
      { code: 'cur_power', value: 123 },
      { code: 'cur_voltage', value: 2300 },
      { code: 'cur_current', value: 456 },
      { code: 'add_ele', value: 789 },
    ])
    expect(out.switchOn).toBe(true)
    expect(out.powerW).toBe(12.3)
    expect(out.voltageV).toBe(230)
    expect(out.currentA).toBe(0.456)
    expect(out.energyKwh).toBe(0.789)
  })

  it('falls back across switch codes and tolerates missing fields', () => {
    const out = formatStatuses([{ code: 'switch', value: false }])
    expect(out.switchOn).toBe(false)
    expect(out.powerW).toBeUndefined()
    expect(out.raw).toEqual({ switch: false })
  })
})

describe('device endpoints', () => {
  it('getDeviceStatus signs with the access token and returns the result', async () => {
    const fetchMock = mockTuya({ success: true, result: [{ code: 'switch_1', value: true }] })
    const res = await getDeviceStatus(CTX, 'dev123')
    expect(res).toEqual([{ code: 'switch_1', value: true }])
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('https://openapi.tuyaeu.com/v1.0/iot-03/devices/dev123/status')
    expect(opts.headers.access_token).toBe('tok')
    expect(opts.headers.sign).toMatch(/^[0-9A-F]{64}$/)
  })

  it('getDeviceInfo hits the device endpoint', async () => {
    const fetchMock = mockTuya({ success: true, result: { name: 'Salon', product_id: 'p1', online: true } })
    const res = await getDeviceInfo(CTX, 'dev123')
    expect(res.name).toBe('Salon')
    expect(fetchMock.mock.calls[0][0]).toBe('https://openapi.tuyaeu.com/v1.0/iot-03/devices/dev123')
  })

  it('getDeviceInfo throws when the device is unknown', async () => {
    mockTuya({ success: false, code: 1106, msg: 'permission deny' })
    await expect(getDeviceInfo(CTX, 'nope')).rejects.toThrow(/1106/)
  })

  it('getDeviceFunctions hits the functions endpoint', async () => {
    const fetchMock = mockTuya({ success: true, result: { functions: [{ code: 'switch_1', type: 'Boolean' }] } })
    const res = await getDeviceFunctions(CTX, 'dev123')
    expect(res.functions[0].code).toBe('switch_1')
    expect(fetchMock.mock.calls[0][0]).toBe('https://openapi.tuyaeu.com/v1.0/iot-03/devices/dev123/functions')
  })

  it('listProjectDevices hits the associated-users devices endpoint', async () => {
    const fetchMock = mockTuya({ success: true, result: { devices: [{ id: 'd1', name: 'Gniazdo', online: true }] } })
    const res = await listProjectDevices(CTX)
    expect(res.devices[0].id).toBe('d1')
    expect(fetchMock.mock.calls[0][0]).toContain('/v1.0/iot-01/associated-users/devices')
  })

  it('sendCommands POSTs the commands payload signed with the token', async () => {
    const fetchMock = mockTuya({ success: true, result: true })
    const res = await sendCommands(CTX, 'dev123', [{ code: 'switch_1', value: false }])
    expect(res).toBe(true)
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('https://openapi.tuyaeu.com/v1.0/iot-03/devices/dev123/commands')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual({ commands: [{ code: 'switch_1', value: false }] })
    expect(opts.headers.access_token).toBe('tok')
  })
})
