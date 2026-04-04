import { useState, useEffect } from 'react'
import { Loader2, Check, X, Users } from 'lucide-react'
import { getApiUrl } from '../lib/api'

export const InviteAccept = ({ token }) => {
  const [status, setStatus] = useState('loading') // loading, success, error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const accept = async () => {
      try {
        const apiUrl = getApiUrl()
        const res = await fetch(`${apiUrl}/api/household/invite/${token}/accept`, {
          method: 'POST',
          credentials: 'include',
        })

        if (res.ok) {
          setStatus('success')
          // Clean URL and redirect after 2s
          setTimeout(() => {
            window.history.replaceState({}, '', '/')
            window.location.reload()
          }, 2000)
        } else {
          const body = await res.json()
          setErrorMsg(body.error || 'Nie udało się przyjąć zaproszenia')
          setStatus('error')
        }
      } catch {
        setErrorMsg('Błąd połączenia')
        setStatus('error')
      }
    }

    accept()
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
        <Users className="w-12 h-12 text-indigo-400 mx-auto mb-4" />

        {status === 'loading' && (
          <>
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-white">Dołączanie do gospodarstwa...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-white text-lg font-semibold mb-2">Dołączono!</p>
            <p className="text-slate-400 text-sm">Przekierowywanie do panelu...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-rose-400" />
            </div>
            <p className="text-white text-lg font-semibold mb-2">Błąd</p>
            <p className="text-rose-400 text-sm mb-4">{errorMsg}</p>
            <button
              onClick={() => {
                window.history.replaceState({}, '', '/')
                window.location.reload()
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
            >
              Wróć do panelu
            </button>
          </>
        )}
      </div>
    </div>
  )
}
