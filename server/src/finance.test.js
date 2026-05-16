import { describe, it, expect, beforeEach } from 'vitest'
import { app, upsertUserAndHousehold } from './app.js'
import { cleanDb } from './test-setup.js'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'

const sql = neon(process.env.DATABASE_URL)
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'test-secret')

async function setupUserWithHousehold() {
  const db = neon(process.env.DATABASE_URL)
  const profile = { sub: 'google-fin-123', email: 'finance@test.com', name: 'Finance User' }
  const user = await upsertUserAndHousehold(db, profile)
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
  return { user, token }
}

describe('GET /api/finance', () => {
  beforeEach(async () => {
    await cleanDb()
  })

  it('returns 401 without auth', async () => {
    const res = await app.request('/api/finance')
    expect(res.status).toBe(401)
  })

  it('returns empty initial structure for new user', async () => {
    const { token } = await setupUserWithHousehold()

    const res = await app.request('/api/finance', {
      headers: { cookie: `token=${token}` },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    // Czytamy z tabel — zwracamy pelne 12 pustych miesiecy + domyslny goal
    expect(Object.keys(body.data.months)).toHaveLength(12)
    for (let m = 0; m < 12; m++) {
      expect(body.data.months[m].incomes).toEqual([])
      expect(body.data.months[m].expenses).toEqual([])
    }
    expect(body.data.savingsAccounts).toEqual([])
    expect(body.data.categoryBudgets).toEqual([])
    expect(body.data.activityLog).toEqual([])
    expect(body.data.savingsGoal.type).toBe('none')
  })
})

describe('Guest data migration via PUT /api/finance', () => {
  beforeEach(async () => {
    await cleanDb()
  })

  // Po Phase 1 transactions managed per-row; PUT migruje tylko savings/categories/goal/activity.
  // TODO Phase 3: guest transactions migration przez per-row POST z frontu albo dedicated endpoint.
  it('fresh user can save guest savingsGoal and retrieve it', async () => {
    const { token } = await setupUserWithHousehold()

    const guestData = {
      months: {},
      savingsGoal: { type: 'yearly', yearlyAmount: 10000, monthlyAmount: 0, targetMonth: 11 },
    }

    const putRes = await app.request('/api/finance', {
      method: 'PUT',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: guestData }),
    })
    expect(putRes.status).toBe(200)

    const getRes = await app.request('/api/finance', {
      headers: { cookie: `token=${token}` },
    })
    const body = await getRes.json()
    expect(body.data.savingsGoal.type).toBe('yearly')
    expect(body.data.savingsGoal.yearlyAmount).toBe(10000)
  })
})

describe('PUT /api/finance', () => {
  beforeEach(async () => {
    await cleanDb()
  })

  it('returns 401 without auth', async () => {
    const res = await app.request('/api/finance', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: {} }),
    })
    expect(res.status).toBe(401)
  })

  // Po Phase 1 PUT nie zarządza transakcjami (skipTransactions=true).
  // Pokrycie transakcji: src/transactions.test.js. Tutaj sprawdzamy savings_accounts.
  it('saves and retrieves savings accounts', async () => {
    const { token, user } = await setupUserWithHousehold()

    const financeData = {
      months: {},
      savingsAccounts: [{ id: 1, name: 'Wakacje', amount: 5000, icon: 'plane' }],
      savingsGoal: { type: 'monthly', monthlyAmount: 500 },
    }

    const putRes = await app.request('/api/finance', {
      method: 'PUT',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: financeData }),
    })
    expect(putRes.status).toBe(200)

    const getRes = await app.request('/api/finance', {
      headers: { cookie: `token=${token}` },
    })
    expect(getRes.status).toBe(200)
    const body = await getRes.json()
    expect(body.data.savingsAccounts[0].name).toBe('Wakacje')
    expect(body.data.savingsAccounts[0].amount).toBe(5000)
    expect(body.data.savingsGoal.type).toBe('monthly')

    // Sensytywne pola szyfrowane w bazie
    const [sa] = await sql`
      SELECT s.name, s.amount FROM savings_accounts s
      JOIN household_members hm ON hm.household_id = s.household_id
      WHERE hm.user_id = ${user.id}
    `
    expect(sa.name).toMatch(/^ff1:/)
    expect(sa.name).not.toContain('Wakacje')
    expect(sa.amount).toMatch(/^ff1:/)
  })

  it('idempotent — second PUT replaces savings rows', async () => {
    const { token, user } = await setupUserWithHousehold()

    const first = { months: {}, savingsAccounts: [{ id: 1, name: 'A', amount: 100 }], savingsGoal: { type: 'none' } }
    const second = { months: {}, savingsAccounts: [{ id: 2, name: 'B', amount: 200 }], savingsGoal: { type: 'none' } }

    for (const data of [first, second]) {
      const res = await app.request('/api/finance', {
        method: 'PUT',
        headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      expect(res.status).toBe(200)
    }

    const [{ cnt }] = await sql`
      SELECT COUNT(*)::int AS cnt FROM savings_accounts s
      JOIN household_members hm ON hm.household_id = s.household_id
      WHERE hm.user_id = ${user.id}
    `
    expect(cnt).toBe(1)

    const getRes = await app.request('/api/finance', {
      headers: { cookie: `token=${token}` },
    })
    const body = await getRes.json()
    expect(body.data.savingsAccounts[0].name).toBe('B')
    expect(body.data.savingsAccounts[0].amount).toBe(200)
  })
})
