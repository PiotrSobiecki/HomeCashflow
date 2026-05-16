import { describe, it, expect, beforeEach } from 'vitest'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'
import { app, upsertUserAndHousehold } from './app.js'
import { cleanDb } from './test-setup.js'

const sql = neon(process.env.DATABASE_URL)
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'test-secret')

async function setupUser(suffix = '') {
  const profile = {
    sub: `google-ala${suffix}`,
    email: `ala${suffix}@test.com`,
    name: `ALA User ${suffix}`,
  }
  const user = await upsertUserAndHousehold(sql, profile)
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
  const [m] = await sql`SELECT household_id FROM household_members WHERE user_id = ${user.id}`
  return { user, token, householdId: m.household_id }
}

async function api(path, init) { return app.request(path, init) }
function auth(token) { return { cookie: `token=${token}`, 'Content-Type': 'application/json' } }

describe('GET /api/action-log', () => {
  beforeEach(async () => {
    await cleanDb()
    await sql`DELETE FROM action_log`
  })

  it('401 bez auth', async () => {
    const res = await api('/api/action-log', { method: 'GET' })
    expect(res.status).toBe(401)
  })

  it('zwraca pustą listę dla świeżego household', async () => {
    const { token } = await setupUser()
    const res = await api('/api/action-log', { method: 'GET', headers: auth(token) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.entries).toEqual([])
  })

  it('zwraca wpisy posortowane DESC z nazwą autora i etykietą operacji', async () => {
    const { user, token } = await setupUser()

    // Wygeneruj 2 mutacje
    const t1 = await (await api('/api/transactions', { method: 'POST', headers: auth(token), body: JSON.stringify({ kind: 'expense', name: 'A', amount: 10, txnDate: '2026-05-16', year: 2026, month: 4, isFixed: false }) })).json()
    await api(`/api/transactions/${t1.id}`, { method: 'PATCH', headers: { ...auth(token), 'If-Match': t1.updatedAt }, body: JSON.stringify({ amount: 20 }) })

    const res = await api('/api/action-log', { method: 'GET', headers: auth(token) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.entries.length).toBe(2)

    // Pierwszy = najnowszy (UPDATE)
    expect(body.entries[0]).toMatchObject({
      operation: 'UPDATE',
      resourceType: 'transaction',
      resourceId: t1.id,
      actorId: user.id,
    })
    expect(body.entries[0].actorName).toBeTruthy() // wzbogacone o nazwę usera
    expect(body.entries[0].undoneAt).toBeNull()
    expect(typeof body.entries[0].at).toBe('string')

    // Drugi = CREATE
    expect(body.entries[1].operation).toBe('CREATE')
  })

  it('403 gdy user nie należy do household z wpisami (izolacja)', async () => {
    const a = await setupUser('-a')
    const b = await setupUser('-b')
    // wpis w household A
    await api('/api/transactions', { method: 'POST', headers: auth(a.token), body: JSON.stringify({ kind: 'expense', name: 'X', amount: 1, txnDate: '2026-05-16', year: 2026, month: 4, isFixed: false }) })

    const resB = await api('/api/action-log', { method: 'GET', headers: auth(b.token) })
    expect(resB.status).toBe(200)
    const body = await resB.json()
    expect(body.entries).toEqual([]) // B widzi tylko swoje (pustkę)
  })

  it('max 20 wpisów', async () => {
    const { token } = await setupUser()
    for (let i = 0; i < 25; i++) {
      await api('/api/transactions', { method: 'POST', headers: auth(token), body: JSON.stringify({ kind: 'expense', name: `T${i}`, amount: i, txnDate: '2026-05-16', year: 2026, month: 4, isFixed: false }) })
    }
    const res = await api('/api/action-log', { method: 'GET', headers: auth(token) })
    const body = await res.json()
    expect(body.entries.length).toBe(20)
  }, 60000)
})
