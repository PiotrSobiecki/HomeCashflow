import { useState, useEffect, useCallback } from 'react'
import {
  Thermometer, ChevronDown, ChevronRight, Loader2, Check, AlertTriangle, MapPin,
} from 'lucide-react'
import { fetchThermostat, saveThermostat } from '../lib/api'

const ERRORS = {
  geocode_no_result: 'Nie znaleziono takiej miejscowości.',
  geocode_failed: 'Nie udało się pobrać lokalizacji. Spróbuj ponownie.',
  threshold_order: 'Próg włączenia musi być wyższy od wyłączenia (min. 1°C odstępu).',
  thresholds_required: 'Podaj oba progi temperatury.',
}

const fmtTime = (iso) => {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return null
  }
}

const lastActionLabel = (a) => (a === 'on' ? 'włączyła klimę' : a === 'off' ? 'wyłączyła klimę' : '—')

/**
 * Sekcja „Termostat zewnętrzny" dla klimy IR (ir_ac). Pozwala włączyć automatykę,
 * podać miejscowość i dwa progi histerezy; pokazuje ostatni odczyt i akcję automatyki.
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

  const load = useCallback(async () => {
    try {
      const { thermostat } = await fetchThermostat(deviceId)
      if (thermostat) {
        setCfg(thermostat)
        setEnabled(thermostat.enabled)
        setCity(thermostat.locationLabel ?? '')
        if (thermostat.tempOn != null) setTempOn(String(thermostat.tempOn))
        if (thermostat.tempOff != null) setTempOff(String(thermostat.tempOff))
      }
    } catch {
      // cicho — automatyka to nie krytyczna ścieżka
    }
  }, [deviceId])

  useEffect(() => { load() }, [load])

  const save = async () => {
    const on = Number(String(tempOn).replace(',', '.'))
    const off = Number(String(tempOff).replace(',', '.'))
    if (!Number.isFinite(on) || !Number.isFinite(off)) { setMsg(ERRORS.thresholds_required); return }
    const hasCoords = city.trim() || cfg?.lat != null
    if (enabled && !hasCoords) { setMsg('Podaj miejscowość, żeby włączyć automatykę.'); return }

    setSaving(true); setMsg('')
    try {
      const body = { enabled, tempOn: on, tempOff: off }
      // Geokodujemy tylko gdy miasto zmienione względem zapisanej etykiety (raz na zmianę).
      if (city.trim() && city.trim() !== (cfg?.locationLabel ?? '')) {
        body.city = city.trim()
      } else if (cfg?.lat != null) {
        body.lat = cfg.lat; body.lon = cfg.lon; body.locationLabel = cfg.locationLabel
      }
      const { thermostat } = await saveThermostat(deviceId, body)
      setCfg(thermostat)
      setCity(thermostat.locationLabel ?? '')
      setMsg('Zapisano ✓')
    } catch (err) {
      setMsg(ERRORS[err.code] || 'Nie udało się zapisać.')
    } finally {
      setSaving(false)
    }
  }

  const lastTemp = cfg?.lastOutdoorTemp
  const lastAt = fmtTime(cfg?.lastCheckedAt)

  return (
    <div className="pt-3 mt-1 border-t border-slate-700/40">
      <button
        type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Thermometer className="w-3.5 h-3.5" /> Termostat zewnętrzny
          {cfg?.enabled && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">aktywny</span>}
        </span>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {open && (
        <div className="mt-2.5 space-y-2.5">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox" checked={enabled} disabled={disabled}
              onChange={(e) => { setEnabled(e.target.checked); setMsg('') }}
              className="accent-indigo-500"
            />
            Automatyka wł./wył. wg temperatury na zewnątrz
          </label>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text" value={city} disabled={disabled}
              onChange={(e) => { setCity(e.target.value); setMsg('') }}
              placeholder="Miejscowość (np. Wrocław)"
              className="flex-1 min-w-0 px-2 py-1 bg-slate-900/60 border border-slate-600 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-300 shrink-0">Włącz powyżej</span>
            <input
              type="text" inputMode="decimal" value={tempOn} disabled={disabled}
              onChange={(e) => { setTempOn(e.target.value); setMsg('') }}
              className="w-14 px-2 py-1 bg-slate-900/60 border border-slate-600 rounded-lg text-white text-center focus:outline-none focus:border-indigo-500"
            />
            <span className="text-slate-400">°C, wyłącz poniżej</span>
            <input
              type="text" inputMode="decimal" value={tempOff} disabled={disabled}
              onChange={(e) => { setTempOff(e.target.value); setMsg('') }}
              className="w-14 px-2 py-1 bg-slate-900/60 border border-slate-600 rounded-lg text-white text-center focus:outline-none focus:border-indigo-500"
            />
            <span className="text-slate-400">°C</span>
          </div>

          {enabled && (
            <p className="flex items-start gap-1.5 text-[11px] text-amber-400/90">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
              Włączenie używa ostatniego trybu z pilota — ustaw klimę na chłodzenie, zanim zostawisz automatykę.
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button" onClick={save} disabled={disabled || saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Zapisz
            </button>
            {msg && (
              <span className={`text-[11px] ${msg.includes('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>{msg}</span>
            )}
          </div>

          {cfg?.lastCheckedAt && (
            <p className="text-[11px] text-slate-500">
              Ostatni odczyt: {lastTemp != null ? `${lastTemp}°C` : '—'}
              {lastAt ? ` (${lastAt})` : ''} · automatyka: {lastActionLabel(cfg.lastAction)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
