import { useState, useEffect, useCallback, useRef } from "react";
import {
  Thermometer,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
} from "lucide-react";
import {
  fetchThermostat,
  saveThermostat,
  fetchThermostatTemperature,
} from "../lib/api";
import { useAlignedPolling } from "../hooks/useAlignedPolling";

const ERRORS = {
  geocode_no_result: "Nie znaleziono takiej miejscowości.",
  geocode_failed: "Nie udało się pobrać lokalizacji. Spróbuj ponownie.",
  threshold_order_cool:
    "„Włącz powyżej” musi być większe od „Wyłącz poniżej”.",
  threshold_order_heat:
    "„Włącz poniżej” musi być mniejsze od „Wyłącz powyżej”.",
  threshold_gap: "Min. 1°C odstępu między progami.",
  thresholds_required: "Podaj oba progi temperatury.",
};

// Kod warunku z backendu (weather.js) → ikona lucide + kolor. Dla bezchmurnego/częściowego
// nieba osobny wariant dzienny/nocny (isDay).
const WEATHER_ICONS = {
  clear: { day: Sun, night: Moon, color: "text-amber-300" },
  "partly-cloudy": { day: CloudSun, night: CloudMoon, color: "text-sky-300" },
  cloudy: { day: Cloud, color: "text-slate-300" },
  fog: { day: CloudFog, color: "text-slate-400" },
  drizzle: { day: CloudDrizzle, color: "text-sky-300" },
  rain: { day: CloudRain, color: "text-sky-400" },
  sleet: { day: CloudSnow, color: "text-sky-200" },
  snow: { day: CloudSnow, color: "text-sky-100" },
  thunder: { day: CloudLightning, color: "text-amber-400" },
};

function WeatherIcon({ condition, className = "w-4 h-4" }) {
  const def = WEATHER_ICONS[condition?.code];
  if (!def) return null;
  const Icon = condition.isDay === false && def.night ? def.night : def.day;
  return (
    <Icon
      className={`${className} ${def.color}`}
      aria-label={condition.label}
    />
  );
}

// Podpowiedzi miejscowości pojawiają się po wpisaniu tylu liter.
const MIN_QUERY = 3;
// Zgodne z worker.js (cron co 5 min, termostat gdy minute % 30 === 0) — minuty UTC.
const THERMO_CRON_MARKS = [0, 30];
const OUTDOOR_NOW_MARKS = [0, 15, 30, 45];
const CRON_SETTLE_MS = 5000; // chwila po :00/:30 UTC — cron zdąży zapisać odczyt
const CRON_FOLLOWUP_MS = 25000; // drugi odczyt stopki, gdy cron skończy później
const CRON_FOLLOW_UPS = [CRON_FOLLOWUP_MS];

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

/** Etykieta tylko gdy przy ostatnim odczycie cron faktycznie przełączył klimę. */
const lastCheckActionLabel = (a) =>
  a === "on" ? "włączyła klimę" : a === "off" ? "wyłączyła klimę" : null;

// Z etykiety „Wrocław, Dolnośląskie, Polska" robimy samą nazwę miasta.
const cityName = (label) => (label ?? "").split(",")[0].trim();

const thresholdGap = (mode, on, off) =>
  mode === "heat" ? off - on : on - off;

const thresholdError = (mode, on, off) => {
  if (!Number.isFinite(on) || !Number.isFinite(off))
    return ERRORS.thresholds_required;
  if (mode === "heat" && on >= off) return ERRORS.threshold_order_heat;
  if (mode === "cool" && on <= off) return ERRORS.threshold_order_cool;
  if (thresholdGap(mode, on, off) < 1) return ERRORS.threshold_gap;
  return null;
};

const parseTemp = (s) => Number(String(s).replace(",", "."));

const thresholdLabels = (mode) =>
  mode === "heat"
    ? { on: "Włącz poniżej", off: "Wyłącz powyżej" }
    : { on: "Włącz powyżej", off: "Wyłącz poniżej" };

const modeWarning = (mode) =>
  mode === "heat"
    ? "Włączenie używa ostatniego trybu z pilota — u góry wybierz Grzanie, zanim zostawisz automatykę."
    : "Włączenie używa ostatniego trybu z pilota — u góry wybierz Chłodzenie, zanim zostawisz automatykę.";

