import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Granica: klient Tuya (zewnętrzne API). Mockujemy wrapper — nie global fetch (Neon też go używa).
vi.mock('./tuya/client.js', async () => {
  const actual = await vi.importActual('./tuya/client.js')
  return {
    getTuyaToken: vi.fn(),
    getDeviceInfo: vi.fn(),
    getDeviceFunctions: vi.fn(),
    getDeviceStatus: vi.fn(),
    listProjectDevices: vi.fn(),
    sendCommands: vi.fn(),
    formatStatuses: actual.formatStatuses,
  }
})

import { app, upsertUserAndHousehold } from './app.js'
import {
  getTuyaToken, getDeviceInfo, getDeviceFunctions, getDeviceStatus, listProjectDevices, sendCommands,
} from './tuya/client.js'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'

const sql = neon(process.env.DATABASE_URL)
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'test-secret')

let createdUserIds = []
const uniq = () => Math.random().toString(36).slice(2, 10)

async function createUser(googleId, email, name) {
  const db = neon(process.env.DATABASE_URL)
  const user = await upsertUserAndHousehold(db, { sub: googleId, email, name })
  createdUserIds.push(user.id)
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
  return { user, token }
}

async function addMemberToHousehold(ownerToken) {
  const email = `mem-${uniq()}@test.com`
  const invRes = await app.request('/api/household/invite', {
    method: 'POST',
    headers: { cookie: `token=${ownerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const { invitation } = await invRes.json()
  const member = await createUser(`g-mem-${uniq()}`, email, 'Member')
  await app.request(`/api/household/invite/${invitation.token}/accept`, {
    method: 'POST',
    headers: { cookie: `token=${member.token}` },
  })
  return member
}

/** Owner z zapisanymi (zweryfikowanymi) poświadczeniami Tuya. */
async function createOwnerWithCreds() {
  const owner = await createUser(`g-own-${uniq()}`, `own-${uniq()}@test.com`, 'Owner')
  vi.mocked(getTuyaToken).mockResolvedValue({ accessToken: 'tok', expireTime: 7200 })
  await app.request('/api/tuya/credentials', {
    method: 'PUT',
    headers: { cookie: `token=${owner.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: 'cid', clientSecret: 'sec', datacenter: 'eu' }),
  })
  return owner
}

function postDevice(token, tuyaDeviceId) {
  return app.request('/api/smart-devices', {
    method: 'POST',
    headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tuyaDeviceId }),
  })
}

function listDevices(token) {
  return app.request('/api/smart-devices', { headers: { cookie: `token=${token}` } })
}

async function addDevice(ownerToken, id = 'dev123', name = 'Salon') {
  vi.mocked(getDeviceInfo).mockResolvedValue({ name, online: true })
  vi.mocked(getDeviceFunctions).mockResolvedValue({ functions: [] })
  return (await postDevice(ownerToken, id)).json()
}

/** Urządzenie z zapisywalnym DP switch_1 (do testów sterowania). */
async function addControllableDevice(ownerToken, id = 'dev123') {
  vi.mocked(getDeviceInfo).mockResolvedValue({ name: 'Gniazdo', online: true })
  vi.mocked(getDeviceFunctions).mockResolvedValue({ functions: [{ code: 'switch_1', type: 'Boolean' }] })
  return (await postDevice(ownerToken, id)).json()
}

function sendCommand(token, deviceRowId, commands) {
  return app.request(`/api/smart-devices/${deviceRowId}/commands`, {
    method: 'POST',
    headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands }),
  })
}

async function countCommandLog(deviceRowId) {
  const [r] = await sql`SELECT count(*)::int n FROM device_command_log WHERE device_id = ${deviceRowId}`
  return r.n
}

beforeEach(() => {
  createdUserIds = []
  vi.mocked(getTuyaToken).mockReset()
  vi.mocked(getDeviceInfo).mockReset()
  vi.mocked(getDeviceFunctions).mockReset()
  vi.mocked(getDeviceStatus).mockReset()
  vi.mocked(listProjectDevices).mockReset()
  vi.mocked(sendCommands).mockReset()
})

afterEach(async () => {
  if (createdUserIds.length) {
    await sql`DELETE FROM users WHERE id = ANY(${createdUserIds})`
  }
})

