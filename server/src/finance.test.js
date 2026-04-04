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

  it('returns empty data for new user', async () => {
    const { token } = await setupUserWithHousehold()

    const res = await app.request('/api/finance', {
      headers: { cookie: `token=${token}` },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual({})
  })
})

describe('Guest data migration via PUT /api/finance', () => {
  beforeEach(async () => {
    await cleanDb()
  })

  it('fresh user can save guest data and retrieve it', async () => {
    const { token } = await setupUserWithHousehold()

    // Simulate guest data structure (same as localStorage format)
    const guestData = {
      months: {
        0: { incomes: [{ id: 1, name: 'Freelance', amount: 3000 }], expenses: [{ id: 2, name: 'Czynsz', amount: 1500, isFixed: true, date: '2026-01-05' }] },
        1: { incomes: [], expenses: [] },
        2: { incomes: [], expenses: [] },
        3: { incomes: [], expenses: [] },
        4: { incomes: [], expenses: [] },
        5: { incomes: [], expenses: [] },
        6: { incomes: [], expenses: [] },
        7: { incomes: [], expenses: [] },
        8: { incomes: [], expenses: [] },
        9: { incomes: [], expenses: [] },
        10: { incomes: [], expenses: [] },
        11: { incomes: [], expenses: [] },
      },
      savingsGoal: { type: 'yearly', yearlyAmount: 10000, monthlyAmount: 0, targetMonth: 11 },
    }

    // PUT guest data (migration)
    const putRes = await app.request('/api/finance', {
      method: 'PUT',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: guestData }),
    })
    expect(putRes.status).toBe(200)

    // GET — should return the migrated data
    const getRes = await app.request('/api/finance', {
      headers: { cookie: `token=${token}` },
    })
    const body = await getRes.json()
    expect(body.data.months['0'].incomes[0].name).toBe('Freelance')
    expect(body.data.months['0'].expenses[0].name).toBe('Czynsz')
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

  it('saves and retrieves finance data', async () => {
    const { token } = await setupUserWithHousehold()

    const financeData = {
      months: { 0: { incomes: [{ id: 1, name: 'Pensja', amount: 5000 }], expenses: [] } },
      savingsGoal: { type: 'monthly', monthlyAmount: 500 },
    }

    // Save
    const putRes = await app.request('/api/finance', {
      method: 'PUT',
      headers: {
        cookie: `token=${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: financeData }),
    })
    expect(putRes.status).toBe(200)

    // Retrieve
    const getRes = await app.request('/api/finance', {
      headers: { cookie: `token=${token}` },
    })
    expect(getRes.status).toBe(200)
    const body = await getRes.json()
    expect(body.data.months['0'].incomes[0].name).toBe('Pensja')
    expect(body.data.savingsGoal.type).toBe('monthly')
  })
})
