import { describe, it, expect, beforeEach } from 'vitest'
import { app, upsertUserAndHousehold } from './app.js'
import { cleanDb } from './test-setup.js'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'test-secret')

async function makeUser(suffix) {
  const db = neon(process.env.DATABASE_URL)
  const user = await upsertUserAndHousehold(db, {
    sub: `g-${suffix}`,
    email: `${suffix}@test.com`,
    name: `User ${suffix}`,
  })
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
  return { user, token }
}

/**
 * Tworzy owner + member w jednym household. Member traci swoje auto-utworzone
 * household i zostaje dopisany do household ownera.
 */
async function setupOwnerAndMember() {
  const db = neon(process.env.DATABASE_URL)
  const owner = await makeUser('owner-perm')
  const member = await makeUser('member-perm')

  const [ownerHousehold] = await db`
    SELECT id FROM households WHERE owner_id = ${owner.user.id}
  `
  // Skasuj auto-household membera i wsadź go do ownera
  await db`DELETE FROM household_members WHERE user_id = ${member.user.id}`
  await db`DELETE FROM households WHERE owner_id = ${member.user.id}`
  await db`
    INSERT INTO household_members (household_id, user_id)
    VALUES (${ownerHousehold.id}, ${member.user.id})
  `
  return { owner, member, householdId: ownerHousehold.id }
}

async function createTxn(token, overrides = {}) {
  const res = await app.request('/api/transactions', {
    method: 'POST',
    headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'expense', name: 'Test', amount: 50, txnDate: '2026-05-17',
      year: 2026, month: 4, isFixed: false, category: 'Inne',
      ...overrides,
    }),
  })
  expect(res.status).toBe(201)
  return res.json()
}

describe('Permissions: per-row mutate guard (transactions)', () => {
  beforeEach(async () => { await cleanDb() })

  it('member CANNOT delete owner\'s transaction (403)', async () => {
    const { owner, member } = await setupOwnerAndMember()
    const txn = await createTxn(owner.token)

    const res = await app.request(`/api/transactions/${txn.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${member.token}`, 'If-Match': txn.updatedAt },
    })
    expect(res.status).toBe(403)
  })

  it('member CANNOT patch owner\'s transaction (403)', async () => {
    const { owner, member } = await setupOwnerAndMember()
    const txn = await createTxn(owner.token)

    const res = await app.request(`/api/transactions/${txn.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${member.token}`, 'Content-Type': 'application/json', 'If-Match': txn.updatedAt },
      body: JSON.stringify({ name: 'hijack', amount: 999 }),
    })
    expect(res.status).toBe(403)
  })

  it('member CAN delete their own transaction', async () => {
    const { member } = await setupOwnerAndMember()
    const txn = await createTxn(member.token)

    const res = await app.request(`/api/transactions/${txn.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${member.token}`, 'If-Match': txn.updatedAt },
    })
    expect(res.status).toBe(204)
  })

  it('owner CAN delete member\'s transaction', async () => {
    const { owner, member } = await setupOwnerAndMember()
    const txn = await createTxn(member.token)

    const res = await app.request(`/api/transactions/${txn.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${owner.token}`, 'If-Match': txn.updatedAt },
    })
    expect(res.status).toBe(204)
  })

  it('legacy row (created_by IS NULL) — member CAN mutate (trudno)', async () => {
    const { owner, member, householdId } = await setupOwnerAndMember()
    const db = neon(process.env.DATABASE_URL)
    // Wstaw rekord starego stylu — bez created_by
    const [row] = await db`
      INSERT INTO transactions (household_id, kind, name, amount, txn_date, year, month, is_fixed, category)
      VALUES (${householdId}, 'expense', 'Legacy', '100', '2026-05-17', 2026, 4, false, 'Inne')
      RETURNING id, updated_at
    `
    const updatedAt = row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at)

    const res = await app.request(`/api/transactions/${row.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${member.token}`, 'If-Match': updatedAt },
    })
    expect(res.status).toBe(204)
  })

  it('POST /api/transactions stamps created_by', async () => {
    const { member } = await setupOwnerAndMember()
    const txn = await createTxn(member.token)
    expect(txn.createdBy).toBe(member.user.id)
  })
})

describe('Permissions: savings_accounts + category_budgets', () => {
  beforeEach(async () => { await cleanDb() })

  async function postSavings(token) {
    const res = await app.request('/api/savings-accounts', {
      method: 'POST',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Konto', amount: 1000, icon: 'bank' }),
    })
    expect(res.status).toBe(201)
    return res.json()
  }

  async function postCategory(token) {
    const res = await app.request('/api/category-budgets', {
      method: 'POST',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Kategoria', limit: 500 }),
    })
    expect(res.status).toBe(201)
    return res.json()
  }

  it('member CANNOT delete owner\'s savings_account (403); CAN delete own', async () => {
    const { owner, member } = await setupOwnerAndMember()
    const ownerAcc = await postSavings(owner.token)
    const memberAcc = await postSavings(member.token)

    const denied = await app.request(`/api/savings-accounts/${ownerAcc.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${member.token}`, 'If-Match': ownerAcc.updatedAt },
    })
    expect(denied.status).toBe(403)

    const allowed = await app.request(`/api/savings-accounts/${memberAcc.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${member.token}`, 'If-Match': memberAcc.updatedAt },
    })
    expect(allowed.status).toBe(204)
  })

  it('member CANNOT patch owner\'s category_budget (403)', async () => {
    const { owner, member } = await setupOwnerAndMember()
    const cat = await postCategory(owner.token)

    const res = await app.request(`/api/category-budgets/${cat.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${member.token}`, 'Content-Type': 'application/json', 'If-Match': cat.updatedAt },
      body: JSON.stringify({ limit: 1 }),
    })
    expect(res.status).toBe(403)
  })

  it('POST stamps created_by on savings + category', async () => {
    const { member } = await setupOwnerAndMember()
    const acc = await postSavings(member.token)
    const cat = await postCategory(member.token)
    expect(acc.createdBy).toBe(member.user.id)
    expect(cat.createdBy).toBe(member.user.id)
  })
})

describe('Permissions: savings_goal owner-only', () => {
  beforeEach(async () => { await cleanDb() })

  it('member CANNOT PUT savings-goal (403)', async () => {
    const { member } = await setupOwnerAndMember()
    const res = await app.request('/api/savings-goal', {
      method: 'PUT',
      headers: { cookie: `token=${member.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'monthly', monthlyAmount: 500, yearlyAmount: 0, targetMonth: 11 }),
    })
    expect(res.status).toBe(403)
  })

  it('owner CAN PUT savings-goal (200)', async () => {
    const { owner } = await setupOwnerAndMember()
    const res = await app.request('/api/savings-goal', {
      method: 'PUT',
      headers: { cookie: `token=${owner.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'monthly', monthlyAmount: 500, yearlyAmount: 0, targetMonth: 11 }),
    })
    expect(res.status).toBe(200)
  })
})
