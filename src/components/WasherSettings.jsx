import { useState } from 'react'
import { Thermometer, Wind, Droplets, Waves, ListChecks } from 'lucide-react'

// Kolejność i nagłówki paneli. Każde ustawienie dostajemy z backendu jako
// { value, options:[{value,label}] } — UI jest „głupie", całe nazewnictwo siedzi w status.js/washer.js.
const FIELDS = [
  { key: 'cycle', label: 'Program', Icon: ListChecks },
  { key: 'temperature', label: 'Temperatura', Icon: Thermometer },
  { key: 'spin', label: 'Wirowanie', Icon: Wind },
  { key: 'rinse', label: 'Płukanie', Icon: Droplets },
  { key: 'bubbleSoak', label: 'Namaczanie', Icon: Waves },
]

/**
 * Ustawienia cyklu pralki SmartThings (temperatura/wirowanie/płukanie/namaczanie/program).
 * Działa tylko przy włączonym zdalnym sterowaniu i gdy pralka nie jest w trakcie cyklu —
 * inaczej `disabled`. Zmianę wysyłamy per pole; błąd pokazujemy pod panelem.
 *
 * @param {object} settings  mapa z backendu (status.settings) lub null/undefined
 * @param {(setting:string,value:string)=>Promise} onSend
 * @param {boolean} disabled  true gdy nie da się teraz zmieniać (offline / cykl w toku)
 */
export const WasherSettings = ({ settings, onSend, disabled }) => {
  const [busyKey, setBusyKey] = useState(null)
  const [err, setErr] = useState('')
  if (!settings) return null

  const fields = FIELDS.filter((f) => settings[f.key]?.options?.length)
  if (!fields.length) return null

  const change = async (key, value) => {
    setErr(''); setBusyKey(key)
    try { await onSend(key, value) }
    catch (e) { setErr(e?.serverMessage || 'Nie udało się zmienić ustawienia.') }
    finally { setBusyKey(null) }
  }

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-3 sm:p-4 mb-3 space-y-2.5">
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Ustawienia prania</p>
      {fields.map(({ key, label, Icon }) => {
        const field = settings[key]
        return (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-300 truncate">
              <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {label}
            </span>
            <select
              value={field.value ?? ''}
              disabled={disabled || busyKey === key}
              onChange={(e) => change(key, e.target.value)}
              className="w-44 px-2 py-1 bg-slate-900/60 border border-slate-600 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            >
              {/* Aktualna wartość spoza listy opcji (rzadkie) — pokaż, by select nie był pusty. */}
              {field.value != null && !field.options.some((o) => o.value === field.value) && (
                <option value={field.value}>{field.value}</option>
              )}
              {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )
      })}
      {disabled && (
        <p className="text-[11px] text-slate-500">Zmiana ustawień możliwa, gdy pralka czeka na start (nie w trakcie prania).</p>
      )}
      {err && <p className="text-[11px] text-rose-400">{err}</p>}
    </div>
  )
}
