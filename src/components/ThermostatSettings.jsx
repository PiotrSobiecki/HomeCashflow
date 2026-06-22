import { useState, useEffect, useCallback } from "react";
import {
  Thermometer,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Snowflake,
  Flame,
} from "lucide-react";
import {
  fetchThermostat,
  saveThermostat,
  fetchThermostatTemperature,
} from "../lib/api";

const ERRORS = {
  geocode_no_result: "Nie znaleziono takiej miejscowości.",
  geocode_failed: "Nie udało się pobrać lokalizacji. Spróbuj ponownie.",
  threshold_order_cool:
    "Chłodzenie: próg włączenia musi być wyższy od wyłączenia (min. 1°C odstępu).",
  threshold_order_heat:
    "Grzanie: próg wyłączenia musi być wyższy od włączenia (min. 1°C odstępu).",
  thresholds_required: "Podaj oba progi temperatury.",
};

// Podpowiedzi miejscowości pojawiają się po wpisaniu tylu liter.
const MIN_QUERY = 3;

const fmtTime = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
};

const lastActionLabel = (a) =>
  a === "on" ? "ostatnio włączyła" : a === "off" ? "ostatnio wyłączyła" : "—";

/** Tekst automatyki tylko gdy ostatnia komenda zgadza się ze stanem klimy z Tuya. */
const automationStatusText = (lastAction, acPower) => {
  const acOn = acPower === 1;
  const acOff = acPower === 0;
  if (lastAction === "on" && acOn) return lastActionLabel("on");
  if (lastAction === "off" && acOff) return lastActionLabel("off");
  return null;
};

const acPowerLabel = (acPower) => {
  if (acPower === 1) return "włączona";
  if (acPower === 0) return "wyłączona";
  return null;
};

// Z etykiety „Wrocław, Dolnośląskie, Polska" robimy samą nazwę miasta.
const cityName = (label) => (label ?? "").split(",")[0].trim();

const thresholdGap = (mode, on, off) =>
  mode === "heat" ? off - on : on - off;

const thresholdLabels = (mode) =>
  mode === "heat"
    ? { on: "Włącz poniżej", off: "Wyłącz powyżej" }
    : { on: "Włącz powyżej", off: "Wyłącz poniżej" };

const modeWarning = (mode) =>
  mode === "heat"
    ? "Włączenie używa ostatniego trybu z pilota — ustaw klimę na grzanie, zanim zostawisz automatykę."
    : "Włączenie używa ostatniego trybu z pilota — ustaw klimę na chłodzenie, zanim zostawisz automatykę.";

const fieldClass =
  "w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-600 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50";

/**
 * Sekcja „Termostat zewnętrzny" dla klimy IR (ir_ac). Pozwala włączyć automatykę,
 * wpisać miejscowość (z podpowiedziami z Open-Meteo) i dwa progi histerezy; bieżąca
 * temperatura na zewnątrz jest zawsze widoczna (nad zwijaniem).
 * @param {string} deviceId
 * @param {boolean} disabled
 * @param {number|undefined} acPower — 0/1 z odczytu Tuya (jak przycisk Włączona/Wyłączona)
 */
