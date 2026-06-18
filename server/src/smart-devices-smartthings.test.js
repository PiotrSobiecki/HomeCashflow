import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Granice (zewnętrzne API): klient Tuya i klient SmartThings. Mockujemy wrappery —
// nie global fetch (Neon też go używa). Pure helpery (summarizeDevices) zostają realne.
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

/** Wstawia snapshot energii gniazdka (idempotentnie jak realny sync). */
async function insertEnergySnapshot(sql, deviceId, { at, energyKwh }) {
  await sql`
    INSERT INTO device_energy_snapshots (device_id, recorded_at, energy_kwh, energy_reported_at)
    VALUES (${deviceId}, ${at}, ${energyKwh}, ${at})
    ON CONFLICT (device_id, energy_reported_at) WHERE energy_reported_at IS NOT NULL DO NOTHING
  `
}
vi.mock('./smartthings/client.js', () => ({
  getStDevices: vi.fn(),
  getStDevice: vi.fn(),
  getStDeviceStatus: vi.fn(),
  sendStCommand: vi.fn(),
}))

import { app, upsertUserAndHousehold } from './app.js'
import { getTuyaToken, getDeviceInfo, getDeviceFunctions, getDeviceStatus } from './tuya/client.js'
import { getStDevices, getStDevice, getStDeviceStatus, sendStCommand } from './smartthings/client.js'
import { saveTokens } from './smartthings/credentials.js'
import { decodeFinanceDataKey } from './finance-crypto.js'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'

const sql = neon(process.env.DATABASE_URL)
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'test-secret')
const rawKey = decodeFinanceDataKey(process.env.FINANCE_DATA_KEY)

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
async function createTuyaOwner() {
  const owner = await createUser(`g-own-${uniq()}`, `own-${uniq()}@test.com`, 'Owner')
  vi.mocked(getTuyaToken).mockResolvedValue({ accessToken: 'tok', expireTime: 7200 })
  await app.request('/api/tuya/credentials', {
    method: 'PUT',
    headers: { cookie: `token=${owner.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: 'cid', clientSecret: 'sec', datacenter: 'eu' }),
  })
  return owner
}

/** Dodaje urządzenie Tuya (gniazdko) i zwraca utworzony wiersz. */
async function addTuyaDevice(ownerToken, id = 'tuya-dev-1', name = 'Salon') {
  vi.mocked(getDeviceInfo).mockResolvedValue({ name, online: true })
  vi.mocked(getDeviceFunctions).mockResolvedValue({ functions: [] })
  const res = await app.request('/api/smart-devices', {
    method: 'POST',
    headers: { cookie: `token=${ownerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tuyaDeviceId: id }),
  })
  return res.json()
}

function listDevices(token) {
  return app.request('/api/smart-devices', { headers: { cookie: `token=${token}` } })
}

/** Seeduje poświadczenia SmartThings (zaszyfrowany token, ważny) dla gospodarstwa ownera. */
async function connectSmartthings(owner) {
  const [m] = await sql`SELECT household_id FROM household_members WHERE user_id = ${owner.user.id}`
  await saveTokens(sql, {
    householdId: m.household_id,
    tokens: {
      accessToken: 'st-access',
      refreshToken: 'st-refresh',
      expiresAt: Date.now() + 3600 * 1000,
    },
    scopes: 'r:devices:* x:devices:*',
    createdBy: owner.user.id,
    rawKey,
  })
  return m.household_id
}

beforeEach(() => {
  createdUserIds = []
  vi.mocked(getTuyaToken).mockReset()
  vi.mocked(getDeviceInfo).mockReset()
  vi.mocked(getDeviceFunctions).mockReset()
  vi.mocked(getDeviceStatus).mockReset()
  vi.mocked(getStDevices).mockReset()
  vi.mocked(getStDevice).mockReset()
  vi.mocked(getStDeviceStatus).mockReset()
  vi.mocked(sendStCommand).mockReset()
})

afterEach(async () => {
  if (createdUserIds.length) {
    await sql`DELETE FROM users WHERE id = ANY(${createdUserIds})`
  }
})

/** Surowy obiekt urządzenia ST (jak z GET /v1/devices), z capability cyklu. */
function stDevice(deviceId, label, cycleCapability = 'washerOperatingState') {
  return {
    deviceId,
    label,
    components: [{ id: 'main', capabilities: [{ id: 'switch' }, { id: cycleCapability }] }],
  }
}

function discoverSt(token) {
  return app.request('/api/smart-devices/discover-smartthings', { headers: { cookie: `token=${token}` } })
}

