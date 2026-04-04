import { Trash2 } from 'lucide-react'

/**
 * Modal potwierdzenia (ten sam wzorzec co przy usuwaniu gospodarstwa).
 * @param {'danger' | 'warning'} variant — danger = czerwony przycisk akcji, warning = bursztynowy (np. pierwszy krok)
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Potwierdź',
  cancelLabel = 'Anuluj',
  variant = 'danger',
}) {
  if (!open) return null

  const confirmStyles =
    variant === 'warning'
      ? 'bg-amber-500 hover:bg-amber-600 text-white'
      : 'bg-rose-500 hover:bg-rose-600 text-white'

  const iconWrap =
    variant === 'warning' ? 'bg-amber-500/20' : 'bg-rose-500/20'

  const iconColor = variant === 'warning' ? 'text-amber-400' : 'text-rose-400'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl ${iconWrap}`}>
            <Trash2 className={`w-5 h-5 ${iconColor}`} />
          </div>
          <h4 id="confirm-dialog-title" className="text-lg font-semibold text-white">
            {title}
          </h4>
        </div>
        <p className="text-slate-300 text-sm mb-6 whitespace-pre-line">{description}</p>
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-all"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${confirmStyles}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
