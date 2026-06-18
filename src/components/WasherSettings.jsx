import { useState } from 'react'
import { Thermometer, Wind, Droplets, Waves, ListChecks, Pencil, Check, X, Loader2 } from 'lucide-react'

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
 * Edytor własnych nazw programów. SmartThings nie wystawia nazw kursów (tylko kody jak „1C"),
 * więc backend pokazuje draft/opis z parametrów, a właściciel może nadpisać każdy kod własną
 * nazwą. Pole puste = powrót do nazwy domyślnej. Lista kodów = opcje programu (settings.cycle).
 */
function CycleLabelEditor({ options, cycleLabels, onSave, onClose }) {
  const [names, setNames] = useState(() =>
    Object.fromEntries(options.map((o) => [o.value, cycleLabels?.[o.value] ?? ''])),
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    setErr(''); setSaving(true)
    try {
      // Wysyłamy tylko niepuste — puste pole znaczy „użyj domyślnej".
      const map = {}
      for (const [code, name] of Object.entries(names)) {
        const trimmed = name.trim()
        if (trimmed) map[code] = trimmed
      }
      await onSave(map)
      onClose()
    } catch (e) {
      setErr(e?.serverMessage || 'Nie udało się zapisać nazw.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-3 mb-2 space-y-2">
      <p className="text-[11px] text-slate-400">
        Nazwij programy po swojemu — kod (np. <span className="text-slate-300">1C</span>) to identyfikator z pralki.
        Puste pole = nazwa domyślna.
      </p>
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {options.map((o) => (
          <div key={o.value} className="flex items-center gap-2">
            <span className="shrink-0 w-9 text-[10px] font-mono text-slate-500 text-center bg-slate-800/60 rounded px-1 py-0.5">{o.value}</span>
            <input
              value={names[o.value]}
              onChange={(e) => setNames((p) => ({ ...p, [o.value]: e.target.value }))}
              placeholder={o.label}
              maxLength={40}
              className="flex-1 min-w-0 px-2 py-1 bg-slate-900/60 border border-slate-600 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        ))}
      </div>
      {err && <p className="text-[11px] text-rose-400">{err}</p>}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button" onClick={save} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Zapisz
        </button>
        <button
          type="button" onClick={onClose} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs text-slate-400 hover:bg-slate-700/50 disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" /> Anuluj
        </button>
      </div>
    </div>
  )
}

/**
 * Ustawienia cyklu pralki SmartThings (temperatura/wirowanie/płukanie/namaczanie/program).
 * Działa tylko przy włączonym zdalnym sterowaniu i gdy pralka nie jest w trakcie cyklu —
 * inaczej `disabled`. Zmianę wysyłamy per pole; błąd pokazujemy pod panelem.
 *
 * @param {object} settings  mapa z backendu (status.settings) lub null/undefined
 * @param {(setting:string,value:string)=>Promise} onSend
 * @param {boolean} disabled  true gdy nie da się teraz zmieniać (offline / cykl w toku)
 * @param {object} [cycleLabels]  własne nazwy programów (mapa kod→nazwa) do prefillu edytora
 * @param {(labels:object)=>Promise} [onSaveLabels]  zapis nazw (tylko właściciel); null = brak edycji
 */
export const WasherSettings = ({ settings, onSend, disabled, cycleLabels, onSaveLabels }) => {
  const [busyKey, setBusyKey] = useState(null)
  const [err, setErr] = useState('')
  const [editingNames, setEditingNames] = useState(false)
  if (!settings) return null

  const fields = FIELDS.filter((f) => settings[f.key]?.options?.length)
  if (!fields.length) return null

  const change = async (key, value) => {
    setErr(''); setBusyKey(key)
    try { await onSend(key, value) }
    catch (e) { setErr(e?.serverMessage || 'Nie udało się zmienić ustawienia.') }
    finally { setBusyKey(null) }
  }

  const canEditNames = typeof onSaveLabels === 'function' && settings.cycle?.options?.length

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-3 sm:p-4 mb-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Ustawienia prania</p>
        {canEditNames && !editingNames && (
          <button
            type="button" onClick={() => setEditingNames(true)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <Pencil className="w-3 h-3" /> Nazwy programów
          </button>
        )}
      </div>

      {editingNames ? (
        <CycleLabelEditor
          options={settings.cycle.options}
          cycleLabels={cycleLabels}
          onSave={onSaveLabels}
          onClose={() => setEditingNames(false)}
        />
      ) : (
        fields.map(({ key, label, Icon }) => {
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
        })
      )}
      {disabled && !editingNames && (
        <p className="text-[11px] text-slate-500">Zmiana ustawień możliwa, gdy pralka czeka na start (nie w trakcie prania).</p>
      )}
      {err && <p className="text-[11px] text-rose-400">{err}</p>}
    </div>
  )
}
