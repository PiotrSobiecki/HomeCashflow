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
