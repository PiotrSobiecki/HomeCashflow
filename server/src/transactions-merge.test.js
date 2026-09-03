import { describe, it, expect, afterEach } from 'vitest'
import { app, upsertUserAndHousehold } from './app.js'
import { decodeFinanceDataKey, encryptField } from './finance-crypto.js'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'

const sql = neon(process.env.DATABASE_URL)
const rawKey = decodeFinanceDataKey(process.env.FINANCE_DATA_KEY)
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'test-secret')

let createdUserIds = []
const uniq = () => Math.random().toString(36).slice(2, 10)

async function createUser() {
  const user = await upsertUserAndHousehold(sql, {
    sub: `g-merge-${uniq()}`, email: `merge-${uniq()}@test.com`, name: 'Jan Testowy',
  })
  createdUserIds.push(user.id)
  const [m] = await sql`SELECT household_id FROM household_members WHERE user_id = ${user.id}`
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
  return { user, householdId: m.household_id, token }
}

async function insertTx({ householdId, userId, kind = 'expense', name, amount, isFixed = false, source = 'manual', bankTxnRef = null }) {
  const nameEnc = await encryptField(name, rawKey)
  const amountEnc = await encryptField(String(amount), rawKey)
  const [row] = await sql`
    INSERT INTO transactions
      (household_id, kind, name, amount, txn_date, year, month, is_fixed, created_by, source, bank_txn_ref)
    VALUES (${householdId}, ${kind}, ${nameEnc}, ${amountEnc}, '2026-09-02', 2026, 8, ${isFixed},
            ${userId}, ${source}, ${bankTxnRef})
    RETURNING id
  `
  return row.id
}

const merge = (token, id, fixedId) => app.request(`/api/transactions/${id}/merge-into-fixed`, {
  method: 'POST',
  headers: { cookie: `token=${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ fixedId }),
})

afterEach(async () => {
  if (createdUserIds.length) {
    await sql`DELETE FROM users WHERE id = ANY(${createdUserIds})`
    createdUserIds = []
  }
})

describe('POST /api/transactions/:id/merge-into-fixed', () => {
  it('removes the bank entry and hands its bank_txn_ref to the fixed item', async () => {
    const ctx = await createUser()
    const base = { householdId: ctx.householdId, userId: ctx.user.id }
    const fixedId = await insertTx({ ...base, name: 'Google Workspace', amount: 46.49, isFixed: true })
    const bankId = await insertTx({
      ...base, name: 'Płatność kartą 01.09.2026 Nr karty 5472xx7776', amount: 46.49,
      source: 'bank', bankTxnRef: `acc:${uniq()}`,
    })

    // GET /api/finance oznacza wpis z banku, żeby UI mógł zaproponować scalenie.
    const before = await (await app.request('/api/finance', { headers: { cookie: `token=${ctx.token}` } })).json()
    const sept = before.data.months[8].expenses
    expect(sept.find((e) => e.id === bankId).source).toBe('bank')
    expect(sept.find((e) => e.id === fixedId).source).toBeUndefined()

    const res = await merge(ctx.token, bankId, fixedId)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, fixedId })

    const rows = await sql`
      SELECT id, bank_txn_ref FROM transactions WHERE household_id = ${ctx.householdId}
    `
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(fixedId)
    expect(rows[0].bank_txn_ref).toMatch(/^acc:/)

    const [log] = await sql`
      SELECT operation, resource_id FROM action_log
      WHERE household_id = ${ctx.householdId} ORDER BY at DESC LIMIT 1
    `
    expect(log).toMatchObject({ operation: 'DELETE', resource_id: bankId })
  })

  it('rejects merging into a non-fixed item, a different kind, or a manual entry', async () => {
    const ctx = await createUser()
    const base = { householdId: ctx.householdId, userId: ctx.user.id }
    const bankId = await insertTx({ ...base, name: 'Płatność kartą', amount: 46.49, source: 'bank', bankTxnRef: `acc:${uniq()}` })
    const variableId = await insertTx({ ...base, name: 'Lunch', amount: 46.49 })
    const fixedIncomeId = await insertTx({ ...base, kind: 'income', name: 'Pensja', amount: 46.49, isFixed: true })
    const fixedExpenseId = await insertTx({ ...base, name: 'Abonament', amount: 46.49, isFixed: true })

    expect((await merge(ctx.token, bankId, variableId)).status).toBe(400)
    expect((await merge(ctx.token, bankId, fixedIncomeId)).status).toBe(400)
    expect((await merge(ctx.token, variableId, fixedExpenseId)).status).toBe(400)
    expect((await merge(ctx.token, bankId, 'not-a-uuid')).status).toBe(400)

    const rows = await sql`SELECT 1 FROM transactions WHERE household_id = ${ctx.householdId}`
    expect(rows).toHaveLength(4)
  })

  it('returns 404 for entries of another household', async () => {
    const mine = await createUser()
    const other = await createUser()
    const bankId = await insertTx({
      householdId: other.householdId, userId: other.user.id, name: 'Płatność kartą', amount: 10,
      source: 'bank', bankTxnRef: `acc:${uniq()}`,
    })
    const fixedId = await insertTx({ householdId: mine.householdId, userId: mine.user.id, name: 'X', amount: 10, isFixed: true })
    expect((await merge(mine.token, bankId, fixedId)).status).toBe(404)
  })
})
