import { describe, it, expect, beforeEach } from 'vitest'
import { app, upsertUserAndHousehold } from './app.js'
import { cleanDb } from './test-setup.js'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'

const sql = neon(process.env.DATABASE_URL)
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'test-secret')

async function createUser(googleId, email, name) {
  const db = neon(process.env.DATABASE_URL)
  const profile = { sub: googleId, email, name }
  const user = await upsertUserAndHousehold(db, profile)
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
  return { user, token }
}

describe('GET /api/household', () => {
  beforeEach(async () => { await cleanDb() })

  it('returns 401 without auth', async () => {
    const res = await app.request('/api/household')
    expect(res.status).toBe(401)
  })

  it('returns household with owner and members', async () => {
    const { token } = await createUser('g-owner-1', 'owner@test.com', 'Owner')

    const res = await app.request('/api/household', {
      headers: { cookie: `token=${token}` },
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.household).toBeDefined()
    expect(body.members).toHaveLength(1)
    expect(body.members[0].email).toBe('owner@test.com')
    expect(body.isOwner).toBe(true)
  })
})

describe('POST /api/household/invite', () => {
  beforeEach(async () => { await cleanDb() })

  it('owner can invite by email', async () => {
    const { token } = await createUser('g-owner-2', 'owner2@test.com', 'Owner')

    const res = await app.request('/api/household/invite', {
      method: 'POST',
      headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'friend@test.com' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.invitation).toBeDefined()
    expect(body.invitation.email).toBe('friend@test.com')
    expect(body.invitation.token).toBeDefined()
  })

  it('non-owner cannot invite', async () => {
    const { user: owner } = await createUser('g-owner-3', 'owner3@test.com', 'Owner')
    const { token: memberToken, user: member } = await createUser('g-member-3', 'member3@test.com', 'Member')

    // Get owner's household
    const [ownerHousehold] = await sql`
      SELECT id FROM households WHERE owner_id = ${owner.id}
    `

    // Add member to owner's household manually
    // First remove member from their own household
    const [memberHousehold] = await sql`
      SELECT household_id FROM household_members WHERE user_id = ${member.id}
    `
    await sql`DELETE FROM finance_data WHERE household_id = ${memberHousehold.household_id}`
    await sql`DELETE FROM household_members WHERE user_id = ${member.id}`
    await sql`DELETE FROM households WHERE id = ${memberHousehold.household_id}`
    await sql`INSERT INTO household_members (household_id, user_id) VALUES (${ownerHousehold.id}, ${member.id})`

    // Member tries to invite
    const res = await app.request('/api/household/invite', {
      method: 'POST',
      headers: { cookie: `token=${memberToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'another@test.com' }),
    })
    expect(res.status).toBe(403)
  })
})

describe('POST /api/household/invite/:token/accept', () => {
  beforeEach(async () => { await cleanDb() })

  it('invited user with matching email joins household', async () => {
    const { token: ownerToken, user: owner } = await createUser('g-owner-4', 'owner4@test.com', 'Owner')

    // Owner invites
    const inviteRes = await app.request('/api/household/invite', {
      method: 'POST',
      headers: { cookie: `token=${ownerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invited@test.com' }),
    })
    const { invitation } = await inviteRes.json()

    // Invited user creates account and accepts
    const { token: invitedToken } = await createUser('g-invited-4', 'invited@test.com', 'Invited')

    const acceptRes = await app.request(`/api/household/invite/${invitation.token}/accept`, {
      method: 'POST',
      headers: { cookie: `token=${invitedToken}` },
    })
    expect(acceptRes.status).toBe(200)

    // Both should see same household
    const ownerHousehold = await app.request('/api/household', {
      headers: { cookie: `token=${ownerToken}` },
    })
    const body = await ownerHousehold.json()
    expect(body.members).toHaveLength(2)

    // Invited user sees same finance data
    const ownerFinance = await app.request('/api/finance', {
      headers: { cookie: `token=${ownerToken}` },
    })
    const invitedFinance = await app.request('/api/finance', {
      headers: { cookie: `token=${invitedToken}` },
    })
    const ownerData = await ownerFinance.json()
    const invitedData = await invitedFinance.json()
    expect(JSON.stringify(ownerData)).toBe(JSON.stringify(invitedData))
  })

  it('rejects user with wrong email', async () => {
    const { token: ownerToken } = await createUser('g-owner-5', 'owner5@test.com', 'Owner')

    const inviteRes = await app.request('/api/household/invite', {
      method: 'POST',
      headers: { cookie: `token=${ownerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'specific@test.com' }),
    })
    const { invitation } = await inviteRes.json()

    // Wrong user tries to accept
    const { token: wrongToken } = await createUser('g-wrong-5', 'wrong@test.com', 'Wrong')

    const acceptRes = await app.request(`/api/household/invite/${invitation.token}/accept`, {
      method: 'POST',
      headers: { cookie: `token=${wrongToken}` },
    })
    expect(acceptRes.status).toBe(403)
  })
})
