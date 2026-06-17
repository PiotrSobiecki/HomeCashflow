import { useState } from 'react'
import { X, Loader2, Plus, Wifi, WifiOff, Search } from 'lucide-react'
import { discoverSmartDevices, discoverSmartThingsDevices } from '../lib/api'

function friendlyError(err) {
  switch (err?.code) {
    case 'device_already_linked': return 'To urządzenie jest już podpięte (do tego lub innego gospodarstwa).'
    case 'device_not_found_in_tuya': return 'Nie znaleziono urządzenia o tym ID na Twoim koncie Tuya.'
    case 'device_not_found_in_smartthings': return 'Nie znaleziono urządzenia o tym ID na Twoim koncie SmartThings.'
    case 'ir_parent_missing': return 'To klima na podczerwień, ale nie udało się ustalić blastera Smart IR. Upewnij się, że pilot jest dodany pod Smart IR w aplikacji Tuya.'
    case 'tuya_not_configured': return 'Najpierw połącz konto Tuya (wpisz Client ID i Secret powyżej).'
    case 'smartthings_not_connected': return 'Najpierw połącz konto Samsung SmartThings powyżej.'
    default: return 'Nie udało się dodać urządzenia. Spróbuj ponownie.'
  }
}

// Etykieta typu urządzenia ST (z wnioskowanego type) — do podpowiedzi przy wyborze.
const ST_TYPE_LABEL = { washer: 'Pralka', dryer: 'Suszarka', dishwasher: 'Zmywarka', fridge: 'Lodówka', other: 'Urządzenie' }

export const AddSmartDeviceModal = ({ onClose, onAdd, onAddSt }) => {
  const [deviceId, setDeviceId] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [discovered, setDiscovered] = useState(null)
  const [discovering, setDiscovering] = useState(false)
  const [stList, setStList] = useState(null)
  const [stDiscovering, setStDiscovering] = useState(false)

  const submit = async (id) => {
    const value = (id || deviceId).trim()
    if (!value) return
    setAdding(true)
    setError('')
    try {
      await onAdd(value)
      onClose()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setAdding(false)
    }
  }

  const submitSt = async (externalDeviceId, displayName) => {
    setAdding(true)
    setError('')
    try {
      await onAddSt(externalDeviceId, displayName)
      onClose()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setAdding(false)
    }
  }

  const runDiscover = async () => {
    setDiscovering(true)
    setError('')
    try {
      setDiscovered(await discoverSmartDevices())
    } catch (err) {
      setError(err?.code === 'tuya_not_configured'
        ? 'Najpierw połącz konto Tuya.'
        : 'Nie udało się pobrać listy z konta Tuya.')
    } finally {
      setDiscovering(false)
    }
  }

  const runStDiscover = async () => {
    setStDiscovering(true)
    setError('')
    try {
      setStList(await discoverSmartThingsDevices())
    } catch (err) {
      setError(err?.code === 'smartthings_not_connected'
        ? 'Najpierw połącz konto Samsung SmartThings powyżej.'
        : 'Nie udało się pobrać listy z konta SmartThings.')
    } finally {
      setStDiscovering(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Dodaj urządzenie</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); submit() }} className="space-y-3">
          <label className="block text-sm text-slate-300">Device ID (z panelu Tuya → Devices)</label>
          <input
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="np. bf500f07bbd9e06a5f436z"
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
            autoFocus
          />
          <button
            type="submit" disabled={adding || !deviceId.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Dodaj
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-500">
          <div className="flex-1 h-px bg-slate-700" /> albo <div className="flex-1 h-px bg-slate-700" />
        </div>

        <button
          type="button" onClick={runDiscover} disabled={discovering}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-300 hover:text-white border border-slate-600 rounded-xl text-sm transition-all disabled:opacity-50"
        >
          {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Pobierz z konta Tuya
        </button>

        {discovered && (
          <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto">
            {discovered.length === 0 && <p className="text-sm text-slate-500 text-center py-2">Brak urządzeń na koncie.</p>}
            {discovered.map((d) => (
              <button
                key={d.id} type="button" onClick={() => submit(d.id)} disabled={adding}
                className="w-full flex items-center justify-between gap-2 py-2 px-3 bg-slate-900/40 hover:bg-slate-900/70 rounded-xl text-left transition-all disabled:opacity-50"
              >
                <span className="min-w-0">
                  <span className="block text-sm text-white truncate">{d.name || d.id}</span>
                  <span className="block text-xs text-slate-500 font-mono truncate">{d.id}</span>
                </span>
                {d.online ? <Wifi className="w-4 h-4 text-emerald-400 shrink-0" /> : <WifiOff className="w-4 h-4 text-slate-500 shrink-0" />}
              </button>
            ))}
          </div>
        )}

        {/* SmartThings (Samsung) — pralka/suszarka itd. z połączonego konta */}
        <div className="my-4 flex items-center gap-3 text-xs text-slate-500">
          <div className="flex-1 h-px bg-slate-700" /> SmartThings (Samsung) <div className="flex-1 h-px bg-slate-700" />
        </div>

        <button
          type="button" onClick={runStDiscover} disabled={stDiscovering}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-300 hover:text-white border border-blue-600/60 rounded-xl text-sm transition-all disabled:opacity-50"
        >
          {stDiscovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Pobierz z konta SmartThings
        </button>

        {stList && (
          <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto">
            {stList.length === 0 && <p className="text-sm text-slate-500 text-center py-2">Brak nowych urządzeń na koncie SmartThings.</p>}
            {stList.map((d) => (
              <button
                key={d.deviceId} type="button" onClick={() => submitSt(d.deviceId, d.label)} disabled={adding}
                className="w-full flex items-center justify-between gap-2 py-2 px-3 bg-slate-900/40 hover:bg-slate-900/70 rounded-xl text-left transition-all disabled:opacity-50"
              >
                <span className="min-w-0">
                  <span className="block text-sm text-white truncate">{d.label || d.deviceId}</span>
                  <span className="block text-xs text-blue-300/70 truncate">{ST_TYPE_LABEL[d.type] || ST_TYPE_LABEL.other}</span>
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 shrink-0">SmartThings</span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-3 p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-center gap-2">
            <X className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-sm text-rose-400">{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}
