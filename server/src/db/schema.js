/**
 * Drizzle schema — odzwierciedlenie aktualnego stanu bazy.
 * Źródło prawdy dla migracji generowanych przez `drizzle-kit generate`.
 */
import {
  pgTable, uuid, text, timestamp, boolean, integer, jsonb, numeric,
  primaryKey, index, uniqueIndex, check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ====== Tabele "core" (były w schema.sql) ======

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  googleId: text('google_id').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const households = pgTable('households', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().default('Moje gospodarstwo'),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const householdMembers = pgTable('household_members', {
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.householdId, t.userId] }),
}))

// Legacy: JSON blob (po migracji 001 jako TEXT — szyfrowany ff1:…)
export const financeData = pgTable('finance_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').notNull().unique().references(() => households.id, { onDelete: 'cascade' }),
  data: text('data').notNull().default('{}'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const invitations = pgTable('invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  invitedBy: uuid('invited_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  statusCheck: check('invitations_status_check', sql`${t.status} IN ('pending', 'accepted', 'declined')`),
}))

// ====== Nowe tabele relacyjne (migracja 002) ======

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  name: text('name').notNull(), // ciphertext (ff1:…) lub plaintext (legacy/test)
  amount: text('amount').notNull(), // ciphertext stringa liczby
  txnDate: text('txn_date').notNull(), // DATE w postgresie — Drizzle traktuje jako string
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  isFixed: boolean('is_fixed').notNull().default(false),
  category: text('category'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  legacyId: text('legacy_id'),
}, (t) => ({
  kindCheck: check('transactions_kind_check', sql`${t.kind} IN ('income', 'expense')`),
  monthCheck: check('transactions_month_check', sql`${t.month} BETWEEN 0 AND 11`),
  byHouseholdMonth: index('idx_transactions_household_month').on(t.householdId, t.year, t.month),
  byHouseholdKind: index('idx_transactions_household_kind').on(t.householdId, t.kind),
}))

export const deletedFixedItems = pgTable('deleted_fixed_items', {
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  kind: text('kind').notNull(),
  name: text('name').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.householdId, t.year, t.month, t.kind, t.name] }),
  kindCheck: check('deleted_fixed_kind_check', sql`${t.kind} IN ('income', 'expense')`),
  monthCheck: check('deleted_fixed_month_check', sql`${t.month} BETWEEN 0 AND 11`),
}))

export const savingsAccounts = pgTable('savings_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // ciphertext
  amount: text('amount').notNull(), // ciphertext stringa liczby
  icon: text('icon'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  legacyId: text('legacy_id'),
})

export const categoryBudgets = pgTable('category_budgets', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // ciphertext — UNIQUE niemozliwy na zaszyfrowanej kolumnie (random IV)
  monthlyLimit: text('monthly_limit').notNull(), // ciphertext stringa liczby
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  legacyId: text('legacy_id'),
})

export const savingsGoals = pgTable('savings_goals', {
  householdId: uuid('household_id').primaryKey().references(() => households.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('none'),
  monthlyAmount: text('monthly_amount'), // ciphertext, NULL gdy type=none
  yearlyAmount: text('yearly_amount'),
  targetMonth: integer('target_month').notNull().default(11),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  typeCheck: check('savings_goals_type_check', sql`${t.type} IN ('none', 'monthly', 'yearly')`),
  targetMonthCheck: check('savings_goals_target_month_check', sql`${t.targetMonth} BETWEEN 0 AND 11`),
}))

export const activityLog = pgTable('activity_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  userName: text('user_name'),
  at: timestamp('at', { withTimezone: true }).notNull(),
  action: text('action').notNull(),
  kind: text('kind'),
  label: text('label'), // ciphertext lub NULL
  amount: text('amount'), // ciphertext stringa liczby lub NULL
  month: integer('month'),
  legacyId: text('legacy_id'),
}, (t) => ({
  byHouseholdAt: index('idx_activity_household_at').on(t.householdId, t.at),
}))

