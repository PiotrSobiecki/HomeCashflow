import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Granica: klient Tuya woła zewnętrzne API. Mockujemy wrapper (nie global fetch —
// Neon HTTP też używa fetch, stub globalny zepsułby zapytania DB).
vi.mock('./tuya/client.js', () => ({
  getTuyaToken: vi.fn(),
}))

import { app, upsertUserAndHousehold } from './app.js'
import { getTuyaToken } from './tuya/client.js'
import { decodeFinanceDataKey, decryptField } from './finance-crypto.js'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'

const sql = neon(process.env.DATABASE_URL)
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'test-secret')
const rawKey = decodeFinanceDataKey(process.env.FINANCE_DATA_KEY)

// Sprzątamy TYLKO swoje wiersze — nigdy cleanDb/global wipe na bazie usera.
// Skasowanie usera kaskaduje na household → members/finance_data/tuya_credentials.
let createdUserIds = []

async function createUser(googleId, email, name) {
  const db = neon(process.env.DATABASE_URL)
  const user = await upsertUserAndHousehold(db, { sub: googleId, email, name })
  createdUserIds.push(user.id)
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
  return { user, token }
}

async function addMemberToHousehold(ownerToken, memberEmail, memberGoogleId, memberName) {
  const invRes = await app.request('/api/household/invite', {
    method: 'POST',
    headers: { cookie: `token=${ownerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: memberEmail }),
  })
  const { invitation } = await invRes.json()
  const member = await createUser(memberGoogleId, memberEmail, memberName)
  await app.request(`/api/household/invite/${invitation.token}/accept`, {
    method: 'POST',
    headers: { cookie: `token=${member.token}` },
  })
  return member
}

async function householdIdOf(userId) {
  const [m] = await sql`SELECT household_id FROM household_members WHERE user_id = ${userId}`
  return m.household_id
}

const uniq = () => Math.random().toString(36).slice(2, 10)

const VALID_BODY = {
  clientId: 'mknu8qe8mk8mjenh8afq',
  clientSecret: 'super-secret-value',
  datacenter: 'eu',
}

function putCredentials(token, body) {
  return app.request('/api/tuya/credentials', {
    method: 'PUT',
    headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  createdUserIds = []
  vi.mocked(getTuyaToken).mockReset()
})

afterEach(async () => {
  if (createdUserIds.length) {
    await sql`DELETE FROM users WHERE id = ANY(${createdUserIds})`
  }
})

describe('PUT /api/tuya/credentials', () => {
  it('verifies via Tuya, stores encrypted credentials and returns connected status', async () => {
    const owner = await createUser(`g-tuya-${uniq()}`, `tuya-${uniq()}@test.com`, 'Owner')
    vi.mocked(getTuyaToken).mockResolvedValue({ accessToken: 'tok', expireTime: 7200 })

    const res = await putCredentials(owner.token, VALID_BODY)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ configured: true, datacenter: 'eu' })
    expect(typeof body.verifiedAt).toBe('string')

    expect(vi.mocked(getTuyaToken)).toHaveBeenCalledWith({
      clientId: VALID_BODY.clientId,
      clientSecret: VALID_BODY.clientSecret,
      datacenter: 'eu',
    })

    const householdId = await householdIdOf(owner.user.id)
    const [row] = await sql`
      SELECT client_secret_enc, client_id_enc, datacenter
      FROM tuya_credentials WHERE household_id = ${householdId}
    `
    expect(row.client_secret_enc.startsWith('ff1:')).toBe(true)
    expect(await decryptField(row.client_secret_enc, rawKey)).toBe(VALID_BODY.clientSecret)
    expect(await decryptField(row.client_id_enc, rawKey)).toBe(VALID_BODY.clientId)
  })

  it('does not persist anything when Tuya rejects the credentials', async () => {
    const owner = await createUser(`g-tuya-${uniq()}`, `tuya-${uniq()}@test.com`, 'Owner')
    vi.mocked(getTuyaToken).mockRejectedValue(new Error('Tuya API: [1004] sign invalid'))

    const res = await putCredentials(owner.token, VALID_BODY)

    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('tuya_auth_failed')

    const householdId = await householdIdOf(owner.user.id)
    const rows = await sql`SELECT 1 FROM tuya_credentials WHERE household_id = ${householdId}`
    expect(rows.length).toBe(0)
  })

  it('returns 400 when required fields are missing', async () => {
    const owner = await createUser(`g-tuya-${uniq()}`, `tuya-${uniq()}@test.com`, 'Owner')
    const res = await putCredentials(owner.token, { clientId: 'x' })
    expect(res.status).toBe(400)
  })

  it('returns 400 for an invalid datacenter', async () => {
    const owner = await createUser(`g-tuya-${uniq()}`, `tuya-${uniq()}@test.com`, 'Owner')
    const res = await putCredentials(owner.token, { ...VALID_BODY, datacenter: 'mars' })
    expect(res.status).toBe(400)
  })

  it('returns 401 without auth', async () => {
    const res = await app.request('/api/tuya/credentials', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_BODY),
    })
    expect(res.status).toBe(401)
  })

  it('returns 403 for a member (owner-only)', async () => {
    const owner = await createUser(`g-tuya-${uniq()}`, `tuya-${uniq()}@test.com`, 'Owner')
    const member = await addMemberToHousehold(owner.token, `mem-${uniq()}@test.com`, `g-mem-${uniq()}`, 'Member')
    vi.mocked(getTuyaToken).mockResolvedValue({ accessToken: 'tok', expireTime: 1 })

    const res = await putCredentials(member.token, VALID_BODY)
    expect(res.status).toBe(403)
  })
})

describe('GET /api/tuya/credentials', () => {
  it('reports not configured before credentials are set', async () => {
    const owner = await createUser(`g-tuya-${uniq()}`, `tuya-${uniq()}@test.com`, 'Owner')
    const res = await app.request('/api/tuya/credentials', {
      headers: { cookie: `token=${owner.token}` },
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ configured: false })
  })

  it('reports configured and never leaks the secret after setup', async () => {
    const owner = await createUser(`g-tuya-${uniq()}`, `tuya-${uniq()}@test.com`, 'Owner')
    vi.mocked(getTuyaToken).mockResolvedValue({ accessToken: 'tok', expireTime: 1 })
    await putCredentials(owner.token, VALID_BODY)

    const res = await app.request('/api/tuya/credentials', {
      headers: { cookie: `token=${owner.token}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ configured: true, datacenter: 'eu' })
    const serialized = JSON.stringify(body)
    expect(serialized).not.toContain(VALID_BODY.clientSecret)
    expect(serialized).not.toContain(VALID_BODY.clientId)
  })

  it('returns 403 for a member', async () => {
    const owner = await createUser(`g-tuya-${uniq()}`, `tuya-${uniq()}@test.com`, 'Owner')
    const member = await addMemberToHousehold(owner.token, `mem-${uniq()}@test.com`, `g-mem-${uniq()}`, 'Member')
    const res = await app.request('/api/tuya/credentials', {
      headers: { cookie: `token=${member.token}` },
    })
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/tuya/credentials', () => {
  it('removes credentials so GET reports not configured', async () => {
    const owner = await createUser(`g-tuya-${uniq()}`, `tuya-${uniq()}@test.com`, 'Owner')
    vi.mocked(getTuyaToken).mockResolvedValue({ accessToken: 'tok', expireTime: 1 })
    await putCredentials(owner.token, VALID_BODY)

    const del = await app.request('/api/tuya/credentials', {
      method: 'DELETE',
      headers: { cookie: `token=${owner.token}` },
    })
    expect(del.status).toBe(204)

    const res = await app.request('/api/tuya/credentials', {
      headers: { cookie: `token=${owner.token}` },
    })
    expect(await res.json()).toMatchObject({ configured: false })
  })

  it('returns 403 for a member', async () => {
    const owner = await createUser(`g-tuya-${uniq()}`, `tuya-${uniq()}@test.com`, 'Owner')
    const member = await addMemberToHousehold(owner.token, `mem-${uniq()}@test.com`, `g-mem-${uniq()}`, 'Member')
    const res = await app.request('/api/tuya/credentials', {
      method: 'DELETE',
      headers: { cookie: `token=${member.token}` },
    })
    expect(res.status).toBe(403)
  })
})
