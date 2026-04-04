# Plan: HomeCashflow v2

> Source PRD: [GitHub Issue #1](https://github.com/PiotrSobiecki/financeflow/issues/1)

## Architectural decisions

- **Architecture style**: Monorepo — React SPA frontend + Hono API backend
- **Frontend**: React 18 + Vite + Tailwind CSS 4 → Cloudflare Pages
- **Backend**: Hono framework → Cloudflare Workers
- **Database**: Neon PostgreSQL — schemat relacyjny, dane finansowe w JSONB
- **Auth**: Google OAuth 2.0, sesje jako JWT w httpOnly cookies
- **Emails**: Resend (zaproszenia do gospodarstwa)
- **Key entities**: users, households, household_members, invitations, finance_data
- **Data model**:
  - Jeden user = jedno gospodarstwo (jako owner lub member)
  - finance_data powiązane z household_id (nie user_id)
  - Dane finansowe przechowywane jako JSONB (miesiące, przychody, wydatki, cele)
- **Uprawnienia**: Owner (zarządza członkami, kasuje household) vs Member (CRUD finansów, opuszczenie) vs Guest (localStorage only)

---

## Phase 1: Fundament — Hono backend + schemat DB + Google login

**User stories**: 1, 2, 3, 16

### What to build

Postawienie backendu Hono w folderze `server/` z konfiguracją Cloudflare Workers. Utworzenie schematu bazy danych w Neon (users, households, household_members, finance_data). Implementacja pełnego Google OAuth flow — user klika "Zaloguj Google", backend obsługuje redirect do Google, callback tworzy usera w DB, automatycznie tworzy household, generuje JWT w httpOnly cookie i przekierowuje do frontendu. Frontend AuthContext adaptowany do nowego flow (GET /api/auth/me sprawdza sesję). Wylogowanie czyści cookie.

### Acceptance criteria

- [ ] Backend Hono uruchamia się lokalnie i odpowiada na requesty
- [ ] Schemat bazy danych utworzony w Neon (users, households, household_members, finance_data)
- [ ] Kliknięcie "Zaloguj Google" na frontendzie rozpoczyna OAuth flow
- [ ] Po callback: user istnieje w tabeli users, household auto-stworzony, user jest jego ownerem
- [ ] JWT w httpOnly cookie — sesja przetrwa odświeżenie strony
- [ ] GET /api/auth/me zwraca dane zalogowanego usera
- [ ] Wylogowanie czyści cookie i wraca do ekranu logowania
- [ ] Usunięcie logowania email+hasło z frontendu (tylko Google + gość)

---

## Phase 2: Persystencja danych finansowych

**User stories**: 6, 7, 8, 9, 10, 11, 12, 13, 14, 15

### What to build

Podpięcie istniejącego hooka useFinanceData do backendu API. Zalogowany user pobiera dane z GET /api/finance (po household_id), a każda zmiana (dodanie/edycja/usunięcie przychodu/wydatku, zmiana celu oszczędnościowego) zapisuje się przez PUT /api/finance. Backend waliduje sesję JWT i zapisuje JSONB do tabeli finance_data. Wszystkie istniejące widoki (Summary, Yearly, GuiltFree, Runway, Forecast) działają bez zmian — zasilane danymi z DB zamiast localStorage.

### Acceptance criteria

- [ ] GET /api/finance zwraca dane finansowe dla household zalogowanego usera
- [ ] PUT /api/finance zapisuje dane do Neon
- [ ] Dodanie przychodu/wydatku na frontendzie → zapis w DB → dane widoczne po odświeżeniu
- [ ] Edycja i usuwanie przychodów/wydatków persystuje w DB
- [ ] Cele oszczędnościowe zapisują się i ładują z DB
- [ ] Nawigacja między miesiącami działa z danymi z DB
- [ ] Wykresy (Yearly, Forecast) renderują dane z DB

---

## Phase 3: Tryb gościa + migracja danych

**User stories**: 4, 5

### What to build

Zachowanie trybu gościa — user wybiera "Kontynuuj jako gość", korzysta z localStorage jak dotychczas. Gdy gość zdecyduje się zalogować Google, po pierwszym logowaniu backend sprawdza czy frontend wysyła dane gościa (z localStorage) i merguje je do nowo utworzonego finance_data w DB. Po migracji localStorage jest czyszczony.

### Acceptance criteria

- [ ] Tryb gościa działa jak wcześniej (brak API calls, dane w localStorage)
- [ ] Gość loguje się Google → dane z localStorage migrują do DB
- [ ] Po migracji localStorage jest czyszczony
- [ ] Jeśli gość nie miał danych — tworzony jest pusty finance_data
- [ ] Dashboard wyświetla zmigrowane dane po zalogowaniu

---

## Phase 4: Zaproszenia do gospodarstwa

**User stories**: 17, 18, 19, 20, 24

### What to build

UI w Dashboard pozwalający właścicielowi wpisać email i wysłać zaproszenie. Backend tworzy rekord w tabeli invitations z unikalnym tokenem i datą wygaśnięcia, wysyła email przez Resend z linkiem (np. /invite/:token). Zaproszona osoba klika link, loguje się Google — backend sprawdza czy email Google zgadza się z emailem zaproszenia. Jeśli tak, user dołącza do household (household_members), a jego ewentualne stare household jest usuwane/opuszczane. Lista członków widoczna w UI. Przy wydatkach/przychodach zapisywane jest kto dodał (added_by w JSONB).

### Acceptance criteria

- [ ] Właściciel widzi sekcję "Członkowie" z listą osób w gospodarstwie
- [ ] Właściciel może wpisać email i wysłać zaproszenie
- [ ] Email z zaproszeniem dociera (Resend) z linkiem tokenowym
- [ ] Zaproszona osoba po kliknięciu linku i zalogowaniu Google dołącza do household
- [ ] Osoba z innym emailem niż zaproszenie NIE może dołączyć
- [ ] Obaj członkowie widzą te same dane finansowe
- [ ] Wpisy pokazują kto je dodał

---

## Phase 5: Zarządzanie członkami

**User stories**: 21, 22, 23

### What to build

Rozbudowa sekcji "Członkowie" o akcje zarządzania. Właściciel może usunąć członka (DELETE /api/household/members/:userId) — usunięty traci dostęp i automatycznie dostaje nowe puste household. Członek (nie-owner) może opuścić gospodarstwo (POST /api/household/leave) — analogicznie dostaje nowe puste household. Właściciel może usunąć całe gospodarstwo (DELETE /api/household) — wszyscy członkowie dostają nowe puste household, dane finansowe usunięte.

### Acceptance criteria

- [ ] Właściciel widzi przycisk "Usuń" przy każdym członku (nie przy sobie)
- [ ] Usunięty członek traci dostęp do danych i dostaje nowe puste gospodarstwo
- [ ] Członek widzi przycisk "Opuść gospodarstwo"
- [ ] Po opuszczeniu członek ma nowe puste gospodarstwo
- [ ] Właściciel może usunąć całe gospodarstwo
- [ ] Po usunięciu gospodarstwa wszyscy (łącznie z ownerem) dostają nowe puste household

---

## Phase 6: Deploy na Cloudflare

**User stories**: N/A (infrastruktura)

### What to build

Konfiguracja deploy pipeline. Frontend (Vite build) na Cloudflare Pages z ustawieniem zmiennych środowiskowych (VITE_API_URL). Backend (Hono) na Cloudflare Workers z secrets (DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, RESEND_API_KEY). Ustawienie produkcyjnego Google OAuth callback URL. Weryfikacja połączenia Workers → Neon. Konfiguracja CORS między Pages a Workers. Aktualizacja GitHub repo — wyczyszczenie starych plików, dodanie wrangler.toml.

### Acceptance criteria

- [ ] Frontend dostępny pod domeną Cloudflare Pages
- [ ] Backend odpowiada pod domeną Cloudflare Workers
- [ ] Google OAuth flow działa z produkcyjnymi URL-ami
- [ ] Workers łączą się z Neon bez błędów
- [ ] CORS poprawnie skonfigurowany (Pages ↔ Workers)
- [ ] Secrets ustawione w Cloudflare dashboard (nie w repo)
- [ ] Repo na GitHub wyczyszczone z nieużywanych plików
