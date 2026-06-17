import { useState, useEffect, useCallback } from 'react'
import { Power, Clock } from 'lucide-react'
import { fetchDeviceTimer, setDeviceTimer } from '../lib/api'

const MAX_MIN = 12 * 60 // suwak do 12 h
const STEP = 30 // co 30 minut

const fmt = (min) => {
  if (min <= 0) return 'wył.'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

const snap = (min) => Math.min(MAX_MIN, Math.round(min / STEP) * STEP)

/**
 * Wyłącznik czasowy urządzenia IR — suwak jak countdown w gniazdkach, ale egzekwowany
 * serwerowo (cron). Czyta aktywny timer, na puszczenie suwaka ustawia/anuluje.
 * @param {string} deviceId
 * @param {boolean} disabled
 */
export const DeviceTimer = ({ deviceId, disabled }) => {
  const [min, setMin] = useState(0)
  const [fireAt, setFireAt] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const { timer } = await fetchDeviceTimer(deviceId)
      // Aktywny timer nigdy nie pokazuje „wył." (min. jeden krok), nawet gdy zostało <15 min.
      setMin(timer ? Math.max(STEP, snap(timer.minutesLeft)) : 0)
      setFireAt(timer?.fireAt ?? null)
    } catch {
      // cicho — timer to nie krytyczna ścieżka
    }
  }, [deviceId])

  useEffect(() => { load() }, [load])

  // Gdy minie czas — wyzeruj suwak (serwer i tak wyłączy urządzenie cronem).
  useEffect(() => {
    if (!fireAt) return
    const ms = new Date(fireAt).getTime() - Date.now()
    if (ms <= 0) { setMin(0); setFireAt(null); return }
    const id = setTimeout(() => { setMin(0); setFireAt(null) }, ms)
    return () => clearTimeout(id)
  }, [fireAt])

  const commit = async (value) => {
    setBusy(true)
    try {
      const { timer } = await setDeviceTimer(deviceId, value)
      setFireAt(timer?.fireAt ?? null)
      setMin(timer ? snap(timer.minutesLeft) : 0)
    } catch {
      load()
    } finally {
      setBusy(false)
    }
  }

  const offTime = fireAt
    ? new Date(fireAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="pt-3 mt-1 border-t border-slate-700/40">
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-xs text-slate-300">
          <Power className="w-3.5 h-3.5" /> Wyłącz za
        </span>
        <span className="text-xs font-medium text-white tabular-nums">{fmt(min)}</span>
      </div>
      <input
        type="range" min={0} max={MAX_MIN} step={STEP} value={min}
        disabled={disabled || busy}
        onChange={(e) => setMin(Number(e.target.value))}
        onPointerUp={(e) => commit(Number(e.currentTarget.value))}
        onKeyUp={(e) => commit(Number(e.currentTarget.value))}
        className="w-full accent-indigo-500 disabled:opacity-50"
      />
      {min > 0 && offTime && (
        <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
          <Clock className="w-3 h-3" /> Wyłączy się o {offTime}
        </p>
      )}
    </div>
  )
}
