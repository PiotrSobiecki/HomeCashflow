import { useState, useEffect, useCallback } from 'react'
import {
  Thermometer, ChevronDown, ChevronRight, Loader2, Check, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { fetchThermostat, saveThermostat, fetchThermostatTemperature } from '../lib/api'

const ERRORS = {
  geocode_no_result: 'Nie znaleziono takiej miejscowości.',
  geocode_failed: 'Nie udało się pobrać lokalizacji. Spróbuj ponownie.',
  threshold_order: 'Próg włączenia musi być wyższy od wyłączenia (min. 1°C odstępu).',
  thresholds_required: 'Podaj oba progi temperatury.',
}

// Lista rozwijana miejscowości (większe miasta PL). Wybór trafia do geokodowania po stronie backendu.
const CITIES = [
  'Białystok', 'Bielsko-Biała', 'Bydgoszcz', 'Bytom', 'Chorzów', 'Częstochowa',
  'Dąbrowa Górnicza', 'Elbląg', 'Gdańsk', 'Gdynia', 'Gliwice', 'Gorzów Wielkopolski',
  'Grudziądz', 'Jaworzno', 'Jelenia Góra', 'Kalisz', 'Katowice', 'Kielce', 'Konin',
  'Koszalin', 'Kraków', 'Legnica', 'Leszno', 'Lublin', 'Łódź', 'Olsztyn', 'Opole',
  'Ostrów Wielkopolski', 'Płock', 'Poznań', 'Radom', 'Ruda Śląska', 'Rybnik', 'Rzeszów',
  'Siedlce', 'Słupsk', 'Sosnowiec', 'Szczecin', 'Tarnów', 'Toruń', 'Tychy', 'Wałbrzych',
  'Warszawa', 'Włocławek', 'Wrocław', 'Zabrze', 'Zamość', 'Zielona Góra',
]

const fmtTime = (iso) => {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return null
  }
}

const lastActionLabel = (a) => (a === 'on' ? 'włączyła klimę' : a === 'off' ? 'wyłączyła klimę' : '—')

// Z etykiety „Wrocław, Dolnośląskie, Polska" robimy samą nazwę miasta (wartość selecta).
const cityName = (label) => (label ?? '').split(',')[0].trim()

const fieldClass =
  'w-full px-2.5 py-1.5 bg-slate-900/60 border border-slate-600 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50'

/**
 * Sekcja „Termostat zewnętrzny" dla klimy IR (ir_ac). Pozwala włączyć automatykę,
 * wybrać miejscowość i dwa progi histerezy; bieżąca temperatura na zewnątrz jest zawsze
 * widoczna (nad zwijaniem), a pod zwijaniem reszta ustawień + ostatni odczyt/akcja.
 * @param {string} deviceId
 * @param {boolean} disabled
 */
