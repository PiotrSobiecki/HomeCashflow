/**
 * Weryfikacja migracji 002 — porównuje stan z JSON-a (finance_data.data) ze stanem
 * w tabelach relacyjnych (odszyfrowanym przez readFinanceFromRelational).
 *
 *   node scripts/verify-migration-002.js
 *   node scripts/verify-migration-002.js --production
 *
 * Exit code 0 = wszystko się zgadza. 2 = znaleziono rozbieżności.
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { neon } from '@neondatabase/serverless'
import { decodeFinanceDataKey, parseStoredFinanceData } from '../src/finance-crypto.js'
import { readFinanceFromRelational } from '../src/finance-relational.js'

const serverDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(serverDir, '..')
const args = process.argv.slice(2)
const useProduction = args.includes('--production')

if (useProduction) {
  dotenv.config({ path: join(serverDir, '.env.production') })
  dotenv.config({ path: join(root, '.env.production') })
} else {
  dotenv.config({ path: join(root, '.env.local') })
  dotenv.config({ path: join(root, '.env') })
  dotenv.config({ path: join(serverDir, '.env') })
}

const sql = neon(process.env.DATABASE_URL)
const rawKey = decodeFinanceDataKey(process.env.FINANCE_DATA_KEY)

function sumArr(arr, key = 'amount') {
  return arr.reduce((s, x) => s + (Number(x?.[key]) || 0), 0)
}

function summarize(data) {
  const months = data?.months ?? {}
  let income = 0, expense = 0, count = 0
  for (let m = 0; m < 12; m++) {
    const md = months[m] ?? months[String(m)]
    if (!md) continue
    income += sumArr(md.incomes ?? [])
    expense += sumArr(md.expenses ?? [])
    count += (md.incomes?.length ?? 0) + (md.expenses?.length ?? 0)
  }
  return {
    income,
    expense,
    txnCount: count,
    savings: sumArr(data?.savingsAccounts ?? []),
    categories: (data?.categoryBudgets ?? []).length,
  }
}

function approxEq(a, b) {
  return Math.abs(Number(a) - Number(b)) < 0.005
}

const rows = await sql('SELECT household_id AS id, data FROM finance_data', [])
let mismatches = 0

for (const row of rows) {
  const jsonData = await parseStoredFinanceData(row.data, rawKey)
  const dbData = await readFinanceFromRelational(sql, row.id, rawKey)

  const j = summarize(jsonData)
  const d = summarize(dbData)

  const problems = []
  if (!approxEq(j.income, d.income)) problems.push(`income ${j.income} vs ${d.income}`)
  if (!approxEq(j.expense, d.expense)) problems.push(`expense ${j.expense} vs ${d.expense}`)
  if (j.txnCount !== d.txnCount) problems.push(`txn count ${j.txnCount} vs ${d.txnCount}`)
  if (!approxEq(j.savings, d.savings)) problems.push(`savings ${j.savings} vs ${d.savings}`)
  if (j.categories !== d.categories) problems.push(`categories ${j.categories} vs ${d.categories}`)

  if (problems.length) {
    mismatches++
    console.log(`✗ ${row.id}: ${problems.join('; ')}`)
  } else {
    console.log(`✓ ${row.id}: income=${j.income} expense=${j.expense} txns=${j.txnCount} savings=${j.savings} cats=${j.categories}`)
  }
}

console.log(`\nGotowe. Rozbieżności: ${mismatches}/${rows.length}`)
if (mismatches > 0) process.exit(2)