// ====== action_log (migracja 003 — undo end-to-end, Phase 4) ======
//
// Każda mutacja per-row (create/update/delete na transactions, savings_accounts,
// category_budgets, savings_goals) wstawia tu wpis z `before`/`after` snapshotem.
// Snapshoty zawierają sensytywne pola w postaci ciphertext (ten sam format ff1:…
// co kolumny docelowe), żeby undo mogło je z powrotem zapisać bez deszyfrowania
// w warstwie aplikacji.
// Rotacja: trigger trzyma tylko 20 najnowszych wpisów per household_id.
export const actionLog = pgTable('action_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  operation: text('operation').notNull(), // CREATE | UPDATE | DELETE | UNDO
  resourceType: text('resource_type').notNull(), // transaction | savings_account | category_budget | savings_goal
  resourceId: text('resource_id'), // uuid lub identyfikator singletonu ('goal'); text bo savings_goal nie ma UUID
  before: jsonb('before'),
  after: jsonb('after'),
  undoneAt: timestamp('undone_at', { withTimezone: true }),
  undoneBy: uuid('undone_by').references(() => users.id, { onDelete: 'set null' }),
  // Gdy ta akcja jest typu UNDO — wskazuje wpis który cofa (do wyświetlenia "X cofnął Y").
  undoesEntryId: uuid('undoes_entry_id'),
}, (t) => ({
  operationCheck: check('action_log_operation_check', sql`${t.operation} IN ('CREATE', 'UPDATE', 'DELETE', 'UNDO')`),
  resourceTypeCheck: check('action_log_resource_type_check', sql`${t.resourceType} IN ('transaction', 'savings_account', 'category_budget', 'savings_goal')`),
  byHouseholdAt: index('idx_action_log_household_at').on(t.householdId, t.at),
}))

export const financeDataMigration = pgTable('finance_data_migration', {
  householdId: uuid('household_id').primaryKey().references(() => households.id, { onDelete: 'cascade' }),
  migratedAt: timestamp('migrated_at', { withTimezone: true }).defaultNow(),
  sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
  txnCount: integer('txn_count'),
  savingsCount: integer('savings_count'),
  categoryCount: integer('category_count'),
  activityCount: integer('activity_count'),
})

// ====== Integracja Tuya — poświadczenia per gospodarstwo (Slice 1) ======
//
// Każde gospodarstwo ma własne konto Tuya. Owner wpisuje Client ID/Secret w panelu;
// trzymamy je zaszyfrowane (ff1:… AES-GCM, ten sam FINANCE_DATA_KEY co reszta).
// Singleton per household → PK = household_id.
export const tuyaCredentials = pgTable('tuya_credentials', {
  householdId: uuid('household_id').primaryKey().references(() => households.id, { onDelete: 'cascade' }),
  clientIdEnc: text('client_id_enc').notNull(), // ciphertext
  clientSecretEnc: text('client_secret_enc').notNull(), // ciphertext
  // UWAGA: device_id NIE tutaj — poświadczenia są jedne na konto/projekt Tuya,
  // a urządzeń może być wiele. Urządzenia → osobna tabela smart_devices (Slice 2).
  datacenter: text('datacenter').notNull().default('eu'),
  energyPricePln: numeric('energy_price_pln', { precision: 10, scale: 4 }), // cena 1 kWh w zł (do kosztów); null = nieustawiona
  verifiedAt: timestamp('verified_at', { withTimezone: true }), // ostatnia udana weryfikacja tokenem
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  datacenterCheck: check('tuya_credentials_datacenter_check', sql`${t.datacenter} IN ('eu', 'us', 'cn', 'in')`),
}))

