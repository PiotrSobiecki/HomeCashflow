/**
 * Czytanie i zapis danych finansowych z/do tabel relacyjnych.
 * Sensytywne pola (nazwy, kwoty) sa szyfrowane (AES-GCM, ten sam klucz co historyczny JSON).
 * Pola sluzace do filtrowania/grupowania (household_id, kind, year, month, is_fixed,
 * category, daty) sa plaintext — pozwala to robic queries po SQL.
 *
 * Strategia zapisu: DELETE all + INSERT all dla danego household w jednej transakcji.
 * Idempotentne, atomowe, proste.
 */
import { encryptField, decryptField } from './finance-crypto.js'

const CURRENT_YEAR = 2026
const ACTIVITY_LOG_MAX = 150

function emptyMonth() {
  return { incomes: [], expenses: [], deletedFixed: { incomes: [], expenses: [] } }
}

function pickDate(item, year, month) {
  if (typeof item?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
    return item.date
  }
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}

/**
 * Skladowa odpowiedz `finance_data` (taka jaka jest dzis w GET /api/finance) z tabel.
 */
export async function readFinanceFromRelational(sql, householdId, rawKey) {
  const [txns, deleted, savings, categories, goalRows, activity] = await Promise.all([
    sql`SELECT id, kind, name, amount, txn_date, year, month, is_fixed, category, updated_at
        FROM transactions WHERE household_id = ${householdId}
        ORDER BY year, month, txn_date`,
    sql`SELECT year, month, kind, name FROM deleted_fixed_items WHERE household_id = ${householdId}`,
    sql`SELECT id, name, amount, icon FROM savings_accounts WHERE household_id = ${householdId} ORDER BY created_at`,
    sql`SELECT id, name, monthly_limit FROM category_budgets WHERE household_id = ${householdId} ORDER BY created_at`,
    sql`SELECT type, monthly_amount, yearly_amount, target_month FROM savings_goals WHERE household_id = ${householdId}`,
    sql`SELECT id, user_id, user_name, at, action, kind, label, amount, month
        FROM activity_log WHERE household_id = ${householdId}
        ORDER BY at DESC LIMIT ${ACTIVITY_LOG_MAX}`,
  ])

  const months = {}
  for (let m = 0; m < 12; m++) months[m] = emptyMonth()

  for (const t of txns) {
    const name = await decryptField(t.name, rawKey)
    const amountStr = await decryptField(t.amount, rawKey)
    const amount = amountStr == null ? 0 : Number(amountStr)
    const item = {
      id: t.id,
      name: name ?? '',
      amount: Number.isFinite(amount) ? amount : 0,
      isFixed: t.is_fixed,
      date: t.txn_date,
      updatedAt: t.updated_at instanceof Date ? t.updated_at.toISOString() : String(t.updated_at),
    }
    if (t.kind === 'expense' && !t.is_fixed && t.category) {
      item.category = t.category
    }
    const monthBucket = months[t.month] ?? (months[t.month] = emptyMonth())
    if (t.kind === 'income') monthBucket.incomes.push(item)
    else monthBucket.expenses.push(item)
  }

  for (const d of deleted) {
    const bucket = months[d.month] ?? (months[d.month] = emptyMonth())
    if (d.kind === 'income') bucket.deletedFixed.incomes.push(d.name)
    else bucket.deletedFixed.expenses.push(d.name)
  }

  const savingsAccounts = []
  for (const s of savings) {
    const name = await decryptField(s.name, rawKey)
    const amountStr = await decryptField(s.amount, rawKey)
    savingsAccounts.push({
      id: s.id,
      name: name ?? '',
      amount: amountStr == null ? 0 : Number(amountStr) || 0,
      icon: s.icon ?? 'bank',
    })
  }

  const categoryBudgets = []
  for (const c of categories) {
    const name = await decryptField(c.name, rawKey)
    const limitStr = await decryptField(c.monthly_limit, rawKey)
    categoryBudgets.push({
      id: c.id,
      name: name ?? '',
      limit: limitStr == null ? 0 : Number(limitStr) || 0,
    })
  }

  let savingsGoal = { type: 'none', monthlyAmount: 0, yearlyAmount: 0, targetMonth: 11 }
  if (goalRows[0]) {
    const g = goalRows[0]
    const monthlyAmount = await decryptField(g.monthly_amount, rawKey)
    const yearlyAmount = await decryptField(g.yearly_amount, rawKey)
    savingsGoal = {
      type: g.type,
      monthlyAmount: monthlyAmount == null ? 0 : Number(monthlyAmount) || 0,
      yearlyAmount: yearlyAmount == null ? 0 : Number(yearlyAmount) || 0,
      targetMonth: g.target_month,
    }
  }

  const activityLog = []
  for (const a of activity) {
    const label = await decryptField(a.label, rawKey)
    const amountStr = await decryptField(a.amount, rawKey)
    const userName = await decryptField(a.user_name, rawKey)
    activityLog.push({
      id: a.id,
      at: a.at instanceof Date ? a.at.toISOString() : a.at,
      userId: a.user_id,
      userName: userName ?? '',
      action: a.action,
      kind: a.kind ?? undefined,
      ...(label != null ? { label } : {}),
      ...(amountStr != null ? { amount: Number(amountStr) || 0 } : {}),
      ...(a.month != null ? { month: a.month } : {}),
    })
  }
  // Frontend oczekuje rosnaco po dacie (sortowanie i tak robi po stronie klienta, ale konsystencja)
  activityLog.reverse()

  return { months, savingsGoal, savingsAccounts, categoryBudgets, activityLog }
}

