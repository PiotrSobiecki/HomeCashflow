import { describe, it, expect, beforeEach } from 'vitest'
import { app, upsertUserAndHousehold } from './app.js'
import { cleanDb } from './test-setup.js'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'

const sql = neon(process.env.DATABASE_URL)
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'test-secret')

async function createUser(googleId, email, name) {
  const db = neon(process.env.DATABASE_URL)
  const user = await upsertUserAndHousehold(db, { sub: googleId, email, name })
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
  return { user, token }
}

async function addMemberToHousehold(ownerToken, memberEmail, memberGoogleId, memberName) {
  // Owner invites
  const invRes = await app.request('/api/household/invite', {
    method: 'POST',
    headers: { cookie: `token=${ownerToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: memberEmail }),
  })
  const { invitation } = await invRes.json()

  // Member creates account and accepts
  const member = await createUser(memberGoogleId, memberEmail, memberName)
  await app.request(`/api/household/invite/${invitation.token}/accept`, {
    method: 'POST',
    headers: { cookie: `token=${member.token}` },
  })
  return member
}

describe('DELETE /api/household/members/:userId', () => {
  beforeEach(async () => { await cleanDb() })

  it('owner can remove a member', async () => {
    const owner = await createUser('g-own-rm', 'owner-rm@test.com', 'Owner')
    const member = await addMemberToHousehold(owner.token, 'mem-rm@test.com', 'g-mem-rm', 'Member')

    const res = await app.request(`/api/household/members/${member.user.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${owner.token}` },
    })
    expect(res.status).toBe(200)

    // Owner's household now has 1 member
    const hRes = await app.request('/api/household', { headers: { cookie: `token=${owner.token}` } })
    const hBody = await hRes.json()
    expect(hBody.members).toHaveLength(1)

    // Removed member has new household
    const mRes = await app.request('/api/household', { headers: { cookie: `token=${member.token}` } })
    const mBody = await mRes.json()
    expect(mBody.members).toHaveLength(1)
    expect(mBody.isOwner).toBe(true)
  })

  it('non-owner cannot remove a member', async () => {
    const owner = await createUser('g-own-nr', 'owner-nr@test.com', 'Owner')
    const member = await addMemberToHousehold(owner.token, 'mem-nr@test.com', 'g-mem-nr', 'Member')

    const res = await app.request(`/api/household/members/${owner.user.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${member.token}` },
    })
    expect(res.status).toBe(403)
  })

  it('owner cannot remove themselves', async () => {
    const owner = await createUser('g-own-self', 'owner-self@test.com', 'Owner')

    const res = await app.request(`/api/household/members/${owner.user.id}`, {
      method: 'DELETE',
      headers: { cookie: `token=${owner.token}` },
    })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/household/leave', () => {
  beforeEach(async () => { await cleanDb() })

  it('member can leave household', async () => {
    const owner = await createUser('g-own-lv', 'owner-lv@test.com', 'Owner')
    const member = await addMemberToHousehold(owner.token, 'mem-lv@test.com', 'g-mem-lv', 'Member')

    const res = await app.request('/api/household/leave', {
      method: 'POST',
      headers: { cookie: `token=${member.token}` },
    })
    expect(res.status).toBe(200)

    // Member has new household
    const mRes = await app.request('/api/household', { headers: { cookie: `token=${member.token}` } })
    const mBody = await mRes.json()
    expect(mBody.members).toHaveLength(1)
    expect(mBody.isOwner).toBe(true)
  })

  it('owner cannot leave their own household', async () => {
    const owner = await createUser('g-own-nolv', 'owner-nolv@test.com', 'Owner')

    const res = await app.request('/api/household/leave', {
      method: 'POST',
      headers: { cookie: `token=${owner.token}` },
    })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/household', () => {
  beforeEach(async () => { await cleanDb() })

  it('owner can delete entire household', async () => {
    // This test has many DB operations (create 2 users, invite, accept, delete, verify both)

    const owner = await createUser('g-own-del', 'owner-del@test.com', 'Owner')
    const member = await addMemberToHousehold(owner.token, 'mem-del@test.com', 'g-mem-del', 'Member')

    const res = await app.request('/api/household', {
      method: 'DELETE',
      headers: { cookie: `token=${owner.token}` },
    })
    expect(res.status).toBe(200)

    // Both get new empty households
    const oRes = await app.request('/api/household', { headers: { cookie: `token=${owner.token}` } })
    const oBody = await oRes.json()
    expect(oBody.members).toHaveLength(1)
    expect(oBody.isOwner).toBe(true)

    const mRes = await app.request('/api/household', { headers: { cookie: `token=${member.token}` } })
    const mBody = await mRes.json()
    expect(mBody.members).toHaveLength(1)
    expect(mBody.isOwner).toBe(true)

    // They have different households
    expect(oBody.household.id).not.toBe(mBody.household.id)
  })

  it('non-owner cannot delete household', async () => {
    const owner = await createUser('g-own-ndel', 'owner-ndel@test.com', 'Owner')
    const member = await addMemberToHousehold(owner.token, 'mem-ndel@test.com', 'g-mem-ndel', 'Member')

    const res = await app.request('/api/household', {
      method: 'DELETE',
      headers: { cookie: `token=${member.token}` },
    })
    expect(res.status).toBe(403)
  })
})
