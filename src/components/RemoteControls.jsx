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
  home: ['home'],
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
 * Pilot IR (TV/STB/itp.): zasilanie, głośność, kanały, nawigacja, menu.
 * Sam pilot jest bezstanowy; gdy powiązany z gniazdkiem, `powerOn`/`plugW` dają realny
 * stan zestawu (etykieta Włącz/Wyłącz + pobór).
 * @param {string} deviceId
 * @param {boolean} disabled
 * @param {boolean|null} powerOn — realny stan zestawu z gniazdka (null = nieznany)
 * @param {number|null} plugW — pobór zestawu w W (gdy powiązane)
 */
export const RemoteControls = ({ deviceId, disabled, powerOn = null, plugW = null }) => {
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

  const find = (slot) => {
    const wanted = ALIASES[slot]
    return keys.find((x) => wanted.includes(norm(x.key)) || wanted.includes(norm(x.key_name))) || null
  }
  const slot = Object.fromEntries(Object.keys(ALIASES).map((s) => [s, find(s)]))

  const busy = (k) => busyKey === (k?.key_id ?? k?.key)
  const off = disabled || busyKey != null

  const hasVolume = slot.volUp || slot.volDown
  const hasChannel = slot.chUp || slot.chDown
  const hasNav = slot.up || slot.down || slot.left || slot.right || slot.ok
  const hasNavRow = slot.menu || slot.home || slot.back

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-3 sm:p-4 mb-3 space-y-3 overflow-hidden max-w-full">
      {/* Realny stan zestawu z powiązanego gniazdka */}
      {powerOn != null && (
        <p className="flex items-center gap-1.5 text-[11px]">
          <span className={`w-2 h-2 rounded-full ${powerOn ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          <span className={powerOn ? 'text-emerald-400' : 'text-slate-400'}>
            {powerOn ? 'Włączony' : 'Uśpiony'}
          </span>
          {plugW != null && <span className="text-slate-500">· {plugW} W</span>}
        </p>
      )}
      {/* Zasilanie / źródło / wycisz */}
      <div className="grid grid-cols-3 gap-2">
        <IconBtn k={slot.power} icon={Power} label={powerOn === true ? 'Wyłącz' : powerOn === false ? 'Włącz' : 'Zasilanie'} tone="danger" onPress={press} off={off} busy={busy} />
        <IconBtn k={slot.source} icon={Tv} label="Źródło" onPress={press} off={off} busy={busy} />
        <IconBtn k={slot.mute} icon={VolumeX} label="Wycisz" onPress={press} off={off} busy={busy} />
      </div>

      {/* Głośność | nawigacja | kanały — siatka 3 kolumn, mieści się w karcie */}
      {(hasVolume || hasNav || hasChannel) && (
        <div className="grid grid-cols-3 gap-1 items-center w-full max-w-full">
          <div className="flex justify-center min-w-0">
            {hasVolume && (
              <Rocker
                icon={Volume2}
                label="Głoś."
                up={slot.volUp}
                down={slot.volDown}
                onPress={press}
                off={off}
                busy={busy}
              />
            )}
          </div>
          <div className="flex justify-center min-w-0">
            {hasNav && (
              <div className="flex flex-col items-center gap-1">
                <ArrowBtn k={slot.up} icon={ChevronUp} onPress={press} off={off} busy={busy} />
                <div className="flex items-center gap-1">
                  <ArrowBtn k={slot.left} icon={ChevronLeft} onPress={press} off={off} busy={busy} />
                  <button
                    type="button"
                    disabled={off || !slot.ok}
                    onClick={() => press(slot.ok)}
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full text-xs font-semibold transition-colors disabled:opacity-40 shrink-0 ${
                      busy(slot.ok) ? 'bg-indigo-500 text-white' : 'bg-indigo-500/25 text-indigo-100 hover:bg-indigo-500/40 ring-1 ring-indigo-500/30'
                    }`}
                  >
                    OK
                  </button>
                  <ArrowBtn k={slot.right} icon={ChevronRight} onPress={press} off={off} busy={busy} />
                </div>
                <ArrowBtn k={slot.down} icon={ChevronDown} onPress={press} off={off} busy={busy} />
              </div>
            )}
          </div>
          <div className="flex justify-center min-w-0">
            {hasChannel && (
              <Rocker
                icon={Tv}
                label="Kanał"
                up={slot.chUp}
                down={slot.chDown}
                onPress={press}
                off={off}
                busy={busy}
              />
            )}
          </div>
        </div>
      )}

      {/* Menu / Home / Wstecz */}
      {hasNavRow && (
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-700/40">
          <IconBtn k={slot.menu} icon={Menu} label="Menu" onPress={press} off={off} busy={busy} />
          <IconBtn k={slot.home} icon={Home} label="Home" onPress={press} off={off} busy={busy} />
          <IconBtn k={slot.back} icon={CornerUpLeft} label="Wstecz" onPress={press} off={off} busy={busy} />
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
    type="button"
    disabled={off || !k}
    onClick={() => onPress(k)}
    className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-[11px] font-medium transition-colors disabled:opacity-40 ${toneCls(tone, busy(k))}`}
  >
    <Icon className="w-4 h-4" /> {label}
  </button>
)

const ArrowBtn = ({ k, icon: Icon, onPress, off, busy }) => (
  <button
    type="button"
    disabled={off || !k}
    onClick={() => onPress(k)}
    className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-slate-600 transition-colors disabled:opacity-40 shrink-0 ${busy(k) ? '!bg-indigo-500 text-white' : 'text-slate-200'}`}
  >
    <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
  </button>
)

const Rocker = ({ icon: Icon, label, up, down, onPress, off, busy }) => (
  <div className="flex flex-col items-center gap-0.5 bg-slate-800/70 border border-slate-700/50 rounded-xl px-1.5 py-1.5 w-full max-w-[4.5rem]">
    <button
      type="button"
      disabled={off || !up}
      onClick={() => onPress(up)}
      className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 ${busy(up) ? 'bg-indigo-500 text-white' : 'bg-slate-700/60 text-slate-200 hover:bg-slate-600'}`}
    >
      <Plus className="w-3.5 h-3.5" />
    </button>
    <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-medium text-slate-400 py-0.5 text-center leading-tight">
      <Icon className="w-3 h-3 shrink-0" />{label}
    </span>
    <button
      type="button"
      disabled={off || !down}
      onClick={() => onPress(down)}
      className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 ${busy(down) ? 'bg-indigo-500 text-white' : 'bg-slate-700/60 text-slate-200 hover:bg-slate-600'}`}
    >
      <Minus className="w-3.5 h-3.5" />
    </button>
  </div>
)
