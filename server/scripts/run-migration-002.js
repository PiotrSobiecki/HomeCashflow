/**
 * Migracja 002: rozbicie finance_data JSON → tabele relacyjne.
 *
 *   node scripts/run-migration-002.js              # dev (DATABASE_URL z .env)
 *   node scripts/run-migration-002.js --production # tylko server/.env.production
 *   node scripts/run-migration-002.js --dry-run    # tylko parse + raport, bez zapisu
 *   node scripts/run-migration-002.js --household <uuid>  # tylko jeden household
 *
 * Idempotentny: dla każdego household kasuje swoje wiersze i wstawia od nowa.
 * Stara kolumna finance_data.data NIE jest ruszana.
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { neon } from '@neondatabase/serverless'
import {
  decodeFinanceDataKey,
  parseStoredFinanceData,
} from '../src/finance-crypto.js'
import { writeFinanceToRelational } from '../src/finance-relational.js'

const serverDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const root = join(serverDir, '..')
const args = process.argv.slice(2)
const useProduction = args.includes('--production')
const dryRun = args.includes('--dry-run')
const householdArgIdx = args.indexOf('--household')
const onlyHousehold = householdArgIdx !== -1 ? args[householdArgIdx + 1] : null

if (useProduction) {
  // Najpierw server/.env.production (jeśli istnieje), potem root .env.production jako fallback dla brakujących kluczy.
  // Wczytanie obu plików daje elastyczność: można trzymać DATABASE_URL w server/, a resztę w root.
  const serverProdPath = join(serverDir, '.env.production')
  const rootProdPath = join(root, '.env.production')
  dotenv.config({ path: serverProdPath })
  dotenv.config({ path: rootProdPath })
  if (!process.env.DATABASE_URL || !process.env.FINANCE_DATA_KEY) {
    console.error(
      `Brak DATABASE_URL lub FINANCE_DATA_KEY. Sprawdzone pliki:\n  - ${serverProdPath}\n  - ${rootProdPath}`,
    )
    process.exit(1)
  }
} else {
  dotenv.config({ path: join(root, '.env.local') })
  dotenv.config({ path: join(root, '.env') })
  dotenv.config({ path: join(serverDir, '.env') })
}

const DATABASE_URL = process.env.DATABASE_URL?.trim()
if (!/^postgres(ql)?:\/\//i.test(DATABASE_URL || '')) {
  console.error('Brakuje poprawnego DATABASE_URL.')
  process.exit(1)
}

const rawKey = decodeFinanceDataKey(process.env.FINANCE_DATA_KEY)
if (!rawKey) {
  console.error('Brakuje/niepoprawny FINANCE_DATA_KEY (potrzebny do dekrypcji).')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function migrateHousehold(row) {
  const { id: householdId, data: encrypted, updated_at: sourceUpdatedAt } = row
  let parsed
  try {
    parsed = await parseStoredFinanceData(encrypted, rawKey)
  } catch (err) {
    console.error(`  ✗ ${householdId}: błąd dekrypcji — ${err.message}`)
    return { ok: false }
  }

  if (dryRun) {
    const report = {
      household_id: householdId,
      months_with_data: Object.keys(parsed?.months ?? {}).length,
      savings_count: (parsed?.savingsAccounts ?? []).length,
      category_count: (parsed?.categoryBudgets ?? []).length,
      activity_count: (parsed?.activityLog ?? []).length,
    }
    console.log(`  · ${householdId} [dry-run]`, report)
    return { ok: true }
  }

  // Wspolny path z runtime'em: ten sam kod ktory backend wola na PUT /api/finance.
  const report = await writeFinanceToRelational(sql, householdId, parsed, rawKey)

  await sql`
    INSERT INTO finance_data_migration
      (household_id, source_updated_at, txn_count, savings_count, category_count, activity_count)
    VALUES
      (${householdId}, ${sourceUpdatedAt}, ${report.txn_count}, ${report.savings_count},
       ${report.category_count}, ${report.activity_count})
    ON CONFLICT (household_id) DO UPDATE SET
      migrated_at = NOW(),
      source_updated_at = EXCLUDED.source_updated_at,
      txn_count = EXCLUDED.txn_count,
      savings_count = EXCLUDED.savings_count,
      category_count = EXCLUDED.category_count,
      activity_count = EXCLUDED.activity_count
  `

  console.log(`  ✓ ${householdId}`, report)
  return { ok: true, report }
}

async function main() {
  console.log(`Migracja 002 — ${useProduction ? 'PRODUKCJA' : 'dev'}${dryRun ? ' [DRY-RUN]' : ''}`)

  const rows = onlyHousehold
    ? await sql('SELECT household_id AS id, data, updated_at FROM finance_data WHERE household_id = $1', [onlyHousehold])
    : await sql('SELECT household_id AS id, data, updated_at FROM finance_data', [])

  console.log(`Znaleziono ${rows.length} household(s) z danymi finansowymi.`)
  let ok = 0
  let failed = 0
  for (const row of rows) {
    const res = await migrateHousehold(row)
    if (res.ok) ok++
    else failed++
  }
  console.log(`Gotowe: ok=${ok} failed=${failed} ${dryRun ? '(dry-run, nic nie zapisano)' : ''}`)
  if (failed > 0) process.exit(2)
}

main().catch(err => {
  console.error('Błąd krytyczny:', err)
  process.exit(1)
})
