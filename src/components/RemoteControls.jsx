import { useState, useEffect, useCallback } from 'react'
import {
  Power, Loader2, RefreshCw, Volume2, VolumeX, Menu, Home, CornerUpLeft,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Plus, Minus, Tv,
} from 'lucide-react'
import { fetchIrKeys, sendIrKey } from '../lib/api'

// Aliasy nazw klawiszy Tuya → logiczne sloty pilota. Dopasowanie po `key` LUB `key_name`
// (Tuya bywa niespójna: key="Volume+", key_name="volume_up"). norm zachowuje +/-.
const ALIASES = {
  power: ['power', 'poweroff', 'poweron'],
  mute: ['mute'],
  source: ['source', 'input', 'signal'],
  menu: ['menu'],
  back: ['exit', 'back', 'return'],
  ok: ['ok', 'enter', 'confirm'],
  up: ['up', 'navigateup'],
  down: ['down', 'navigatedown'],
  left: ['left', 'navigateleft'],
  right: ['right', 'navigateright'],
  volUp: ['volume+', 'volumeup', 'vol+', 'voladd'],
  volDown: ['volume-', 'volumedown', 'vol-', 'volred'],
  chUp: ['channel+', 'channelup', 'ch+', 'chadd', 'chup', 'progadd'],
  chDown: ['channel-', 'channeldown', 'ch-', 'chred', 'chdown', 'progred'],
}

const norm = (s) => String(s || '').toLowerCase().replace(/[\s_]/g, '')

/**
 * Pilot IR (TV/STB/itp.): układ przypominający fizyczny pilot. Sloty mapowane po nazwach
 * klawiszy Tuya; rozpoznane idą na stałe miejsca, reszta do sekcji „Więcej". Bezstanowy.
 * @param {string} deviceId
 * @param {boolean} disabled
 */
export const RemoteControls = ({ deviceId, disabled }) => {
  const [keys, setKeys] = useState(null)
  const [categoryId, setCategoryId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyKey, setBusyKey] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchIrKeys(deviceId)
      setKeys(data.keys || [])
      setCategoryId(data.categoryId ?? null)
    } catch {
      setError('Nie udało się pobrać przycisków pilota. Sprawdź, czy w Tuya włączone jest API podczerwieni.')
    } finally {
      setLoading(false)
    }
  }, [deviceId])

  useEffect(() => { load() }, [load])

  const press = useCallback(async (k) => {
    if (!k) return
    setBusyKey(k.key_id ?? k.key)
    try {
      await sendIrKey(deviceId, { key: k.key, keyId: k.key_id ?? null, categoryId })
    } catch {
      setError('Nie udało się wysłać przycisku.')
    } finally {
      setBusyKey(null)
    }
  }, [deviceId, categoryId])

  if (loading) {
    return <div className="flex justify-center py-4 mb-3"><Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /></div>
  }
  if (error) {
    return (
      <div className="mb-3">
        <p className="text-xs text-rose-400 mb-2">{error}</p>
        <button type="button" onClick={load} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400">
          <RefreshCw className="w-3.5 h-3.5" /> Spróbuj ponownie
        </button>
      </div>
    )
  }
  if (!keys || keys.length === 0) {
    return <p className="text-xs text-slate-500 mb-3">Ten pilot nie ma zapisanych przycisków w Tuya.</p>
  }

  // Dopasowanie slotów po `key` lub `key_name`.
  const find = (slot) => {
    const wanted = ALIASES[slot]
    return keys.find((x) => wanted.includes(norm(x.key)) || wanted.includes(norm(x.key_name))) || null
  }
  const slot = Object.fromEntries(Object.keys(ALIASES).map((s) => [s, find(s)]))

  // Cyfry 0–9 (po `key` lub `key_name`).
  const digits = []
  for (let d = 0; d <= 9; d++) {
    digits[d] = keys.find((x) => norm(x.key) === String(d) || norm(x.key_name) === String(d)) || null
  }
  const hasDigits = digits.some(Boolean)

  const busy = (k) => busyKey === (k?.key_id ?? k?.key)
  const off = disabled || busyKey != null

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-3 mb-3 space-y-3">
      {/* Góra: zasilanie / źródło / wycisz */}
      <div className="grid grid-cols-3 gap-2">
        <IconBtn k={slot.power} icon={Power} label="Zasil." tone="danger" onPress={press} off={off} busy={busy} />
        <IconBtn k={slot.source} icon={Tv} label="Źródło" onPress={press} off={off} busy={busy} />
        <IconBtn k={slot.mute} icon={VolumeX} label="Wycisz" onPress={press} off={off} busy={busy} />
      </div>

      {/* Kołyski głośności/kanałów + krzyżak nawigacji */}
      {(slot.volUp || slot.volDown || slot.chUp || slot.chDown || slot.up || slot.down || slot.left || slot.right || slot.ok) && (
        <div className="grid grid-cols-3 gap-2 items-center">
          {/* Głośność */}
          <Rocker icon={Volume2} label="Głoś."
            up={slot.volUp} down={slot.volDown} onPress={press} off={off} busy={busy} />

          {/* Krzyżak */}
          <div className="flex flex-col items-center gap-1">
            <ArrowBtn k={slot.up} icon={ChevronUp} onPress={press} off={off} busy={busy} />
            <div className="flex items-center gap-1">
              <ArrowBtn k={slot.left} icon={ChevronLeft} onPress={press} off={off} busy={busy} />
              <button
                type="button" disabled={off || !slot.ok} onClick={() => press(slot.ok)}
                className={`w-12 h-12 rounded-full text-xs font-semibold transition-colors disabled:opacity-40 ${
                  busy(slot.ok) ? 'bg-indigo-500 text-white' : 'bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30'
                }`}
              >OK</button>
              <ArrowBtn k={slot.right} icon={ChevronRight} onPress={press} off={off} busy={busy} />
            </div>
            <ArrowBtn k={slot.down} icon={ChevronDown} onPress={press} off={off} busy={busy} />
          </div>

          {/* Kanały */}
          <Rocker icon={Tv} label="Kanał"
            up={slot.chUp} down={slot.chDown} onPress={press} off={off} busy={busy} />
        </div>
      )}

      {/* Menu / Home / Wstecz */}
      {(slot.menu || slot.home || slot.back) && (
        <div className="grid grid-cols-3 gap-2">
          <IconBtn k={slot.menu} icon={Menu} label="Menu" onPress={press} off={off} busy={busy} />
          <IconBtn k={slot.home} icon={Home} label="Home" onPress={press} off={off} busy={busy} />
          <IconBtn k={slot.back} icon={CornerUpLeft} label="Wstecz" onPress={press} off={off} busy={busy} />
        </div>
      )}

      {/* Klawiatura numeryczna */}
      {hasDigits && (
        <div className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <NumBtn key={d} k={digits[d]} n={d} onPress={press} off={off} busy={busy} />
          ))}
          <div />
          <NumBtn k={digits[0]} n={0} onPress={press} off={off} busy={busy} />
          <div />
        </div>
      )}
    </div>
  )
}

