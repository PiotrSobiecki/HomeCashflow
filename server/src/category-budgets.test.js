import { describe, it, expect, beforeEach } from 'vitest'
import { app, upsertUserAndHousehold } from './app.js'
import { cleanDb } from './test-setup.js'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'test-secret')

async function setupUserWithHousehold(suffix = '') {
  const db = neon(process.env.DATABASE_URL)
  const profile = { sub: `google-cb${suffix}`, email: `cb${suffix}@test.com`, name: `CB User ${suffix}` }
  const user = await upsertUserAndHousehold(db, profile)
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
  return { user, token }
}

async function createBudget(token, overrides = {}) {
  const res = await app.request('/api/category-budgets', {
    method: 'POST',
    headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Żywność', limit: 1500, ...overrides }),
  })
  return res.json()
}

describe('POST /api/category-budgets', () => {
  beforeEach(async () => { await cleanDb() })

  it('creates budget and returns id + updatedAt', async () => {
    const { token } = await setupUserWithHousehold()
    const res = await app.request('/api/category-budgets', {
      method: 'POST',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Żywność', limit: 1500 }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toMatchObject({ name: 'Żywność', limit: 1500 })
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(typeof body.updatedAt).toBe('string')
  })

  it('returns 401 without auth', async () => {
    const res = await app.request('/api/category-budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'X', limit: 100 }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 when fields missing', async () => {
    const { token } = await setupUserWithHousehold()
    const res = await app.request('/api/category-budgets', {
      method: 'POST',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/category-budgets/:id', () => {
  beforeEach(async () => { await cleanDb() })

  it('updates fields and bumps updated_at', async () => {
    const { token } = await setupUserWithHousehold()
    const created = await createBudget(token)
    await new Promise(r => setTimeout(r, 50))
    const res = await app.request(`/api/category-budgets/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json', 'If-Match': created.updatedAt },
      body: JSON.stringify({ limit: 2000 }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.limit).toBe(2000)
    expect(body.updatedAt).not.toBe(created.updatedAt)
  })

  it('returns 400 without If-Match', async () => {
    const { token } = await setupUserWithHousehold()
    const created = await createBudget(token)
    const res = await app.request(`/api/category-budgets/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 2000 }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 409 with current when If-Match stale', async () => {
    const { token } = await setupUserWithHousehold()
    const created = await createBudget(token)
    await new Promise(r => setTimeout(r, 50))
    await app.request(`/api/category-budgets/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json', 'If-Match': created.updatedAt },
      body: JSON.stringify({ limit: 999 }),
    })
    const res = await app.request(`/api/category-budgets/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json', 'If-Match': created.updatedAt },
      body: JSON.stringify({ limit: 333 }),
    })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.current.limit).toBe(999)
  })

  it('returns 403 from another household', async () => {
    const a = await setupUserWithHousehold('-a')
    const b = await setupUserWithHousehold('-b')
    const aBud = await createBudget(a.token)
    const res = await app.request(`/api/category-budgets/${aBud.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${b.token}`, 'Content-Type': 'application/json', 'If-Match': aBud.updatedAt },
      body: JSON.stringify({ limit: 1 }),
    })
    expect(res.status).toBe(403)
  })

  it('returns 404 when budget does not exist', async () => {
    const { token } = await setupUserWithHousehold()
    const res = await app.request(`/api/category-budgets/00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json', 'If-Match': new Date().toISOString() },
      body: JSON.stringify({ limit: 1 }),
    })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/category-budgets/:id', () => {
  beforeEach(async () => { await cleanDb() })

  it('deletes and returns 204', async () => {
    const { token } = await setupUserWithHousehold()
    const created = await createBudget(token)
    const res = await app.request(`/api/category-budgets/${created.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${token}`, 'If-Match': created.updatedAt },
    })
    expect(res.status).toBe(204)
  })

  it('returns 409 with stale If-Match', async () => {
    const { token } = await setupUserWithHousehold()
    const created = await createBudget(token)
    await new Promise(r => setTimeout(r, 50))
    await app.request(`/api/category-budgets/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json', 'If-Match': created.updatedAt },
      body: JSON.stringify({ limit: 999 }),
    })
    const res = await app.request(`/api/category-budgets/${created.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${token}`, 'If-Match': created.updatedAt },
    })
    expect(res.status).toBe(409)
  })

  it('returns 403 from another household', async () => {
    const a = await setupUserWithHousehold('-a')
    const b = await setupUserWithHousehold('-b')
    const aBud = await createBudget(a.token)
    const res = await app.request(`/api/category-budgets/${aBud.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${b.token}`, 'If-Match': aBud.updatedAt },
    })
    expect(res.status).toBe(403)
  })
})
