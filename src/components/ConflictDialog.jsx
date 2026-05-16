import { AlertTriangle } from 'lucide-react'

/**
 * Modal pokazywany gdy PATCH/DELETE per-row dostaje 409 (ktoś inny zmienił ten rekord równolegle).
 * Daje dwie opcje:
 *  - "Nadpisz mimo to" — frontend retry mutacji z aktualnym updated_at z odpowiedzi serwera
 *  - "Anuluj i pokaż aktualne" — zastąp lokalny stan świeżą wersją (utracenie wpisanego edytu)
 *
 * Domyślny focus na "Anuluj" (bezpieczniejsze).
 *
 * Props:
 *   open: boolean
 *   onOverride: () => void
 *   onCancel: () => void
 *   resourceLabel: string — np. "Lunch" (z attemptedEdit)
 *   yours: { name, amount } — co próbowałeś zapisać
 *   theirs: { name, amount } — co aktualnie jest na serwerze
 */
export function ConflictDialog({ open, onOverride, onCancel, resourceLabel, yours, theirs }) {
  if (!open) return null

  const fmt = (v) =>
    typeof v === 'number'
      ? new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(v)
      : v

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflict-dialog-title"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <h4 id="conflict-dialog-title" className="text-lg font-semibold text-white">
            Ktoś inny zmienił ten wpis
          </h4>
        </div>

        <p className="text-slate-300 text-sm mb-4">
          {resourceLabel && <span>Wpis „{resourceLabel}” </span>}
          został zmodyfikowany z innego urządzenia w trakcie twojej edycji.
        </p>

        {(yours || theirs) && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {yours && (
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Twoja zmiana</p>
                <p className="text-white font-medium text-sm break-words">{yours.name}</p>
                <p className="text-amber-300 text-sm">{fmt(yours.amount)}</p>
              </div>
            )}
            {theirs && (
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Aktualne na serwerze</p>
                <p className="text-white font-medium text-sm break-words">{theirs.name}</p>
                <p className="text-emerald-300 text-sm">{fmt(theirs.amount)}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            autoFocus
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-all"
          >
            Anuluj i pokaż aktualne
          </button>
          <button
            type="button"
            onClick={onOverride}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-all"
          >
            Nadpisz mimo to
          </button>
        </div>
      </div>
    </div>
  )
}
