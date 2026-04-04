CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users (Google OAuth)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Households
CREATE TABLE IF NOT EXISTS households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Moje gospodarstwo',
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household members (many-to-many)
CREATE TABLE IF NOT EXISTS household_members (
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (household_id, user_id)
);

-- Finance data (JSONB per household)
CREATE TABLE IF NOT EXISTS finance_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL UNIQUE REFERENCES households(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitations (for Phase 4, create table now)
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
