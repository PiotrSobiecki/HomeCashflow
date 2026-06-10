import { useState } from 'react'

// Przyjazne etykiety dla typowych DP (fallback = surowy code).
const LABELS = {
  switch_1: 'Zasilanie',
  switch: 'Zasilanie',
  switch_led: 'Podświetlenie',
  child_lock: 'Blokada rodzicielska',
  bright_value: 'Jasność',
  bright_value_v2: 'Jasność',
  temp_value: 'Temperatura barwy',
  temp_value_v2: 'Temperatura barwy',
  work_mode: 'Tryb pracy',
  countdown_1: 'Wyłącznik czasowy',
}

const labelFor = (code) => LABELS[code] || code

function parseValues(values) {
  if (values == null) return {}
  if (typeof values === 'object') return values
  try { return JSON.parse(values) } catch { return {} }
}

const isWritableType = (t) => ['boolean', 'enum', 'integer'].includes(String(t || '').toLowerCase())

/**
 * Renderuje maksymalny zakres sterowania urządzeniem z zapisywalnych DP.
 * @param {object} functionsJson — snapshot { functions: [{code,type,values}] }
 * @param {object} raw — bieżące wartości DP (status.raw)
 * @param {(commands:Array)=>Promise} onSend
 */
export const DeviceControls = ({ functionsJson, raw = {}, onSend, disabled }) => {
  const [busyCode, setBusyCode] = useState(null)

  const fns = (functionsJson?.functions || []).filter((f) => isWritableType(f.type))
  if (fns.length === 0) return null

  const send = async (code, value) => {
    setBusyCode(code)
    try { await onSend([{ code, value }]) } finally { setBusyCode(null) }
  }

  return (
    <div className="space-y-2.5 mb-3">
      {fns.map((fn) => {
        const type = String(fn.type).toLowerCase()
        const current = raw[fn.code]
        const busy = busyCode === fn.code || disabled

        if (type === 'boolean') {
          const on = current === true
          return (
            <Row key={fn.code} label={labelFor(fn.code)}>
              <button
                type="button" disabled={busy}
                onClick={() => send(fn.code, !on)}
                className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${on ? 'bg-emerald-500' : 'bg-slate-600'}`}
                aria-pressed={on}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${on ? 'translate-x-5' : ''}`} />
              </button>
            </Row>
          )
        }

        if (type === 'enum') {
          const range = parseValues(fn.values).range || []
          return (
            <Row key={fn.code} label={labelFor(fn.code)}>
              <select
                value={current ?? ''} disabled={busy}
                onChange={(e) => send(fn.code, e.target.value)}
                className="px-2 py-1 bg-slate-900/60 border border-slate-600 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              >
                <option value="" disabled>—</option>
                {range.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Row>
          )
        }

        // integer
        const { min = 0, max = 100, step = 1 } = parseValues(fn.values)
        const val = typeof current === 'number' ? current : min
        return (
          <Row key={fn.code} label={labelFor(fn.code)}>
            <div className="flex items-center gap-2 w-40">
              <input
                type="range" min={min} max={max} step={step || 1} defaultValue={val} disabled={busy}
                onChange={(e) => send(fn.code, Number(e.target.value))}
                className="flex-1 accent-indigo-500 disabled:opacity-50"
              />
              <span className="text-xs text-slate-400 w-10 text-right tabular-nums">{val}</span>
            </div>
          </Row>
        )
      })}
    </div>
  )
}

const Row = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs text-slate-300 truncate">{label}</span>
    {children}
  </div>
)
