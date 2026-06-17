import { useState } from 'react'
import { Power, Minus, Plus, Snowflake, Flame, RefreshCcw, Wind, Droplets } from 'lucide-react'

// Standardowe mapowanie trybów/wiatru klimy IR Tuya (Gree). Łatwe do poprawienia,
// gdyby dany pilot miał inną kolejność.
const MODES = [
  { value: 0, label: 'Chłodzenie', icon: Snowflake },
  { value: 1, label: 'Grzanie', icon: Flame },
  { value: 2, label: 'Auto', icon: RefreshCcw },
  { value: 3, label: 'Wentylator', icon: Wind },
  { value: 4, label: 'Osuszanie', icon: Droplets },
]
const WINDS = [
  { value: 0, label: 'Auto' },
  { value: 1, label: 'Niski' },
  { value: 2, label: 'Średni' },
  { value: 3, label: 'Wysoki' },
]
const TEMP_MIN = 16
const TEMP_MAX = 30

/**
 * Panel sterowania klimą na podczerwień (Smart IR): zasilanie / tryb / temperatura / wiatr.
 * Komendy wysyłane jako [{ code, value }] (value liczbowy) — backend tłumaczy na AC API Tuya.
 * @param {{power:number,mode:number,temp:number,wind:number}} ac — bieżący stan z odczytu
 * @param {(commands:Array)=>Promise} onSend
 */
export const AcControls = ({ ac, onSend, disabled }) => {
  const [busy, setBusy] = useState(false)

  const power = ac?.power === 1
  const mode = typeof ac?.mode === 'number' ? ac.mode : 0
  const temp = typeof ac?.temp === 'number' ? ac.temp : 24
  const wind = typeof ac?.wind === 'number' ? ac.wind : 0
  const off = busy || disabled

  const send = async (code, value) => {
    setBusy(true)
    try { await onSend([{ code, value }]) } finally { setBusy(false) }
  }

  const setTemp = (next) => {
    const clamped = Math.max(TEMP_MIN, Math.min(TEMP_MAX, next))
    if (clamped !== temp) send('temp', clamped)
  }

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-3 sm:p-4 mb-3 space-y-3">
      {/* Zasilanie + temperatura */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button" disabled={off}
          onClick={() => send('power', power ? 0 : 1)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
            power ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'
          }`}
          aria-pressed={power}
        >
          <Power className="w-4 h-4" /> {power ? 'Włączona' : 'Wyłączona'}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button" disabled={off || temp <= TEMP_MIN}
            onClick={() => setTemp(temp - 1)}
            className="p-1.5 bg-slate-700/50 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-40"
            aria-label="Zmniejsz temperaturę"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-white font-semibold tabular-nums w-12 text-center">{temp}°C</span>
          <button
            type="button" disabled={off || temp >= TEMP_MAX}
            onClick={() => setTemp(temp + 1)}
            className="p-1.5 bg-slate-700/50 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-40"
            aria-label="Zwiększ temperaturę"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tryb */}
      <Row label="Tryb">
        <select
          value={mode} disabled={off}
          onChange={(e) => send('mode', Number(e.target.value))}
          className="w-40 px-2 py-1 bg-slate-900/60 border border-slate-600 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        >
          {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </Row>

      {/* Wiatr */}
      <Row label="Wiatr">
        <select
          value={wind} disabled={off}
          onChange={(e) => send('wind', Number(e.target.value))}
          className="w-40 px-2 py-1 bg-slate-900/60 border border-slate-600 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        >
          {WINDS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
        </select>
      </Row>
    </div>
  )
}

const Row = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs text-slate-300 truncate">{label}</span>
    {children}
  </div>
)
