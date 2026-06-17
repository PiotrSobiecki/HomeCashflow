import { useState, useEffect } from 'react'
import { Loader2, Check, X, Trash2, Smartphone } from 'lucide-react'
import {
  fetchSmartThingsStatus, connectSmartThings, disconnectSmartThings,
} from '../lib/api'

// Komunikat zwrotny z callbacku OAuth (?st=connected|reconnect|error w URL).
function consumeCallbackFlash() {
  const params = new URLSearchParams(window.location.search)
  const st = params.get('st')
  if (!st) return null
  // wyczyść param z URL, żeby nie wisiał po odświeżeniu
  params.delete('st')
  const qs = params.toString()
  window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''))
  return st
}

export const SmartThingsIntegration = ({ isOwner }) => {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null) // { connected, verifiedAt }
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState(null) // 'connected' | 'reconnect' | 'error'

  const load = async () => {
    try {
      setStatus(await fetchSmartThingsStatus())
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setFlash(consumeCallbackFlash())
    load()
  }, [])

  const handleDisconnect = async () => {
    setBusy(true)
    try {
      await disconnectSmartThings()
      setStatus({ connected: false })
    } catch {
      setFlash('error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return null

  const connected = status?.connected

  return (
    <div className="bg-gradient-to-br from-sky-500/10 to-slate-800/50 border border-sky-500/30 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-sky-400" />
          <h3 className="text-lg font-semibold text-white">Integracja SmartThings (Samsung)</h3>
        </div>
        {connected ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-medium">
            <Check className="w-3.5 h-3.5" /> Połączono
          </span>
        ) : (
          <span className="px-2.5 py-1 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 text-xs font-medium">
            Niepołączono
          </span>
        )}
      </div>

      <p className="text-sm text-slate-300 mb-4">
        Połącz konto Samsung, aby zobaczyć pralkę, suszarkę i inne urządzenia SmartThings
        obok urządzeń Tuya. Logujesz się swoim kontem Samsung — bez wpisywania kluczy.
      </p>

      {isOwner ? (
        connected ? (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={busy}
            className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-600 rounded-xl text-sm transition-all disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Rozłącz
          </button>
        ) : (
          <button
            type="button"
            onClick={connectSmartThings}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Smartphone className="w-4 h-4" /> Połącz konto Samsung
          </button>
        )
      ) : (
        <p className="text-xs text-slate-500">Połączenie konfiguruje właściciel gospodarstwa.</p>
      )}

      {flash === 'reconnect' && (
        <div className="mt-3 p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-sm text-amber-300">
          Sesja SmartThings wygasła — połącz konto ponownie.
        </div>
      )}
      {flash === 'error' && (
        <div className="mt-3 p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-center gap-2">
          <X className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="text-sm text-rose-400">Nie udało się połączyć. Spróbuj ponownie.</span>
        </div>
      )}
    </div>
  )
}
