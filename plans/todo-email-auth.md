# TODO: Logowanie email + hasło

## Dlaczego
Nie każdy ma Google — trzeba dodać klasyczne logowanie email/hasło jako alternatywę.

## Co trzeba zmienić

### Baza danych
- `users.google_id` → nullable (obecnie `NOT NULL UNIQUE`)
- Dodać kolumnę `password_hash TEXT`
- Constraint: user musi mieć `google_id` ALBO `password_hash` (CHECK)
- Migracja ALTER TABLE na Neon

### Backend (server/src/app.js)
- `POST /api/auth/register` — email, hasło, imię → hash bcrypt → upsertUserAndHousehold → JWT cookie
- `POST /api/auth/login` — email, hasło → bcrypt.compare → JWT cookie
- Zależność: `bcryptjs` (działa w Workers, nie wymaga native bindings)
- Zaktualizować `upsertUserAndHousehold()` żeby obsługiwał usera bez google_id

### Frontend
- `Auth.jsx` — dodać formularz email/hasło z przełącznikiem logowanie/rejestracja
- `AuthContext.jsx` — nowe metody `signIn(email, password)` i `register(email, password, name)`

## Decyzje do podjęcia
- Potwierdzenie emaila (Resend już jest w stacku) — od razu czy później?
- Reset hasła — od razu czy później?
- Minimalna długość hasła (sugestia: 8 znaków)
- Czy pozwolić na połączenie kont (ten sam email Google + hasło)?
