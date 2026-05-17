/**
 * Integracyjne testy: każda mutacja per-row (transactions, savings_accounts,
 * category_budgets, savings_goal) zostawia odpowiedni wpis w action_log.
 * Tu sprawdzamy TYLKO że wpis powstał z poprawnymi metadanymi —
 * weryfikacja "reverse operation działa" jest w slice 4 (undo endpoint).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'
import { app, upsertUserAndHousehold } from './app.js'
import { cleanDb } from './test-setup.js'
import { readRecentActionLog } from './action-log.js'

const sql = neon(process.env.DATABASE_URL)
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'test-secret')

async function setupUser(suffix = '') {
  const profile = {
    sub: `google-alm${suffix}`,
    email: `alm${suffix}@test.com`,
    name: `ALM User ${suffix}`,
  }
  const user = await upsertUserAndHousehold(sql, profile)
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
  const [m] = await sql`SELECT household_id FROM household_members WHERE user_id = ${user.id}`
  return { user, token, householdId: m.household_id }
}

async function actionLogFor(householdId) {
  return readRecentActionLog(sql, householdId)
}

async function api(path, init = {}) {
  return app.request(path, init)
}

function auth(token, extra = {}) {
  return { cookie: `token=${token}`, 'Content-Type': 'application/json', ...extra }
}

describe('action_log entries from mutations', () => {
  beforeEach(async () => {
    await cleanDb()
    await sql`DELETE FROM action_log`
  })

  // ===== transactions =====

  it('POST /api/transactions → CREATE entry', async () => {
    const { user, token, householdId } = await setupUser()
    const res = await api('/api/transactions', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({ kind: 'expense', name: 'Lunch', amount: 42.5, txnDate: '2026-05-16', year: 2026, month: 4, isFixed: false, category: 'Żywność' }),
    })
    expect(res.status).toBe(201)
    const created = await res.json()

    const log = await actionLogFor(householdId)
    expect(log.length).toBe(1)
    expect(log[0]).toMatchObject({
      operation: 'CREATE',
      resourceType: 'transaction',
      resourceId: created.id,
      actorId: user.id,
    })
    expect(log[0].before).toBeNull()
    expect(log[0].after).toMatchObject({ kind: 'expense', year: 2026, month: 4, is_fixed: false, category: 'Żywność' })
    expect(typeof log[0].after.name).toBe('string')
    expect(log[0].after.name).toMatch(/^ff1:/)
  })

  it('PATCH /api/transactions/:id → UPDATE entry with before+after', async () => {
    const { token, householdId } = await setupUser()
    const created = await (await api('/api/transactions', {
      method: 'POST', headers: auth(token),
      body: JSON.stringify({ kind: 'expense', name: 'Lunch', amount: 42.5, txnDate: '2026-05-16', year: 2026, month: 4, isFixed: false, category: 'Żywność' }),
    })).json()

    const res = await api(`/api/transactions/${created.id}`, {
      method: 'PATCH', headers: auth(token, { 'If-Match': created.updatedAt }),
      body: JSON.stringify({ name: 'Dinner', amount: 100 }),
    })
    expect(res.status).toBe(200)

    const log = await actionLogFor(householdId)
    expect(log.length).toBe(2) // CREATE + UPDATE
    const update = log[0]
    expect(update).toMatchObject({
      operation: 'UPDATE',
      resourceType: 'transaction',
      resourceId: created.id,
    })
    expect(update.before).toBeTruthy()
    expect(update.after).toBeTruthy()
    expect(update.before.name).toMatch(/^ff1:/)
    expect(update.after.name).toMatch(/^ff1:/)
    expect(update.before.name).not.toBe(update.after.name)
  })

  it('DELETE /api/transactions/:id → DELETE entry with before only', async () => {
    const { token, householdId } = await setupUser()
    const created = await (await api('/api/transactions', {
      method: 'POST', headers: auth(token),
      body: JSON.stringify({ kind: 'income', name: 'Pensja', amount: 5000, txnDate: '2026-05-01', year: 2026, month: 4, isFixed: true }),
    })).json()

    const res = await api(`/api/transactions/${created.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${token}`, 'If-Match': created.updatedAt },
    })
    expect(res.status).toBe(204)

    const log = await actionLogFor(householdId)
    const del = log[0]
    expect(del).toMatchObject({
      operation: 'DELETE',
      resourceType: 'transaction',
      resourceId: created.id,
    })
    expect(del.before).toBeTruthy()
    expect(del.after).toBeNull()
    expect(del.before.kind).toBe('income')
  })

  // ===== savings_accounts =====

  it('POST /api/savings-accounts → CREATE entry', async () => {
    const { token, householdId } = await setupUser()
    const res = await api('/api/savings-accounts', {
      method: 'POST', headers: auth(token),
      body: JSON.stringify({ name: 'PKO', amount: 1000, icon: 'bank' }),
    })
    expect(res.status).toBe(201)
    const created = await res.json()
    const log = await actionLogFor(householdId)
    expect(log[0]).toMatchObject({ operation: 'CREATE', resourceType: 'savings_account', resourceId: created.id })
    expect(log[0].after.icon).toBe('bank')
  })

  it('PATCH /api/savings-accounts/:id → UPDATE entry', async () => {
    const { token, householdId } = await setupUser()
    const created = await (await api('/api/savings-accounts', {
      method: 'POST', headers: auth(token),
      body: JSON.stringify({ name: 'PKO', amount: 1000 }),
    })).json()
    const res = await api(`/api/savings-accounts/${created.id}`, {
      method: 'PATCH', headers: auth(token, { 'If-Match': created.updatedAt }),
      body: JSON.stringify({ amount: 1500 }),
    })
    expect(res.status).toBe(200)
    const log = await actionLogFor(householdId)
    expect(log[0]).toMatchObject({ operation: 'UPDATE', resourceType: 'savings_account', resourceId: created.id })
    expect(log[0].before.amount).not.toBe(log[0].after.amount)
  })

  it('DELETE /api/savings-accounts/:id → DELETE entry', async () => {
    const { token, householdId } = await setupUser()
    const created = await (await api('/api/savings-accounts', {
      method: 'POST', headers: auth(token),
      body: JSON.stringify({ name: 'PKO', amount: 1000 }),
    })).json()
    const res = await api(`/api/savings-accounts/${created.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${token}`, 'If-Match': created.updatedAt },
    })
    expect(res.status).toBe(204)
    const log = await actionLogFor(householdId)
    expect(log[0]).toMatchObject({ operation: 'DELETE', resourceType: 'savings_account', resourceId: created.id })
    expect(log[0].after).toBeNull()
  })

  // ===== category_budgets =====

  it('POST /api/category-budgets → CREATE entry', async () => {
    const { token, householdId } = await setupUser()
    const res = await api('/api/category-budgets', {
      method: 'POST', headers: auth(token),
      body: JSON.stringify({ name: 'Żywność', limit: 800 }),
    })
    expect(res.status).toBe(201)
    const created = await res.json()
    const log = await actionLogFor(householdId)
    expect(log[0]).toMatchObject({ operation: 'CREATE', resourceType: 'category_budget', resourceId: created.id })
  })

  it('PATCH /api/category-budgets/:id → UPDATE entry', async () => {
    const { token, householdId } = await setupUser()
    const created = await (await api('/api/category-budgets', {
      method: 'POST', headers: auth(token),
      body: JSON.stringify({ name: 'Żywność', limit: 800 }),
    })).json()
    const res = await api(`/api/category-budgets/${created.id}`, {
      method: 'PATCH', headers: auth(token, { 'If-Match': created.updatedAt }),
      body: JSON.stringify({ limit: 900 }),
    })
    expect(res.status).toBe(200)
    const log = await actionLogFor(householdId)
    expect(log[0]).toMatchObject({ operation: 'UPDATE', resourceType: 'category_budget', resourceId: created.id })
  })

  it('DELETE /api/category-budgets/:id → DELETE entry', async () => {
    const { token, householdId } = await setupUser()
    const created = await (await api('/api/category-budgets', {
      method: 'POST', headers: auth(token),
      body: JSON.stringify({ name: 'Żywność', limit: 800 }),
    })).json()
    const res = await api(`/api/category-budgets/${created.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${token}`, 'If-Match': created.updatedAt },
    })
    expect(res.status).toBe(204)
    const log = await actionLogFor(householdId)
    expect(log[0]).toMatchObject({ operation: 'DELETE', resourceType: 'category_budget', resourceId: created.id })
  })

  // ===== savings_goal (singleton, PUT) =====

  it('PUT /api/savings-goal (pierwszy raz) → CREATE entry', async () => {
    const { token, householdId } = await setupUser()
    const res = await api('/api/savings-goal', {
      method: 'PUT', headers: auth(token),
      body: JSON.stringify({ type: 'monthly', monthlyAmount: 500, yearlyAmount: 0, targetMonth: 11 }),
    })
    expect(res.status).toBeLessThan(300)
    const log = await actionLogFor(householdId)
    expect(log[0]).toMatchObject({ operation: 'CREATE', resourceType: 'savings_goal' })
    expect(log[0].before).toBeNull()
  })

  it('PUT /api/savings-goal (drugi raz) → UPDATE entry', async () => {
    const { token, householdId } = await setupUser()
    await api('/api/savings-goal', {
      method: 'PUT', headers: auth(token),
      body: JSON.stringify({ type: 'monthly', monthlyAmount: 500, yearlyAmount: 0, targetMonth: 11 }),
    })
    await api('/api/savings-goal', {
      method: 'PUT', headers: auth(token),
      body: JSON.stringify({ type: 'yearly', monthlyAmount: 0, yearlyAmount: 6000, targetMonth: 5 }),
    })
    const log = await actionLogFor(householdId)
    expect(log[0]).toMatchObject({ operation: 'UPDATE', resourceType: 'savings_goal' })
    expect(log[0].before).toBeTruthy()
    expect(log[0].after).toBeTruthy()
  })
})