const toneCls = (tone, active) => {
  if (active) return 'bg-indigo-500 text-white'
  if (tone === 'danger') return 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
  return 'bg-slate-700/50 text-slate-200 hover:bg-slate-600'
}

const IconBtn = ({ k, icon: Icon, label, tone, onPress, off, busy }) => (
  <button
    type="button" disabled={off || !k} onClick={() => onPress(k)}
    className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[11px] font-medium transition-colors disabled:opacity-40 ${toneCls(tone, busy(k))}`}
  >
    <Icon className="w-4 h-4" /> {label}
  </button>
)

const ArrowBtn = ({ k, icon: Icon, onPress, off, busy }) => (
  <button
    type="button" disabled={off || !k} onClick={() => onPress(k)}
    className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 ${toneCls(null, busy(k))}`}
  >
    <Icon className="w-5 h-5" />
  </button>
)

const Rocker = ({ icon: Icon, label, up, down, onPress, off, busy }) => (
  <div className="flex flex-col items-center gap-1 bg-slate-800/60 rounded-full py-1.5">
    <button type="button" disabled={off || !up} onClick={() => onPress(up)}
      className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 ${toneCls(null, busy(up))}`}>
      <Plus className="w-4 h-4" />
    </button>
    <span className="flex items-center gap-0.5 text-[10px] text-slate-400"><Icon className="w-3 h-3" />{label}</span>
    <button type="button" disabled={off || !down} onClick={() => onPress(down)}
      className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 ${toneCls(null, busy(down))}`}>
      <Minus className="w-4 h-4" />
    </button>
  </div>
)

const NumBtn = ({ k, n, onPress, off, busy }) => (
  <button
    type="button" disabled={off || !k} onClick={() => onPress(k)}
    className={`py-2 rounded-lg text-sm font-semibold tabular-nums transition-colors disabled:opacity-30 ${toneCls(null, busy(k))}`}
  >{n}</button>
)
