# HomeCashflow

Aplikacja do zarządzania budzetem domowym ze wspolnymi kontami. Backend Hono na Cloudflare Workers, frontend React na Cloudflare Pages, baza Neon PostgreSQL.

## Funkcje

- **Google OAuth** — logowanie jednym kliknieciem
- **Tryb goscia** — testowanie bez konta (dane w localStorage)
- **Gospodarstwa domowe** — wspolne finanse z zaproszeniami email
- **Wydatki stale vs zmienne** — rozdzielenie rachunkow od codziennych wydatkow
- **Stale przychody** — automatyczne przenoszenie miedzy miesiacami
- **Moje oszczednosci** — sledzenie wielu zrodel (konto, makler, gotowka)
- **Cele oszczednosciowe** — miesieczne lub roczne
- **Guilt-Free Burn Tracker** — ile mozesz wydac dzisiaj
- **Prognoza finansowa** — wykres kumulatywnych oszczednosci
- **Poduszka bezpieczenstwa** — na ile miesiecy wystarczy

## Stack

| Warstwa | Technologia | Deploy |
|---------|------------|--------|
| Frontend | React 18 + Vite + Tailwind CSS 4 | Cloudflare Pages |
| Backend | Hono | Cloudflare Workers |
| Database | Neon PostgreSQL | — |
| Auth | Google OAuth 2.0 (JWT httpOnly cookies) | — |
| Emails | Resend | — |

## Instalacja lokalna

### Wymagania

- Node.js 20+
- Konto Neon (baza PostgreSQL)
- Google OAuth credentials

### Setup

```bash
# Frontend
npm install

# Backend
cd server
npm install

# Baza danych — wykonaj schema.sql w Neon
```

### Konfiguracja

Utworz `.env` w rootcie projektu:

```env
VITE_API_URL=http://localhost:3000

DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
NEXTAUTH_SECRET=losowy-klucz-jwt
NEXTAUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=twoj-google-client-id
GOOGLE_CLIENT_SECRET=twoj-google-client-secret
RESEND_API_KEY=twoj-resend-api-key
```

### Uruchomienie

```bash
# Terminal 1 — backend
cd server
npm run dev

# Terminal 2 — frontend
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3000

### Testy

```bash
cd server
npm test
```

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

1. CF Dashboard → Workers & Pages → Create → Pages → Connect to Git
2. Repo: `PiotrSobiecki/HomeCashflow`
3. Build command: `npm run build`, output: `dist/`
4. Environment variable: `VITE_API_URL` = `https://api.homecashflow.org`

### DNS

- `homecashflow.org` → CF Pages (Custom domain)
- `api.homecashflow.org` → CF Workers (Custom domain)

### Google Console

Dodaj redirect URI: `https://api.homecashflow.org/api/auth/callback`

## Struktura projektu

```
HomeCashflow/
├── src/                    # Frontend React
│   ├── components/         # Dashboard, Auth, wykresy, etc.
│   ├── contexts/           # AuthContext
│   ├── hooks/              # useFinanceData
│   └── lib/                # api.js
├── server/                 # Backend Hono
│   ├── src/
│   │   ├── app.js          # Glowna aplikacja + routes
│   │   ├── worker.js       # CF Workers entrypoint
│   │   └── index.js        # Local dev entrypoint
│   ├── schema.sql          # Schemat bazy
│   └── wrangler.toml       # Konfiguracja Workers
├── plans/                  # Plany implementacji
└── prd.md                  # Product Requirements Document
```
