import { describe, it, expect, afterEach, vi } from 'vitest'

// Granica: HTTP Enable Banking. Mockujemy tylko wywołanie sieciowe —
// mapowanie/kategoryzacja/filtr zostają prawdziwe.
vi.mock('./enable-banking.js', async () => {
  const actual = await vi.importActual('./enable-banking.js')
  return { ...actual, fetchAccountTransactions: vi.fn() }
})

import { app, upsertUserAndHousehold } from './app.js'
import { fetchAccountTransactions, EbApiError } from './enable-banking.js'
import { syncBankConnection, syncBankConnections } from './bank-sync.js'
import { decodeFinanceDataKey, decryptField, encryptField } from './finance-crypto.js'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'

const sql = neon(process.env.DATABASE_URL)
const rawKey = decodeFinanceDataKey(process.env.FINANCE_DATA_KEY)
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'test-secret')
const env = { ENABLE_BANKING_APP_ID: 'test-app', ENABLE_BANKING_PRIVATE_KEY: 'test-pem' }

let createdUserIds = []
const uniq = () => Math.random().toString(36).slice(2, 10)

async function createUser(name = 'Jan Testowy') {
  const user = await upsertUserAndHousehold(sql, {
    sub: `g-bank-${uniq()}`, email: `bank-${uniq()}@test.com`, name,
  })
  createdUserIds.push(user.id)
  const [m] = await sql`SELECT household_id FROM household_members WHERE user_id = ${user.id}`
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(JWT_SECRET)
  return { user, householdId: m.household_id, token }
}

async function createConnection({ householdId, userId, aspsp = 'ING' }, accounts = [{ uid: `acc-${uniq()}`, displayName: 'Konto', maskedIban: 'PL61…2874', currency: 'PLN', lastBookedDate: null }]) {
  const sessionEnc = await encryptField('session-123', rawKey)
  const [row] = await sql`
    INSERT INTO bank_connections
      (household_id, user_id, aspsp_name, session_id_enc, accounts, status)
    VALUES (${householdId}, ${userId}, ${aspsp}, ${sessionEnc}, ${JSON.stringify(accounts)}::jsonb, 'active')
    RETURNING *
  `
  return row
}

async function insertFixedExpense({ householdId, name, amount, month, year = 2026 }) {
  const nameEnc = await encryptField(name, rawKey)
  const amountEnc = await encryptField(String(amount), rawKey)
  await sql`
    INSERT INTO transactions (household_id, kind, name, amount, txn_date, year, month, is_fixed)
    VALUES (${householdId}, 'expense', ${nameEnc}, ${amountEnc},
            ${`${year}-${String(month + 1).padStart(2, '0')}-01`}, ${year}, ${month}, true)
  `
}

const bookedTx = (over = {}) => ({
  status: 'BOOK',
  credit_debit_indicator: 'DBIT',
  transaction_amount: { amount: '50.00', currency: 'PLN' },
  booking_date: '2026-08-30',
  creditor: { name: 'ZABKA Z1234' },
  entry_reference: `ref-${uniq()}`,
  ...over,
})

afterEach(async () => {
  vi.mocked(fetchAccountTransactions).mockReset()
  if (createdUserIds.length) {
    await sql`DELETE FROM users WHERE id = ANY(${createdUserIds})`
    createdUserIds = []
  }
})

