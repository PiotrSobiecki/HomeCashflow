import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwtVerify, SignJWT } from 'jose'
import { neon } from '@neondatabase/serverless'

export const app = new Hono()

// Env helper — czyta z c.env (Workers bindings) z fallbackiem na process.env (local dev)
// c.env ma zawsze priorytet gdy jest ustawione (Workers runtime lub test bindings)
function getEnv(c, key) {
  if (c.env && typeof c.env === 'object' && key in c.env) return c.env[key]
  return process.env[key]
}

app.use('/api/*', cors({
  origin: (origin, c) => {
    const allowed = getEnv(c, 'FRONTEND_URL') || 'http://localhost:5173'
    return origin === allowed ? origin : null
  },
  credentials: true,
}))

function getSecret(c) {
  return new TextEncoder().encode(getEnv(c, 'NEXTAUTH_SECRET') || 'test-secret')
}

function getDb(c) {
  return neon(getEnv(c, 'DATABASE_URL'))
}

function parseCookie(header, name) {
  if (!header) return null
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? match[1] : null
}

export async function upsertUserAndHousehold(sql, profile) {
  // Upsert user
  const [user] = await sql`
    INSERT INTO users (google_id, email, name, avatar_url)
    VALUES (${profile.sub}, ${profile.email}, ${profile.name}, ${profile.picture || null})
    ON CONFLICT (google_id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      avatar_url = EXCLUDED.avatar_url
    RETURNING *
  `

  // Check if user already has a household (as owner or member)
  const [existing] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `

  if (!existing) {
    // Create household + membership + finance_data
    const [household] = await sql`
      INSERT INTO households (owner_id) VALUES (${user.id}) RETURNING *
    `
    await sql`
      INSERT INTO household_members (household_id, user_id) VALUES (${household.id}, ${user.id})
    `
    await sql`
      INSERT INTO finance_data (household_id) VALUES (${household.id})
    `
  }

  return user
}

async function exchangeCodeForProfile(c, code) {
  const redirectUri = `${getEnv(c, 'NEXTAUTH_URL') || 'http://localhost:3000'}/api/auth/callback`

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: getEnv(c, 'GOOGLE_CLIENT_ID'),
      client_secret: getEnv(c, 'GOOGLE_CLIENT_SECRET'),
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const tokens = await tokenRes.json()

  // Get user profile
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  return profileRes.json()
}

app.get('/api/auth/google', (c) => {
  const clientId = getEnv(c, 'GOOGLE_CLIENT_ID')
  const redirectUri = `${getEnv(c, 'NEXTAUTH_URL') || 'http://localhost:3000'}/api/auth/callback`
  const scope = 'openid email profile'

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', scope)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')

  return c.redirect(url.toString())
})

app.get('/api/auth/callback', async (c) => {
  const code = c.req.query('code')
  if (!code) {
    return c.json({ error: 'Missing code' }, 400)
  }

  try {
    const profile = await exchangeCodeForProfile(c, code)
    const sql = getDb(c)
    const user = await upsertUserAndHousehold(sql, profile)

    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(getSecret(c))

    const frontendUrl = getEnv(c, 'FRONTEND_URL') || 'http://localhost:5173'
    return new Response(null, {
      status: 302,
      headers: {
        Location: frontendUrl,
        'Set-Cookie': `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`,
      },
    })
  } catch (err) {
    return c.json({ error: 'Auth failed' }, 500)
  }
})

app.post('/api/auth/logout', (c) => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
    },
  })
})

// Auth middleware - extracts user from JWT, sets c.user
async function authMiddleware(c, next) {
  const token = parseCookie(c.req.header('cookie'), 'token')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { payload } = await jwtVerify(token, getSecret(c))
    const sql = getDb(c)
    const [user] = await sql`
      SELECT id, email, name, avatar_url FROM users WHERE id = ${payload.userId}
    `
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    c.set('user', user)
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
}

app.get('/api/auth/me', authMiddleware, (c) => {
  return c.json({ user: c.get('user') })
})

// ============ FINANCE ENDPOINTS ============

app.get('/api/finance', authMiddleware, async (c) => {
  const user = c.get('user')
  const sql = getDb(c)

  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `
  if (!membership) {
    return c.json({ data: {} })
  }

  const [fd] = await sql`
    SELECT data FROM finance_data WHERE household_id = ${membership.household_id}
  `
  return c.json({ data: fd?.data || {} })
})

app.put('/api/finance', authMiddleware, async (c) => {
  const user = c.get('user')
  const body = await c.req.json()
  const sql = getDb(c)

  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `
  if (!membership) {
    return c.json({ error: 'No household' }, 400)
  }

  await sql`
    UPDATE finance_data
    SET data = ${JSON.stringify(body.data)}::jsonb, updated_at = NOW()
    WHERE household_id = ${membership.household_id}
  `
  return c.json({ ok: true })
})

// ============ HOUSEHOLD ENDPOINTS ============

app.get('/api/household', authMiddleware, async (c) => {
  const user = c.get('user')
  const sql = getDb(c)

  const [membership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `
  if (!membership) {
    return c.json({ error: 'No household' }, 400)
  }

  const [household] = await sql`
    SELECT id, name, owner_id, created_at FROM households WHERE id = ${membership.household_id}
  `

  const members = await sql`
    SELECT u.id, u.email, u.name, u.avatar_url, hm.joined_at
    FROM household_members hm
    JOIN users u ON u.id = hm.user_id
    WHERE hm.household_id = ${household.id}
    ORDER BY hm.joined_at
  `

  const pendingInvitations = await sql`
    SELECT id, email, created_at FROM invitations
    WHERE household_id = ${household.id} AND status = 'pending'
  `

  return c.json({
    household,
    members,
    pendingInvitations,
    isOwner: household.owner_id === user.id,
  })
})

