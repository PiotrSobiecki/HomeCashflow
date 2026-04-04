# HomeCashflow 💰

Aplikacja do zarządzania finansami osobistymi z bazą PostgreSQL w **Neon** oraz logowaniem (email + Google) przez Supabase.

## ✨ Funkcje

- 🔐 **Logowanie i rejestracja** - każdy użytkownik ma swoje dane
- 💸 **Wydatki stałe vs zmienne** - rozdzielenie rachunków od codziennych wydatków
- 🎯 **Cele oszczędnościowe** - miesięczne lub roczne
- 🔥 **Guilt-Free Burn Tracker** - ile możesz wydać dzisiaj bez wyrzutów sumienia
- 📊 **Prognoza finansowa** - wykres kumulatywnych oszczędności
- 🛡️ **Poduszka bezpieczeństwa** - na ile miesięcy wystarczą Twoje oszczędności
- ☁️ **Dane w chmurze** - dostęp z każdego urządzenia

---

## 🚀 Instalacja

### Wymagania

- **Node.js** w aktualnej wersji LTS (np. 20.x)
- **npm** (domyślnie razem z Node.js)
- Konto i baza PostgreSQL w **Neon** (`https://neon.tech`)

### Krok 1: Utwórz bazę w Neon

1. Wejdź na **https://neon.tech** i załóż konto
2. Utwórz nowy projekt / bazę danych PostgreSQL
3. Skopiuj **connection string** do zmiennej `DATABASE_URL` (np. z panelu Neona)

### Krok 2: Utwórz tabelę w bazie danych

1. Połącz się z bazą w Neon (np. przez psql, TablePlus, DBeaver lub panel www)
2. Wykonaj poniższe zapytanie SQL:

```sql
CREATE TABLE user_finance_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

> Uwaga: identyfikator `user_id` pochodzi z systemu logowania (Supabase Auth).  
> Aplikacja frontendowa łączy się z backendem / Supabase, który używa tej tabeli w bazie Neon.

### Krok 3: Skonfiguruj Supabase (auth + API)

1. Wejdź na **https://supabase.com** i utwórz projekt (darmowy plan wystarczy)
2. W Supabase skonfiguruj połączenie z bazą (Neon lub domyślną bazą Supabase, w zależności od Twojej architektury)
3. Włącz uwierzytelnianie email + Google (szczegóły w sekcji „Logowanie przez Google” poniżej)
4. Skopiuj:
   - **Project URL** (np. `https://abc123.supabase.co`)
   - **anon public** key (długi ciąg znaków)

### Krok 4: Skonfiguruj plik `.env`

1. Utwórz plik `.env` w głównym folderze:

```env
# Baza danych (Neon)
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# Frontend ↔ Supabase (auth + API)
VITE_SUPABASE_URL="https://twoj-projekt.supabase.co"
VITE_SUPABASE_ANON_KEY="twoj-anon-key"

# Logowanie przez Google (OAuth)
GOOGLE_CLIENT_ID="twoje-google-client-id"
GOOGLE_CLIENT_SECRET="twoj-google-client-secret"
```

### Krok 5: Uruchom aplikację

```bash
cd financeflow   # lub inna nazwa, jeśli zmienisz slug repozytorium na GitHub
npm install
npm run dev
```

Otwórz **http://localhost:5173**

Jeżeli podczas `npm install` pojawią się błędy typu:

- `tarball data for vite@... seems to be corrupted`
- `npm error enoent ENOENT: Cannot cd into '.../node_modules/@babel/parser'`

to wykonaj:

```bash
rm -rf node_modules package-lock.json   # na Windows: rmdir /s node_modules & del package-lock.json
npm cache clean --force
npm install
```

---

## 🌐 Publikacja online (opcjonalne)

### Vercel (darmowe)

1. Wrzuć kod na GitHub
2. Wejdź na **https://vercel.com** i połącz z GitHubem
3. Dodaj zmienne środowiskowe:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Netlify (darmowe)

1. Wrzuć kod na GitHub
2. **https://netlify.com** → New site from Git
3. Dodaj zmienne środowiskowe w Site settings → Environment
4. Deploy!

---

## 📧 Konfiguracja emaili (opcjonalne)

Domyślnie Supabase wymaga potwierdzenia emaila. Żeby to wyłączyć:

1. Supabase Dashboard → **Authentication** → **Providers**
2. Kliknij na **Email**
3. Wyłącz **"Confirm email"**
4. Zapisz

---

## 🔑 Logowanie przez Google

Aplikacja wspiera logowanie przez **Google** (Supabase Auth + Google OAuth).

### Krok 1: Utwórz dane logowania w Google Cloud

1. Wejdź na `https://console.cloud.google.com/`
2. Utwórz projekt lub użyj istniejącego
3. Przejdź do **APIs & Services → Credentials**
4. Utwórz **OAuth 2.0 Client ID** typu **Web application**
5. Ustaw:
   - **Authorized redirect URI** zgodnie z panelem Supabase (np. `https://twoj-projekt.supabase.co/auth/v1/callback`)
6. Skopiuj:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
7. Wpisz je do pliku `.env` zgodnie z przykładem powyżej.

### Krok 2: Włącz Google w Supabase

1. Supabase Dashboard → **Authentication** → **Providers**
2. Wybierz **Google**
3. Wklej `GOOGLE_CLIENT_ID` i `GOOGLE_CLIENT_SECRET`
4. Zapisz zmiany

Od tego momentu przycisk **„Zaloguj się przez Google”** w ekranie logowania HomeCashflow będzie dostępny i użytkownicy będą mogli logować się jednym kliknięciem.

---

## 🔒 Bezpieczeństwo

- Hasła są hashowane przez Supabase Auth
- Row Level Security (RLS) chroni dane użytkowników
- Każdy widzi tylko swoje dane
- Klucz `anon` jest bezpieczny do użycia w frontend

---

## 📁 Struktura projektu

```
financeflow/   # katalog = nazwa repo po git clone
├── src/
│   ├── components/     # Komponenty React
│   ├── contexts/       # AuthContext
│   ├── hooks/          # useFinanceData
│   ├── lib/            # Konfiguracja Supabase
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env                # Twoje klucze (nie commituj!)
├── .env.example        # Przykład
├── index.html
├── package.json
└── vite.config.js
```

---

## ❓ FAQ

**Q: Czy moje dane są bezpieczne?**
A: Tak! Supabase używa szyfrowania i Row Level Security. Każdy użytkownik widzi tylko swoje dane.

**Q: Ile to kosztuje?**
A: Supabase ma darmowy plan z 500MB bazy danych - wystarczy na tysiące użytkowników.

**Q: Czy mogę udostępnić aplikację znajomym?**
A: Tak! Każdy może założyć konto i mieć swoje własne dane.

---

## 🛠️ Rozwój

Przed uruchomieniem trybu deweloperskiego **koniecznie zainstaluj zależności**:

```bash
npm install
```

Następnie możesz korzystać ze skryptów:

```bash
npm run dev      # Tryb deweloperski (wymaga wcześniejszego npm install)
npm run build    # Build produkcyjny
npm run preview  # Podgląd buildu
```

---

Made with ❤️ by HomeCashflow Team
