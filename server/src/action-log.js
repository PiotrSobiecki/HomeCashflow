/**
 * Audit/undo log per household.
 *
 * Każda mutacja per-row (POST/PATCH/DELETE na transactions, savings_accounts,
 * category_budgets, savings_goals) wstawia jeden wpis przez `logAction`.
 * `before`/`after` to JSONB snapshoty z polami sensytywnymi przechowanymi w postaci
 * ciphertextu (ff1:…) — undo może je z powrotem zapisać bez deszyfrowania
 * w warstwie aplikacji (encrypt-once, decrypt na readzie).
 *
 * Rotacja: trzymamy tylko 20 najnowszych wpisów per household. Robimy to lazy
 * po każdym insercie (bez triggera) — prościej do testowania i nie wymaga
 * uprawnień do tworzenia funkcji w bazie.
 */

const MAX_ENTRIES_PER_HOUSEHOLD = 20

/**
 * Wstawia wpis do action_log i przycina log do 20 najnowszych per household.
 *
 * UWAGA: nie podpina się do transakcji nadrzędnej mutacji — w Neon HTTP nie ma
 * "ambient transaction". Konsekwencja: w skrajnym wyścigu mutacja może się
 * udać a wpis w action_log nie. Akceptowalne — to log, nie source of truth.
 */
export async function logAction(sql, {
  householdId,
  actorId,
  operation,
  resourceType,
  resourceId,
  before,
  after,
  undoesEntryId = null,
}) {
  const [row] = await sql`
    INSERT INTO action_log
      (household_id, actor_id, operation, resource_type, resource_id, before, after, undoes_entry_id)
    VALUES
      (${householdId}, ${actorId}, ${operation}, ${resourceType}, ${resourceId ?? null},
       ${before == null ? null : JSON.stringify(before)},
       ${after == null ? null : JSON.stringify(after)},
       ${undoesEntryId})
    RETURNING id, at
  `

  // Rotacja: zostaw 20 najnowszych, resztę skasuj.
  await sql`
    DELETE FROM action_log
    WHERE household_id = ${householdId}
      AND id NOT IN (
        SELECT id FROM action_log
        WHERE household_id = ${householdId}
        ORDER BY at DESC, id DESC
        LIMIT ${MAX_ENTRIES_PER_HOUSEHOLD}
      )
  `

  return { id: row.id, at: row.at }
}

/**
 * Czyta ostatnie wpisy action_log dla danego household, najnowsze pierwsze.
 * Zwraca surowe pola — caller (endpoint /api/action-log) wzbogaca o nazwę usera itp.
 */
export async function readRecentActionLog(sql, householdId, limit = MAX_ENTRIES_PER_HOUSEHOLD) {
  const rows = await sql`
    SELECT id, household_id, actor_id, at, operation, resource_type, resource_id,
           before, after, undone_at, undone_by, undoes_entry_id
    FROM action_log
    WHERE household_id = ${householdId}
    ORDER BY at DESC, id DESC
    LIMIT ${limit}
  `
  return rows.map(toEntry)
}

export async function readActionLogEntry(sql, id) {
  const [row] = await sql`
    SELECT id, household_id, actor_id, at, operation, resource_type, resource_id,
           before, after, undone_at, undone_by, undoes_entry_id
    FROM action_log
    WHERE id = ${id}
  `
  return row ? toEntry(row) : null
}

function toEntry(row) {
  return {
    id: row.id,
    householdId: row.household_id,
    actorId: row.actor_id,
    at: row.at instanceof Date ? row.at.toISOString() : String(row.at),
    operation: row.operation,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    before: row.before ?? null,
    after: row.after ?? null,
    undoneAt: row.undone_at == null
      ? null
      : (row.undone_at instanceof Date ? row.undone_at.toISOString() : String(row.undone_at)),
    undoneBy: row.undone_by ?? null,
    undoesEntryId: row.undoes_entry_id ?? null,
  }
}

export { MAX_ENTRIES_PER_HOUSEHOLD }
