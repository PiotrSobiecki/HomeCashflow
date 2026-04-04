# PRD: HomeCashflow v2

## Problem Statement

Użytkownik chce zarządzać budżetem domowym wspólnie z bliskimi osobami. Obecne rozwiązania albo nie wspierają współdzielenia danych, albo są zbyt skomplikowane. HomeCashflow działa obecnie tylko w trybie gościa (localStorage) — dane giną po wyczyszczeniu przeglądarki, nie ma możliwości logowania ani współpracy z innymi osobami.

## Solution

Rozbudowa HomeCashflow o:
- **Logowanie przez Google** — szybki onboarding, bez haseł
- **Persystencja danych w Neon PostgreSQL** — dane bezpieczne w chmurze
- **Wspólne gospodarstwa domowe** — zaproszenie po emailu, współdzielone przychody i wydatki
- **Deploy na Cloudflare** — szybki, globalny dostęp

Po zalogowaniu Google automatycznie tworzy się gospodarstwo domowe. Użytkownik może zaprosić bliskich po emailu. Wszyscy członkowie widzą i wpisują te same dane finansowe. Tryb gościa (localStorage) pozostaje jako opcja bez logowania.

## User Stories

### Autentykacja
1. Jako nowy użytkownik, chcę zalogować się przez Google jednym kliknięciem, żeby nie tworzyć kolejnego hasła
2. Jako zalogowany użytkownik, chcę aby moja sesja była zapamiętana, żeby nie logować się przy każdej wizycie
3. Jako użytkownik, chcę się wylogować, żeby zabezpieczyć dostęp na współdzielonym urządzeniu
4. Jako użytkownik bez konta, chcę kontynuować jako gość (localStorage), żeby przetestować aplikację bez rejestracji
5. Jako gość, chcę móc później zalogować się przez Google i zachować swoje dane, żeby nie stracić wpisanych wydatków

### Zarządzanie finansami
6. Jako członek gospodarstwa, chcę dodać przychód (nazwa, kwota, data), żeby śledzić wpływy
7. Jako członek gospodarstwa, chcę dodać wydatek stały lub zmienny (nazwa, kwota, data), żeby kategoryzować koszty
8. Jako członek gospodarstwa, chcę edytować i usuwać przychody/wydatki, żeby poprawiać błędy
9. Jako członek gospodarstwa, chcę ustawić cel oszczędnościowy (miesięczny lub roczny), żeby planować budżet
10. Jako członek gospodarstwa, chcę widzieć podsumowanie miesiąca (przychody, wydatki stałe, zmienne, bilans), żeby znać swoją sytuację
11. Jako członek gospodarstwa, chcę nawigować między miesiącami, żeby przeglądać historię
12. Jako członek gospodarstwa, chcę widzieć roczne podsumowanie na wykresie, żeby widzieć trendy
13. Jako członek gospodarstwa, chcę widzieć "Guilt-Free Burn" (ile mogę dziennie wydać), żeby kontrolować bieżące wydatki
14. Jako członek gospodarstwa, chcę widzieć "Financial Runway" (na ile miesięcy starczą oszczędności), żeby ocenić bezpieczeństwo finansowe
15. Jako członek gospodarstwa, chcę widzieć prognozę 12-miesięczną, żeby planować przyszłość

### Wspólne gospodarstwa domowe
16. Jako nowy użytkownik po zalogowaniu Google, chcę mieć automatycznie utworzone gospodarstwo domowe, żeby od razu zacząć wpisywać dane
17. Jako właściciel gospodarstwa, chcę zaprosić osobę po emailu, żeby mogła współdzielić budżet
18. Jako zaproszona osoba, chcę otrzymać email z zaproszeniem i po zalogowaniu Google dołączyć do gospodarstwa, żeby widzieć wspólne dane
19. Jako zaproszona osoba, mogę dołączyć tylko jeśli mój email Google zgadza się z zaproszeniem, żeby nikt obcy nie uzyskał dostępu
20. Jako członek gospodarstwa, chcę widzieć kto jest w moim gospodarstwie, żeby wiedzieć kto ma dostęp
21. Jako właściciel, chcę usunąć członka z gospodarstwa, żeby zarządzać dostępem
22. Jako właściciel, chcę usunąć całe gospodarstwo, żeby wyczyścić dane
23. Jako członek (nie-właściciel), chcę opuścić gospodarstwo, żeby odłączyć się od wspólnych danych
24. Jako członek gospodarstwa, chcę widzieć kto dodał dany wydatek/przychód, żeby wiedzieć kto co wpisał

## Implementation Decisions

### Architektura
- **Monorepo** — frontend i backend w jednym repozytorium
- **Frontend:** React 18 + Vite + Tailwind CSS 4 -> deploy na **Cloudflare Pages**
- **Backend:** **Hono** framework na **Cloudflare Workers**
- **Baza danych:** **Neon PostgreSQL** (istniejąca instancja)
- **Auth:** **Google OAuth 2.0** — flow obsługiwany przez backend, sesje jako JWT (httpOnly cookies)
- **Emaile:** **Resend** — wysyłka zaproszeń do gospodarstwa domowego (darmowy tier: 100/dzień)