function addStDevice(token, externalDeviceId, displayName) {
  return app.request('/api/smart-devices/smartthings', {
    method: 'POST',
    headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ externalDeviceId, displayName }),
  })
}

describe('smart_devices provider column (regression: Tuya)', () => {
  it('reports provider=tuya and externalDeviceId for an existing Tuya device', async () => {
    const owner = await createTuyaOwner()
    await addTuyaDevice(owner.token, 'tuya-dev-1', 'Salon')

    const { devices } = await (await listDevices(owner.token)).json()
    expect(devices).toHaveLength(1)
    expect(devices[0]).toMatchObject({
      tuyaDeviceId: 'tuya-dev-1',
      provider: 'tuya',
      externalDeviceId: 'tuya-dev-1',
    })
  })
})

describe('GET /api/smart-devices/discover-smartthings', () => {
  it('owner gets devices from the connected ST account with inferred type', async () => {
    const owner = await createTuyaOwner()
    await connectSmartthings(owner)
    vi.mocked(getStDevices).mockResolvedValue([
      stDevice('st-washer', 'Pralka', 'washerOperatingState'),
      stDevice('st-dryer', 'Suszarka', 'dryerOperatingState'),
    ])

    const res = await discoverSt(owner.token)
    expect(res.status).toBe(200)
    const { devices } = await res.json()
    expect(devices).toEqual([
      { deviceId: 'st-washer', label: 'Pralka', type: 'washer' },
      { deviceId: 'st-dryer', label: 'Suszarka', type: 'dryer' },
    ])
  })

  it('filters out devices already added to this household', async () => {
    const owner = await createTuyaOwner()
    await connectSmartthings(owner)
    // Pralka już dodana wcześniej.
    vi.mocked(getStDevice).mockResolvedValue(stDevice('st-washer', 'Pralka'))
    expect((await addStDevice(owner.token, 'st-washer', 'Pralka')).status).toBe(201)

    vi.mocked(getStDevices).mockResolvedValue([
      stDevice('st-washer', 'Pralka'),
      stDevice('st-dryer', 'Suszarka', 'dryerOperatingState'),
    ])
    const { devices } = await (await discoverSt(owner.token)).json()
    expect(devices.map((d) => d.deviceId)).toEqual(['st-dryer'])
  })

  it('returns 400 when ST account is not connected', async () => {
    const owner = await createTuyaOwner()
    const res = await discoverSt(owner.token)
    expect(res.status).toBe(400)
  })

  it('returns 403 for a member', async () => {
    const owner = await createTuyaOwner()
    await connectSmartthings(owner)
    const member = await addMemberToHousehold(owner.token)
    const res = await discoverSt(member.token)
    expect(res.status).toBe(403)
  })
})

describe('POST /api/smart-devices/smartthings', () => {
  it('adds a device as provider=smartthings with a saved capabilities snapshot', async () => {
    const owner = await createTuyaOwner()
    await connectSmartthings(owner)
    vi.mocked(getStDevice).mockResolvedValue(stDevice('st-washer', 'Pralka'))

    const res = await addStDevice(owner.token, 'st-washer', 'Pralka kuchnia')
    expect(res.status).toBe(201)
    const created = await res.json()
    expect(created).toMatchObject({
      provider: 'smartthings',
      externalDeviceId: 'st-washer',
      displayName: 'Pralka kuchnia',
      deviceType: 'washer',
      tuyaDeviceId: null,
    })
    expect(created.capabilitiesJson).toBeTruthy()

    const { devices } = await (await listDevices(owner.token)).json()
    const stRow = devices.find((d) => d.externalDeviceId === 'st-washer')
    expect(stRow).toMatchObject({ provider: 'smartthings', deviceType: 'washer' })
    // Snapshot zawiera capability cyklu (do mappera w Fazie 3).
    const capIds = stRow.capabilitiesJson[0].capabilities.map((cap) => cap.id)
    expect(capIds).toContain('washerOperatingState')
  })

  it('falls back to the ST label when no displayName is given', async () => {
    const owner = await createTuyaOwner()
    await connectSmartthings(owner)
    vi.mocked(getStDevice).mockResolvedValue(stDevice('st-dryer', 'Suszarka Samsung', 'dryerOperatingState'))

    const res = await addStDevice(owner.token, 'st-dryer')
    const created = await res.json()
    expect(created).toMatchObject({ displayName: 'Suszarka Samsung', deviceType: 'dryer' })
  })

  it('returns 409 when the device is already linked to another household', async () => {
    const owner1 = await createTuyaOwner()
    await connectSmartthings(owner1)
    vi.mocked(getStDevice).mockResolvedValue(stDevice('shared-st', 'Pralka'))
    expect((await addStDevice(owner1.token, 'shared-st', 'Pralka')).status).toBe(201)

    const owner2 = await createTuyaOwner()
    await connectSmartthings(owner2)
    const res = await addStDevice(owner2.token, 'shared-st', 'Pralka 2')
    expect(res.status).toBe(409)
    expect((await res.json()).error).toBe('device_already_linked')
  })

  it('returns 400 when ST account is not connected', async () => {
    const owner = await createTuyaOwner()
    const res = await addStDevice(owner.token, 'st-washer', 'Pralka')
    expect(res.status).toBe(400)
  })

  it('returns 403 for a member', async () => {
    const owner = await createTuyaOwner()
    await connectSmartthings(owner)
    const member = await addMemberToHousehold(owner.token)
    const res = await addStDevice(member.token, 'st-washer', 'Pralka')
    expect(res.status).toBe(403)
  })
})

