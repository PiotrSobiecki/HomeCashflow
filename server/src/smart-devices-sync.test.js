import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('./tuya/client.js', async () => {
  const actual = await vi.importActual('./tuya/client.js')
  return {
    getTuyaToken: vi.fn(),
    getDeviceStatus: vi.fn(),
    formatStatuses: actual.formatStatuses,
  }
})

import { collectEnergySnapshots } from './smart-devices-sync.js'
import { getTuyaToken, getDeviceStatus } from './tuya/client.js'
import { upsertUserAndHousehold } from './app.js'
import { decodeFinanceDataKey, encryptField } from './finance-crypto.js'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const rawKey = decodeFinanceDataKey(process.env.FINANCE_DATA_KEY)
const uniq = () => Math.random().toString(36).slice(2, 10)

let createdUserIds = []

async function makeHousehold() {
  const user = await upsertUserAndHousehold(sql, { sub: `g-${uniq()}`, email: `${uniq()}@test.com`, name: 'Owner' })
  createdUserIds.push(user.id)
  const [m] = await sql`SELECT household_id FROM household_members WHERE user_id = ${user.id}`
  return m.household_id
}

async function insertCreds(householdId) {
  await sql`
    INSERT INTO tuya_credentials (household_id, client_id_enc, client_secret_enc, datacenter, verified_at, created_by)
    VALUES (${householdId}, ${await encryptField('cid', rawKey)}, ${await encryptField('sec', rawKey)}, 'eu', NOW(), NULL)
  `
}

async function insertDevice(householdId, tuyaDeviceId, isActive = true) {
  const [row] = await sql`
    INSERT INTO smart_devices (household_id, tuya_device_id, display_name, is_active)
    VALUES (${householdId}, ${tuyaDeviceId}, ${tuyaDeviceId}, ${isActive})
    RETURNING id
  `
  return row
}

beforeEach(() => {
  createdUserIds = []
  vi.mocked(getTuyaToken).mockReset()
  vi.mocked(getDeviceStatus).mockReset()
})

afterEach(async () => {
  if (createdUserIds.length) await sql`DELETE FROM users WHERE id = ANY(${createdUserIds})`
})

describe('collectEnergySnapshots', () => {
  it('records a snapshot for an active device', async () => {
    const hh = await makeHousehold()
    await insertCreds(hh)
    const dev = await insertDevice(hh, `dev-${uniq()}`)
    vi.mocked(getTuyaToken).mockResolvedValue({ accessToken: 'tok', expireTime: 7200 })
    vi.mocked(getDeviceStatus).mockResolvedValue([
      { code: 'switch_1', value: true }, { code: 'cur_power', value: 155 }, { code: 'add_ele', value: 1234 },
    ])

    const res = await collectEnergySnapshots(sql, rawKey, { householdId: hh })
    expect(res.inserted).toBe(1)

    const rows = await sql`SELECT * FROM device_energy_snapshots WHERE device_id = ${dev.id}`
    expect(rows).toHaveLength(1)
    expect(Number(rows[0].power_w)).toBe(15.5)
    expect(Number(rows[0].energy_kwh)).toBe(1.234)
    expect(rows[0].switch_on).toBe(true)
    expect(rows[0].is_online).toBe(true)
  })

  it('skips an offline device but keeps recording the rest', async () => {
    const hh = await makeHousehold()
    await insertCreds(hh)
    const idA = `dev-a-${uniq()}`
    const idB = `dev-b-${uniq()}`
    const a = await insertDevice(hh, idA)
    await insertDevice(hh, idB)
    vi.mocked(getTuyaToken).mockResolvedValue({ accessToken: 'tok', expireTime: 7200 })
    vi.mocked(getDeviceStatus).mockImplementation(async (_ctx, deviceId) => {
      if (deviceId === idB) throw new Error('Tuya API: device offline')
      return [{ code: 'cur_power', value: 100 }]
    })

    const res = await collectEnergySnapshots(sql, rawKey, { householdId: hh })
    expect(res).toEqual({ inserted: 1, skipped: 1 })

    const rows = await sql`SELECT device_id FROM device_energy_snapshots WHERE device_id = ${a.id}`
    expect(rows).toHaveLength(1)
  })

  it('does not poll inactive devices', async () => {
    const hh = await makeHousehold()
    await insertCreds(hh)
    await insertDevice(hh, `act-${uniq()}`, true)
    await insertDevice(hh, `inact-${uniq()}`, false)
    vi.mocked(getTuyaToken).mockResolvedValue({ accessToken: 'tok', expireTime: 7200 })
    vi.mocked(getDeviceStatus).mockResolvedValue([{ code: 'cur_power', value: 50 }])

    const res = await collectEnergySnapshots(sql, rawKey, { householdId: hh })
    expect(res.inserted).toBe(1)
  })
})
