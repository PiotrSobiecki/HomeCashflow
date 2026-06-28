import { useState, useEffect } from 'react'
import { Bell, ChevronDown, ChevronRight } from 'lucide-react'
import {
  loadPushStatus,
  getPushSupportInfo,
  describePushClientError,
  subscribeDevicePush,
} from '../lib/push'

const fieldClass =
  'px-1.5 py-0.5 bg-slate-900/60 border border-slate-600 rounded-md text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50'

const CYCLE_TYPES = new Set(['washer', 'dryer', 'dishwasher'])

const cycleLabel = (type) =>
  type === 'dryer' ? 'suszarka skończy'
    : type === 'dishwasher' ? 'zmywarka skończy'
      : 'pralka skończy'

const parseThresholdInput = (raw) => {
  const s = String(raw ?? '').trim()
  if (!s) return null
  const n = Number(s.replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return NaN
  return n
}

const ThresholdInput = ({ symbol, value, onChange, onSave, disabled, saving, ariaLabel }) => (
  <>
    <span className="shrink-0 text-[11px]">
      <span className="hidden sm:inline">Powiadom </span>
      {symbol}
    </span>
    <input
      type="text"
      inputMode="decimal"
      value={value}
      disabled={disabled || saving}
      onChange={onChange}
      onBlur={onSave}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSave() } }}
      placeholder="—"
      className={`${fieldClass} w-12 text-center tabular-nums shrink-0 disabled:opacity-40`}
      aria-label={ariaLabel}
    />
    <span className="text-[11px] text-slate-500 shrink-0">W</span>
  </>
)

const validatePlugThresholds = (thresholdMax, thresholdMin) => {
  const max = parseThresholdInput(thresholdMax)
  const min = parseThresholdInput(thresholdMin)
  if (Number.isNaN(max) || Number.isNaN(min)) return { error: 'Podaj dodatni próg mocy lub zostaw puste.' }
  if (max == null && min == null) return { error: 'Ustaw przynajmniej jeden próg.' }
  if (max != null && min != null && min >= max) return { error: 'Próg „<" musi być mniejszy niż „>".' }
  return { max, min }
}

/**
 * Powiadomienia push per urządzenie: koniec cyklu AGD (ST) lub progi mocy gniazdka.
 */
