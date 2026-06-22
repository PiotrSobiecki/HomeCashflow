import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Granica: klient Tuya (zewnętrzne API). Mockujemy wrapper — nie global fetch (Neon też go używa).
vi.mock('./tuya/client.js', async () => {
  const actual = await vi.importActual('./tuya/client.js')
  return {
    getTuyaToken: vi.fn(),
    getDeviceInfo: vi.fn(),
    getDeviceFunctions: vi.fn(),
    getDeviceStatus: vi.fn(),
    getAcStatus: vi.fn(),
    listProjectDevices: vi.fn(),
    sendCommands: vi.fn(),
    sendAcCommand: vi.fn(),
    formatStatuses: actual.formatStatuses,
    formatAcStatus: actual.formatAcStatus,
  }
})

// Granica: geocoding Open-Meteo. Mock, żeby endpoint nie bił w realne API w teście.
vi.mock('./weather.js', () => ({
  geocodeCity: vi.fn(),
  getOutdoorTemp: vi.fn(),
}))

import { app, upsertUserAndHousehold } from './app.js'
import { getTuyaToken, sendAcCommand, getAcStatus, getDeviceStatus } from './tuya/client.js'
import { geocodeCity, getOutdoorTemp } from './weather.js'
import { runAcThermostats } from './ac-thermostat.js'
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

/** Owner z zapisanymi (zaszyfrowanymi) poświadczeniami Tuya. */
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

async function householdOf(userId) {
  const [m] = await sql`SELECT household_id FROM household_members WHERE user_id = ${userId}`
  return m.household_id
}

/** Wstawia urządzenie klimy IR (ir_ac) bezpośrednio do bazy. */
async function addIrAc(householdId, ownerId, { extId = `irac-${uniq()}`, parent = `blaster-${uniq()}` } = {}) {
  const [d] = await sql`
    INSERT INTO smart_devices (household_id, provider, external_device_id, tuya_device_id,
      display_name, device_type, ir_parent_id, created_by)
    VALUES (${householdId}, 'tuya', ${extId}, ${extId}, 'Klima', 'ir_ac', ${parent}, ${ownerId})
    RETURNING id
  `
  return { id: d.id, tuyaId: extId, parent }
}

async function addPlug(householdId, ownerId, { extId = `plug-${uniq()}` } = {}) {
  const [d] = await sql`
    INSERT INTO smart_devices (household_id, provider, external_device_id, tuya_device_id,
      display_name, device_type, created_by)
    VALUES (${householdId}, 'tuya', ${extId}, ${extId}, 'Gniazdko', 'plug', ${ownerId})
    RETURNING id
  `
  return { id: d.id, tuyaId: extId }
}

