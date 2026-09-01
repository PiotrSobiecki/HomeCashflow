import { useState, useEffect } from 'react'
import { Loader2, Check, X, Trash2, Landmark, RefreshCw } from 'lucide-react'
import { fetchBankStatus, connectBank, syncBankNow, disconnectBank } from '../lib/api'

// Nazwy ASPSP muszą odpowiadać nazwom w Enable Banking (kraj: PL).
const BANKS = [
  'ING',
  'mBank',
  'PKO Bank Polski',
  'Bank Pekao',
  'Santander Bank Polska',
  'Bank Millennium',
  'Alior Bank',
]

// Komunikat zwrotny z callbacku autoryzacji (?bank=connected|error w URL).
function consumeCallbackFlash() {
  const params = new URLSearchParams(window.location.search)
  const bank = params.get('bank')
  if (!bank) return null
  params.delete('bank')
  const qs = params.toString()
  window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''))
  return bank
}

function formatSyncTime(iso) {
  if (!iso) return 'nigdy'
  try {
    return new Date(iso).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export const BankIntegration = ({ isOwner, onAfterSync }) => {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null) // { configured, connections }
  const [selectedBank, setSelectedBank] = useState(BANKS[0])
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState(null) // 'connected' | 'error' | { imported }
  const [deleteId, setDeleteId] = useState(null)

  const load = async () => {
    try {
      setStatus(await fetchBankStatus())
    } catch {
      setStatus({ configured: false, connections: [] })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const f = consumeCallbackFlash()
    setFlash(f)
    load()
    // Po powrocie z banku pierwsza synchronizacja leci w tle — odśwież status po chwili.
    if (f === 'connected') {
      const t = setTimeout(() => { load(); onAfterSync?.() }, 8000)
      return () => clearTimeout(t)
    }
  }, [])

  const handleSync = async () => {
    setBusy(true)
    setFlash(null)
    try {
      const res = await syncBankNow()
      setFlash({ imported: res.imported ?? 0, failed: res.failed ?? 0 })
      await load()
      onAfterSync?.()
    } catch {
      setFlash('error')
    } finally {
      setBusy(false)
    }
  }

  const handleDisconnect = async (id) => {
    setDeleteId(null)
    setBusy(true)
    try {
      await disconnectBank(id)
      await load()
    } catch {
      setFlash('error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return null
  // Sekret niezaskonfigurowany na backendzie — nie pokazuj martwej karty.
  if (status && status.configured === false && (status.connections?.length ?? 0) === 0) return null

  const connections = status?.connections ?? []

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-slate-800/50 border border-emerald-500/30 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Integracja z bankiem</h3>
        </div>
        {connections.length > 0 && (
          <button
            type="button"
            onClick={handleSync}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Synchronizuj teraz
          </button>
        )}
      </div>

      <p className="text-sm text-slate-300 mb-4">
        Podepnij swoje konto bankowe — zaksięgowane wydatki i przychody będą same
        trafiać do budżetu (z datą, kwotą i kategorią). Synchronizacja co 6 godzin.
      </p>

      {connections.length > 0 && (
        <div className="space-y-2 mb-4">
          {connections.map((conn) => (
            <div key={conn.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm">
              <span className="font-medium text-white">{conn.aspspName}</span>
              <span className="text-slate-400">{conn.userName}</span>
              {conn.accounts.map((a, i) => (
                <span key={i} className="text-slate-500 text-xs">{a.maskedIban || a.displayName}</span>
              ))}
              {conn.status === 'active' ? (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">
                  <Check className="w-3 h-3" /> Aktywne
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-300 text-xs">
                  Wygasło — połącz ponownie
                </span>
              )}
              <span className="text-slate-500 text-xs ml-auto">
                Ostatnia synchronizacja: {formatSyncTime(conn.lastSyncAt)}
              </span>
              {(conn.isMine || isOwner) && (
                deleteId === conn.id ? (
                  <span className="flex items-center gap-1">
                    <button type="button" onClick={() => handleDisconnect(conn.id)} className="px-2 py-0.5 text-xs text-rose-300 bg-rose-500/20 border border-rose-500/30 rounded-lg">Potwierdź</button>
                    <button type="button" onClick={() => setDeleteId(null)} className="px-2 py-0.5 text-xs text-slate-400 border border-slate-600 rounded-lg">Anuluj</button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteId(conn.id)}
                    disabled={busy}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Rozłącz bank (wpisy w budżecie zostają)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedBank}
          onChange={(e) => setSelectedBank(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
        >
          {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <button
          type="button"
          onClick={() => connectBank(selectedBank)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Landmark className="w-4 h-4" /> Połącz bank
        </button>
        <span className="text-xs text-slate-500">
          Autoryzujesz w aplikacji swojego banku. Zgoda jest ważna 90 dni.
        </span>
      </div>

      {flash === 'connected' && (
        <div className="mt-3 p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-sm text-emerald-300">
          Bank połączony. Pierwsza synchronizacja (30 dni wstecz) trwa — wpisy pojawią się za chwilę.
        </div>
      )}
      {flash === 'error' && (
        <div className="mt-3 p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-center gap-2">
          <X className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="text-sm text-rose-400">Nie udało się połączyć z bankiem. Spróbuj ponownie.</span>
        </div>
      )}
      {flash && typeof flash === 'object' && (
        <div className="mt-3 p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-sm text-emerald-300">
          Zaimportowano {flash.imported} {flash.imported === 1 ? 'transakcję' : 'transakcji'}.
          {flash.failed > 0 && ' Część połączeń zwróciła błąd — sprawdź status.'}
        </div>
      )}
    </div>
  )
}
