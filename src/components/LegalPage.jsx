import { ArrowLeft, FileText, ShieldCheck, Zap } from "lucide-react";

const TERMS_CONTENT = [
  {
    title: "1. Postanowienia ogolne",
    items: [
      "Regulamin okresla zasady korzystania z aplikacji HomeCashflow (Aplikacja).",
      "Aplikacja sluzy do zarzadzania finansami domowymi, w tym do wspolpracy w ramach gospodarstw domowych.",
      "Korzystanie z Aplikacji oznacza akceptacje niniejszego Regulaminu.",
    ],
  },
  {
    title: "2. Definicje",
    items: [
      "Uzytkownik - osoba korzystajaca z Aplikacji.",
      "Konto - profil Uzytkownika utworzony po logowaniu przez Google OAuth.",
      "Gospodarstwo - wspolna przestrzen finansowa, do ktorej moga nalezec zaproszeni Uzytkownicy.",
      "Wlasciciel gospodarstwa - Uzytkownik, ktory utworzyl gospodarstwo i zarzadza czlonkami.",
    ],
  },
  {
    title: "3. Zakres uslug",
    items: [
      "Aplikacja umozliwia m.in. dodawanie i edycje danych finansowych, prowadzenie budzetu domowego i zapraszanie czlonkow gospodarstwa.",
      "W Aplikacji dostepny jest tez tryb goscia (bez konta).",
      "Funkcje moga byc rozwijane, zmieniane lub czasowo ograniczane.",
    ],
  },
  {
    title: "4. Konto i logowanie",
    items: [
      "Logowanie odbywa sie za pomoca konta Google.",
      "Uzytkownik zobowiazuje sie podawac prawdziwe dane.",
      "Uzytkownik odpowiada za bezpieczenstwo swojego konta Google oraz urzadzenia.",
    ],
  },
  {
    title: "5. Tryb goscia",
    items: [
      "Tryb goscia pozwala korzystac z Aplikacji bez logowania.",
      "Dane w trybie goscia sa przechowywane lokalnie w przegladarce Uzytkownika.",
      "Usuniecie danych przegladarki moze spowodowac utrate danych z trybu goscia.",
    ],
  },
  {
    title: "6. Gospodarstwa i zaproszenia",
    items: [
      "Wlasciciel gospodarstwa moze zapraszac innych Uzytkownikow.",
      "Zaproszony Uzytkownik musi zalogowac sie adresem e-mail zgodnym z adresem zaproszenia.",
      "Wlasciciel moze usuwac czlonkow gospodarstwa zgodnie z dostepnymi funkcjami Aplikacji.",
    ],
  },
  {
    title: "7. Zasady korzystania",
    items: [
      "Zabronione jest korzystanie z Aplikacji w sposob sprzeczny z prawem.",
      "Zabronione jest podejmowanie dzialan zaklocajacych dzialanie Aplikacji.",
      "Uzytkownik ponosi odpowiedzialnosc za tresci i dane, ktore wprowadza do Aplikacji.",
    ],
  },
  {
    title: "8. Odpowiedzialnosc",
    items: [
      "Aplikacja ma charakter narzedzia wspierajacego planowanie finansow i nie stanowi porady finansowej, prawnej ani podatkowej.",
      "Dane finansowe sa dodatkowo szyfrowane przed zapisem do bazy danych.",
      "Dokladnosc analiz i podsumowan zalezy od danych wprowadzonych przez Uzytkownika.",
      "Tworca Aplikacji nie odpowiada za decyzje finansowe podjete na podstawie danych z Aplikacji.",
    ],
  },
  {
    title: "9. Dostepnosc i zmiany",
    items: [
      "Dokladany jest staranny wysilek, aby Aplikacja byla dostepna i bezpieczna.",
      "Moga wystepowac przerwy techniczne, aktualizacje i awarie niezalezne od tworcow.",
      "Regulamin moze byc aktualizowany; zmiany obowiazuja od chwili publikacji nowej wersji.",
    ],
  },
  {
    title: "10. Kontakt",
    items: [
      "W sprawach zwiazanych z korzystaniem z Aplikacji nalezy kontaktowac sie z administratorem instancji, na ktorej Aplikacja jest udostepniona.",
    ],
  },
];

