import { describe, it, expect, beforeEach } from 'vitest'
import { app, upsertUserAndHousehold } from './app.js'
import { cleanDb } from './test-setup.js'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'

// Env bindings — symulacja jak Workers runtime przekazuje env
// Celowo nadpisujemy GOOGLE_* żeby zweryfikować że app czyta z c.env, nie process.env
const ENV = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'test-secret',
  GOOGLE_CLIENT_ID: 'test-client-id',
  GOOGLE_CLIENT_SECRET: 'test-client-secret',
  NEXTAUTH_URL: 'http://localhost:3000',
  FRONTEND_URL: 'http://localhost:5173',
}

const sql = neon(process.env.DATABASE_URL)
const JWT_SECRET = new TextEncoder().encode(ENV.NEXTAUTH_SECRET)

async function createTestUser() {
  const [user] = await sql`
    INSERT INTO users (google_id, email, name)
    VALUES ('google-env-test', 'env-test@example.com', 'Env Test User')
    RETURNING *
  `
  return user
}

async function makeJwt(userId) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
}

describe('app with env bindings (Workers-style)', () => {
  beforeEach(async () => {
    await cleanDb()
  })

  it('GET /api/auth/me works with env passed as 3rd arg', async () => {
    const user = await createTestUser()
    const token = await makeJwt(user.id)

    const res = await app.request('/api/auth/me', {
      headers: { cookie: `token=${token}` },
    }, ENV)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user.email).toBe('env-test@example.com')
  })

  it('GET /api/auth/google redirects with client_id from env', async () => {
    const res = await app.request('/api/auth/google', {}, ENV)
    expect(res.status).toBe(302)

    const location = res.headers.get('location')
    expect(location).toContain('client_id=test-client-id')
  })

  it('GET /api/finance works with env bindings', async () => {
    const db = neon(process.env.DATABASE_URL)
    const profile = { sub: 'google-env-fin', email: 'envfin@test.com', name: 'Env Fin' }
    const user = await upsertUserAndHousehold(db, profile)
    const token = await makeJwt(user.id)

    const res = await app.request('/api/finance', {
      headers: { cookie: `token=${token}` },
    }, ENV)

    expect(res.status).toBe(200)
  })

  it('CORS allows FRONTEND_URL from env', async () => {
    const res = await app.request('/api/auth/me', {
      headers: { Origin: 'http://localhost:5173' },
    }, ENV)

    const acaoHeader = res.headers.get('access-control-allow-origin')
    expect(acaoHeader).toBe('http://localhost:5173')
  })

  it('CORS allows production domain from env', async () => {
    const prodEnv = { ...ENV, FRONTEND_URL: 'https://homecashflow.org' }

    const res = await app.request('/api/auth/me', {
      headers: { Origin: 'https://homecashflow.org' },
    }, prodEnv)

    const acaoHeader = res.headers.get('access-control-allow-origin')
    expect(acaoHeader).toBe('https://homecashflow.org')
  })

  it('CORS rejects unknown origin', async () => {
    const res = await app.request('/api/auth/me', {
      headers: { Origin: 'https://evil.com' },
    }, ENV)

    const acaoHeader = res.headers.get('access-control-allow-origin')
    expect(acaoHeader).toBeNull()
  })
})
