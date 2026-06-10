import { Zap, Cpu, LayoutDashboard, User, UserX, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

/**
 * Wspólny górny pasek aplikacji — to samo menu na Dashboardzie i podstronach.
 *
 * @param {'budzet'|'urzadzenia'} activeView — która sekcja jest aktywna (steruje linkiem nawigacji)
 * @param {React.ReactNode} extras — opcjonalne kontrolki kontekstowe (np. status zapisu, reset) wstrzykiwane przed info o userze
 */
export const AppHeader = ({ activeView = "budzet", extras = null }) => {
  const { user, signOut, isGuest } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">HomeCashflow</h1>
              <p className="text-xs text-slate-400">
                Zarządzaj finansami inteligentnie
              </p>
            </div>
          </a>

          <div className="flex items-center gap-4">
            {extras}

            {/* User info */}
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${isGuest ? "bg-amber-500/20" : "bg-slate-800/50"}`}
            >
              {isGuest ? (
                <UserX className="w-4 h-4 text-amber-400" />
              ) : (
                <User className="w-4 h-4 text-indigo-400" />
              )}
              <span
                className={`text-sm ${isGuest ? "text-amber-300" : "text-slate-300"}`}
              >
                {isGuest ? "Gość" : user?.name || user?.email?.split("@")[0]}
              </span>
            </div>

            {/* Nawigacja Budżet ↔ Inteligentne urządzenia (nie dla gościa) */}
            {!isGuest &&
              (activeView === "urzadzenia" ? (
                <a
                  href="/"
                  className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                  title="Budżet"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Budżet</span>
                </a>
              ) : (
                <a
                  href="/?view=urzadzenia"
                  className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                  title="Inteligentne urządzenia"
                >
                  <Cpu className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Urządzenia</span>
                </a>
              ))}

            {/* Logout */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
              title={isGuest ? "Zaloguj się" : "Wyloguj się"}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">
                {isGuest ? "Zaloguj" : "Wyloguj"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