export const DeviceNotifySettings = ({ device, disabled, isOwner, onSave }) => {
  const isCycle = CYCLE_TYPES.has(device.deviceType)
  const isPlug = device.deviceType === 'plug'
  if (!isOwner || (!isCycle && !isPlug)) return null

  const [open, setOpen] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 640px)').matches,
  )
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [thresholdMax, setThresholdMax] = useState(
    device.powerThresholdW != null ? String(device.powerThresholdW) : '',
  )
  const [thresholdMin, setThresholdMin] = useState(
    device.powerThresholdMinW != null ? String(device.powerThresholdMinW) : '',
  )
  const [pushState, setPushState] = useState(() => {
    const info = getPushSupportInfo()
    return {
      supported: info.supported,
      configured: false,
      subscribed: false,
      washerCycleNotify: false,
      plugPowerNotify: false,
      hint: info.hint,
    }
  })

  const deviceEnabled = isCycle
    ? device.cycleNotifyEnabled
    : device.plugNotifyEnabled
  const pushFlag = isCycle ? 'washerCycleNotify' : 'plugPowerNotify'
  const pushOn = pushState.subscribed && pushState[pushFlag]
  const plugActive = device.plugNotifyEnabled && pushOn

  useEffect(() => {
    loadPushStatus().then(setPushState).catch(() => {})
  }, [])

  useEffect(() => {
    setThresholdMax(device.powerThresholdW != null ? String(device.powerThresholdW) : '')
    setThresholdMin(device.powerThresholdMinW != null ? String(device.powerThresholdMinW) : '')
  }, [device.powerThresholdW, device.powerThresholdMinW])

  const ensurePush = async () => {
    const result = await subscribeDevicePush({ [pushFlag]: true })
    if (result === 'denied') throw new Error('Przeglądarka zablokowała powiadomienia.')
    if (result === 'unsupported') throw new Error('Ta przeglądarka nie obsługuje powiadomień push.')
    if (result === 'not_configured') throw new Error('Serwer nie ma skonfigurowanych kluczy push.')
    setPushState(await loadPushStatus())
  }

  const saveCycle = async (next) => {
    setSaving(true)
    setMsg('')
    try {
      if (next) await ensurePush()
      await onSave(device.id, { cycleNotifyEnabled: next })
      setMsg(next ? 'Powiadomienia włączone.' : 'Powiadomienia wyłączone.')
    } catch (err) {
      setMsg(describePushClientError(err))
    } finally {
      setSaving(false)
    }
  }

  const savePlug = async () => {
    if (!device.plugNotifyEnabled) return
    const v = validatePlugThresholds(thresholdMax, thresholdMin)
    if (v.error) {
      setMsg(v.error)
      return
    }
    setSaving(true)
    setMsg('')
    try {
      await onSave(device.id, {
        plugNotifyEnabled: true,
        powerThresholdW: v.max,
        powerThresholdMinW: v.min,
      })
      setMsg('Zapisano progi.')
    } catch (err) {
      setMsg(describePushClientError(err))
    } finally {
      setSaving(false)
    }
  }

  const togglePlug = async (next) => {
    setSaving(true)
    setMsg('')
    try {
      if (next) {
        const v = validatePlugThresholds(thresholdMax, thresholdMin)
        if (v.error) {
          setMsg(v.error)
          return
        }
        await ensurePush()
        await onSave(device.id, {
          plugNotifyEnabled: true,
          powerThresholdW: v.max,
          powerThresholdMinW: v.min,
        })
        setMsg('Powiadomienia włączone.')
      } else {
        await onSave(device.id, { plugNotifyEnabled: false })
        setMsg('Powiadomienia wyłączone.')
      }
    } catch (err) {
      setMsg(describePushClientError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <Bell className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
          <span className="truncate">Powiadomienia na telefonie</span>
          {deviceEnabled && (isCycle ? pushOn : plugActive) && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0">
              wł.
            </span>
          )}
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 shrink-0" />
        )}
      </button>

      {open && (
        <div
          className="mt-2.5 rounded-xl border border-slate-700/50 bg-slate-900/40 px-2.5 py-2 space-y-1.5"
          title="Sprawdzane co 15 minut"
        >
          {!pushState.supported ? (
            <p className="text-[11px] text-slate-500 leading-snug">
              {pushState.hint || 'Ta przeglądarka nie obsługuje powiadomień push.'}
            </p>
          ) : !pushState.configured ? (
            <p className="text-[11px] text-slate-500 leading-snug">
              Powiadomienia push nie są skonfigurowane na serwerze.
            </p>
          ) : isCycle ? (
            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={deviceEnabled && pushOn}
                disabled={disabled || saving}
                onChange={(e) => saveCycle(e.target.checked)}
                className="accent-indigo-500 mt-0.5 shrink-0"
              />
              <span className="leading-snug">
                Powiadom, gdy {cycleLabel(device.deviceType)} pracę.
              </span>
            </label>
          ) : (
            <div
              className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-slate-300 min-w-0"
              title="Powiadom push gdy moc przekroczy próg (> lub <). Sprawdzane co 15 min."
            >
              <input
                type="checkbox"
                checked={plugActive}
                disabled={disabled || saving}
                onChange={(e) => togglePlug(e.target.checked)}
                className="accent-indigo-500 shrink-0"
                aria-label="Włącz powiadomienia push dla gniazdka"
              />
              <ThresholdInput
                symbol=">"
                value={thresholdMax}
                onChange={(e) => { setThresholdMax(e.target.value); setMsg('') }}
                onSave={savePlug}
                disabled={disabled}
                saving={saving}
                ariaLabel="Próg górny w watach"
              />
              <span className="text-slate-600 shrink-0 px-0.5" aria-hidden>·</span>
              <ThresholdInput
                symbol="<"
                value={thresholdMin}
                onChange={(e) => { setThresholdMin(e.target.value); setMsg('') }}
                onSave={savePlug}
                disabled={disabled}
                saving={saving}
                ariaLabel="Próg dolny w watach"
              />
            </div>
          )}
          {msg && (
            <p className={`text-[11px] leading-snug ${msg.includes('włączone') || msg.includes('Zapisano') ? 'text-emerald-400' : 'text-slate-400'}`}>
              {msg}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
