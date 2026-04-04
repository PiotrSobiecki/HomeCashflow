# CLAUDE.md — HomeCashflow

## Overview

Aplikacja do zarządzania budżetem domowym ze wspólnymi kontami. Polski interfejs.

- **PRD:** [GitHub Issue #1](https://github.com/PiotrSobiecki/financeflow/issues/1)
- **Plan implementacji:** `plans/homecashflow-v2.md` (6 faz)

## Stack

| Warstwa | Technologia | Deploy |
|---------|------------|--------|
| Frontend | React 18 + Vite + Tailwind CSS 4 | Cloudflare Pages |
| Backend | Hono | Cloudflare Workers |
| Database | Neon PostgreSQL | - |
| Auth | Google OAuth 2.0 (JWT httpOnly cookies) | - |
| Emails | Resend (zaproszenia) | - |

## Commands

```bash
npm run dev          # Frontend dev server (Vite)
npm run build        # Frontend production build
npm run preview      # Preview production build
```

## Project Structure

```
<repo>/                     # nazwa katalogu = slug repozytorium na GitHub
├── src/                    # Frontend React app
│   ├── components/         # UI components (Dashboard, Auth, wykresy, etc.)
│   ├── contexts/           # AuthContext
│   ├── hooks/              # useFinanceData (główny hook stanu)
│   └── lib/                # api.js (wywołania backendu)
├── server/                 # Backend Hono (do zbudowania)
├── plans/                  # Plan implementacji
└── prd.md                  # Product Requirements Document
```

## Database Schema

- **users** — id, google_id, email, name, avatar_url, created_at
- **households** — id, name, owner_id (FK users), created_at
- **household_members** — household_id, user_id, joined_at (composite PK)
- **invitations** — id, household_id, email, invited_by, status, token, expires_at, created_at
- **finance_data** — id, household_id (FK households), data (JSONB), updated_at

Dane finansowe to JSONB per household (nie per user).

## Permissions

- **Owner:** zapraszanie/usuwanie członków, usuwanie gospodarstwa + wszystko co Member
- **Member:** CRUD wydatków/przychodów, przeglądanie danych, opuszczenie gospodarstwa
- **Guest:** tylko localStorage, zero API calls

## Key Flows

- Nowy user loguje się Google → auto-tworzenie household → redirect do Dashboard
- Zaproszenie: owner wpisuje email → Resend wysyła link z tokenem → zaproszona osoba loguje się Google → email musi się zgadzać → dołącza do household
- Tryb gościa: localStorage, po zalogowaniu Google dane migrują do DB

## Environment

Secrets (nigdy nie commitować):
- `DATABASE_URL` — Neon connection string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth credentials
- `JWT_SECRET` — signing key
- `RESEND_API_KEY` — email service
- `VITE_API_URL` — backend URL (frontend env)

## Conventions

- Interfejs w języku polskim
- `@supabase/supabase-js` do usunięcia z dependencies (nieużywane)
- Stara tabela `user_finance_data` do zmigrowania na nowy schemat
