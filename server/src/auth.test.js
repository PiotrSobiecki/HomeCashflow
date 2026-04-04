import { describe, it, expect, beforeEach } from 'vitest'
import { app, upsertUserAndHousehold } from './app.js'
import { cleanDb } from './test-setup.js'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'

const sql = neon(process.env.DATABASE_URL)
const db = () => neon(process.env.DATABASE_URL)
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'test-secret')

async function createTestUser() {
  const [user] = await sql`
    INSERT INTO users (google_id, email, name)
    VALUES ('google-123', 'test@example.com', 'Test User')
    RETURNING *
  `
  return user
}

async function makeJwt(payload, secret = JWT_SECRET) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret)
}

describe('GET /api/auth/me', () => {
  beforeEach(async () => {
    await cleanDb()
  })

  it('returns 401 without session cookie', async () => {
    const res = await app.request('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns user data with valid JWT', async () => {
    const user = await createTestUser()
    const token = await makeJwt({ userId: user.id })

    const res = await app.request('/api/auth/me', {
      headers: { cookie: `token=${token}` },
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user.email).toBe('test@example.com')
    expect(body.user.name).toBe('Test User')
    expect(body.user.id).toBe(user.id)
  })

  it('returns 401 with invalid JWT', async () => {
    const res = await app.request('/api/auth/me', {
      headers: { cookie: 'token=garbage.invalid.token' },
    })
    expect(res.status).toBe(401)
  })

  it('returns 401 with expired JWT', async () => {
    const user = await createTestUser()
    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('0s')
      .sign(JWT_SECRET)

    // tiny delay to ensure expiry
    await new Promise((r) => setTimeout(r, 1100))

    const res = await app.request('/api/auth/me', {
      headers: { cookie: `token=${token}` },
    })
    expect(res.status).toBe(401)
  })
})

describe('upsertUserAndHousehold', () => {
  beforeEach(async () => {
    await cleanDb()
  })

  it('creates user, household, and membership for new Google user', async () => {
    const profile = {
      sub: 'google-new-456',
      email: 'new@example.com',
      name: 'New User',
      picture: 'https://example.com/avatar.jpg',
    }

    const user = await upsertUserAndHousehold(db(), profile)

    expect(user.email).toBe('new@example.com')
    expect(user.name).toBe('New User')

    // Verify household was created
    const [household] = await sql`
      SELECT * FROM households WHERE owner_id = ${user.id}
    `
    expect(household).toBeDefined()
    expect(household.owner_id).toBe(user.id)

    // Verify membership
    const [member] = await sql`
      SELECT * FROM household_members
      WHERE household_id = ${household.id} AND user_id = ${user.id}
    `
    expect(member).toBeDefined()

    // Verify finance_data created
    const [fd] = await sql`
      SELECT * FROM finance_data WHERE household_id = ${household.id}
    `
    expect(fd).toBeDefined()
  })

  it('does not duplicate user or household on second login', async () => {
    const profile = {
      sub: 'google-repeat-789',
      email: 'repeat@example.com',
      name: 'Repeat User',
      picture: null,
    }

    const user1 = await upsertUserAndHousehold(db(), profile)
    const user2 = await upsertUserAndHousehold(db(), { ...profile, name: 'Updated Name' })

    // Same user
    expect(user2.id).toBe(user1.id)
    expect(user2.name).toBe('Updated Name')

    // Only one household
    const households = await sql`
      SELECT * FROM households WHERE owner_id = ${user1.id}
    `
    expect(households).toHaveLength(1)

    // Only one membership
    const members = await sql`
      SELECT * FROM household_members WHERE user_id = ${user1.id}
    `
    expect(members).toHaveLength(1)
  })
})

describe('POST /api/auth/logout', () => {
  it('clears cookie and returns 200', async () => {
    const res = await app.request('/api/auth/logout', { method: 'POST' })
    expect(res.status).toBe(200)

    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('token=')
    expect(setCookie).toContain('Max-Age=0')
  })
})

describe('GET /api/auth/google', () => {
  it('redirects to Google OAuth with correct params', async () => {
    const res = await app.request('/api/auth/google')
    expect(res.status).toBe(302)

    const location = res.headers.get('location')
    expect(location).toContain('accounts.google.com/o/oauth2/v2/auth')
    expect(location).toContain('client_id=')
    expect(location).toContain('redirect_uri=')
    expect(location).toContain('scope=')
    expect(location).toContain('response_type=code')
  })
})