describe('POST /api/smart-devices', () => {
  it('adds a device by id and returns it in the list with functions snapshot', async () => {
    const owner = await createOwnerWithCreds()
    vi.mocked(getDeviceInfo).mockResolvedValue({ name: 'Salon', product_name: 'Smart Plug', product_id: 'p1', online: true })
    vi.mocked(getDeviceFunctions).mockResolvedValue({ functions: [{ code: 'switch_1', type: 'Boolean' }] })

    const res = await postDevice(owner.token, 'dev123')
    expect(res.status).toBe(201)
    const created = await res.json()
    expect(created).toMatchObject({ tuyaDeviceId: 'dev123', displayName: 'Salon' })

    const list = await (await listDevices(owner.token)).json()
    expect(list.devices).toHaveLength(1)
    expect(list.devices[0]).toMatchObject({ tuyaDeviceId: 'dev123', displayName: 'Salon', isActive: true })
    expect(list.devices[0].functionsJson).toBeTruthy()
  })

  it('returns 404 when the device is unknown in Tuya', async () => {
    const owner = await createOwnerWithCreds()
    vi.mocked(getDeviceInfo).mockRejectedValue(new Error('Tuya API: [1106] permission deny'))
    const res = await postDevice(owner.token, 'ghost')
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe('device_not_found_in_tuya')
  })

  it('returns 409 when the device is already linked to another household', async () => {
    const owner1 = await createOwnerWithCreds()
    vi.mocked(getDeviceInfo).mockResolvedValue({ name: 'Salon', online: true })
    vi.mocked(getDeviceFunctions).mockResolvedValue({ functions: [] })
    expect((await postDevice(owner1.token, 'shared-dev')).status).toBe(201)

    const owner2 = await createOwnerWithCreds()
    const res = await postDevice(owner2.token, 'shared-dev')
    expect(res.status).toBe(409)
    expect((await res.json()).error).toBe('device_already_linked')
  })

  it('returns 403 for a member adding a device', async () => {
    const owner = await createOwnerWithCreds()
    const member = await addMemberToHousehold(owner.token)
    const res = await postDevice(member.token, 'dev123')
    expect(res.status).toBe(403)
  })

  it('returns 401 without auth', async () => {
    const res = await app.request('/api/smart-devices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tuyaDeviceId: 'x' }),
    })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/smart-devices', () => {
  it('lets a member see the household devices', async () => {
    const owner = await createOwnerWithCreds()
    vi.mocked(getDeviceInfo).mockResolvedValue({ name: 'Salon', online: true })
    vi.mocked(getDeviceFunctions).mockResolvedValue({ functions: [] })
    await postDevice(owner.token, 'dev123')
    const member = await addMemberToHousehold(owner.token)

    const list = await (await listDevices(member.token)).json()
    expect(list.devices).toHaveLength(1)
    expect(list.devices[0].tuyaDeviceId).toBe('dev123')
  })
})

describe('PATCH /api/smart-devices/:id', () => {
  it('owner renames and deactivates a device', async () => {
    const owner = await createOwnerWithCreds()
    const dev = await addDevice(owner.token)

    const res = await app.request(`/api/smart-devices/${dev.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${owner.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Salon — lampa', isActive: false }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ displayName: 'Salon — lampa', isActive: false })

    const list = await (await listDevices(owner.token)).json()
    expect(list.devices[0]).toMatchObject({ displayName: 'Salon — lampa', isActive: false })
  })

  it('returns 403 for a member', async () => {
    const owner = await createOwnerWithCreds()
    const dev = await addDevice(owner.token)
    const member = await addMemberToHousehold(owner.token)
    const res = await app.request(`/api/smart-devices/${dev.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${member.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'X' }),
    })
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/smart-devices/:id', () => {
  it('owner removes a device from the household', async () => {
    const owner = await createOwnerWithCreds()
    const dev = await addDevice(owner.token)

    const del = await app.request(`/api/smart-devices/${dev.id}`, {
      method: 'DELETE', headers: { cookie: `token=${owner.token}` },
    })
    expect(del.status).toBe(204)

    const list = await (await listDevices(owner.token)).json()
    expect(list.devices).toHaveLength(0)
  })

  it('returns 403 for a member', async () => {
    const owner = await createOwnerWithCreds()
    const dev = await addDevice(owner.token)
    const member = await addMemberToHousehold(owner.token)
    const res = await app.request(`/api/smart-devices/${dev.id}`, {
      method: 'DELETE', headers: { cookie: `token=${member.token}` },
    })
    expect(res.status).toBe(403)
  })
})

describe('GET /api/smart-devices/status (batch)', () => {
  it('returns live status per device and stays graceful when one fails', async () => {
    const owner = await createOwnerWithCreds()
    await addDevice(owner.token, 'dev-a', 'A')
    await addDevice(owner.token, 'dev-b', 'B')
    vi.mocked(getDeviceStatus).mockImplementation(async (_ctx, deviceId) => {
      if (deviceId === 'dev-a') return [{ code: 'switch_1', value: true }, { code: 'cur_power', value: 155 }]
      throw new Error('Tuya API: device offline')
    })

    const res = await app.request('/api/smart-devices/status', { headers: { cookie: `token=${owner.token}` } })
    expect(res.status).toBe(200)
    const { statuses } = await res.json()
    const a = statuses.find((s) => s.tuyaDeviceId === 'dev-a')
    const b = statuses.find((s) => s.tuyaDeviceId === 'dev-b')
    expect(a).toMatchObject({ ok: true, switchOn: true, powerW: 15.5 })
    expect(b).toMatchObject({ ok: false })
  })

  it('lets a member read status', async () => {
    const owner = await createOwnerWithCreds()
    await addDevice(owner.token, 'dev-a', 'A')
    const member = await addMemberToHousehold(owner.token)
    vi.mocked(getDeviceStatus).mockResolvedValue([{ code: 'cur_power', value: 100 }])
    const res = await app.request('/api/smart-devices/status', { headers: { cookie: `token=${member.token}` } })
    expect(res.status).toBe(200)
    expect((await res.json()).statuses[0]).toMatchObject({ ok: true, powerW: 10 })
  })
})

describe('GET /api/smart-devices/:id/status', () => {
  it('returns a single device status', async () => {
    const owner = await createOwnerWithCreds()
    const dev = await addDevice(owner.token)
    vi.mocked(getDeviceStatus).mockResolvedValue([{ code: 'cur_power', value: 200 }])
    const res = await app.request(`/api/smart-devices/${dev.id}/status`, { headers: { cookie: `token=${owner.token}` } })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, powerW: 20 })
  })
})