describe('GET /api/smart-devices/status — SmartThings devices', () => {
  async function addWasher(owner) {
    vi.mocked(getStDevice).mockResolvedValue(stDevice('st-washer', 'Pralka'))
    await addStDevice(owner.token, 'st-washer', 'Pralka')
  }

  it('returns a mapped UI state (not raw JSON) for a running ST washer', async () => {
    const owner = await createTuyaOwner()
    await connectSmartthings(owner)
    await addWasher(owner)
    vi.mocked(getStDeviceStatus).mockResolvedValue({
      components: { main: {
        washerOperatingState: { machineState: { value: 'run' }, completionTime: { value: '2026-06-17T19:25:22Z' } },
        'samsungce.washerOperatingState': { remainingTime: { value: 164, unit: 'min' } },
      } },
    })

    const res = await app.request('/api/smart-devices/status', { headers: { cookie: `token=${owner.token}` } })
    expect(res.status).toBe(200)
    const { statuses } = await res.json()
    const st = statuses.find((s) => s.externalDeviceId === 'st-washer')
    expect(st).toMatchObject({
      provider: 'smartthings', ok: true, online: true,
      state: 'running', label: 'W trakcie', remainingMin: 164,
    })
  })

  it('marks an ST device offline when the status call fails', async () => {
    const owner = await createTuyaOwner()
    await connectSmartthings(owner)
    await addWasher(owner)
    vi.mocked(getStDeviceStatus).mockRejectedValue(new Error('ST device offline'))

    const { statuses } = await (await app.request('/api/smart-devices/status', { headers: { cookie: `token=${owner.token}` } })).json()
    const st = statuses.find((s) => s.externalDeviceId === 'st-washer')
    expect(st).toMatchObject({ provider: 'smartthings', ok: false, online: false })
  })
})

