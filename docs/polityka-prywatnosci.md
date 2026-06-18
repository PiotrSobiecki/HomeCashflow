# Polityka prywatnosci HomeCashflow

Data wejscia w zycie: 2026-04-06 (ostatnia aktualizacja: 2026-06-18)

## 1. Informacje ogolne

1. Niniejsza Polityka prywatnosci opisuje zasady przetwarzania danych osobowych w aplikacji HomeCashflow ("Aplikacja").
2. Administratorem danych jest podmiot udostepniajacy dana instancje Aplikacji ("Administrator").

## 2. Jakie dane przetwarzamy

W zaleznosci od sposobu korzystania z Aplikacji mozemy przetwarzac:

1. dane konta Google: identyfikator Google, adres e-mail, nazwe profilu, avatar URL,
2. dane techniczne sesji niezbedne do uwierzytelnienia (np. token sesji/JWT w cookie httpOnly),
3. dane finansowe wprowadzone przez Uzytkownika (np. wydatki, przychody, cele, oszczednosci),
4. dane dotyczace zaproszen do gospodarstwa (adres e-mail, token zaproszenia, status, daty),
5. dane integracji smart home (integracje sa opcjonalne):
   - Tuya: poswiadczenia API (Client ID i Client Secret) podane przez Wlasciciela gospodarstwa, przechowywane w postaci zaszyfrowanej,
   - SmartThings (Samsung): tokeny dostepu OAuth (access token i refresh token) przechowywane w postaci zaszyfrowanej, a opcjonalnie identyfikator konta Samsung oraz identyfikator lokalizacji,
   - dane urzadzen smart home niezalezne od dostawcy: identyfikatory, nazwy, typy oraz dostepne funkcje/capabilities urzadzen,
6. dane telemetryczne urzadzen (np. moc, napiecie, zuzycie energii, stan wlacznika, status i ustawienia urzadzen AGD) zbierane cyklicznie w celu prezentacji wykresow i raportow.

## 3. Cele i podstawy przetwarzania

Dane przetwarzamy w celu:

1. swiadczenia uslugi i utrzymania konta Uzytkownika,
2. obslugi logowania i bezpieczenstwa sesji,
3. realizacji funkcji wspoldzielenia danych w gospodarstwie domowym,
4. wysylki zaproszen e-mail do gospodarstwa,
5. obslugi opcjonalnych integracji smart home (Tuya, SmartThings): odczytu statusu urzadzen, sterowania nimi oraz pomiarow zuzycia energii,
6. generowania raportow zuzycia energii i ich wysylki na adres e-mail Uzytkownika (na jego zadanie),
7. zapewnienia bezpieczenstwa i stabilnosci Aplikacji.

## 4. Tryb goscia

1. W trybie goscia dane sa zapisywane lokalnie w przegladarce Uzytkownika (localStorage).
2. Dane z trybu goscia nie sa automatycznie przesylane do backendu, dopoki Uzytkownik nie skorzysta z funkcji wymagajacej konta.

## 5. Odbiorcy danych i podmioty przetwarzajace

W ramach dzialania Aplikacji dane moga byc powierzane dostawcom infrastruktury, np.:

1. Google (uwierzytelnianie OAuth),
2. Neon (baza danych PostgreSQL),
3. Cloudflare (hosting frontendu i backendu),
4. Resend (wysylka e-mail: zaproszenia i raporty zuzycia energii),
5. Tuya (komunikacja z urzadzeniami smart home w ramach opcjonalnej integracji),
6. Samsung / SmartThings (komunikacja z urzadzeniami AGD i smart home w ramach opcjonalnej integracji, uwierzytelnianie OAuth).

Dane sa przekazywane tylko w zakresie niezbednym do realizacji wskazanych celow.

Polaczenie z Tuya oraz SmartThings jest opcjonalne. Uzytkownik moze je w kazdej chwili odlaczyc w Aplikacji, co usuwa zapisane poswiadczenia/tokeny, a dostep nadany przez OAuth moze dodatkowo cofnac w ustawieniach swojego konta Samsung lub Tuya.

## 6. Okres przechowywania

1. Dane konta i dane finansowe sa przechowywane przez okres korzystania z Aplikacji lub do momentu ich usuniecia przez uprawnionego Uzytkownika/Administratora.
2. Dane techniczne i logi bezpieczenstwa moga byc przechowywane przez okres niezbedny do ochrony Aplikacji i rozpatrywania incydentow.

## 7. Prawa Uzytkownika

Uzytkownik ma prawo do:

1. dostepu do swoich danych,
2. sprostowania danych,
3. usuniecia danych,
4. ograniczenia przetwarzania (w przypadkach przewidzianych prawem),
5. wniesienia skargi do wlasciwego organu nadzorczego.

W celu realizacji praw nalezy skontaktowac sie z Administratorem danej instancji.

## 8. Bezpieczenstwo

1. Stosowane sa srodki techniczne i organizacyjne adekwatne do ryzyka.
2. Dane finansowe sa dodatkowo szyfrowane przed zapisem do bazy danych (szyfrowanie po stronie aplikacji).
3. Dostep do danych jest ograniczony do uprawnionych procesow i osob.
4. Mimo stosowanych zabezpieczen zadna metoda transmisji lub przechowywania danych nie daje 100% gwarancji bezpieczenstwa.

## 9. Pliki cookie i podobne technologie

1. Aplikacja moze wykorzystywac cookie niezbedne do utrzymania sesji i dzialania logowania.
2. Brak zgody na cookie techniczne moze uniemozliwic korzystanie z funkcji wymagajacych konta.

## 10. Zmiany polityki

Polityka prywatnosci moze byc aktualizowana. Aktualna wersja jest publikowana w repozytorium/projekcie Aplikacji.