export const ThermostatSettings = ({ deviceId, disabled }) => {
  const [open, setOpen] = useState(false)
  const [cfg, setCfg] = useState(null)
  const [enabled, setEnabled] = useState(false)
  const [city, setCity] = useState('')
  const [tempOn, setTempOn] = useState('26')
  const [tempOff, setTempOff] = useState('24')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  // Bieżąca temperatura na zewnątrz.
  const [now, setNow] = useState(null)
  const [nowLoading, setNowLoading] = useState(false)
  const [nowError, setNowError] = useState(false)

  const load = useCallback(async () => {
    try {
      const { thermostat } = await fetchThermostat(deviceId)
      if (thermostat) {
        setCfg(thermostat)
        setEnabled(thermostat.enabled)
        setCity(cityName(thermostat.locationLabel))
        if (thermostat.tempOn != null) setTempOn(String(thermostat.tempOn))
        if (thermostat.tempOff != null) setTempOff(String(thermostat.tempOff))
      }
    } catch {
      // cicho — automatyka to nie krytyczna ścieżka
    }
  }, [deviceId])

  useEffect(() => { load() }, [load])

  const hasCoords = cfg?.lat != null && cfg?.lon != null

  const loadNow = useCallback(async () => {
    if (cfg?.lat == null || cfg?.lon == null) return
    setNowLoading(true); setNowError(false)
    try {
      const { temp } = await fetchThermostatTemperature(deviceId)
      setNow(typeof temp === 'number' ? temp : null)
    } catch {
      setNowError(true)
    } finally {
      setNowLoading(false)
    }
  }, [deviceId, cfg?.lat, cfg?.lon])

  // Bieżąca temp pobierana gdy jest lokalizacja — niezależnie od zwinięcia (ma być zawsze widoczna).
  useEffect(() => {
    if (hasCoords) loadNow()
  }, [hasCoords, loadNow])

  const save = async () => {
    const on = Number(String(tempOn).replace(',', '.'))
    const off = Number(String(tempOff).replace(',', '.'))
    if (!Number.isFinite(on) || !Number.isFinite(off)) { setMsg(ERRORS.thresholds_required); return }
    if (enabled && !city && cfg?.lat == null) { setMsg('Wybierz miejscowość, żeby włączyć automatykę.'); return }

    setSaving(true); setMsg('')
    try {
      const body = { enabled, tempOn: on, tempOff: off }
      // Geokodujemy tylko gdy wybrano inne miasto niż zapisane (raz na zmianę).
      if (city && city !== cityName(cfg?.locationLabel)) {
        body.city = city
      } else if (cfg?.lat != null) {
        body.lat = cfg.lat; body.lon = cfg.lon; body.locationLabel = cfg.locationLabel
      }
      const { thermostat } = await saveThermostat(deviceId, body)
      setCfg(thermostat)
      setCity(cityName(thermostat.locationLabel))
      setMsg('Zapisano ✓')
    } catch (err) {
      setMsg(ERRORS[err.code] || 'Nie udało się zapisać.')
    } finally {
      setSaving(false)
    }
  }

  const lastTemp = cfg?.lastOutdoorTemp
  const lastAt = fmtTime(cfg?.lastCheckedAt)
  const saved = msg.includes('✓')
  // Miasto spoza listy (np. zapisane wcześniej) dokładamy jako opcję, żeby select je pokazał.
  const cityOptions = city && !CITIES.includes(city) ? [city, ...CITIES] : CITIES

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
        {open ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
      </button>

      {/* Bieżąca temperatura — ZAWSZE widoczna (nad zwijaniem), gdy ustawiona jest lokalizacja. */}
      {hasCoords && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-sky-500/10 border border-sky-500/25 px-2.5 py-2">
          <span className="flex items-center gap-1.5 text-[11px] text-sky-300/90">
            <Thermometer className="w-3.5 h-3.5" /> Teraz na zewnątrz
            {cfg?.locationLabel && <span className="text-slate-500">· {cityName(cfg.locationLabel)}</span>}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white tabular-nums">
              {nowLoading ? '…' : nowError ? '—' : now != null ? `${now}°C` : '—'}
            </span>
            <button
              type="button"
              onClick={loadNow}
              disabled={disabled || nowLoading}
              className="p-1 text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 rounded disabled:opacity-50"
              aria-label="Odśwież temperaturę"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${nowLoading ? 'animate-spin' : ''}`} />
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
              onChange={(e) => { setEnabled(e.target.checked); setMsg('') }}
              className="accent-indigo-500 mt-0.5 shrink-0"
            />
            <span className="leading-snug">Automatyka wł./wył. wg temperatury na zewnątrz</span>
          </label>

          <div className="space-y-1">
            <label htmlFor={`thermo-city-${deviceId}`} className="text-[11px] text-slate-400">
              Miejscowość
            </label>
            <select
              id={`thermo-city-${deviceId}`}
              value={city}
              disabled={disabled}
              onChange={(e) => { setCity(e.target.value); setMsg('') }}
              className={fieldClass}
            >
              <option value="">— wybierz miejscowość —</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor={`thermo-on-${deviceId}`} className="text-[11px] text-slate-400">
                Włącz powyżej
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id={`thermo-on-${deviceId}`}
                  type="text"
                  inputMode="decimal"
                  value={tempOn}
                  disabled={disabled}
                  onChange={(e) => { setTempOn(e.target.value); setMsg('') }}
                  className={`${fieldClass} text-center tabular-nums`}
                />
                <span className="text-xs text-slate-500 shrink-0">°C</span>
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor={`thermo-off-${deviceId}`} className="text-[11px] text-slate-400">
                Wyłącz poniżej
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id={`thermo-off-${deviceId}`}
                  type="text"
                  inputMode="decimal"
                  value={tempOff}
                  disabled={disabled}
                  onChange={(e) => { setTempOff(e.target.value); setMsg('') }}
                  className={`${fieldClass} text-center tabular-nums`}
                />
                <span className="text-xs text-slate-500 shrink-0">°C</span>
              </div>
            </div>
          </div>

          {enabled && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-[11px] leading-snug text-amber-200/90">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Włączenie używa ostatniego trybu z pilota — ustaw klimę na chłodzenie, zanim zostawisz automatykę.
            </p>
          )}

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={save}
              disabled={disabled || saving}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Zapisz ustawienia
            </button>
            {msg && (
              <p className={`text-center text-[11px] ${saved ? 'text-emerald-400' : 'text-rose-400'}`}>{msg}</p>
            )}
          </div>

          {cfg?.lastCheckedAt && (
            <p className="pt-2 border-t border-slate-700/40 text-[11px] text-slate-500 leading-relaxed">
              Ostatni odczyt:{' '}
              <span className="text-slate-400">{lastTemp != null ? `${lastTemp}°C` : '—'}</span>
              {lastAt && <span className="text-slate-600"> · {lastAt}</span>}
              <br />
              Automatyka: <span className="text-slate-400">{lastActionLabel(cfg.lastAction)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