export const ThermostatSettings = ({ deviceId, disabled, acPower }) => {
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState("cool");
  const [city, setCity] = useState("");
  const [tempOn, setTempOn] = useState("26");
  const [tempOff, setTempOff] = useState("24");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  // Podpowiedzi miejscowości + wybrana (precyzyjne lat/lon, bez ponownego geokodowania).
  const [suggestions, setSuggestions] = useState([]);
  const [picked, setPicked] = useState(null);
  // Bieżąca temperatura na zewnątrz.
  const [now, setNow] = useState(null);
  const [nowLoading, setNowLoading] = useState(false);
  const [nowError, setNowError] = useState(false);

  const load = useCallback(async () => {
    try {
      const { thermostat } = await fetchThermostat(deviceId);
      if (thermostat) {
        setCfg(thermostat);
        setEnabled(thermostat.enabled);
        setMode(thermostat.mode === "heat" ? "heat" : "cool");
        setCity(cityName(thermostat.locationLabel));
        if (thermostat.tempOn != null) setTempOn(String(thermostat.tempOn));
        if (thermostat.tempOff != null) setTempOff(String(thermostat.tempOff));
      }
    } catch {
      // cicho — automatyka to nie krytyczna ścieżka
    }
  }, [deviceId]);

  useEffect(() => {
    load();
  }, [load]);

  const hasCoords = cfg?.lat != null && cfg?.lon != null;

  const loadNow = useCallback(async () => {
    if (cfg?.lat == null || cfg?.lon == null) return;
    setNowLoading(true);
    setNowError(false);
    try {
      const { temp } = await fetchThermostatTemperature(deviceId);
      setNow(typeof temp === "number" ? temp : null);
    } catch {
      setNowError(true);
    } finally {
      setNowLoading(false);
    }
  }, [deviceId, cfg?.lat, cfg?.lon]);

  // Bieżąca temp pobierana gdy jest lokalizacja — niezależnie od zwinięcia (ma być zawsze widoczna).
  useEffect(() => {
    if (hasCoords) loadNow();
  }, [hasCoords, loadNow]);

  // Podpowiedzi miejscowości z Open-Meteo (debounce). Nie szukamy zapisanej już nazwy ani po wyborze.
  useEffect(() => {
    const q = city.trim();
    if (q.length < MIN_QUERY || picked || q === cityName(cfg?.locationLabel)) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=pl&format=json`,
        );
        const data = await res.json();
        setSuggestions(
          (data?.results ?? []).map((r) => ({
            id: r.id ?? `${r.latitude}-${r.longitude}`,
            name: r.name,
            lat: r.latitude,
            lon: r.longitude,
            label: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
          })),
        );
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [city, picked, cfg?.locationLabel]);

  const onCityChange = (e) => {
    setCity(e.target.value);
    setPicked(null);
    setMsg("");
  };

  const pickCity = (s) => {
    setCity(s.name);
    setPicked({ lat: s.lat, lon: s.lon, label: s.label });
    setSuggestions([]);
    setMsg("");
  };

  const onModeChange = (next) => {
    if (next === mode) return;
    const on = Number(String(tempOn).replace(",", "."));
    const off = Number(String(tempOff).replace(",", "."));
    setMode(next);
    setMsg("");
    // Zamień progi, jeśli kolejność nie pasuje do nowego trybu.
    if (Number.isFinite(on) && Number.isFinite(off)) {
      if (next === "heat" && on >= off) {
        setTempOn(String(off));
        setTempOff(String(on));
      } else if (next === "cool" && on <= off) {
        setTempOn(String(off));
        setTempOff(String(on));
      }
    }
  };

  const save = async () => {
    const on = Number(String(tempOn).replace(",", "."));
    const off = Number(String(tempOff).replace(",", "."));
    if (!Number.isFinite(on) || !Number.isFinite(off)) {
      setMsg(ERRORS.thresholds_required);
      return;
    }
    if (thresholdGap(mode, on, off) < 1) {
      setMsg(
        mode === "heat"
          ? ERRORS.threshold_order_heat
          : ERRORS.threshold_order_cool,
      );
      return;
    }
    if (enabled && !city.trim() && cfg?.lat == null) {
      setMsg("Podaj miejscowość, żeby włączyć automatykę.");
      return;
    }

    setSaving(true);
    setMsg("");
    try {
      const body = { enabled, mode, tempOn: on, tempOff: off };
      if (picked) {
        // Wybrano z podpowiedzi — mamy dokładne współrzędne, bez ponownego geokodowania.
        body.lat = picked.lat;
        body.lon = picked.lon;
        body.locationLabel = picked.label;
      } else if (city.trim() && city.trim() !== cityName(cfg?.locationLabel)) {
        // Wpisano ręcznie i nie wybrano — backend zgeokoduje nazwę.
        body.city = city.trim();
      } else if (cfg?.lat != null) {
        body.lat = cfg.lat;
        body.lon = cfg.lon;
        body.locationLabel = cfg.locationLabel;
      }
      const { thermostat } = await saveThermostat(deviceId, body);
      setCfg(thermostat);
      setMode(thermostat.mode === "heat" ? "heat" : "cool");
      setCity(cityName(thermostat.locationLabel));
      setPicked(null);
      setMsg("Zapisano ✓");
    } catch (err) {
      setMsg(
        err.code === "threshold_order"
          ? mode === "heat"
            ? ERRORS.threshold_order_heat
            : ERRORS.threshold_order_cool
          : ERRORS[err.code] || "Nie udało się zapisać.",
      );
    } finally {
      setSaving(false);
    }
  };

  const lastTemp = cfg?.lastOutdoorTemp;
  const lastAt = fmtTime(cfg?.lastCheckedAt);
  const saved = msg.includes("✓");
  const powerLabel = acPowerLabel(acPower);
  const autoStatus = automationStatusText(cfg?.lastAction, acPower);
  const labels = thresholdLabels(mode);

  return (
    <div className="pt-3 mt-1 border-t border-slate-700/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <Thermometer className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Termostat zewnętrzny</span>
          {cfg?.enabled && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0">
              aktywny
            </span>
          )}
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 shrink-0" />
        )}
      </button>

      {/* Bieżąca temperatura — ZAWSZE widoczna (nad zwijaniem), gdy ustawiona jest lokalizacja. */}
      {hasCoords && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-sky-500/10 border border-sky-500/25 px-2.5 py-2">
          <span className="flex items-center gap-1.5 text-[11px] text-sky-300/90">
            <Thermometer className="w-3.5 h-3.5" /> Teraz na zewnątrz
            {cfg?.locationLabel && (
              <span className="text-slate-500">
                · {cityName(cfg.locationLabel)}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white tabular-nums">
              {nowLoading
                ? "…"
                : nowError
                  ? "—"
                  : now != null
                    ? `${now}°C`
                    : "—"}
            </span>
            <button
              type="button"
              onClick={loadNow}
              disabled={disabled || nowLoading}
              className="p-1 text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 rounded disabled:opacity-50"
              aria-label="Odśwież temperaturę"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${nowLoading ? "animate-spin" : ""}`}
              />
            </button>
          </span>
        </div>
      )}

      {open && (
        <div className="mt-2.5 rounded-xl border border-slate-700/50 bg-slate-900/40 p-3 space-y-3">
          <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              disabled={disabled}
              onChange={(e) => {
                setEnabled(e.target.checked);
                setMsg("");
              }}
              className="accent-indigo-500 mt-0.5 shrink-0"
            />
            <span className="leading-snug">Automatyka wł./wył.</span>
          </label>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-400">Tryb automatyki</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onModeChange("cool")}
                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                  mode === "cool"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                    : "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200"
                }`}
              >
                <Snowflake className="w-3.5 h-3.5" /> Chłodzenie
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onModeChange("heat")}
                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                  mode === "heat"
                    ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                    : "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200"
                }`}
              >
                <Flame className="w-3.5 h-3.5" /> Grzanie
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor={`thermo-city-${deviceId}`}
              className="text-[11px] text-slate-400"
            >
              Miejscowość
            </label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none z-10" />
              <input
                id={`thermo-city-${deviceId}`}
                type="text"
                value={city}
                disabled={disabled}
                onChange={onCityChange}
                placeholder="np. Wrocław"
                autoComplete="off"
                className={`${fieldClass} pl-8`}
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-20 left-0 right-0 mt-1 max-h-44 overflow-auto rounded-lg border border-slate-600 bg-slate-900 shadow-xl">
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => pickCity(s)}
                        className="w-full flex items-center gap-1.5 text-left px-2.5 py-1.5 text-xs text-slate-200 hover:bg-indigo-500/20"
                      >
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{s.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label
                htmlFor={`thermo-on-${deviceId}`}
                className="text-[11px] text-slate-400"
              >
                {labels.on}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id={`thermo-on-${deviceId}`}
                  type="text"
                  inputMode="decimal"
                  value={tempOn}
                  disabled={disabled}
                  onChange={(e) => {
                    setTempOn(e.target.value);
                    setMsg("");
                  }}
                  className={`${fieldClass} text-center tabular-nums`}
                />
                <span className="text-xs text-slate-500 shrink-0">°C</span>
              </div>
            </div>
            <div className="space-y-1">
              <label
                htmlFor={`thermo-off-${deviceId}`}
                className="text-[11px] text-slate-400"
              >
                {labels.off}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id={`thermo-off-${deviceId}`}
                  type="text"
                  inputMode="decimal"
                  value={tempOff}
                  disabled={disabled}
                  onChange={(e) => {
                    setTempOff(e.target.value);
                    setMsg("");
                  }}
                  className={`${fieldClass} text-center tabular-nums`}
                />
                <span className="text-xs text-slate-500 shrink-0">°C</span>
              </div>
            </div>
          </div>

          {enabled && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-[11px] leading-snug text-amber-200/90">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {modeWarning(mode)}
            </p>
          )}

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={save}
              disabled={disabled || saving}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Zapisz ustawienia
            </button>
            {msg && (
              <p
                className={`text-center text-[11px] ${saved ? "text-emerald-400" : "text-rose-400"}`}
              >
                {msg}
              </p>
            )}
          </div>

          {cfg?.lastCheckedAt && (
            <p className="pt-2 border-t border-slate-700/40 text-[11px] text-slate-500 leading-relaxed">
              Ostatni odczyt:{" "}
              <span className="text-slate-400">
                {lastTemp != null ? `${lastTemp}°C` : "—"}
              </span>
              {lastAt && <span className="text-slate-600"> · {lastAt}</span>}
              {(powerLabel || autoStatus) && (
                <>
                  <br />
                  {powerLabel && (
                    <>
                      Klima:{" "}
                      <span className="text-slate-400">{powerLabel}</span>
                    </>
                  )}
                  {autoStatus && (
                    <>
                      {powerLabel && <span className="text-slate-600"> · </span>}
                      Automatyka:{" "}
                      <span className="text-slate-400">{autoStatus}</span>
                    </>
                  )}
                </>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