const PRIVACY_CONTENT = [
  {
    title: "1. Informacje ogolne",
    items: [
      "Niniejsza Polityka prywatnosci opisuje zasady przetwarzania danych osobowych w aplikacji HomeCashflow (Aplikacja).",
      "Administratorem danych jest podmiot udostepniajacy dana instancje Aplikacji (Administrator).",
    ],
  },
  {
    title: "2. Jakie dane przetwarzamy",
    items: [
      "Dane konta Google (m.in. e-mail, identyfikator, nazwa, avatar).",
      "Dane finansowe wprowadzone przez uzytkownika (przychody, wydatki, cele, oszczednosci).",
      "Dane techniczne sesji i logowania wymagane do dzialania aplikacji.",
      "Dane zaproszen do gospodarstwa (adres e-mail, token zaproszenia, status, daty).",
    ],
  },
  {
    title: "3. Cele przetwarzania",
    items: [
      "Swiadczenie uslugi i obsluga konta uzytkownika.",
      "Zapewnienie bezpieczenstwa, autoryzacji i stabilnosci systemu.",
      "Umozliwienie wspolpracy w ramach gospodarstwa domowego i zaproszen e-mail.",
    ],
  },
  {
    title: "4. Tryb goscia",
    items: [
      "W trybie goscia dane sa zapisywane lokalnie w przegladarce Uzytkownika (localStorage).",
      "Dane z trybu goscia nie sa automatycznie przesylane do backendu, dopoki Uzytkownik nie skorzysta z funkcji wymagajacej konta.",
    ],
  },
  {
    title: "5. Odbiorcy danych i podmioty przetwarzajace",
    items: [
      "W ramach dzialania Aplikacji dane moga byc powierzane dostawcom infrastruktury, np. Google, Neon, Cloudflare i Resend.",
      "Dane sa przekazywane tylko w zakresie niezbednym do realizacji celow opisanych w Polityce.",
    ],
  },
  {
    title: "6. Okres przechowywania",
    items: [
      "Dane konta i dane finansowe sa przechowywane przez okres korzystania z Aplikacji lub do momentu ich usuniecia przez uprawnionego Uzytkownika/Administratora.",
      "Dane techniczne i logi bezpieczenstwa moga byc przechowywane przez okres niezbedny do ochrony Aplikacji i rozpatrywania incydentow.",
    ],
  },
  {
    title: "7. Prawa Uzytkownika",
    items: [
      "Uzytkownik ma prawo dostepu do danych, ich sprostowania i usuniecia.",
      "Uzytkownik ma prawo ograniczenia przetwarzania w przypadkach przewidzianych prawem.",
      "Uzytkownik moze wniesc skarge do wlasciwego organu nadzorczego.",
      "W celu realizacji praw nalezy skontaktowac sie z Administratorem danej instancji.",
    ],
  },
  {
    title: "8. Bezpieczenstwo",
    items: [
      "Stosowane sa srodki techniczne i organizacyjne adekwatne do ryzyka.",
      "Dane finansowe sa dodatkowo szyfrowane przed zapisem do bazy danych (szyfrowanie po stronie aplikacji).",
      "Dostep do danych jest ograniczony do uprawnionych procesow i osob.",
      "Mimo stosowanych zabezpieczen zadna metoda transmisji lub przechowywania danych nie daje 100% gwarancji bezpieczenstwa.",
    ],
  },
  {
    title: "9. Pliki cookie i podobne technologie",
    items: [
      "Aplikacja moze wykorzystywac cookie niezbedne do utrzymania sesji i dzialania logowania.",
      "Brak zgody na cookie techniczne moze uniemozliwic korzystanie z funkcji wymagajacych konta.",
    ],
  },
  {
    title: "10. Zmiany polityki",
    items: [
      "Polityka prywatnosci moze byc aktualizowana. Aktualna wersja jest publikowana w projekcie Aplikacji.",
    ],
  },
];

export const LegalPage = ({ type }) => {
  const isTerms = type === "terms";
  const title = isTerms ? "Regulamin" : "Polityka prywatnosci";
  const subtitle = isTerms
    ? "Zasady korzystania z aplikacji HomeCashflow"
    : "Informacje o przetwarzaniu i ochronie danych osobowych";
  const Icon = isTerms ? FileText : ShieldCheck;
  const sections = isTerms ? TERMS_CONTENT : PRIVACY_CONTENT;

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold">HomeCashflow</p>
              <p className="text-xs text-slate-400">{title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Powrot
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-3 mb-6">
            <Icon className="w-6 h-6 text-indigo-400 mt-1" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
              <p className="text-slate-400 mt-1">{subtitle}</p>
              <p className="text-xs text-slate-500 mt-2">Data aktualizacji: 2026-04-06</p>
            </div>
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-white mb-3">{section.title}</h2>
                <ul className="space-y-2 text-slate-300 text-sm leading-relaxed">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