app.post('/api/household/invite', authMiddleware, async (c) => {
  const user = c.get('user')
  const { email } = await c.req.json()
  const sql = getDb(c)

  // Check ownership
  const [household] = await sql`
    SELECT h.id FROM households h
    JOIN household_members hm ON hm.household_id = h.id
    WHERE hm.user_id = ${user.id} AND h.owner_id = ${user.id}
  `
  if (!household) {
    return c.json({ error: 'Only owner can invite' }, 403)
  }

  // Generate token
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const [invitation] = await sql`
    INSERT INTO invitations (household_id, email, invited_by, token, expires_at)
    VALUES (${household.id}, ${email}, ${user.id}, ${token}, ${expiresAt.toISOString()})
    RETURNING id, email, token, expires_at, created_at
  `

  return c.json({ invitation })
})

app.post('/api/household/invite/:token/accept', authMiddleware, async (c) => {
  const user = c.get('user')
  const inviteToken = c.req.param('token')
  const sql = getDb(c)

  // Find invitation
  const [invitation] = await sql`
    SELECT * FROM invitations
    WHERE token = ${inviteToken} AND status = 'pending' AND expires_at > NOW()
  `
  if (!invitation) {
    return c.json({ error: 'Invalid or expired invitation' }, 404)
  }

  // Check email matches
  if (invitation.email !== user.email) {
    return c.json({ error: 'Email does not match invitation' }, 403)
  }

  // Remove user from their current household
  const [currentMembership] = await sql`
    SELECT household_id FROM household_members WHERE user_id = ${user.id}
  `
  if (currentMembership) {
    const [currentHousehold] = await sql`
      SELECT id, owner_id FROM households WHERE id = ${currentMembership.household_id}
    `
    // Only clean up if user owns this household and is the only member
    if (currentHousehold && currentHousehold.owner_id === user.id) {
      const memberCount = await sql`
        SELECT count(*) as cnt FROM household_members WHERE household_id = ${currentHousehold.id}
      `
      if (parseInt(memberCount[0].cnt) === 1) {
        await sql`DELETE FROM finance_data WHERE household_id = ${currentHousehold.id}`
        await sql`DELETE FROM household_members WHERE household_id = ${currentHousehold.id}`
        await sql`DELETE FROM households WHERE id = ${currentHousehold.id}`
      }
    } else {
      await sql`DELETE FROM household_members WHERE user_id = ${user.id} AND household_id = ${currentMembership.household_id}`
    }
  }

  // Add to invited household
  await sql`
    INSERT INTO household_members (household_id, user_id)
    VALUES (${invitation.household_id}, ${user.id})
    ON CONFLICT DO NOTHING
  `

  // Mark invitation as accepted
  await sql`
    UPDATE invitations SET status = 'accepted' WHERE id = ${invitation.id}
  `

  return c.json({ ok: true })
})

// Helper: create a fresh household for a user
async function createFreshHousehold(sql, userId) {
  const [household] = await sql`
    INSERT INTO households (owner_id) VALUES (${userId}) RETURNING *
  `
  await sql`
    INSERT INTO household_members (household_id, user_id) VALUES (${household.id}, ${userId})
  `
  await sql`
    INSERT INTO finance_data (household_id) VALUES (${household.id})
  `
  return household
}

app.delete('/api/household/members/:userId', authMiddleware, async (c) => {
  const user = c.get('user')
  const targetUserId = c.req.param('userId')
  const sql = getDb(c)

  if (targetUserId === user.id) {
    return c.json({ error: 'Cannot remove yourself' }, 400)
  }

  const [household] = await sql`
    SELECT h.id, h.owner_id FROM households h
    JOIN household_members hm ON hm.household_id = h.id
    WHERE hm.user_id = ${user.id} AND h.owner_id = ${user.id}
  `
  if (!household) {
    return c.json({ error: 'Only owner can remove members' }, 403)
  }

  await sql`
    DELETE FROM household_members WHERE user_id = ${targetUserId} AND household_id = ${household.id}
  `
  await createFreshHousehold(sql, targetUserId)

  return c.json({ ok: true })
})

app.post('/api/household/leave', authMiddleware, async (c) => {
  const user = c.get('user')
  const sql = getDb(c)

  const [membership] = await sql`
    SELECT hm.household_id, h.owner_id FROM household_members hm
    JOIN households h ON h.id = hm.household_id
    WHERE hm.user_id = ${user.id}
  `
  if (!membership) {
    return c.json({ error: 'No household' }, 400)
  }

  if (membership.owner_id === user.id) {
    return c.json({ error: 'Owner cannot leave' }, 400)
  }

  await sql`
    DELETE FROM household_members WHERE user_id = ${user.id} AND household_id = ${membership.household_id}
  `
  await createFreshHousehold(sql, user.id)

  return c.json({ ok: true })
})

app.delete('/api/household', authMiddleware, async (c) => {
  const user = c.get('user')
  const sql = getDb(c)

  const [household] = await sql`
    SELECT h.id, h.owner_id FROM households h
    JOIN household_members hm ON hm.household_id = h.id
    WHERE hm.user_id = ${user.id}
  `
  if (!household || household.owner_id !== user.id) {
    return c.json({ error: 'Only owner can delete household' }, 403)
  }

  const members = await sql`
    SELECT user_id FROM household_members WHERE household_id = ${household.id}
  `

  await sql`DELETE FROM households WHERE id = ${household.id}`

  for (const member of members) {
    await createFreshHousehold(sql, member.user_id)
  }

  return c.json({ ok: true })
})
