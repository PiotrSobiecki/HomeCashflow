import { useState } from "react";
import { FileText, Download, Mail, Loader2, Check, X } from "lucide-react";
import { fetchEnergyReport, emailEnergyReport } from "../lib/api";
import { buildEnergyReportPdf, pdfToBase64 } from "../lib/energyReportPdf";

const DAY_MS = 86400000;
const MAX_RANGE_DAYS = 366;

const toDateInput = (d) => {
  // Lokalna data (input[type=date] działa w strefie przeglądarki)
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
};

const PRESETS = [
  { label: "7 dni", days: 7 },
  { label: "30 dni", days: 30 },
  { label: "90 dni", days: 90 },
  { label: "1 rok", days: 365 },
];

/**
 * Eksport raportu energii: zakres dat (max rok), wybór urządzeń,
 * pobranie PDF albo wysyłka na email zalogowanego usera.
 */
export const EnergyReportExport = ({ devices }) => {
  const today = toDateInput(new Date());
  const [from, setFrom] = useState(
    toDateInput(new Date(Date.now() - 29 * DAY_MS)),
  );
  const [to, setTo] = useState(today);
  // null = wszystkie; Set id = wybrane (checkboxy)
  const [selected, setSelected] = useState(
    () => new Set(devices.map((d) => d.id)),
  );
  const [busy, setBusy] = useState(""); // '' | 'download' | 'email'
  const [message, setMessage] = useState(null); // { ok: boolean, text: string }

  const applyPreset = (days) => {
    setFrom(toDateInput(new Date(Date.now() - (days - 1) * DAY_MS)));
    setTo(today);
  };

  const toggleDevice = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const validate = () => {
    if (!from || !to) return "Wybierz daty od i do.";
    const span = Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1;
    if (span < 1) return 'Data „od" musi być wcześniejsza niż „do".';
    if (span > MAX_RANGE_DAYS) return "Zakres może obejmować maksymalnie rok.";
    if (selected.size === 0) return "Zaznacz przynajmniej jedno urządzenie.";
    return null;
  };

  const handleExport = async (mode) => {
    const validationError = validate();
    if (validationError) {
      setMessage({ ok: false, text: validationError });
      return;
    }
    setBusy(mode);
    setMessage(null);
    try {
      const deviceIds =
        selected.size === devices.length ? undefined : [...selected];
      const report = await fetchEnergyReport({ from, to, deviceIds });
      if (report.devices.length === 0) {
        setMessage({ ok: false, text: "Brak urządzeń do raportu." });
        return;
      }
      const doc = await buildEnergyReportPdf(report);
      if (mode === "download") {
        doc.save(`raport-energii-${from}-${to}.pdf`);
        setMessage({ ok: true, text: "Pobrano raport PDF." });
      } else {
        const { to: email } = await emailEnergyReport({
          pdfBase64: pdfToBase64(doc),
          from,
          to,
        });
        setMessage({ ok: true, text: `Wysłano raport na ${email}.` });
      }
    } catch (err) {
      setMessage({
        ok: false,
        text:
          err?.code === "email_not_configured"
            ? "Wysyłka maili nie jest skonfigurowana na serwerze."
            : "Nie udało się wygenerować raportu. Spróbuj ponownie.",
      });
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-slate-800/50 border border-emerald-500/30 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-semibold text-white">Raport zużycia</h3>
      </div>
      <p className="text-sm text-slate-400 mb-5">
        Wybierz okres i urządzenia, potem pobierz PDF albo wyślij go na swój
        email.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Okres */}
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-400 mb-3">
            Okres
          </p>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="date"
              value={from}
              max={to || today}
              onChange={(e) => setFrom(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors [color-scheme:dark]"
            />
            <span className="text-sm text-slate-500 shrink-0">—</span>
            <input
              type="date"
              value={to}
              min={from}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors [color-scheme:dark]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => applyPreset(p.days)}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-800/60 text-slate-400 hover:text-white hover:bg-emerald-500/20 border border-slate-700 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Urządzenia */}
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-400 mb-3">
            Urządzenia{" "}
            <span className="text-slate-500 normal-case tracking-normal">
              ({selected.size}/{devices.length})
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {devices.map((d) => (
              <label
                key={d.id}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer border transition-colors ${
                  selected.has(d.id)
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(d.id)}
                  onChange={() => toggleDevice(d.id)}
                  className="sr-only"
                />
                {selected.has(d.id) && <Check className="w-3 h-3" />}
                {d.displayName}
              </label>
            ))}
          </div>
        </div>

        {/* Eksport */}
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-400 mb-3">
            Eksport
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleExport("download")}
              disabled={!!busy}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {busy === "download" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Pobierz PDF
            </button>
            <button
              type="button"
              onClick={() => handleExport("email")}
              disabled={!!busy}
              className="flex items-center justify-center gap-2 px-4 py-2 text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 border border-slate-600 rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {busy === "email" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              Wyślij na mój email
            </button>
          </div>
          {message && (
            <p
              className={`flex items-start gap-1.5 mt-3 text-xs ${message.ok ? "text-emerald-400" : "text-rose-400"}`}
            >
              {message.ok ? (
                <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              ) : (
                <X className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              )}
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