/**
 * Rozkladamy obiekt finance i nadpisujemy stan tabel dla danego household.
 * Atomowo w jednej transakcji.
 *
 * Opcje:
 *   skipTransactions — nie rusza tabel `transactions` i `deleted_fixed_items`.
 *     Używane przez stary PUT /api/finance po Phase 1: transakcje są zarządzane
 *     przez per-row endpointy, więc PUT (który ratuje oszczędności/kategorie/goal/
 *     activity_log) musi je zostawić w spokoju.
 */
export async function writeFinanceToRelational(sql, householdId, data, rawKey, options = {}) {
  const skipTransactions = options.skipTransactions === true
  const months = data?.months ?? {}
  const savingsAccounts = Array.isArray(data?.savingsAccounts) ? data.savingsAccounts : []
  const categoryBudgets = Array.isArray(data?.categoryBudgets) ? data.categoryBudgets : []
  const activityLog = Array.isArray(data?.activityLog)
    ? data.activityLog.slice(-ACTIVITY_LOG_MAX)
    : []
  const savingsGoal = data?.savingsGoal ?? null

  // Pre-encrypt wszystko zanim wbijemy w transakcje (zeby crypto.subtle nie blokowal w srodku batcha)
  const txnInserts = []
  const deletedFixedInserts = []
  for (let m = 0; m < 12; m++) {
    const md = months[m] ?? months[String(m)]
    if (!md) continue
    for (const inc of md.incomes ?? []) {
      txnInserts.push({
        kind: 'income',
        nameEnc: await encryptField(inc.name, rawKey),
        amountEnc: await encryptField(inc.amount, rawKey),
        txn_date: pickDate(inc, CURRENT_YEAR, m),
        year: CURRENT_YEAR,
        month: m,
        is_fixed: !!inc.isFixed,
        category: null,
        legacy_id: inc.id != null ? String(inc.id) : null,
      })
    }
    for (const exp of md.expenses ?? []) {
      txnInserts.push({
        kind: 'expense',
        nameEnc: await encryptField(exp.name, rawKey),
        amountEnc: await encryptField(exp.amount, rawKey),
        txn_date: pickDate(exp, CURRENT_YEAR, m),
        year: CURRENT_YEAR,
        month: m,
        is_fixed: !!exp.isFixed,
        category: exp.isFixed ? null : (exp.category ?? null),
        legacy_id: exp.id != null ? String(exp.id) : null,
      })
    }
    const df = md.deletedFixed ?? {}
    for (const name of df.incomes ?? []) {
      deletedFixedInserts.push({ year: CURRENT_YEAR, month: m, kind: 'income', name })
    }
    for (const name of df.expenses ?? []) {
      deletedFixedInserts.push({ year: CURRENT_YEAR, month: m, kind: 'expense', name })
    }
  }

  const savingsInserts = []
  for (const s of savingsAccounts) {
    savingsInserts.push({
      nameEnc: await encryptField(s.name, rawKey),
      amountEnc: await encryptField(s.amount, rawKey),
      icon: s.icon ?? null,
      legacy_id: s.id != null ? String(s.id) : null,
    })
  }

  const categoryInserts = []
  for (const c of categoryBudgets) {
    categoryInserts.push({
      nameEnc: await encryptField(c.name, rawKey),
      limitEnc: await encryptField(c.limit, rawKey),
      legacy_id: c.id != null ? String(c.id) : null,
    })
  }

  const activityInserts = []
  for (const a of activityLog) {
    activityInserts.push({
      user_id: a.userId ?? null,
      userNameEnc: await encryptField(a.userName, rawKey),
      at: a.at ? new Date(a.at).toISOString() : new Date().toISOString(),
      action: a.action ?? 'unknown',
      kind: a.kind ?? null,
      labelEnc: await encryptField(a.label, rawKey),
      amountEnc: await encryptField(a.amount, rawKey),
      month: Number.isInteger(a.month) ? a.month : null,
      legacy_id: a.id != null ? String(a.id) : null,
    })
  }

  let goalInsert = null
  if (savingsGoal && savingsGoal.type) {
    goalInsert = {
      type: savingsGoal.type,
      monthlyEnc: await encryptField(savingsGoal.monthlyAmount, rawKey),
      yearlyEnc: await encryptField(savingsGoal.yearlyAmount, rawKey),
      target_month: Number.isInteger(savingsGoal.targetMonth) ? savingsGoal.targetMonth : 11,
    }
  }

  // Buduj liste queries do transakcji.
  const queries = [
    sql`DELETE FROM savings_accounts WHERE household_id = ${householdId}`,
    sql`DELETE FROM category_budgets WHERE household_id = ${householdId}`,
    sql`DELETE FROM savings_goals WHERE household_id = ${householdId}`,
    sql`DELETE FROM activity_log WHERE household_id = ${householdId}`,
  ]

  if (!skipTransactions) {
    queries.unshift(
      sql`DELETE FROM transactions WHERE household_id = ${householdId}`,
      sql`DELETE FROM deleted_fixed_items WHERE household_id = ${householdId}`,
    )
    for (const t of txnInserts) {
      queries.push(sql`
        INSERT INTO transactions
          (household_id, kind, name, amount, txn_date, year, month, is_fixed, category, legacy_id)
        VALUES
          (${householdId}, ${t.kind}, ${t.nameEnc}, ${t.amountEnc}, ${t.txn_date},
           ${t.year}, ${t.month}, ${t.is_fixed}, ${t.category}, ${t.legacy_id})
      `)
    }
    for (const d of deletedFixedInserts) {
      queries.push(sql`
        INSERT INTO deleted_fixed_items (household_id, year, month, kind, name)
        VALUES (${householdId}, ${d.year}, ${d.month}, ${d.kind}, ${d.name})
        ON CONFLICT DO NOTHING
      `)
    }
  }
  for (const s of savingsInserts) {
    queries.push(sql`
      INSERT INTO savings_accounts (household_id, name, amount, icon, legacy_id)
      VALUES (${householdId}, ${s.nameEnc}, ${s.amountEnc}, ${s.icon}, ${s.legacy_id})
    `)
  }
  for (const c of categoryInserts) {
    queries.push(sql`
      INSERT INTO category_budgets (household_id, name, monthly_limit, legacy_id)
      VALUES (${householdId}, ${c.nameEnc}, ${c.limitEnc}, ${c.legacy_id})
    `)
  }
  if (goalInsert) {
    queries.push(sql`
      INSERT INTO savings_goals (household_id, type, monthly_amount, yearly_amount, target_month)
      VALUES (${householdId}, ${goalInsert.type}, ${goalInsert.monthlyEnc},
              ${goalInsert.yearlyEnc}, ${goalInsert.target_month})
    `)
  }
  for (const a of activityInserts) {
    queries.push(sql`
      INSERT INTO activity_log
        (household_id, user_id, user_name, at, action, kind, label, amount, month, legacy_id)
      VALUES
        (${householdId}, ${a.user_id}, ${a.userNameEnc}, ${a.at}, ${a.action},
         ${a.kind}, ${a.labelEnc}, ${a.amountEnc}, ${a.month}, ${a.legacy_id})
    `)
  }

  await sql.transaction(queries)

  return {
    txn_count: txnInserts.length,
    deleted_fixed_count: deletedFixedInserts.length,
    savings_count: savingsInserts.length,
    category_count: categoryInserts.length,
    activity_count: activityInserts.length,
    has_goal: goalInsert != null,
  }
}
