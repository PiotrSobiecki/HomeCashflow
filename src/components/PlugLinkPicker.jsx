import { useState } from 'react'
import { Plug, X, Loader2 } from 'lucide-react'

/**
 * Powiązanie urządzenia IR (pilot) z gniazdkiem mierzącym pobór — realny stan zestawu.
 * Owner: gdy brak powiązania → wybór gniazdka; gdy jest → nazwa + odepnij.
 * @param {object} device — urządzenie IR (ma linkedPlugId)
 * @param {Array} plugs — dostępne gniazdka [{id, displayName}]
 * @param {(deviceId, plugId|null)=>Promise} onLinkPlug
 */
export const PlugLinkPicker = ({ device, plugs, onLinkPlug }) => {
  const [busy, setBusy] = useState(false)
  const linked = plugs.find((p) => p.id === device.linkedPlugId) || null

  const set = async (plugId) => {
    setBusy(true)
    try { await onLinkPlug(device.id, plugId) } finally { setBusy(false) }
  }

  if (linked) {
    return (
      <div className="flex items-center justify-between gap-2 text-xs text-slate-300 mb-3 bg-slate-900/40 border border-slate-700/40 rounded-xl px-3 py-2">
        <span className="flex items-center gap-1.5 min-w-0">
          <Plug className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">Stan z gniazdka: <span className="text-white">{linked.displayName}</span></span>
        </span>
        <button
          type="button" disabled={busy} onClick={() => set(null)}
          title="Odepnij gniazdko"
          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded shrink-0 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
        </button>
      </div>
    )
  }

  if (plugs.length === 0) return null

  return (
    <div className="flex items-center gap-2 mb-3">
      <Plug className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      <select
        value="" disabled={busy}
        onChange={(e) => e.target.value && set(e.target.value)}
        className="flex-1 px-2 py-1.5 bg-slate-900/60 border border-slate-600 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
      >
        <option value="">Dodaj do gniazdka (realny stan)…</option>
        {plugs.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
      </select>
    </div>
  )
}