/** 0 = chłodzenie, 1 = grzanie (jak dropdown Tryb w AcControls). */
const climateModeFromAc = (acMode, fallback = "cool") => {
  if (acMode === 1) return "heat";
  if (acMode === 0) return "cool";
  return fallback === "heat" ? "heat" : "cool";
};

const fieldClass =
  "w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-600 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50";

/**
 * Sekcja „Termostat zewnętrzny" dla klimy IR (ir_ac). Pozwala włączyć automatykę,
 * wpisać miejscowość (z podpowiedziami z Open-Meteo) i dwa progi histerezy; bieżąca
 * temperatura na zewnątrz jest zawsze widoczna (nad zwijaniem).
 * @param {string} deviceId
 * @param {boolean} disabled
 * @param {number|undefined} acMode — tryb z dropdownu Tryb (0=chłodzenie, 1=grzanie)
 * @param {number} [statusRefreshKey] — inkrementowany przy „Odśwież" na karcie urządzenia
 * @param {string} [statusUpdatedAt] — zmienia się co ~30 s przy pollingu statusu karty
 */
export const ThermostatSettings = ({
  deviceId,
  disabled,
  acMode,
  statusRefreshKey = 0,
  statusUpdatedAt,
}) => {
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState(null);
  const [enabled, setEnabled] = useState(false);
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
  const [nowCondition, setNowCondition] = useState(null);
  const [nowLoading, setNowLoading] = useState(false);
  const [nowError, setNowError] = useState(false);
  const cfgReady = useRef(false);

  const load = useCallback(async (syncForm = false) => {
    try {
      const { thermostat } = await fetchThermostat(deviceId);
      if (thermostat) {
        setCfg(thermostat);
        cfgReady.current = true;
        if (syncForm) {
          setEnabled(thermostat.enabled);
          setCity(cityName(thermostat.locationLabel));
          if (thermostat.tempOn != null) setTempOn(String(thermostat.tempOn));
          if (thermostat.tempOff != null) setTempOff(String(thermostat.tempOff));
        }
      }
    } catch {
      // cicho — automatyka to nie krytyczna ścieżka
    }
  }, [deviceId]);

  useEffect(() => {
    load(true);
  }, [load]);

  // Po ręcznym „Odśwież" na karcie — dograj stopkę z bazy (bez nadpisywania formularza).
  useEffect(() => {
    if (statusRefreshKey > 0) load(false);
  }, [statusRefreshKey, load]);

  // Polling statusu karty (co ~30 s) — stopka dogania cron bez przełączania strony.
  useEffect(() => {
    if (!statusUpdatedAt || !cfgReady.current) return;
    load(false);
  }, [statusUpdatedAt, load]);

  // Stopka — dodatkowo zsynchronizowana z :00/:30 UTC (cron + 5 s).
  useAlignedPolling({
    marks: THERMO_CRON_MARKS,
    settleMs: CRON_SETTLE_MS,
    followUpMs: CRON_FOLLOW_UPS,
    enabled: !!deviceId,
    onTick: () => load(false),
    isBlocked: () => saving,
  });

  const hasCoords = cfg?.lat != null && cfg?.lon != null;

  const loadNow = useCallback(async () => {
    if (cfg?.lat == null || cfg?.lon == null) return;
    setNowLoading(true);
    setNowError(false);
    try {
      const { temp, condition } = await fetchThermostatTemperature(deviceId);
      setNow(typeof temp === "number" ? temp : null);
      setNowCondition(condition ?? null);
    } catch {
      setNowError(true);
    } finally {
      setNowLoading(false);
    }
  }, [deviceId, cfg?.lat, cfg?.lon]);

  // Bieżąca temp — start + co 15 min (:00/:15/:30/:45 UTC).
  useEffect(() => {
    if (hasCoords) loadNow();
  }, [hasCoords, loadNow]);

  useAlignedPolling({
    marks: OUTDOOR_NOW_MARKS,
    settleMs: 0,
    enabled: hasCoords,
    onTick: loadNow,
    isBlocked: () => nowLoading,
  });

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

  const climateMode = climateModeFromAc(acMode, cfg?.mode);
  const prevClimateMode = useRef(climateMode);

  // Po przełączeniu Trybu u góry (chłodzenie ↔ grzanie) zamień progi, jeśli kolejność jest odwrotna.
  useEffect(() => {
    if (prevClimateMode.current === climateMode) return;
    const on = parseTemp(tempOn);
    const off = parseTemp(tempOff);
    if (Number.isFinite(on) && Number.isFinite(off) && thresholdGap(climateMode, on, off) < 1) {
      setTempOn(String(off));
      setTempOff(String(on));
      setMsg("");
    }
    prevClimateMode.current = climateMode;
  }, [climateMode, tempOn, tempOff]);

  const parsedOn = parseTemp(tempOn);
  const parsedOff = parseTemp(tempOff);
  const thresholdErr =
    tempOn.trim() && tempOff.trim()
      ? thresholdError(climateMode, parsedOn, parsedOff)
      : null;
  const invalidThresholds = thresholdErr != null && thresholdErr !== ERRORS.thresholds_required;
  const onOrderInvalid =
    invalidThresholds &&
    Number.isFinite(parsedOn) &&
    Number.isFinite(parsedOff) &&
    (climateMode === "heat"
      ? parsedOn >= parsedOff
      : climateMode === "cool"
        ? parsedOn <= parsedOff
        : false);

  const savedMode = cfg?.mode === "heat" ? "heat" : "cool";
  const hasChanges =
    !cfg
      ? enabled ||
        picked != null ||
        city.trim() !== "" ||
        tempOn !== "26" ||
        tempOff !== "24"
      : enabled !== !!cfg.enabled ||
        climateMode !== savedMode ||
        picked != null ||
        city.trim() !== cityName(cfg.locationLabel) ||
        parsedOn !== Number(cfg.tempOn) ||
        parsedOff !== Number(cfg.tempOff);

  const save = async () => {
    const on = parsedOn;
    const off = parsedOff;
    const err = thresholdError(climateMode, on, off);
    if (err) {
      setMsg(err);
      return;
    }
    if (enabled && !city.trim() && cfg?.lat == null) {
      setMsg("Podaj miejscowość, żeby włączyć automatykę.");
      return;
    }

    setSaving(true);
    setMsg("");
    try {
      const body = { enabled, mode: climateMode, tempOn: on, tempOff: off };
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
      setCity(cityName(thermostat.locationLabel));
      setPicked(null);
      setMsg("Zapisano ✓");
    } catch (err) {
      setMsg(
        err.code === "threshold_order"
          ? climateMode === "heat"
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
  const labels = thresholdLabels(climateMode);
  const autoLabel = lastCheckActionLabel(cfg?.lastCheckAction);

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
            {!nowLoading && !nowError && now != null && nowCondition && (
              <WeatherIcon condition={nowCondition} className="w-4 h-4 shrink-0" />
            )}
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
                  className={`${fieldClass} text-center tabular-nums${onOrderInvalid ? " border-rose-500/70 focus:border-rose-500" : ""}`}
                />
                <span className="text-xs text-slate-500 shrink-0">°C</span>
              </div>
              {onOrderInvalid && climateMode === "heat" && (
                <p className="text-[10px] text-rose-400 leading-snug">
                  Musi być mniejsze od „Wyłącz powyżej”.
                </p>
              )}
              {onOrderInvalid && climateMode === "cool" && (
                <p className="text-[10px] text-rose-400 leading-snug">
                  Musi być większe od „Wyłącz poniżej”.
                </p>
              )}
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
                  className={`${fieldClass} text-center tabular-nums${invalidThresholds && !onOrderInvalid ? " border-rose-500/70 focus:border-rose-500" : ""}`}
                />
                <span className="text-xs text-slate-500 shrink-0">°C</span>
              </div>
            </div>
          </div>

          {invalidThresholds && thresholdErr === ERRORS.threshold_gap && (
            <p className="text-[11px] text-rose-400 leading-snug">{thresholdErr}</p>
          )}

          {enabled && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-[11px] leading-snug text-amber-200/90">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {modeWarning(climateMode)}
            </p>
          )}

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={save}
              disabled={disabled || saving || invalidThresholds || !hasChanges}
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
              {autoLabel && (
                <>
                  <br />
                  Automatyka {autoLabel}.
                </>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