describe('GET /api/smart-devices/discover', () => {
  it('owner gets devices from the linked account', async () => {
    const owner = await createOwnerWithCreds()
    vi.mocked(listProjectDevices).mockResolvedValue({ devices: [{ id: 'd1', name: 'Gniazdo', online: true }] })
    const res = await app.request('/api/smart-devices/discover', { headers: { cookie: `token=${owner.token}` } })
    expect(res.status).toBe(200)
    const { devices } = await res.json()
    expect(devices[0]).toMatchObject({ id: 'd1', name: 'Gniazdo', online: true })
  })

  it('returns 403 for a member', async () => {
    const owner = await createOwnerWithCreds()
    const member = await addMemberToHousehold(owner.token)
    const res = await app.request('/api/smart-devices/discover', { headers: { cookie: `token=${member.token}` } })
    expect(res.status).toBe(403)
  })
})

describe('POST /api/smart-devices/:id/commands', () => {
  it('owner sends a valid command, it reaches Tuya and is logged', async () => {
    const owner = await createOwnerWithCreds()
    const dev = await addControllableDevice(owner.token)
    vi.mocked(sendCommands).mockResolvedValue(true)

    const res = await sendCommand(owner.token, dev.id, [{ code: 'switch_1', value: false }])
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)

    expect(vi.mocked(sendCommands)).toHaveBeenCalledWith(
      expect.anything(), 'dev123', [{ code: 'switch_1', value: false }],
    )
    expect(await countCommandLog(dev.id)).toBe(1)
  })

  it('lets a member control the device', async () => {
    const owner = await createOwnerWithCreds()
    const dev = await addControllableDevice(owner.token)
    const member = await addMemberToHousehold(owner.token)
    vi.mocked(sendCommands).mockResolvedValue(true)

    const res = await sendCommand(member.token, dev.id, [{ code: 'switch_1', value: true }])
    expect(res.status).toBe(200)
  })

  it('rejects a command for a non-writable DP without calling Tuya or logging', async () => {
    const owner = await createOwnerWithCreds()
    const dev = await addControllableDevice(owner.token)
    vi.mocked(sendCommands).mockResolvedValue(true)

    const res = await sendCommand(owner.token, dev.id, [{ code: 'evil_code', value: true }])
    expect(res.status).toBe(400)
    expect(vi.mocked(sendCommands)).not.toHaveBeenCalled()
    expect(await countCommandLog(dev.id)).toBe(0)
  })

  it('rejects a wrong value type for a Boolean DP', async () => {
    const owner = await createOwnerWithCreds()
    const dev = await addControllableDevice(owner.token)
    const res = await sendCommand(owner.token, dev.id, [{ code: 'switch_1', value: 'on' }])
    expect(res.status).toBe(400)
  })

  it('returns 401 without auth', async () => {
    const res = await app.request('/api/smart-devices/whatever/commands', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [{ code: 'switch_1', value: true }] }),
    })
    expect(res.status).toBe(401)
  })

  it('does not log a false success when Tuya rejects the command', async () => {
    const owner = await createOwnerWithCreds()
    const dev = await addControllableDevice(owner.token)
    vi.mocked(sendCommands).mockRejectedValue(new Error('Tuya API: command failed'))

    const res = await sendCommand(owner.token, dev.id, [{ code: 'switch_1', value: false }])
    expect(res.status).toBeGreaterThanOrEqual(500)
    expect(await countCommandLog(dev.id)).toBe(0)
  })
})
