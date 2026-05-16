# HomeCashflow

Aplikacja do zarzadzania budzetem domowym ze wspolnymi kontami.  
Frontend: React + Vite, backend: Hono na Cloudflare Workers, baza: Neon PostgreSQL.

## Najwazniejsze funkcje

- Logowanie Google OAuth
- Tryb goscia (dane lokalnie w przegladarce)
- Wspolne gospodarstwa domowe i zaproszenia e-mail
- Rozdzielenie wydatkow stalych i zmiennych
- Cele oszczednosciowe i podsumowania miesieczne
- Prognoza finansowa, poduszka bezpieczenstwa i wskazniki biegu finansowego

## Stack

| Warstwa | Technologia | Deploy |
|---------|------------|--------|
| Frontend | React 18 + Vite + Tailwind CSS 4 | Cloudflare Pages |
| Backend | Hono | Cloudflare Workers |
| Database | Neon PostgreSQL | - |
| Auth | Google OAuth 2.0 (JWT httpOnly cookies) | - |
| Emails | Resend | - |

## Start lokalny

### Wymagania

- Node.js 20+
- Konto Neon (baza PostgreSQL)
- Google OAuth credentials

### Instalacja

```bash
# root (frontend)
npm install

# backend
cd server
npm install
```

### Zmienne srodowiskowe

W projekcie sa osobne pliki `.env` dla frontendu i backendu:

- root: `.env.local` (frontend)
- `server/`: `.env` (backend lokalnie) lub sekrety we Wranglerze (prod)

Przykladowe klucze:

```env
# frontend (.env.local)
VITE_API_URL=http://localhost:3000

# backend (server/.env)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
NEXTAUTH_SECRET=losowy-klucz-jwt
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=twoj-google-client-id
GOOGLE_CLIENT_SECRET=twoj-google-client-secret
RESEND_API_KEY=twoj-resend-api-key
```

### Uruchomienie

```bash
# terminal 1: backend
cd server
npm run dev

# terminal 2: frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Testy backendu

```bash
cd server
npm test
```

## Migracje bazy danych

Migracje schematu sa zarzadzane przez **Drizzle Kit**. Schemat zywie w `server/src/db/schema.js`
i jest zrodlem prawdy. Po kazdej zmianie schematu generujesz plik SQL z diffem i aplikujesz go
na odpowiednia baze.

Sa dwa osobne configi — dev i prod — kazdy ciagnie `DATABASE_URL` z innego pliku:

- dev: `.env.local` w roocie projektu
- prod: `server/.env.production` (DATABASE_URL prod) + fallback z roota `.env.production`
  dla pozostalych sekretow (np. `FINANCE_DATA_KEY` potrzebny do migracji danych)

### Workflow zmiany schematu

```bash
cd server

# 1. Edytuj src/db/schema.js (dodaj kolumne / tabele / index itp.)

# 2. Wygeneruj plik migracji SQL (powstanie w drizzle/NNNN_xxx.sql)
npm run drizzle:dev:generate

# 3. Przejrzyj wygenerowany SQL i zaaplikuj na dev
npm run drizzle:dev:migrate

# 4. Zacommituj zmiany w schema.js + drizzle/

# 5. Na prod (ten sam plik migracji, ma 3-sekundowy bezpiecznik)
npm run drizzle:prod:migrate
```

### Wszystkie skroty

```bash
npm run drizzle:dev:generate    # wygeneruj migracje z diffu schema vs dev DB
npm run drizzle:dev:migrate     # zaaplikuj pending migracje na dev
npm run drizzle:dev:check       # sanity check spojnosci historii migracji
npm run drizzle:dev:studio      # GUI do przegladania devowej bazy

npm run drizzle:prod:generate   # zwykle niepotrzebne — generuj na devie i commituj
npm run drizzle:prod:migrate    # aplikuj pending migracje na prod
```

### Migracja danych z legacy JSON do tabel relacyjnych

Historycznie dane finansowe byly trzymane jako zaszyfrowany JSON w `finance_data.data`
(jeden blob per gospodarstwo, prefiks `ff1:` = AES-256-GCM kluczem `FINANCE_DATA_KEY`).
Obecnie schemat ma osobne tabele (`transactions`, `savings_accounts`, `category_budgets`,
`savings_goals`, `activity_log`, `deleted_fixed_items`).

Skrypt `scripts/run-migration-002.js` odszyfrowuje JSON i kopiuje rekordy do nowych tabel.
Jest **idempotentny** (dla danego household kasuje swoje wiersze i wstawia od nowa).
Stara kolumna `finance_data.data` nie jest ruszana — zostaje jako kopia bezpieczenstwa.

```bash
cd server

# Podglad bez zapisu — ile czego wjedzie do nowych tabel
node scripts/run-migration-002.js --dry-run                 # dev
node scripts/run-migration-002.js --production --dry-run    # prod

# Wlasciwa migracja danych
npm run migrate:relational                                  # dev
node scripts/run-migration-002.js --production              # prod

# Weryfikacja: sumy z odszyfrowanego JSON-a vs sumy w nowych tabelach
npm run migrate:relational:verify                           # dev
node scripts/verify-migration-002.js --production           # prod

# Opcjonalnie: migracja jednego konkretnego household
node scripts/run-migration-002.js --household <uuid>
```

Pierwszy historyczny krok — przejscie kolumny `finance_data.data` z `JSONB` na `TEXT`
(pod szyfrowanie) — `scripts/run-migration-001.js`. Juz zaaplikowane wszedzie, ma znaczenie
tylko archiwalne.

## Dokumenty dla uzytkownikow

- `docs/regulamin.md`
- `docs/polityka-prywatnosci.md`
- `docs/instrukcja-uzytkownika.md`

## Deploy (Cloudflare)

### Backend (Workers)

```bash
cd server
npx wrangler login
npx wrangler secret put DATABASE_URL
npx wrangler secret put NEXTAUTH_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler deploy
```

### Frontend (Pages)

1. Cloudflare Dashboard -> Workers & Pages -> Create -> Pages -> Connect to Git
2. Repo: `PiotrSobiecki/HomeCashflow`
3. Build command: `npm run build`, output: `dist/`
4. Ustaw `VITE_API_URL` na publiczny adres backendu

### Google OAuth

Dodaj redirect URI: `https://api.homecashflow.org/api/auth/callback`

## Struktura projektu

```text
financeflow/
|- src/                     # frontend React
|- server/                  # backend Hono
|- docs/                    # dokumenty prawne i instrukcja
|- plans/
`- prd.md
```
