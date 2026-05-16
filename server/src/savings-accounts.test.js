import { describe, it, expect, beforeEach } from 'vitest'
import { app, upsertUserAndHousehold } from './app.js'
import { cleanDb } from './test-setup.js'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'

const sql = neon(process.env.DATABASE_URL)
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'test-secret')

async function setupUserWithHousehold(suffix = '') {
  const db = neon(process.env.DATABASE_URL)
  const profile = {
    sub: `google-sa${suffix}`,
    email: `sa${suffix}@test.com`,
    name: `SA User ${suffix}`,
  }
  const user = await upsertUserAndHousehold(db, profile)
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
  return { user, token }
}

describe('POST /api/savings-accounts', () => {
  beforeEach(async () => {
    await cleanDb()
  })

  it('creates a savings account and returns it with id + updated_at', async () => {
    const { token } = await setupUserWithHousehold()

    const res = await app.request('/api/savings-accounts', {
      method: 'POST',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Wakacje', amount: 5000, icon: 'plane' }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toMatchObject({ name: 'Wakacje', amount: 5000, icon: 'plane' })
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(typeof body.updatedAt).toBe('string')
  })

  it('returns 401 without auth', async () => {
    const res = await app.request('/api/savings-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'X', amount: 1 }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    const { token } = await setupUserWithHousehold()
    const res = await app.request('/api/savings-accounts', {
      method: 'POST',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })
})

async function createSavingsAccount(token, overrides = {}) {
  const res = await app.request('/api/savings-accounts', {
    method: 'POST',
    headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Wakacje', amount: 5000, icon: 'plane', ...overrides }),
  })
  return res.json()
}

describe('PATCH /api/savings-accounts/:id', () => {
  beforeEach(async () => { await cleanDb() })

  it('updates fields, bumps updated_at, returns updated row', async () => {
    const { token } = await setupUserWithHousehold()
    const created = await createSavingsAccount(token)
    await new Promise(r => setTimeout(r, 50))

    const res = await app.request(`/api/savings-accounts/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json', 'If-Match': created.updatedAt },
      body: JSON.stringify({ name: 'Vacation', amount: 6000 }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(created.id)
    expect(body.name).toBe('Vacation')
    expect(body.amount).toBe(6000)
    expect(body.updatedAt).not.toBe(created.updatedAt)
  })

  it('returns 400 when If-Match header is missing', async () => {
    const { token } = await setupUserWithHousehold()
    const created = await createSavingsAccount(token)
    const res = await app.request(`/api/savings-accounts/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'X' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 409 with current row when If-Match is stale', async () => {
    const { token } = await setupUserWithHousehold()
    const created = await createSavingsAccount(token)
    await new Promise(r => setTimeout(r, 50))
    const first = await app.request(`/api/savings-accounts/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json', 'If-Match': created.updatedAt },
      body: JSON.stringify({ name: 'First' }),
    })
    expect(first.status).toBe(200)

    const stale = await app.request(`/api/savings-accounts/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json', 'If-Match': created.updatedAt },
      body: JSON.stringify({ name: 'Stale' }),
    })
    expect(stale.status).toBe(409)
    const body = await stale.json()
    expect(body.current.name).toBe('First')
  })

  it('returns 403 when editing account from another household', async () => {
    const a = await setupUserWithHousehold('-a')
    const b = await setupUserWithHousehold('-b')
    const aAcct = await createSavingsAccount(a.token)
    const res = await app.request(`/api/savings-accounts/${aAcct.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${b.token}`, 'Content-Type': 'application/json', 'If-Match': aAcct.updatedAt },
      body: JSON.stringify({ name: 'Hack' }),
    })
    expect(res.status).toBe(403)
  })

  it('returns 404 when account does not exist', async () => {
    const { token } = await setupUserWithHousehold()
    const res = await app.request(`/api/savings-accounts/00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json', 'If-Match': new Date().toISOString() },
      body: JSON.stringify({ name: 'X' }),
    })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/savings-accounts/:id', () => {
  beforeEach(async () => { await cleanDb() })

  it('deletes and returns 204', async () => {
    const { token } = await setupUserWithHousehold()
    const created = await createSavingsAccount(token)
    const res = await app.request(`/api/savings-accounts/${created.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${token}`, 'If-Match': created.updatedAt },
    })
    expect(res.status).toBe(204)
  })

  it('returns 409 when If-Match is stale', async () => {
    const { token } = await setupUserWithHousehold()
    const created = await createSavingsAccount(token)
    await new Promise(r => setTimeout(r, 50))
    await app.request(`/api/savings-accounts/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json', 'If-Match': created.updatedAt },
      body: JSON.stringify({ name: 'Edit' }),
    })
    const res = await app.request(`/api/savings-accounts/${created.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${token}`, 'If-Match': created.updatedAt },
    })
    expect(res.status).toBe(409)
  })

  it('returns 403 when deleting account from another household', async () => {
    const a = await setupUserWithHousehold('-a')
    const b = await setupUserWithHousehold('-b')
    const aAcct = await createSavingsAccount(a.token)
    const res = await app.request(`/api/savings-accounts/${aAcct.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${b.token}`, 'If-Match': aAcct.updatedAt },
    })
    expect(res.status).toBe(403)
  })
})
