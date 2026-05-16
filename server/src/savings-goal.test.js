import { describe, it, expect, beforeEach } from 'vitest'
import { app, upsertUserAndHousehold } from './app.js'
import { cleanDb } from './test-setup.js'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'test-secret')

async function setupUserWithHousehold() {
  const db = neon(process.env.DATABASE_URL)
  const profile = { sub: 'google-sg', email: 'sg@test.com', name: 'SG User' }
  const user = await upsertUserAndHousehold(db, profile)
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
  return { user, token }
}

describe('PUT /api/savings-goal', () => {
  beforeEach(async () => { await cleanDb() })

  it('creates a goal when none exists (insert)', async () => {
    const { token } = await setupUserWithHousehold()
    const res = await app.request('/api/savings-goal', {
      method: 'PUT',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'yearly', monthlyAmount: 0, yearlyAmount: 12000, targetMonth: 11 }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ type: 'yearly', yearlyAmount: 12000, targetMonth: 11 })
  })

  it('upserts: second PUT replaces existing goal', async () => {
    const { token } = await setupUserWithHousehold()
    await app.request('/api/savings-goal', {
      method: 'PUT',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'yearly', yearlyAmount: 12000, monthlyAmount: 0, targetMonth: 11 }),
    })
    const res = await app.request('/api/savings-goal', {
      method: 'PUT',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'monthly', monthlyAmount: 500, yearlyAmount: 0, targetMonth: 11 }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.type).toBe('monthly')
    expect(body.monthlyAmount).toBe(500)
  })

  it('returns 401 without auth', async () => {
    const res = await app.request('/api/savings-goal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'none' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid type', async () => {
    const { token } = await setupUserWithHousehold()
    const res = await app.request('/api/savings-goal', {
      method: 'PUT',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'invalid' }),
    })
    expect(res.status).toBe(400)
  })
})
