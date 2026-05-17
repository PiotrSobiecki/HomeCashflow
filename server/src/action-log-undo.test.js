import { describe, it, expect, beforeEach } from 'vitest'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'
import { app, upsertUserAndHousehold } from './app.js'
import { cleanDb } from './test-setup.js'

const sql = neon(process.env.DATABASE_URL)
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'test-secret')

async function setupOwner(suffix = '') {
  const profile = { sub: `google-undo${suffix}`, email: `undo${suffix}@test.com`, name: `Undo User ${suffix}` }
  const user = await upsertUserAndHousehold(sql, profile)
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' }).setExpirationTime('1h').sign(JWT_SECRET)
  const [m] = await sql`SELECT household_id FROM household_members WHERE user_id = ${user.id}`
  return { user, token, householdId: m.household_id }
}

// Tworzy drugiego usera i dołącza do household istniejącego ownera (member, nie owner)
async function joinAsMember(householdId, suffix) {
  const [user] = await sql`
    INSERT INTO users (google_id, email, name)
    VALUES (${`google-member${suffix}`}, ${`member${suffix}@test.com`}, ${`Member ${suffix}`})
    RETURNING *
  `
  await sql`INSERT INTO household_members (household_id, user_id) VALUES (${householdId}, ${user.id})`
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' }).setExpirationTime('1h').sign(JWT_SECRET)
  return { user, token }
}

async function api(p, init) { return app.request(p, init) }
function auth(t, extra = {}) { return { cookie: `token=${t}`, 'Content-Type': 'application/json', ...extra } }

async function getLastEntry(householdId) {
  const res = await api('/api/action-log', { method: 'GET', headers: auth(await tokenFor(householdId)) })
  return (await res.json()).entries[0]
}
// helper aby pobrać świeży token usera dla household — nieużywany; pobieramy ID wpisu inaczej
async function tokenFor() { throw new Error('unused') }

