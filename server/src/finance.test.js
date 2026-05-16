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

  // Po Phase 3 wszystkie zasoby zarządzane per-row; PUT migruje tylko activity_log.
  // Guest data migration musi się stać per-row na froncie (Phase 5 / cleanup) — skip tutaj.
  it.skip('guest data migration via PUT — TODO move to per-row POST after Phase 5', () => {})
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

  // Po Phase 3 PUT z onlyActivity=true — wszystkie inne zasoby NIE są tknięte przez PUT.
  // Sprawdzamy że to jest faktycznie zachowanie. Pełne pokrycie:
  //   transactions       → src/transactions.test.js
  //   savings_accounts   → src/savings-accounts.test.js
  //   category_budgets   → src/category-budgets.test.js
  //   savings_goal       → src/savings-goal.test.js
  it('PUT does NOT touch savings_accounts (managed per-row)', async () => {
    const { token, user } = await setupUserWithHousehold()

    const putRes = await app.request('/api/finance', {
      method: 'PUT',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: { months: {}, savingsAccounts: [{ id: 1, name: 'X', amount: 999 }] },
      }),
    })
    expect(putRes.status).toBe(200)

    const [{ cnt }] = await sql`
      SELECT COUNT(*)::int AS cnt FROM savings_accounts s
      JOIN household_members hm ON hm.household_id = s.household_id
      WHERE hm.user_id = ${user.id}
    `
    expect(cnt).toBe(0)
  })
})
