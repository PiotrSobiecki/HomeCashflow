import { useState, useEffect, useCallback } from 'react'
import { Power, Loader2, RefreshCw } from 'lucide-react'
import { fetchIrKeys, sendIrKey } from '../lib/api'

// Przyjazne polskie etykiety dla typowych przycisków pilota (fallback = key_name z Tuya).
const LABELS = {
  power: 'Zasilanie', poweroff: 'Wyłącz', poweron: 'Włącz',
  mute: 'Wycisz', menu: 'Menu', back: 'Wstecz', exit: 'Wyjście', home: 'Home',
  ok: 'OK', confirm: 'OK',
  up: '▲', down: '▼', left: '◀', right: '▶',
  vol_add: 'Głośność +', vol_red: 'Głośność −', volume_up: 'Głośność +', volume_down: 'Głośność −',
  ch_add: 'Kanał +', ch_red: 'Kanał −', channel_up: 'Kanał +', channel_down: 'Kanał −',
  signal: 'Źródło', source: 'Źródło', input: 'Źródło',
}

const labelFor = (k) => LABELS[String(k?.key || '').toLowerCase()] || k?.key_name || k?.key || '—'
const isPower = (k) => /power/i.test(k?.key || '')

/**
 * Pilot IR (TV/STB/itp.): siatka przycisków pobranych z Tuya. Bezstanowy — tylko wysyłka.
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

  const press = async (k) => {
    setBusyKey(k.key_id ?? k.key)
    try {
      await sendIrKey(deviceId, { key: k.key, keyId: k.key_id ?? null, categoryId })
    } catch {
      setError('Nie udało się wysłać przycisku.')
    } finally {
      setBusyKey(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4 mb-3">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
      </div>
    )
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

  const powerKey = keys.find(isPower)
  const rest = keys.filter((k) => !isPower(k))

  return (
    <div className="space-y-2 mb-3">
      {powerKey && (
        <button
          type="button" disabled={disabled || busyKey != null}
          onClick={() => press(powerKey)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          <Power className="w-4 h-4" /> {labelFor(powerKey)}
        </button>
      )}
      <div className="grid grid-cols-3 gap-1.5">
        {rest.map((k) => {
          const id = k.key_id ?? k.key
          return (
            <button
              key={id} type="button"
              disabled={disabled || busyKey != null}
              onClick={() => press(k)}
              className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                busyKey === id ? 'bg-indigo-500 text-white' : 'bg-slate-700/50 hover:bg-slate-600 text-slate-200'
              }`}
            >
              {labelFor(k)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