describe('POST /api/action-log/:id/undo', () => {
  beforeEach(async () => {
    await cleanDb()
    await sql`DELETE FROM action_log`
  })

  it('401 bez auth', async () => {
    const res = await api('/api/action-log/00000000-0000-0000-0000-000000000000/undo', { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('404 dla nieistniejącego wpisu', async () => {
    const { token } = await setupOwner()
    const res = await api('/api/action-log/00000000-0000-0000-0000-000000000000/undo', {
      method: 'POST', headers: auth(token),
    })
    expect(res.status).toBe(404)
  })

  it('cofa CREATE: usuwa zasób', async () => {
    const { token, householdId } = await setupOwner()
    const created = await (await api('/api/transactions', {
      method: 'POST', headers: auth(token),
      body: JSON.stringify({ kind: 'expense', name: 'Lunch', amount: 42, txnDate: '2026-05-16', year: 2026, month: 4, isFixed: false }),
    })).json()

    // Pobierz id wpisu CREATE z action_log
    const [logRow] = await sql`
      SELECT id FROM action_log
      WHERE household_id = ${householdId} AND operation = 'CREATE' AND resource_id = ${created.id}
    `
    const undoRes = await api(`/api/action-log/${logRow.id}/undo`, { method: 'POST', headers: auth(token) })
    expect(undoRes.status).toBe(200)
    const undoBody = await undoRes.json()
    expect(undoBody.ok).toBe(true)

    // Zasób ma już nie istnieć
    const [exists] = await sql`SELECT 1 FROM transactions WHERE id = ${created.id}`
    expect(exists).toBeUndefined()

    // Oryginalny wpis oznaczony jako undone, pojawił się wpis UNDO
    const [orig] = await sql`SELECT undone_at, undone_by FROM action_log WHERE id = ${logRow.id}`
    expect(orig.undone_at).not.toBeNull()
    const [undoEntry] = await sql`
      SELECT operation, undoes_entry_id FROM action_log
      WHERE household_id = ${householdId} AND operation = 'UNDO'
    `
    expect(undoEntry.undoes_entry_id).toBe(logRow.id)
  })

  it('cofa UPDATE: przywraca poprzednie wartości', async () => {
    const { token, householdId } = await setupOwner()
    const created = await (await api('/api/transactions', {
      method: 'POST', headers: auth(token),
      body: JSON.stringify({ kind: 'expense', name: 'Lunch', amount: 42, txnDate: '2026-05-16', year: 2026, month: 4, isFixed: false }),
    })).json()
    await api(`/api/transactions/${created.id}`, {
      method: 'PATCH', headers: auth(token, { 'If-Match': created.updatedAt }),
      body: JSON.stringify({ name: 'Dinner', amount: 100 }),
    })

    const [logRow] = await sql`
      SELECT id FROM action_log
      WHERE household_id = ${householdId} AND operation = 'UPDATE' AND resource_id = ${created.id}
    `
    const undoRes = await api(`/api/action-log/${logRow.id}/undo`, { method: 'POST', headers: auth(token) })
    expect(undoRes.status).toBe(200)

    // Sprawdź że wartości w GET /api/finance wracają do oryginału
    const fin = await (await api('/api/finance', { method: 'GET', headers: auth(token) })).json()
    const allExpenses = Object.values(fin.data.months).flatMap(m => m.expenses)
    const restored = allExpenses.find(x => x.id === created.id)
    expect(restored.name).toBe('Lunch')
    expect(restored.amount).toBe(42)
  })

  it('cofa DELETE: tworzy rekord ponownie z tym samym id', async () => {
    const { token, householdId } = await setupOwner()
    const created = await (await api('/api/transactions', {
      method: 'POST', headers: auth(token),
      body: JSON.stringify({ kind: 'expense', name: 'Coffee', amount: 15, txnDate: '2026-05-16', year: 2026, month: 4, isFixed: false }),
    })).json()
    await api(`/api/transactions/${created.id}`, {
      method: 'DELETE', headers: { cookie: `token=${token}`, 'If-Match': created.updatedAt },
    })

    const [logRow] = await sql`
      SELECT id FROM action_log
      WHERE household_id = ${householdId} AND operation = 'DELETE' AND resource_id = ${created.id}
    `
    const undoRes = await api(`/api/action-log/${logRow.id}/undo`, { method: 'POST', headers: auth(token) })
    expect(undoRes.status).toBe(200)

    // Rekord wrócił do bazy, z tym samym id
    const [back] = await sql`SELECT id FROM transactions WHERE id = ${created.id}`
    expect(back).toBeTruthy()
  })

  it('idempotentne: drugie undo na już cofnięty wpis zwraca 200 z notyfikacją', async () => {
    const { token, householdId } = await setupOwner()
    const created = await (await api('/api/transactions', {
      method: 'POST', headers: auth(token),
      body: JSON.stringify({ kind: 'expense', name: 'X', amount: 1, txnDate: '2026-05-16', year: 2026, month: 4, isFixed: false }),
    })).json()
    const [logRow] = await sql`
      SELECT id FROM action_log WHERE household_id = ${householdId} AND operation = 'CREATE' AND resource_id = ${created.id}
    `
    const first = await api(`/api/action-log/${logRow.id}/undo`, { method: 'POST', headers: auth(token) })
    expect(first.status).toBe(200)

    const second = await api(`/api/action-log/${logRow.id}/undo`, { method: 'POST', headers: auth(token) })
    expect(second.status).toBe(200)
    const body = await second.json()
    expect(body.alreadyUndone).toBe(true)
  })

  it('403: member nie może cofnąć cudzego wpisu (ownera)', async () => {
    const owner = await setupOwner('-o')
    const member = await joinAsMember(owner.householdId, '-m')

    // Wpis stworzony przez ownera
    const created = await (await api('/api/transactions', {
      method: 'POST', headers: auth(owner.token),
      body: JSON.stringify({ kind: 'expense', name: 'OwnerExp', amount: 50, txnDate: '2026-05-16', year: 2026, month: 4, isFixed: false }),
    })).json()
    const [logRow] = await sql`
      SELECT id FROM action_log WHERE household_id = ${owner.householdId} AND operation = 'CREATE' AND resource_id = ${created.id}
    `
    const res = await api(`/api/action-log/${logRow.id}/undo`, { method: 'POST', headers: auth(member.token) })
    expect(res.status).toBe(403)
  })

  it('owner może cofnąć cudzy wpis (member-a)', async () => {
    const owner = await setupOwner('-o2')
    const member = await joinAsMember(owner.householdId, '-m2')

    // Wpis stworzony przez membera
    const created = await (await api('/api/transactions', {
      method: 'POST', headers: auth(member.token),
      body: JSON.stringify({ kind: 'expense', name: 'MemberExp', amount: 20, txnDate: '2026-05-16', year: 2026, month: 4, isFixed: false }),
    })).json()
    const [logRow] = await sql`
      SELECT id FROM action_log WHERE household_id = ${owner.householdId} AND operation = 'CREATE' AND resource_id = ${created.id}
    `
    const res = await api(`/api/action-log/${logRow.id}/undo`, { method: 'POST', headers: auth(owner.token) })
    expect(res.status).toBe(200)
  })

  it('400 gdy wpis starszy niż 24h — okno cofania wygasło', async () => {
    const { token, householdId } = await setupOwner('-exp')
    const created = await (await api('/api/transactions', {
      method: 'POST', headers: auth(token),
      body: JSON.stringify({ kind: 'expense', name: 'Old', amount: 7, txnDate: '2026-05-16', year: 2026, month: 4, isFixed: false }),
    })).json()
    const [logRow] = await sql`
      SELECT id FROM action_log WHERE household_id = ${householdId} AND operation = 'CREATE' AND resource_id = ${created.id}
    `
    // Cofamy `at` 25h wstecz — udajemy że wpis ma więcej niż 24h
    await sql`UPDATE action_log SET at = NOW() - INTERVAL '25 hours' WHERE id = ${logRow.id}`

    const res = await api(`/api/action-log/${logRow.id}/undo`, { method: 'POST', headers: auth(token) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('undo_window_expired')

    // Zasób w bazie zostaje nietknięty
    const [stillThere] = await sql`SELECT 1 FROM transactions WHERE id = ${created.id}`
    expect(stillThere).toBeTruthy()
  })

  it('403: user z innego household nie widzi wpisu (404 by default ale 403 dopuszczamy)', async () => {
    const a = await setupOwner('-aa')
    const b = await setupOwner('-bb')
    const created = await (await api('/api/transactions', {
      method: 'POST', headers: auth(a.token),
      body: JSON.stringify({ kind: 'expense', name: 'X', amount: 1, txnDate: '2026-05-16', year: 2026, month: 4, isFixed: false }),
    })).json()
    const [logRow] = await sql`
      SELECT id FROM action_log WHERE household_id = ${a.householdId} AND operation = 'CREATE' AND resource_id = ${created.id}
    `
    const res = await api(`/api/action-log/${logRow.id}/undo`, { method: 'POST', headers: auth(b.token) })
    expect([403, 404]).toContain(res.status)
  })
})