// ====== Poświadczenia SmartThings per gospodarstwo (OAuth-In, Faza 1) ======
//
// W przeciwieństwie do Tuya (BYO client_id/secret per household), SmartThings ma JEDEN
// OAuth-In SmartApp na całą apkę (client_id/secret w env). Tutaj trzymamy tylko to, co
// per-user: tokeny OAuth (zaszyfrowane ff1:… AES-GCM, ten sam FINANCE_DATA_KEY).
// Singleton per household → PK = household_id. Tokeny nigdy nie wracają do frontu.
export const smartthingsCredentials = pgTable('smartthings_credentials', {
  householdId: uuid('household_id').primaryKey().references(() => households.id, { onDelete: 'cascade' }),
  accessTokenEnc: text('access_token_enc').notNull(), // ciphertext
  refreshTokenEnc: text('refresh_token_enc').notNull(), // ciphertext
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), // wygaśnięcie access tokenu
  scopes: text('scopes'), // przyznane scope (space-separated)
  locationId: text('location_id'), // domyślna lokacja ST (opcjonalnie)
  samsungAccountId: text('samsung_account_id'), // do audytu (opcjonalnie)
  verifiedAt: timestamp('verified_at', { withTimezone: true }), // ostatnia udana wymiana/odświeżenie
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// ====== Urządzenia Tuya per gospodarstwo (Slice 2) ======
//
// N urządzeń per gospodarstwo (poświadczenia są jedne — tuya_credentials).
// `tuya_device_id` UNIQUE globalnie: jedno fizyczne urządzenie należy do jednego
// gospodarstwa. `functions_json` to snapshot zapisywalnych DP z Tuya (do renderu
// kontrolek w Slice 3) pobierany przy dodaniu.
export const smartDevices = pgTable('smart_devices', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  // Provider integracji. 'tuya' = wiersze sprzed Fazy 2 SmartThings (backfill). Urządzenia
  // ST mają tuya_device_id = NULL (nie chodzą przez Tuya API), identyfikator w external_device_id.
  provider: text('provider').notNull().default('tuya'),
  // Id urządzenia u dostawcy (Tuya device_id lub SmartThings deviceId). Dla Tuya = tuya_device_id
  // (backfill). UNIQUE(provider, external_device_id): jedno fizyczne urządzenie w jednym gospodarstwie.
  externalDeviceId: text('external_device_id'),
  // Tuya-only (NULL dla ST). Zostaje, żeby kod Tuya czytający tuya_device_id był bez zmian.
  tuyaDeviceId: text('tuya_device_id').unique(),
  // Snapshot capabilities SmartThings (komponenty + capabilities z profilu urządzenia),
  // pobrany przy dodaniu. Ziarno mappera stanu (Faza 3). NULL dla Tuya (tam functions_json).
  capabilitiesJson: jsonb('capabilities_json'),
  displayName: text('display_name').notNull(),
  productName: text('product_name'),
  productId: text('product_id'),
  deviceType: text('device_type').default('plug'),
  // Dla urządzeń IR (np. klima Gree pod blasterem Smart IR): id blastera (infrared_id),
  // którym Tuya wysyła kody IR. NULL dla zwykłych gniazdek. Sterowanie/odczyt idą wtedy
  // przez /v2.0/infrareds/{ir_parent_id}/... zamiast standardowego /devices/{id}/commands.
  irParentId: text('ir_parent_id'),
  // Powiązanie urządzenia IR (pilot TV/STB) z gniazdkiem mierzącym pobór — IR jest
  // bezstanowy, więc realny on/off wnioskujemy z mocy gniazdka. NULL = brak powiązania.
  // Self-FK do smart_devices (gniazdko w tym samym gospodarstwie).
  linkedPlugId: uuid('linked_plug_id').references(() => smartDevices.id, { onDelete: 'set null' }),
  // Własne nazwy programów pralki (SmartThings nie wystawia nazw kursów — tylko kody jak
  // "1C"). Mapa { kodKursu: nazwaPL } nadpisuje draft z washer.js. NULL = same defaulty.
  cycleLabels: jsonb('cycle_labels'),
  functionsJson: jsonb('functions_json'),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  byHousehold: index('idx_smart_devices_household').on(t.householdId),
  providerCheck: check('smart_devices_provider_check', sql`${t.provider} IN ('tuya', 'smartthings')`),
  uniqProviderExternal: uniqueIndex('uniq_smart_devices_provider_external').on(t.provider, t.externalDeviceId),
}))

// ====== Audyt sterowania urządzeniami (Slice 3) ======
//
// Osobny od action_log (to nie jest cofalna mutacja budżetu) — kto/kiedy/co.
export const deviceCommandLog = pgTable('device_command_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  deviceId: uuid('device_id').references(() => smartDevices.id, { onDelete: 'set null' }),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  code: text('code').notNull(),
  value: jsonb('value'),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byHouseholdAt: index('idx_device_cmd_household_at').on(t.householdId, t.at),
}))

