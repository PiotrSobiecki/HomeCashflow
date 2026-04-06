import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Zap, Loader2, UserX } from "lucide-react";

const AUTH_ERR_MESSAGES = {
  oauth_redirect:
    "Google odrzucił logowanie — adres zwrotny (redirect URI) nie zgadza się z konfiguracją. W Google Cloud Console dodaj dokładnie: https://api.homecashflow.org/api/auth/callback",
  google_token:
    "Google nie wymienił kodu na token (zwykle kod już został użyty albo sesja wygasła). Kliknij „Zaloguj przez Google” ponownie — bez odświeżania starego linku z Google.",
  config_db: "Błąd konfiguracji serwera (połączenie z bazą).",
  config_oauth: "Błąd konfiguracji Google OAuth po stronie serwera.",
  profile: "Konto Google nie zwróciło wymaganego adresu e-mail.",
  google_profile: "Nie udało się pobrać profilu z Google.",
  unknown: "Logowanie nie powiodło się. Spróbuj ponownie.",
};

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { signInWithGoogle, continueAsGuest } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authErr = params.get("auth_err");
    if (!authErr) return;
    setError(AUTH_ERR_MESSAGES[authErr] ?? AUTH_ERR_MESSAGES.unknown);
    params.delete("auth_err");
    const qs = params.toString();
    const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState({}, "", next);
  }, []);

  const handleGoogleLogin = () => {
    setError("");
    setLoading(true);
    signInWithGoogle();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/30">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">HomeCashflow</h1>
            <p className="text-sm text-slate-400">
              Zarządzaj finansami inteligentnie
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white text-center mb-6">
            Zaloguj się
          </h2>

          {error && (
            <div className="p-3 mb-4 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* Google login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white/90 hover:bg-white text-slate-900 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-xs font-bold">
                  G
                </span>
                Zaloguj się przez Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-700"></div>
            <span className="text-slate-500 text-sm">lub</span>
            <div className="flex-1 h-px bg-slate-700"></div>
          </div>

          {/* Guest mode */}
          <button
            onClick={continueAsGuest}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white font-medium rounded-xl transition-all"
          >
            <UserX className="w-5 h-5" />
            Kontynuuj bez logowania
          </button>

          <p className="text-xs text-slate-500 text-center mt-3">
            Tryb demo - dane zapisywane tylko w tej przeglądarce
          </p>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Dane finansowe sa szyfrowane i bezpiecznie przechowywane w chmurze
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
    </div>
  );
};