### Schemat bazy danych
- **users** — id, google_id, email, name, avatar_url, created_at
- **households** — id, name, owner_id (FK users), created_at
- **household_members** — household_id, user_id, joined_at (composite PK)
- **invitations** — id, household_id, email, invited_by (FK users), status (pending/accepted/declined), token, expires_at, created_at
- **finance_data** — id, household_id (FK households), data (JSONB), updated_at
- Obecna tabela user_finance_data zostanie zastąpiona przez finance_data z kluczem household_id zamiast user_id

### Kluczowe przepływy
- **Rejestracja:** Google OAuth -> callback -> upsert user -> auto-tworzenie household -> redirect do Dashboard
- **Zaproszenie:** Właściciel wpisuje email -> backend tworzy invitation + wysyła email (Resend) z linkiem tokenowym -> zaproszona osoba klika link -> loguje się Google -> backend sprawdza email vs invitation -> dodaje do household
- **Dane finansowe:** Wszystkie operacje CRUD lecą na finance_data per household_id — wszyscy członkowie czytają i piszą te same dane
- **Tryb gościa:** Bez zmian — localStorage, offline, bez API calls

### API Endpoints (Hono Workers)
- GET/POST /api/auth/google — OAuth flow
- GET /api/auth/callback — Google callback
- POST /api/auth/logout — wylogowanie
- GET /api/auth/me — dane zalogowanego usera
- GET /api/household — dane gospodarstwa + członkowie
- POST /api/household/invite — wyślij zaproszenie (owner only)
- POST /api/household/invite/:token/accept — przyjmij zaproszenie
- DELETE /api/household/members/:userId — usuń członka (owner only)
- DELETE /api/household — usuń gospodarstwo (owner only)
- POST /api/household/leave — opuść gospodarstwo
- GET /api/finance — pobierz dane finansowe
- PUT /api/finance — zapisz dane finansowe

### Uprawnienia
- **Właściciel:** zapraszanie, usuwanie członków, usuwanie gospodarstwa + wszystko co członek
- **Członek:** CRUD wydatków/przychodów, przeglądanie danych, opuszczenie gospodarstwa
- **Gość:** tylko localStorage, zero API

## Validation Strategy

### Auth
- [ ] Logowanie Google działa — user trafia do Dashboard
- [ ] Sesja przetrwa odświeżenie strony
- [ ] Wylogowanie czyści sesję i wraca do ekranu logowania
- [ ] Tryb gościa działa jak wcześniej (localStorage)
- [ ] Migracja danych gościa do konta po zalogowaniu

### Finanse
- [ ] Dodawanie/edycja/usuwanie przychodów i wydatków zapisuje się w Neon
- [ ] Dane ładują się poprawnie po odświeżeniu
- [ ] Cele oszczędnościowe zapisują się i ładują
- [ ] Wszystkie widoki (Summary, Yearly, GuiltFree, Runway, Forecast) działają z danymi z DB

### Wspólne konta
- [ ] Po rejestracji Google automatycznie tworzy się household
- [ ] Właściciel może wysłać zaproszenie na email
- [ ] Email z zaproszeniem dociera (Resend)
- [ ] Zaproszona osoba po zalogowaniu Google dołącza do gospodarstwa
- [ ] Obcy email nie może użyć tokenu zaproszenia
- [ ] Obaj członkowie widzą te same dane
- [ ] Zmiana danych przez jednego widoczna u drugiego (po odświeżeniu)
- [ ] Właściciel może usunąć członka
- [ ] Członek może opuścić gospodarstwo

### Deploy
- [ ] Frontend na Cloudflare Pages — działa produkcyjnie
- [ ] Backend na Cloudflare Workers — odpowiada na requesty
- [ ] Google OAuth callback działa z produkcyjnym URL
- [ ] Połączenie z Neon działa z Workers

## Out of Scope

- Logowanie email + hasło (tylko Google OAuth)
- Wiele gospodarstw per user (jeden user = jedno gospodarstwo)
- Powiadomienia push / real-time sync (WebSocket)
- Eksport danych (CSV/PDF)
- Aplikacja mobilna (PWA ewentualnie później)
- Wielowalutowość
- Kategorie wydatków (poza stale/zmienne)
- Historia zmian / audit log

## Further Notes

- Interfejs w języku polskim
- Frontend już istnieje i działa w trybie gościa — wymaga adaptacji do pracy z API zamiast localStorage
- Usunąć @supabase/supabase-js z dependencies (nieużywane)
- .env z credentials Neon/Google już istnieje — nie commitować do repo
- Obecna tabela user_finance_data w Neon do zmigrowania na nowy schemat