function putThermostat(token, deviceId, body) {
  return app.request(`/api/smart-devices/${deviceId}/thermostat`, {
    method: 'PUT',
    headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function getThermostat(token, deviceId) {
  return app.request(`/api/smart-devices/${deviceId}/thermostat`, {
    headers: { cookie: `token=${token}` },
  })
}

beforeEach(() => {
  createdUserIds = []
  vi.mocked(getTuyaToken).mockReset()
  vi.mocked(sendAcCommand).mockReset()
  vi.mocked(getAcStatus).mockReset()
  vi.mocked(getDeviceStatus).mockReset()
  vi.mocked(geocodeCity).mockReset()
  vi.mocked(getOutdoorTemp).mockReset()
  // Domyślnie: stan klimy nieznany (runner używa last_action jak wcześniej).
  vi.mocked(getAcStatus).mockResolvedValue({ power: undefined })
})

afterEach(async () => {
  if (createdUserIds.length) {
    await sql`DELETE FROM users WHERE id = ANY(${createdUserIds})`
  }
})

describe('runner termostatu — cron → decyzja → komenda Tuya', () => {
  it('włączony termostat z temp ≥ górnego progu wysyła power=1 i zapisuje last_action', async () => {
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const dev = await addIrAc(hh, owner.user.id)

    const put = await putThermostat(owner.token, dev.id, {
      enabled: true, locationLabel: 'Wrocław', lat: 51.1, lon: 17.03, tempOn: 26, tempOff: 24,
    })
    expect(put.status).toBe(200)

    const readOutdoorTemp = vi.fn().mockResolvedValue(28)
    const res = await runAcThermostats(sql, rawKey, { readOutdoorTemp })

    expect(res).toMatchObject({ checked: 1, switched: 1 })
    expect(sendAcCommand).toHaveBeenCalledWith(expect.anything(), dev.parent, dev.tuyaId, 'power', 1)

    const [t] = await sql`SELECT last_action, last_check_action, last_outdoor_temp FROM ac_thermostats WHERE device_id = ${dev.id}`
    expect(t.last_action).toBe('on')
    expect(t.last_check_action).toBe('on')
    expect(Number(t.last_outdoor_temp)).toBe(28)
  })

  it('temp ≤ dolnego progu przy klimie włączonej wysyła power=0', async () => {
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const dev = await addIrAc(hh, owner.user.id)
    await putThermostat(owner.token, dev.id, { enabled: true, lat: 51.1, lon: 17.03, tempOn: 26, tempOff: 24 })
    await sql`UPDATE ac_thermostats SET last_action = 'on' WHERE device_id = ${dev.id}`
    vi.mocked(getAcStatus).mockResolvedValue({ power: '1' })

    const res = await runAcThermostats(sql, rawKey, { readOutdoorTemp: vi.fn().mockResolvedValue(22) })

    expect(res).toMatchObject({ switched: 1 })
    expect(sendAcCommand).toHaveBeenCalledWith(expect.anything(), dev.parent, dev.tuyaId, 'power', 0)
    const [t] = await sql`SELECT last_action, last_check_action FROM ac_thermostats WHERE device_id = ${dev.id}`
    expect(t.last_action).toBe('off')
    expect(t.last_check_action).toBe('off')
  })

  it('nie wysyła power=0, gdy Tuya zgłasza że klima już jest wyłączona', async () => {
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const dev = await addIrAc(hh, owner.user.id)
    await putThermostat(owner.token, dev.id, { enabled: true, lat: 51.1, lon: 17.03, tempOn: 26, tempOff: 24 })
    await sql`UPDATE ac_thermostats SET last_action = 'on' WHERE device_id = ${dev.id}`
    vi.mocked(getAcStatus).mockResolvedValue({ power: '0' })

    const res = await runAcThermostats(sql, rawKey, { readOutdoorTemp: vi.fn().mockResolvedValue(22) })

    expect(res).toMatchObject({ checked: 1, switched: 0 })
    expect(sendAcCommand).not.toHaveBeenCalled()
    const [t] = await sql`SELECT last_action, last_check_action FROM ac_thermostats WHERE device_id = ${dev.id}`
    expect(t.last_action).toBe('on')
    expect(t.last_check_action).toBe(null)
  })

  it('gdy IR mówi wył., ale gniazdko pobiera prąd — wyłącza przy temp poniżej progu', async () => {
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const plug = await addPlug(hh, owner.user.id)
    const dev = await addIrAc(hh, owner.user.id)
    await sql`UPDATE smart_devices SET linked_plug_id = ${plug.id} WHERE id = ${dev.id}`
    await putThermostat(owner.token, dev.id, { enabled: true, lat: 51.1, lon: 17.03, tempOn: 26, tempOff: 24 })
    vi.mocked(getAcStatus).mockResolvedValue({ power: '0' })
    vi.mocked(getDeviceStatus).mockResolvedValue([{ code: 'cur_power', value: 450 }])

    const res = await runAcThermostats(sql, rawKey, { readOutdoorTemp: vi.fn().mockResolvedValue(22) })

    expect(res).toMatchObject({ checked: 1, switched: 1 })
    expect(sendAcCommand).toHaveBeenCalledWith(expect.anything(), dev.parent, dev.tuyaId, 'power', 0)
    const [t] = await sql`SELECT last_check_action FROM ac_thermostats WHERE device_id = ${dev.id}`
    expect(t.last_check_action).toBe('off')
  })

  it('w strefie martwej nie wysyła komendy, ale zapisuje last_checked_at i temperaturę', async () => {
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const dev = await addIrAc(hh, owner.user.id)
    await putThermostat(owner.token, dev.id, { enabled: true, lat: 51.1, lon: 17.03, tempOn: 26, tempOff: 24 })

    const res = await runAcThermostats(sql, rawKey, { readOutdoorTemp: vi.fn().mockResolvedValue(25) })

    expect(res).toMatchObject({ checked: 1, switched: 0 })
    expect(sendAcCommand).not.toHaveBeenCalled()
    const [t] = await sql`SELECT last_action, last_check_action, last_outdoor_temp, last_checked_at FROM ac_thermostats WHERE device_id = ${dev.id}`
    expect(t.last_action).toBe(null)
    expect(t.last_check_action).toBe(null)
    expect(Number(t.last_outdoor_temp)).toBe(25)
    expect(t.last_checked_at).not.toBe(null)
  })

  it('błąd dostawcy pogody pomija wpis — klima i last_action bez zmian', async () => {
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const dev = await addIrAc(hh, owner.user.id)
    await putThermostat(owner.token, dev.id, { enabled: true, lat: 51.1, lon: 17.03, tempOn: 26, tempOff: 24 })

    const res = await runAcThermostats(sql, rawKey, {
      readOutdoorTemp: vi.fn().mockRejectedValue(new Error('open-meteo down')),
    })

    expect(res).toMatchObject({ checked: 0, switched: 0, failed: 1 })
    expect(sendAcCommand).not.toHaveBeenCalled()
    const [t] = await sql`SELECT last_action, last_outdoor_temp FROM ac_thermostats WHERE device_id = ${dev.id}`
    expect(t.last_action).toBe(null)
    expect(t.last_outdoor_temp).toBe(null)
  })

  it('pomija termostaty wyłączone (enabled=false)', async () => {
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const dev = await addIrAc(hh, owner.user.id)
    await putThermostat(owner.token, dev.id, { enabled: false, lat: 51.1, lon: 17.03, tempOn: 26, tempOff: 24 })

    const res = await runAcThermostats(sql, rawKey, { readOutdoorTemp: vi.fn().mockResolvedValue(30) })

    expect(res).toMatchObject({ checked: 0, switched: 0 })
    expect(sendAcCommand).not.toHaveBeenCalled()
  })
})

describe('PUT /api/smart-devices/:id/thermostat — walidacja', () => {
  it('odrzuca tempOn <= tempOff w trybie chłodzenia (za mała strefa martwa)', async () => {
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const dev = await addIrAc(hh, owner.user.id)

    const res = await putThermostat(owner.token, dev.id, { enabled: true, mode: 'cool', tempOn: 24, tempOff: 24 })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('threshold_order')
  })

  it('odrzuca tempOff <= tempOn w trybie grzania', async () => {
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const dev = await addIrAc(hh, owner.user.id)

    const res = await putThermostat(owner.token, dev.id, { enabled: true, mode: 'heat', tempOn: 8, tempOff: 5 })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('threshold_order')
  })

  it('grzanie: zimno na zewnątrz włącza klimę (power=1)', async () => {
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const dev = await addIrAc(hh, owner.user.id)
    await putThermostat(owner.token, dev.id, {
      enabled: true, mode: 'heat', lat: 51.1, lon: 17.03, tempOn: 5, tempOff: 8,
    })
    vi.mocked(getAcStatus).mockResolvedValue({ power: '0' })

    const res = await runAcThermostats(sql, rawKey, { readOutdoorTemp: vi.fn().mockResolvedValue(3) })

    expect(res).toMatchObject({ checked: 1, switched: 1 })
    expect(sendAcCommand).toHaveBeenCalledWith(expect.anything(), dev.parent, dev.tuyaId, 'power', 1)
  })

  it('odrzuca konfigurację dla urządzenia nie będącego klimą IR', async () => {
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const [plug] = await sql`
      INSERT INTO smart_devices (household_id, provider, external_device_id, tuya_device_id,
        display_name, device_type, created_by)
      VALUES (${hh}, 'tuya', ${'plug-' + uniq()}, ${'plug-' + uniq()}, 'Gniazdko', 'plug', ${owner.user.id})
      RETURNING id
    `
    const res = await putThermostat(owner.token, plug.id, { enabled: true, tempOn: 26, tempOff: 24 })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('thermostat_not_supported')
  })

  it('GET zwraca zapisaną konfigurację (round-trip)', async () => {
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const dev = await addIrAc(hh, owner.user.id)
    await putThermostat(owner.token, dev.id, { enabled: true, locationLabel: 'Wrocław', lat: 51.1, lon: 17.03, tempOn: 26, tempOff: 24 })

    const t = (await (await getThermostat(owner.token, dev.id)).json()).thermostat
    expect(t).toMatchObject({ enabled: true, locationLabel: 'Wrocław', tempOn: 26, tempOff: 24, lastAction: null, lastCheckAction: null })
  })

  it('po podaniu miasta geokoduje raz i zapisuje lat/lon + etykietę', async () => {
    vi.mocked(geocodeCity).mockResolvedValue({ lat: 51.1, lon: 17.03, label: 'Wrocław, Dolnośląskie, Polska' })
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const dev = await addIrAc(hh, owner.user.id)

    const res = await putThermostat(owner.token, dev.id, { enabled: true, city: 'Wrocław', tempOn: 26, tempOff: 24 })
    expect(res.status).toBe(200)
    expect(vi.mocked(geocodeCity)).toHaveBeenCalledWith('Wrocław')

    const t = (await res.json()).thermostat
    expect(t).toMatchObject({ lat: 51.1, lon: 17.03, locationLabel: 'Wrocław, Dolnośląskie, Polska' })
  })

  it('zwraca 400 gdy geocoding nie znajdzie miasta', async () => {
    vi.mocked(geocodeCity).mockResolvedValue(null)
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const dev = await addIrAc(hh, owner.user.id)

    const res = await putThermostat(owner.token, dev.id, { enabled: true, city: 'Xyzzyland', tempOn: 26, tempOff: 24 })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('geocode_no_result')
  })
})

describe('GET /api/smart-devices/:id/thermostat/temperature — aktualna temp na zewnątrz', () => {
  function getTemp(token, deviceId) {
    return app.request(`/api/smart-devices/${deviceId}/thermostat/temperature`, {
      headers: { cookie: `token=${token}` },
    })
  }

  it('zwraca bieżącą temperaturę dla zapisanej lokalizacji', async () => {
    vi.mocked(getOutdoorTemp).mockResolvedValue(19.4)
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const dev = await addIrAc(hh, owner.user.id)
    await putThermostat(owner.token, dev.id, { enabled: true, lat: 51.1, lon: 17.03, tempOn: 26, tempOff: 24 })

    const res = await getTemp(owner.token, dev.id)
    expect(res.status).toBe(200)
    expect((await res.json()).temp).toBe(19.4)
    expect(vi.mocked(getOutdoorTemp)).toHaveBeenCalledWith({ lat: 51.1, lon: 17.03 })
  })

  it('zwraca 400 gdy termostat nie ma ustawionej lokalizacji', async () => {
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const dev = await addIrAc(hh, owner.user.id)
    await putThermostat(owner.token, dev.id, { enabled: false, tempOn: 26, tempOff: 24 })

    const res = await getTemp(owner.token, dev.id)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('no_location')
  })

  it('zwraca 502 gdy Open-Meteo nie odpowie', async () => {
    vi.mocked(getOutdoorTemp).mockRejectedValue(new Error('open-meteo down'))
    const owner = await createOwnerWithCreds()
    const hh = await householdOf(owner.user.id)
    const dev = await addIrAc(hh, owner.user.id)
    await putThermostat(owner.token, dev.id, { enabled: true, lat: 51.1, lon: 17.03, tempOn: 26, tempOff: 24 })

    const res = await getTemp(owner.token, dev.id)
    expect(res.status).toBe(502)
  })
})
