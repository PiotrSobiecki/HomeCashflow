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
- Inteligentne urzadzenia (zakladka "Urzadzenia"): integracje z Tuya Cloud
  (poswiadczenia per gospodarstwo) oraz SmartThings/Samsung (logowanie OAuth) —
  status na zywo (moc, napiecie, zuzycie dzienne), sterowanie (gniazdka, piloty IR,
  klima, AGD jak pralka/suszarka/zmywarka), wykresy zuzycia energii z kosztami
  wg ustawionej ceny za 1 kWh
- Raporty zuzycia energii do PDF: dowolny zakres dat (max rok), wybor urzadzen,
  pobranie pliku lub wysylka na e-mail uzytkownika

## Stack

| Warstwa | Technologia | Deploy |
|---------|------------|--------|
| Frontend | React 18 + Vite + Tailwind CSS 4 | Cloudflare Pages |
| Backend | Hono | Cloudflare Workers |
| Database | Neon PostgreSQL | - |
| Auth | Google OAuth 2.0 (JWT httpOnly cookies) | - |
| Emails | Resend (zaproszenia + raporty PDF) | - |
| Smart home | Tuya Cloud API (poswiadczenia per gospodarstwo, szyfrowane) | - |
| Smart home | SmartThings API (OAuth 2.0, tokeny per gospodarstwo, szyfrowane) | - |

## Start lokalny

### Wymagania

- Node.js 20+
- Konto Neon (baza PostgreSQL)
- Google OAuth credentials

### Instalacja

Projekt uzywa **pnpm** (lockfile: `pnpm-lock.yaml`).

```bash
# root (frontend)
pnpm install

# backend
cd server
pnpm install
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
FINANCE_DATA_KEY=64-znakowy-hex-klucz-aes256   # szyfrowanie danych finansowych oraz poswiadczen/tokenow Tuya i SmartThings

# SmartThings (opcjonalnie — integracja AGD/smart home Samsung; jeden OAuth-In SmartApp na cala aplikacje)
SMARTTHINGS_CLIENT_ID=twoj-smartthings-client-id
SMARTTHINGS_CLIENT_SECRET=twoj-smartthings-client-secret
SMARTTHINGS_REDIRECT_URI=http://localhost:3000/api/smartthings/callback
```

Tuya jest konfigurowane per gospodarstwo z poziomu UI (Client ID/Secret z iot.tuya.com),
wiec nie wymaga zmiennych srodowiskowych. SmartThings uzywa jednego OAuth-In SmartApp na cala
aplikacje (powyzsze sekrety), a tokeny per uzytkownik trafiaja zaszyfrowane do bazy.

### Uruchomienie

```bash
# terminal 1: backend
cd server
pnpm run dev

# terminal 2: frontend
pnpm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Testy backendu

```bash
cd server
pnpm test
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
pnpm run drizzle:dev:generate

# 3. Przejrzyj wygenerowany SQL i zaaplikuj na dev
pnpm run drizzle:dev:migrate

# 4. Zacommituj zmiany w schema.js + drizzle/

# 5. Na prod (ten sam plik migracji, ma 3-sekundowy bezpiecznik)
pnpm run drizzle:prod:migrate
```

### Wszystkie skroty

```bash
pnpm run drizzle:dev:generate    # wygeneruj migracje z diffu schema vs dev DB
pnpm run drizzle:dev:migrate     # zaaplikuj pending migracje na dev
pnpm run drizzle:dev:check       # sanity check spojnosci historii migracji
pnpm run drizzle:dev:studio      # GUI do przegladania devowej bazy

pnpm run drizzle:prod:generate   # zwykle niepotrzebne — generuj na devie i commituj
pnpm run drizzle:prod:migrate    # aplikuj pending migracje na prod
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
pnpm run migrate:relational                                  # dev
node scripts/run-migration-002.js --production              # prod

# Weryfikacja: sumy z odszyfrowanego JSON-a vs sumy w nowych tabelach
pnpm run migrate:relational:verify                           # dev
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

Z katalogu repozytorium:

```bash
pnpm run deploy:server   # backend  (wrangler deploy --config server/wrangler.toml)
pnpm run deploy          # frontend (build + wrangler deploy --config wrangler.jsonc)
```

Konfiguracja **musi być podana jawnie**. Samo `wrangler deploy` — nawet z katalogu
`server/` — bierze `wrangler.jsonc` z katalogu repozytorium i wypycha frontend.
Dlatego backend ma własne polecenie; w `server/` działa też `pnpm run deploy`.

Zawsze `pnpm run deploy`, nigdy `pnpm deploy` — to drugie jest wbudowaną komendą
pnpm (kopiowaniem paczki z workspace'u), nie naszym skryptem.

`SMARTTHINGS_REDIRECT_URI` nie jest sekretem — jest ustawiany w `[vars]` w `server/wrangler.toml`.

#### Sekrety

```bash
cd server
pnpm run secrets:push                        # wartości z pliku produkcyjnego repozytorium
bash scripts/push-secrets.sh <ścieżka>      # inny plik w formacie KLUCZ=wartość
bash scripts/push-secrets.sh --op           # 1Password wg secrets.tpl.json
```

Skrypt bierze wyłącznie 12 kluczy Workera (reszta zmiennych zostaje na miejscu),
pyta o potwierdzenie i woła wranglera przez `node` — shim `npx` gubi strumień,
a PowerShell dokleja do niego BOM, przez co `secret bulk` widzi puste wejście.

Sekrety lądują w **nowej wersji**, która nie obsługuje jeszcze ruchu; skrypt wypisze
polecenie `wrangler versions deploy <id>@100`, którym się ją wdraża. Zwykłe
`secret bulk` odpada, gdy wdrożona wersja nie jest ostatnią wgraną (czyli po każdym
rollbacku) — Cloudflare odrzuca to błędem 10215.

Po wdrożeniu sprawdź `pnpm exec wrangler versions secret list --config wrangler.toml`:
brak choćby jednego sekretu to 500 na każdym zapytaniu. Nowa wersja nie zawsze
dziedziczy sekrety po poprzedniej.

Backend ma tez cron (konfiguracja w `server/wrangler.toml`) uruchamiany co 5 minut:
obsluguje wylaczniki czasowe urzadzen IR oraz co 15 minut zbiera pomiary energii
z urzadzen smart home (`device_energy_snapshots`).

### Frontend (Worker ze statycznymi assetami)

Frontend serwuje Worker `homecashflow` (konfiguracja w `wrangler.jsonc`), nie Pages.

```bash
pnpm run deploy          # = vite build && wrangler deploy --config wrangler.jsonc
```

`VITE_API_URL` ustaw w `.env.production` na publiczny adres backendu. Bez niego
build produkcyjny wpada na fallback `https://api.homecashflow.org` (`src/lib/api.js`).

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
