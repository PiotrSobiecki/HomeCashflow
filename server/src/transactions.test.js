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
    sub: `google-tx${suffix}`,
    email: `tx${suffix}@test.com`,
    name: `Tx User ${suffix}`,
  }
  const user = await upsertUserAndHousehold(db, profile)
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
  return { user, token }
}

describe('POST /api/transactions', () => {
  beforeEach(async () => {
    await cleanDb()
  })

  it('creates an expense transaction and returns it with id + updated_at', async () => {
    const { token } = await setupUserWithHousehold()

    const res = await app.request('/api/transactions', {
      method: 'POST',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'expense',
        name: 'Lunch',
        amount: 42.5,
        txnDate: '2026-05-16',
        year: 2026,
        month: 4,
        isFixed: false,
        category: 'Żywność',
      }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toMatchObject({
      kind: 'expense',
      name: 'Lunch',
      amount: 42.5,
      txnDate: '2026-05-16',
      year: 2026,
      month: 4,
      isFixed: false,
      category: 'Żywność',
    })
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(typeof body.updatedAt).toBe('string')
  })

  it('returns 401 without auth', async () => {
    const res = await app.request('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'expense', name: 'X', amount: 1, txnDate: '2026-05-16', year: 2026, month: 4, isFixed: false }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    const { token } = await setupUserWithHousehold()

    const res = await app.request('/api/transactions', {
      method: 'POST',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'expense' }), // brak wymaganych pól
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })
})

async function createTransaction(token, overrides = {}) {
  const res = await app.request('/api/transactions', {
    method: 'POST',
    headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'expense', name: 'Lunch', amount: 42.5, txnDate: '2026-05-16',
      year: 2026, month: 4, isFixed: false, category: 'Żywność',
      ...overrides,
    }),
  })
  return res.json()
}

describe('PATCH /api/transactions/:id', () => {
  beforeEach(async () => {
    await cleanDb()
  })

  it('updates fields, bumps updated_at, returns updated row', async () => {
    const { token } = await setupUserWithHousehold()
    const created = await createTransaction(token)

    // małe odczekanie żeby updated_at się zmienił
    await new Promise(r => setTimeout(r, 50))

    const res = await app.request(`/api/transactions/${created.id}`, {
      method: 'PATCH',
      headers: {
        cookie: `token=${token}`,
        'Content-Type': 'application/json',
        'If-Match': created.updatedAt,
      },
      body: JSON.stringify({ name: 'Dinner', amount: 99.99 }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(created.id)
    expect(body.name).toBe('Dinner')
    expect(body.amount).toBe(99.99)
    expect(body.updatedAt).not.toBe(created.updatedAt)
  })

  it('returns 400 when If-Match header is missing', async () => {
    const { token } = await setupUserWithHousehold()
    const created = await createTransaction(token)

    const res = await app.request(`/api/transactions/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Dinner' }),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/if-match/i)
  })

  it('returns 409 with current row when If-Match is stale', async () => {
    const { token } = await setupUserWithHousehold()
    const created = await createTransaction(token)

    // pierwsza udana edycja zmienia updated_at
    await new Promise(r => setTimeout(r, 50))
    const firstEdit = await app.request(`/api/transactions/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json', 'If-Match': created.updatedAt },
      body: JSON.stringify({ name: 'First edit' }),
    })
    expect(firstEdit.status).toBe(200)

    // druga edycja ze STARYM If-Match (created.updatedAt już nieaktualny)
    const stale = await app.request(`/api/transactions/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json', 'If-Match': created.updatedAt },
      body: JSON.stringify({ name: 'Stale attempt' }),
    })
    expect(stale.status).toBe(409)
    const body = await stale.json()
    expect(body.error).toMatch(/conflict/i)
    expect(body.current).toBeTruthy()
    expect(body.current.name).toBe('First edit')
  })

  it('returns 403 when editing transaction from another household', async () => {
    const a = await setupUserWithHousehold('-a')
    const b = await setupUserWithHousehold('-b')

    const aTxn = await createTransaction(a.token)

    const res = await app.request(`/api/transactions/${aTxn.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${b.token}`, 'Content-Type': 'application/json', 'If-Match': aTxn.updatedAt },
      body: JSON.stringify({ name: 'Hacked' }),
    })
    expect(res.status).toBe(403)
  })

  it('returns 404 when transaction does not exist', async () => {
    const { token } = await setupUserWithHousehold()
    const fakeId = '00000000-0000-0000-0000-000000000000'

    const res = await app.request(`/api/transactions/${fakeId}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json', 'If-Match': new Date().toISOString() },
      body: JSON.stringify({ name: 'X' }),
    })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/transactions/:id', () => {
  beforeEach(async () => {
    await cleanDb()
  })

  it('deletes transaction and returns 204', async () => {
    const { token } = await setupUserWithHousehold()
    const created = await createTransaction(token)

    const res = await app.request(`/api/transactions/${created.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${token}`, 'If-Match': created.updatedAt },
    })
    expect(res.status).toBe(204)

    // sanity: drugi GET tej transakcji powinien zwrócić 404 (PATCH na tym samym id)
    const after = await app.request(`/api/transactions/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json', 'If-Match': created.updatedAt },
      body: JSON.stringify({ name: 'X' }),
    })
    expect(after.status).toBe(404)
  })

  it('returns 409 when If-Match is stale', async () => {
    const { token } = await setupUserWithHousehold()
    const created = await createTransaction(token)

    // edycja zmienia updated_at → DELETE ze starym If-Match konflikt
    await new Promise(r => setTimeout(r, 50))
    await app.request(`/api/transactions/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json', 'If-Match': created.updatedAt },
      body: JSON.stringify({ name: 'Edited' }),
    })

    const res = await app.request(`/api/transactions/${created.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${token}`, 'If-Match': created.updatedAt },
    })
    expect(res.status).toBe(409)
  })

  it('returns 403 when deleting transaction from another household', async () => {
    const a = await setupUserWithHousehold('-a')
    const b = await setupUserWithHousehold('-b')
    const aTxn = await createTransaction(a.token)

    const res = await app.request(`/api/transactions/${aTxn.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${b.token}`, 'If-Match': aTxn.updatedAt },
    })
    expect(res.status).toBe(403)
  })
})
