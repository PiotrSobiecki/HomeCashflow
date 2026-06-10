/**
 * Wspólna stopka — ta sama na Dashboardzie i podstronach.
 *
 * @param {boolean} isGuest
 * @param {number} year
 */
export const AppFooter = ({ isGuest = false, year = new Date().getFullYear() }) => {
  return (
    <footer className="border-t border-slate-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-center text-sm text-slate-500">
          HomeCashflow © {year} •{" "}
          {isGuest
            ? "Dane zapisywane lokalnie w przeglądarce"
            : "Dane finansowe szyfrowane i bezpiecznie przechowywane w chmurze"}
        </p>
        <p className="text-center text-xs text-slate-500 mt-2">
          <a
            href="/?view=regulamin"
            className="hover:text-slate-300 transition-colors"
          >
            Regulamin
          </a>{" "}
          •{" "}
          <a
            href="/?view=polityka-prywatnosci"
            className="hover:text-slate-300 transition-colors"
          >
            Polityka prywatnosci
          </a>
        </p>
      </div>
    </footer>
  );
};