describe('syncBankConnection', () => {
  it('imports booked transactions as encrypted budget entries with category', async () => {
    const ctx = await createUser()
    // Budżet kategorii "Żywność" — auto-kategoryzacja ma go dopasować.
    await app.request('/api/category-budgets', {
      method: 'POST',
      headers: { cookie: `token=${ctx.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Żywność', limit: 1000 }),
    })
    const conn = await createConnection({ householdId: ctx.householdId, userId: ctx.user.id })
    vi.mocked(fetchAccountTransactions).mockResolvedValue({
      transactions: [
        bookedTx({ entry_reference: 'e1' }),
        bookedTx({
          entry_reference: 'e2',
          credit_debit_indicator: 'CRDT',
          transaction_amount: { amount: '8000.00', currency: 'PLN' },
          debtor: { name: 'AUDITMOS SP Z O O' },
          booking_date: '2026-08-28',
        }),
        bookedTx({ entry_reference: 'e3', status: 'PDNG' }), // pending — pomijany
      ],
      continuationKey: null,
    })

    const res = await syncBankConnection(sql, rawKey, env, conn)
    expect(res).toEqual({ imported: 2, skipped: 1, failed: 0 })

    const rows = await sql`
      SELECT kind, name, amount, txn_date, month, category, source, bank_txn_ref, created_by
      FROM transactions WHERE household_id = ${ctx.householdId} ORDER BY txn_date
    `
    expect(rows).toHaveLength(2)
    const [income, expense] = rows
    expect(income.kind).toBe('income')
    expect(await decryptField(income.name, rawKey)).toBe('AUDITMOS SP Z O O')
    expect(await decryptField(income.amount, rawKey)).toBe('8000')
    expect(expense.kind).toBe('expense')
    expect(expense.category).toBe('Żywność')
    expect(expense.source).toBe('bank')
    expect(expense.name.startsWith('ff1:')).toBe(true)
    expect(expense.created_by).toBe(ctx.user.id)

    // Watermark przesunięty na najnowszą zaksięgowaną datę.
    const [after] = await sql`SELECT accounts, last_sync_at FROM bank_connections WHERE id = ${conn.id}`
    expect(after.accounts[0].lastBookedDate).toBe('2026-08-30')
    expect(after.last_sync_at).not.toBe(null)
  })

  it('is idempotent — second run over the same window imports nothing', async () => {
    const ctx = await createUser()
    const conn = await createConnection({ householdId: ctx.householdId, userId: ctx.user.id })
    const page = { transactions: [bookedTx({ entry_reference: 'dup-1' })], continuationKey: null }
    vi.mocked(fetchAccountTransactions).mockResolvedValue(page)

    const first = await syncBankConnection(sql, rawKey, env, conn)
    const [reloaded] = await sql`SELECT * FROM bank_connections WHERE id = ${conn.id}`
    const second = await syncBankConnection(sql, rawKey, env, reloaded)

    expect(first.imported).toBe(1)
    expect(second).toEqual({ imported: 0, skipped: 1, failed: 0 })
    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM transactions WHERE household_id = ${ctx.householdId}
    `
    expect(count).toBe(1)
  })

  it('skips transfers between own accounts (full-name match)', async () => {
    const ctx = await createUser('Jan Testowy')
    const conn = await createConnection({ householdId: ctx.householdId, userId: ctx.user.id })
    vi.mocked(fetchAccountTransactions).mockResolvedValue({
      transactions: [
        bookedTx({ entry_reference: 'own-1', creditor: { name: 'JAN TESTOWY' } }),
        bookedTx({ entry_reference: 'other-1', creditor: { name: 'Anna Testowa' } }),
      ],
      continuationKey: null,
    })

    const res = await syncBankConnection(sql, rawKey, env, conn)
    expect(res.imported).toBe(1)
    const rows = await sql`SELECT name FROM transactions WHERE household_id = ${ctx.householdId}`
    expect(await decryptField(rows[0].name, rawKey)).toBe('Anna Testowa')
  })

  it('skips bank entries covered by a fixed item, honoring month propagation and deletions', async () => {
    const ctx = await createUser()
    const conn = await createConnection({ householdId: ctx.householdId, userId: ctx.user.id })
    // Pozycja stała tylko w czerwcu (miesiąc 5) — sierpień (7) ma ją widzieć
    // przez propagację, dokładnie jak frontend.
    await insertFixedExpense({ householdId: ctx.householdId, name: 'Google Workspace', amount: 61, month: 5 })
    vi.mocked(fetchAccountTransactions).mockResolvedValue({
      transactions: [
        bookedTx({ entry_reference: 'gw-1', creditor: { name: 'GOOGLE *WORKSPACE' }, transaction_amount: { amount: '61.38', currency: 'PLN' } }),
        bookedTx({ entry_reference: 'zk-1' }), // Żabka 50 zł — zwykły wydatek, wchodzi
      ],
      continuationKey: null,
    })

    const res = await syncBankConnection(sql, rawKey, env, conn)
    expect(res).toEqual({ imported: 1, skipped: 1, failed: 0 })
    const rows = await sql`
      SELECT name FROM transactions
      WHERE household_id = ${ctx.householdId} AND source = 'bank'
    `
    expect(rows).toHaveLength(1)
    expect(await decryptField(rows[0].name, rawKey)).toBe('ZABKA Z1234')

    // Usunięcie stałej w sierpniu (deleted_fixed_items) wyłącza pokrycie —
    // kolejne obciążenie Workspace ma się zaimportować.
    await sql`
      INSERT INTO deleted_fixed_items (household_id, year, month, kind, name)
      VALUES (${ctx.householdId}, 2026, 7, 'expense', 'Google Workspace')
    `
    const [reloaded] = await sql`SELECT * FROM bank_connections WHERE id = ${conn.id}`
    vi.mocked(fetchAccountTransactions).mockResolvedValue({
      transactions: [
        bookedTx({ entry_reference: 'gw-2', creditor: { name: 'GOOGLE *WORKSPACE' }, transaction_amount: { amount: '61.38', currency: 'PLN' } }),
      ],
      continuationKey: null,
    })
    const second = await syncBankConnection(sql, rawKey, env, reloaded)
    expect(second.imported).toBe(1)
  })

  it('keeps watermarks of healthy accounts when another account fails (429)', async () => {
    const ctx = await createUser()
    const okUid = `acc-ok-${uniq()}`
    const badUid = `acc-bad-${uniq()}`
    const conn = await createConnection({ householdId: ctx.householdId, userId: ctx.user.id }, [
      { uid: okUid, displayName: 'Konto', maskedIban: 'PL61…2874', currency: 'PLN', lastBookedDate: null },
      { uid: badUid, displayName: 'Oszczędnościowe', maskedIban: 'PL61…9999', currency: 'PLN', lastBookedDate: null },
    ])
    vi.mocked(fetchAccountTransactions).mockImplementation(async (_env, uid) => {
      if (uid === badUid) {
        throw new EbApiError(429, { error: 'ASPSP_RATE_LIMIT_EXCEEDED' }, `/accounts/${uid}/transactions`)
      }
      return { transactions: [bookedTx({ entry_reference: 'ok-1' })], continuationKey: null }
    })

    const res = await syncBankConnection(sql, rawKey, env, conn)
    expect(res).toEqual({ imported: 1, skipped: 0, failed: 1 })

    const [after] = await sql`
      SELECT accounts, status, last_sync_at, last_sync_error
      FROM bank_connections WHERE id = ${conn.id}
    `
    // Udane konto zachowuje watermark, wadliwe nie; 429 nie wygasza połączenia.
    expect(after.accounts.find((a) => a.uid === okUid).lastBookedDate).toBe('2026-08-30')
    expect(after.accounts.find((a) => a.uid === badUid).lastBookedDate).toBe(null)
    expect(after.status).toBe('active')
    expect(after.last_sync_at).toBe(null)
    expect(after.last_sync_error).toContain('EB 429')
  })

  it('marks the connection expired on EB 401 and records the error', async () => {
    const ctx = await createUser()
    const conn = await createConnection({ householdId: ctx.householdId, userId: ctx.user.id })
    vi.mocked(fetchAccountTransactions).mockRejectedValue(
      new EbApiError(401, { message: 'session expired' }, '/accounts/x/transactions'),
    )

    const res = await syncBankConnection(sql, rawKey, env, conn)
    expect(res.failed).toBe(1)
    const [after] = await sql`SELECT status, last_sync_error FROM bank_connections WHERE id = ${conn.id}`
    expect(after.status).toBe('expired')
    expect(after.last_sync_error).toContain('EB 401')
  })

  it('first sync starts at the connection creation date, and overlap never goes below it', async () => {
    const ctx = await createUser()
    const conn = await createConnection({ householdId: ctx.householdId, userId: ctx.user.id })
    const createdDate = new Date(conn.created_at).toISOString().slice(0, 10)
    vi.mocked(fetchAccountTransactions).mockResolvedValue({ transactions: [], continuationKey: null })

    // Pierwszy sync — od dnia utworzenia połączenia, nie 30 dni wstecz.
    await syncBankConnection(sql, rawKey, env, conn)
    expect(vi.mocked(fetchAccountTransactions).mock.calls[0][2].dateFrom).toBe(createdDate)

    // lastBookedDate tuż po utworzeniu → overlap −4 dni obcięty do podłogi.
    const [reloaded] = await sql`SELECT * FROM bank_connections WHERE id = ${conn.id}`
    reloaded.accounts[0].lastBookedDate = createdDate
    await syncBankConnection(sql, rawKey, env, reloaded)
    expect(vi.mocked(fetchAccountTransactions).mock.calls[1][2].dateFrom).toBe(createdDate)
  })

  it('follows continuation pages', async () => {
    const ctx = await createUser()
    const conn = await createConnection({ householdId: ctx.householdId, userId: ctx.user.id })
    vi.mocked(fetchAccountTransactions)
      .mockResolvedValueOnce({ transactions: [bookedTx({ entry_reference: 'p1' })], continuationKey: 'next' })
      .mockResolvedValueOnce({ transactions: [bookedTx({ entry_reference: 'p2' })], continuationKey: null })

    const res = await syncBankConnection(sql, rawKey, env, conn)
    expect(res.imported).toBe(2)
    expect(vi.mocked(fetchAccountTransactions)).toHaveBeenCalledTimes(2)
    expect(vi.mocked(fetchAccountTransactions).mock.calls[1][2].continuationKey).toBe('next')
  })
})

describe('bank HTTP endpoints', () => {
  it('GET /api/bank/status lists household connections without secrets', async () => {
    const ctx = await createUser()
    await createConnection({ householdId: ctx.householdId, userId: ctx.user.id })

    const res = await app.request('/api/bank/status', {
      headers: { cookie: `token=${ctx.token}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.connections).toHaveLength(1)
    const conn = body.connections[0]
    expect(conn.aspspName).toBe('ING')
    expect(conn.isMine).toBe(true)
    expect(conn.accounts[0].maskedIban).toBe('PL61…2874')
    expect(JSON.stringify(body)).not.toContain('session')
  })

  it('POST /api/bank/sync syncs only the caller household', async () => {
    const ctx = await createUser()
    const other = await createUser()
    await createConnection({ householdId: ctx.householdId, userId: ctx.user.id })
    await createConnection({ householdId: other.householdId, userId: other.user.id })
    vi.mocked(fetchAccountTransactions).mockResolvedValue({
      transactions: [bookedTx()], continuationKey: null,
    })

    const res = await app.request('/api/bank/sync', {
      method: 'POST',
      headers: { cookie: `token=${ctx.token}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ connections: 1, imported: 1, skipped: 0, failed: 0 })
    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM transactions WHERE household_id = ${other.householdId}
    `
    expect(count).toBe(0)
  })

  it('DELETE /api/bank/connections/:id — linking user may, stranger may not', async () => {
    const ctx = await createUser()
    const stranger = await createUser()
    const conn = await createConnection({ householdId: ctx.householdId, userId: ctx.user.id })

    const forbidden = await app.request(`/api/bank/connections/${conn.id}`, {
      method: 'DELETE', headers: { cookie: `token=${stranger.token}` },
    })
    expect(forbidden.status).toBe(404) // inne gospodarstwo — nie widzi połączenia

    const ok = await app.request(`/api/bank/connections/${conn.id}`, {
      method: 'DELETE', headers: { cookie: `token=${ctx.token}` },
    })
    expect(ok.status).toBe(204)
    const rows = await sql`SELECT id FROM bank_connections WHERE id = ${conn.id}`
    expect(rows).toHaveLength(0)
  })
})

describe('syncBankConnections (cron)', () => {
  it('aggregates over all active connections and skips expired ones', async () => {
    const ctx = await createUser()
    await createConnection({ householdId: ctx.householdId, userId: ctx.user.id })
    const expired = await createConnection({ householdId: ctx.householdId, userId: ctx.user.id, aspsp: 'mBank' })
    await sql`UPDATE bank_connections SET status = 'expired' WHERE id = ${expired.id}`
    vi.mocked(fetchAccountTransactions).mockResolvedValue({
      transactions: [bookedTx()], continuationKey: null,
    })

    const totals = await syncBankConnections(sql, rawKey, env, { householdId: ctx.householdId })
    expect(totals.connections).toBe(1)
    expect(totals.imported).toBe(1)
  })
})