describe('PATCH /api/smart-devices/:id — link ST device to a Tuya plug (cost)', () => {
  async function setup() {
    const owner = await createTuyaOwner()
    await connectSmartthings(owner)
    const plug = await addTuyaDevice(owner.token, 'tuya-plug-1', 'Gniazdko pralki')
    vi.mocked(getStDevice).mockResolvedValue(stDevice('st-washer', 'Pralka'))
    const washer = await (await addStDevice(owner.token, 'st-washer', 'Pralka')).json()
    return { owner, plug, washer }
  }

  function patch(token, id, body) {
    return app.request(`/api/smart-devices/${id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('owner links the ST washer to a Tuya plug', async () => {
    const { owner, plug, washer } = await setup()
    const res = await patch(owner.token, washer.id, { linkedPlugId: plug.id })
    expect(res.status).toBe(200)
    expect((await res.json()).linkedPlugId).toBe(plug.id)
  })

  it('owner unlinks the plug (linkedPlugId: null)', async () => {
    const { owner, plug, washer } = await setup()
    await patch(owner.token, washer.id, { linkedPlugId: plug.id })
    const res = await patch(owner.token, washer.id, { linkedPlugId: null })
    expect(res.status).toBe(200)
    expect((await res.json()).linkedPlugId).toBeNull()
  })

  it('status of a linked ST washer shows plug power and today kWh', async () => {
    const { owner, plug, washer } = await setup()
    await patch(owner.token, washer.id, { linkedPlugId: plug.id })

    // kWh dziś z gniazdka (snapshot energii „teraz" — w bieżącej dobie warszawskiej),
    // moc bieżąca z odczytu Tuya.
    await insertEnergySnapshot(sql, plug.id, { at: new Date().toISOString(), energyKwh: 1.25 })
    vi.mocked(getStDeviceStatus).mockResolvedValue({
      components: { main: { washerOperatingState: { machineState: { value: 'run' } } } },
    })
    vi.mocked(getDeviceStatus).mockResolvedValue([{ code: 'cur_power', value: 1500 }]) // 150 W

    const { statuses } = await (await app.request('/api/smart-devices/status', { headers: { cookie: `token=${owner.token}` } })).json()
    const st = statuses.find((s) => s.externalDeviceId === 'st-washer')
    expect(st).toMatchObject({ provider: 'smartthings', state: 'running', linked: true, plugW: 150, todayKwh: 1.25 })
  })

  it('status of an unlinked ST washer has no consumption section', async () => {
    const { owner, washer } = await setup()
    vi.mocked(getStDeviceStatus).mockResolvedValue({
      components: { main: { washerOperatingState: { machineState: { value: 'stop' } } } },
    })

    const { statuses } = await (await app.request('/api/smart-devices/status', { headers: { cookie: `token=${owner.token}` } })).json()
    const st = statuses.find((s) => s.externalDeviceId === 'st-washer')
    expect(st.linked).toBeFalsy()
    expect(st.plugW).toBeUndefined()
    expect(st.todayKwh).toBeUndefined()
  })
})

describe('POST /api/smart-devices/:id/commands — SmartThings control', () => {
  function washerStatusJson(machineState, remote = 'true') {
    return { components: { main: {
      washerOperatingState: { machineState: { value: machineState } },
      remoteControlStatus: { remoteControlEnabled: { value: remote } },
    } } }
  }
  function command(token, id, action) {
    return app.request(`/api/smart-devices/${id}/commands`, {
      method: 'POST',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
  }
  async function logCount(deviceId) {
    const [r] = await sql`SELECT count(*)::int n FROM device_command_log WHERE device_id = ${deviceId}`
    return r.n
  }
  async function addWasher(owner) {
    vi.mocked(getStDevice).mockResolvedValue(stDevice('st-washer', 'Pralka'))
    return (await addStDevice(owner.token, 'st-washer', 'Pralka')).json()
  }

  it('member starts a washer with remote control enabled → command sent and logged', async () => {
    const owner = await createTuyaOwner()
    await connectSmartthings(owner)
    const washer = await addWasher(owner)
    const member = await addMemberToHousehold(owner.token)
    vi.mocked(getStDeviceStatus).mockResolvedValue(washerStatusJson('stop', 'true'))
    vi.mocked(sendStCommand).mockResolvedValue({})

    const res = await command(member.token, washer.id, 'start')
    expect(res.status).toBe(200)
    expect(vi.mocked(sendStCommand)).toHaveBeenCalledWith(
      expect.anything(), 'st-washer',
      { component: 'main', capability: 'washerOperatingState', command: 'setMachineState', arguments: ['run'] },
    )
    expect(await logCount(washer.id)).toBe(1)
  })

  it('rejects an action the device capability does not support (no ST call, no log)', async () => {
    const owner = await createTuyaOwner()
    await connectSmartthings(owner)
    vi.mocked(getStDevice).mockResolvedValue({ deviceId: 'st-fridge', label: 'Lodówka', components: [{ id: 'main', capabilities: [{ id: 'refrigeration' }] }] })
    const fridge = await (await addStDevice(owner.token, 'st-fridge', 'Lodówka')).json()

    const res = await command(owner.token, fridge.id, 'start')
    expect(res.status).toBe(400)
    expect(vi.mocked(sendStCommand)).not.toHaveBeenCalled()
    expect(await logCount(fridge.id)).toBe(0)
  })

  it('blocks the command with a Polish message when remote control is disabled', async () => {
    const owner = await createTuyaOwner()
    await connectSmartthings(owner)
    const washer = await addWasher(owner)
    vi.mocked(getStDeviceStatus).mockResolvedValue(washerStatusJson('run', 'false'))

    const res = await command(owner.token, washer.id, 'pause')
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('remote_control_disabled')
    expect(body.message).toMatch(/zdalne sterowanie/i)
    expect(vi.mocked(sendStCommand)).not.toHaveBeenCalled()
    expect(await logCount(washer.id)).toBe(0)
  })

  it('returns a Polish message and does not log when SmartThings rejects the command', async () => {
    const owner = await createTuyaOwner()
    await connectSmartthings(owner)
    const washer = await addWasher(owner)
    vi.mocked(getStDeviceStatus).mockResolvedValue(washerStatusJson('stop', 'true'))
    vi.mocked(sendStCommand).mockRejectedValue(Object.assign(new Error('conflict'), { status: 409 }))

    const res = await command(owner.token, washer.id, 'start')
    expect(res.status).toBeGreaterThanOrEqual(409)
    expect((await res.json()).message).toBeTruthy()
    expect(await logCount(washer.id)).toBe(0)
  })

  // Status pralki z listą wspieranych temperatur (do walidacji ustawień cyklu).
  function washerSettingsStatusJson(remote = 'true') {
    return { components: { main: {
      washerOperatingState: { machineState: { value: 'stop' } },
      remoteControlStatus: { remoteControlEnabled: { value: remote } },
      'custom.washerWaterTemperature': {
        washerWaterTemperature: { value: '40' },
        supportedWasherWaterTemperature: { value: ['cold', '20', '30', '40', '60', '90'] },
      },
    } } }
  }
  function setting(token, id, body) {
    return app.request(`/api/smart-devices/${id}/commands`, {
      method: 'POST',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('member sets washer water temperature → setWasherWaterTemperature sent and logged', async () => {
    const owner = await createTuyaOwner()
    await connectSmartthings(owner)
    const washer = await addWasher(owner)
    vi.mocked(getStDeviceStatus).mockResolvedValue(washerSettingsStatusJson('true'))
    vi.mocked(sendStCommand).mockResolvedValue({})

    const res = await setting(owner.token, washer.id, { setting: 'temperature', value: '60' })
    expect(res.status).toBe(200)
    expect(vi.mocked(sendStCommand)).toHaveBeenCalledWith(
      expect.anything(), 'st-washer',
      { component: 'main', capability: 'custom.washerWaterTemperature', command: 'setWasherWaterTemperature', arguments: ['60'] },
    )
    expect(await logCount(washer.id)).toBe(1)
  })

  it('rejects a setting value outside the supported list (no ST call, no log)', async () => {
    const owner = await createTuyaOwner()
    await connectSmartthings(owner)
    const washer = await addWasher(owner)
    vi.mocked(getStDeviceStatus).mockResolvedValue(washerSettingsStatusJson('true'))

    const res = await setting(owner.token, washer.id, { setting: 'temperature', value: '999' })
    expect(res.status).toBe(409)
    expect((await res.json()).error).toBe('setting_not_available')
    expect(vi.mocked(sendStCommand)).not.toHaveBeenCalled()
    expect(await logCount(washer.id)).toBe(0)
  })

  it('returns 401 without auth', async () => {
    const res = await app.request('/api/smart-devices/whatever/commands', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
    })
    expect(res.status).toBe(401)
  })

  it('status exposes available controls so the UI can render only supported buttons', async () => {
    const owner = await createTuyaOwner()
    await connectSmartthings(owner)
    const washer = await addWasher(owner)
    vi.mocked(getStDeviceStatus).mockResolvedValue(washerStatusJson('run', 'true'))

    const res = await app.request(`/api/smart-devices/${washer.id}/status`, { headers: { cookie: `token=${owner.token}` } })
    const body = await res.json()
    expect(body.controls).toEqual({ remoteControlEnabled: true, actions: ['pause', 'stop'] })
  })
})

describe('DELETE /api/smartthings/disconnect (cascade to ST devices)', () => {
  it('removes ST credentials and ST devices, leaving Tuya devices intact', async () => {
    const owner = await createTuyaOwner()
    const householdId = await connectSmartthings(owner)
    await addTuyaDevice(owner.token, 'tuya-keep', 'Gniazdko')
    vi.mocked(getStDevice).mockResolvedValue(stDevice('st-gone', 'Pralka'))
    await addStDevice(owner.token, 'st-gone', 'Pralka')

    const res = await app.request('/api/smartthings/disconnect', {
      method: 'DELETE', headers: { cookie: `token=${owner.token}` },
    })
    expect(res.status).toBe(204)

    // Poświadczenia ST skasowane.
    const [cred] = await sql`SELECT 1 FROM smartthings_credentials WHERE household_id = ${householdId}`
    expect(cred).toBeUndefined()

    // Urządzenie ST zniknęło, Tuya zostało.
    const { devices } = await (await listDevices(owner.token)).json()
    expect(devices.map((d) => d.externalDeviceId)).toEqual(['tuya-keep'])
    expect(devices.every((d) => d.provider === 'tuya')).toBe(true)
  })
})
