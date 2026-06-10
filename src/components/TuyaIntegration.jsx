import { useState, useEffect } from 'react'
import {
  Plug, Loader2, Check, X, Trash2, ChevronDown, ChevronRight, ExternalLink,
} from 'lucide-react'
import {
  fetchTuyaCredentials, saveTuyaCredentials, deleteTuyaCredentials,
} from '../lib/api'

const DATACENTERS = [
  { value: 'eu', label: 'Europa (EU)' },
  { value: 'us', label: 'Ameryka (US)' },
  { value: 'cn', label: 'Chiny (CN)' },
  { value: 'in', label: 'Indie (IN)' },
]

const EMPTY_FORM = { clientId: '', clientSecret: '', datacenter: 'eu' }

function friendlyError(err) {
  if (err?.code === 'tuya_auth_failed') {
    return 'Nie udało się połączyć — sprawdź Client ID, Client Secret i region (datacenter).'
  }
  return 'Coś poszło nie tak. Spróbuj ponownie.'
}

export const TuyaIntegration = () => {
  const [loading, setLoading] = useState(true)
  const [hidden, setHidden] = useState(false) // nie-owner → 403 → ukryj
  const [status, setStatus] = useState(null) // { configured, datacenter, verifiedAt, deviceId }
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showGuide, setShowGuide] = useState(false)

  const load = async () => {
    try {
      const data = await fetchTuyaCredentials()
      setStatus(data)
      setEditing(!data.configured)
    } catch (err) {
      if (err?.status === 403) setHidden(true)
      // inne błędy: zostaw panel w stanie "niepołączono", owner spróbuje zapisać
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await saveTuyaCredentials({
        clientId: form.clientId.trim(),
        clientSecret: form.clientSecret.trim(),
        datacenter: form.datacenter,
      })
      setStatus({ configured: true, datacenter: data.datacenter, verifiedAt: data.verifiedAt })
      setForm(EMPTY_FORM)
      setEditing(false)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await deleteTuyaCredentials()
      setStatus({ configured: false })
      setForm(EMPTY_FORM)
      setEditing(true)
    } catch {
      setError('Nie udało się rozłączyć. Spróbuj ponownie.')
    }
  }

  if (loading || hidden) return null

  const configured = status?.configured

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Plug className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Integracja Tuya</h3>
        </div>
        {configured ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-medium">
            <Check className="w-3.5 h-3.5" /> Połączono
          </span>
        ) : (
          <span className="px-2.5 py-1 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 text-xs font-medium">
            Niepołączono
          </span>
        )}
      </div>

      {/* Instrukcja 3-kroki */}
      <button
        type="button"
        onClick={() => setShowGuide((v) => !v)}
        className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 mb-3 transition-colors"
      >
        {showGuide ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        Jak podłączyć urządzenia? (instrukcja)
      </button>
      {showGuide && (
        <ol className="space-y-2 mb-4 text-sm text-slate-300 list-decimal list-inside bg-slate-900/40 rounded-xl p-4">
          <li>
            Dodaj urządzenia w aplikacji <strong>Tuya Smart</strong> / <strong>Smart Life</strong> i sparuj je z Wi-Fi.
          </li>
          <li>
            Załóż konto na{' '}
            <a href="https://iot.tuya.com/" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-0.5">
              iot.tuya.com <ExternalLink className="w-3 h-3" />
            </a>{' '}
            → utwórz <em>Cloud Project</em> (region EU) → <em>Link App Account</em> (zeskanuj kod QR z apki) → włącz uprawnienia Device Status / Management / Control.
          </li>
          <li>
            Skopiuj z projektu <strong>Access ID/Client ID</strong> oraz <strong>Access Secret/Client Secret</strong> i wpisz poniżej. Konkretne urządzenia dodasz już po połączeniu konta.
          </li>
        </ol>
      )}

      {/* Status połączenia */}
      {configured && !editing && (
        <div className="space-y-3">
          <div className="text-sm text-slate-300 bg-slate-900/40 rounded-xl p-3 space-y-1">
            <p>Region: <span className="text-white">{DATACENTERS.find((d) => d.value === status.datacenter)?.label || status.datacenter}</span></p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setForm({ ...EMPTY_FORM, datacenter: status.datacenter }); setEditing(true) }}
              className="px-3 py-2 text-slate-300 hover:text-indigo-400 hover:bg-indigo-500/10 border border-slate-600 rounded-xl text-sm transition-all"
            >
              Zmień dane
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-600 rounded-xl text-sm transition-all"
            >
              <Trash2 className="w-4 h-4" /> Rozłącz
            </button>
          </div>
        </div>
      )}

      {/* Formularz poświadczeń */}
      {editing && (
        <form onSubmit={handleSave} className="space-y-3">
          <input
            type="text" value={form.clientId} onChange={setField('clientId')}
            placeholder="Client ID (Access ID)" required autoComplete="off"
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <input
            type="password" value={form.clientSecret} onChange={setField('clientSecret')}
            placeholder="Client Secret (Access Secret)" required autoComplete="off"
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <select
            value={form.datacenter} onChange={setField('datacenter')}
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {DATACENTERS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <div className="flex gap-2">
            <button
              type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Łączę…' : 'Połącz'}
            </button>
            {configured && (
              <button
                type="button" onClick={() => { setEditing(false); setError('') }}
                className="px-4 py-2.5 text-slate-400 hover:text-white border border-slate-600 rounded-xl text-sm transition-all"
              >
                Anuluj
              </button>
            )}
          </div>
        </form>
      )}

      {error && (
        <div className="mt-3 p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-center gap-2">
          <X className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="text-sm text-rose-400">{error}</span>
        </div>
      )}
    </div>
  )
}