// ====== Wyłącznik czasowy dla urządzeń IR (Smart IR) ======
//
// Urządzenia IR (klima/TV) nie mają natywnego DP `countdown` jak gniazdka — pilot nie
// zna stanu i nie umie odliczać. Timer trzymamy po stronie serwera: cron co minutę
// wyłącza urządzenia, którym minął `fire_at`. Jeden aktywny timer per urządzenie
// (partial unique po status='pending').
export const deviceTimers = pgTable('device_timers', {
  id: uuid('id').defaultRandom().primaryKey(),
  deviceId: uuid('device_id').notNull().references(() => smartDevices.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  fireAt: timestamp('fire_at', { withTimezone: true }).notNull(),
  action: text('action').notNull().default('off'),
  status: text('status').notNull().default('pending'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  statusCheck: check('device_timers_status_check', sql`${t.status} IN ('pending', 'done', 'canceled', 'failed')`),
  byStatusFire: index('idx_device_timers_status_fire').on(t.status, t.fireAt),
  uniqPending: uniqueIndex('uniq_device_timer_pending').on(t.deviceId).where(sql`${t.status} = 'pending'`),
}))

// ====== Termostat zewnętrzny dla klimy IR (Tuya ir_ac) ======
//
// Per urządzenie ir_ac: automatyka włącza/wyłącza klimę wg temperatury zewnętrznej
// z danej miejscowości. Cron co 30 min odczytuje temp i woła decide() (histereza +
// edge-trigger). last_action to ostatnia komenda wysłana przez automatykę — służy do
// edge-triggera (nie ponawiamy, nie nadpisujemy ręcznych zmian w strefie martwej).
// Jeden termostat per urządzenie (UNIQUE device_id).
export const acThermostats = pgTable('ac_thermostats', {
  id: uuid('id').defaultRandom().primaryKey(),
  deviceId: uuid('device_id').notNull().unique().references(() => smartDevices.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').notNull().default(false),
  // Miejscowość: etykieta do wyświetlenia + współrzędne (geocoding w Fazie 3).
  locationLabel: text('location_label'),
  lat: numeric('lat', { precision: 8, scale: 5 }),
  lon: numeric('lon', { precision: 8, scale: 5 }),
  // Progi histerezy: włącz gdy temp ≥ temp_on, wyłącz gdy temp ≤ temp_off.
  tempOn: numeric('temp_on', { precision: 4, scale: 1 }).notNull(),
  tempOff: numeric('temp_off', { precision: 4, scale: 1 }).notNull(),
  // Ostatnia akcja automatyki (NULL = jeszcze nie działała). Klucz edge-triggera.
  lastAction: text('last_action'),
  lastOutdoorTemp: numeric('last_outdoor_temp', { precision: 4, scale: 1 }),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  byEnabled: index('idx_ac_thermostats_enabled').on(t.enabled),
  thresholdCheck: check('ac_thermostats_threshold_check', sql`${t.tempOn} > ${t.tempOff}`),
  lastActionCheck: check('ac_thermostats_last_action_check', sql`${t.lastAction} IS NULL OR ${t.lastAction} IN ('on', 'off')`),
}))

// ====== Pomiary zużycia w czasie (Slice 4 — wykresy) ======
//
// Dwa rodzaje wierszy w jednej tabeli:
//  • snapshot mocy (cron co 15 min): power_w/switch_on, energy_reported_at = NULL,
//  • paczka energii (z logów zdarzeń Tuya): energy_kwh = przyrost add_ele,
//    energy_reported_at = event_time, power_w = NULL.
// Zużycie w oknie = SUMA paczek (DISTINCT po energy_reported_at). Szczyt/wykres mocy
// = power_w po recorded_at. add_ele to przyrost zdarzeniowy, nie licznik. Retencja 400 dni.
export const deviceEnergySnapshots = pgTable('device_energy_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  deviceId: uuid('device_id').notNull().references(() => smartDevices.id, { onDelete: 'cascade' }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  powerW: numeric('power_w', { precision: 10, scale: 2 }),
  energyKwh: numeric('energy_kwh', { precision: 12, scale: 4 }),
  // event_time paczki add_ele z logów Tuya. Klucz dedupu paczek energii.
  energyReportedAt: timestamp('energy_reported_at', { withTimezone: true }),
  switchOn: boolean('switch_on'),
  isOnline: boolean('is_online'),
}, (t) => ({
  byDeviceAt: index('idx_energy_device_at').on(t.deviceId, t.recordedAt),
  // Jedna paczka add_ele na (urządzenie, event_time) — idempotentne zaciąganie z logów.
  uniqEvent: uniqueIndex('uniq_energy_device_event').on(t.deviceId, t.energyReportedAt)
    .where(sql`${t.energyReportedAt} IS NOT NULL`),
}))
