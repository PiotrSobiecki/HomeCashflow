-- Migracja 002: rozbicie finance_data (JSON blob) na tabele relacyjne.
-- Bezpieczne: tworzy NOWE tabele obok finance_data. Starej kolumny nie rusza.
-- Drop legacy table dopiero po weryfikacji (osobna migracja 003).

-- Transakcje (przychody i wydatki) per miesiąc/rok
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  name TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  txn_date DATE NOT NULL,            -- pełna data (dla wydatków zmiennych); dla stałych: 1. dnia miesiąca
  year INT NOT NULL,                  -- denormalizacja pod szybkie query miesięczne
  month INT NOT NULL CHECK (month BETWEEN 0 AND 11),
  is_fixed BOOLEAN NOT NULL DEFAULT FALSE,
  category TEXT,                      -- tylko dla wydatków zmiennych
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  legacy_id TEXT                      -- oryginalne id z JSON-a (do weryfikacji migracji)
);

CREATE INDEX IF NOT EXISTS idx_transactions_household_month ON transactions(household_id, year, month);
CREATE INDEX IF NOT EXISTS idx_transactions_household_kind ON transactions(household_id, kind);

-- "Usunięte stałe" per miesiąc — żeby auto-przenoszenie nie wracało
CREATE TABLE IF NOT EXISTS deleted_fixed_items (
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 0 AND 11),
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  name TEXT NOT NULL,
  PRIMARY KEY (household_id, year, month, kind, name)
);

-- Konta oszczędnościowe
CREATE TABLE IF NOT EXISTS savings_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  legacy_id TEXT
);

-- Budżety kategorii
CREATE TABLE IF NOT EXISTS category_budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  monthly_limit NUMERIC(14, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  legacy_id TEXT,
  UNIQUE (household_id, name)
);

-- Cel oszczędnościowy — jeden wiersz per household
CREATE TABLE IF NOT EXISTS savings_goals (
  household_id UUID PRIMARY KEY REFERENCES households(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'none' CHECK (type IN ('none', 'monthly', 'yearly')),
  monthly_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  yearly_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  target_month INT NOT NULL DEFAULT 11 CHECK (target_month BETWEEN 0 AND 11),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log aktywności
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT,
  at TIMESTAMPTZ NOT NULL,
  action TEXT NOT NULL,
  kind TEXT,
  label TEXT,
  amount NUMERIC(14, 2),
  month INT,
  legacy_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_activity_household_at ON activity_log(household_id, at DESC);

-- Znacznik migracji per household (idempotencja + ślad)
CREATE TABLE IF NOT EXISTS finance_data_migration (
  household_id UUID PRIMARY KEY REFERENCES households(id) ON DELETE CASCADE,
  migrated_at TIMESTAMPTZ DEFAULT NOW(),
  source_updated_at TIMESTAMPTZ,
  txn_count INT,
  savings_count INT,
  category_count INT,
  activity_count INT
);
