import { useState } from 'react'
import {
  Power, Wifi, WifiOff, Zap, Activity, Gauge, RefreshCw,
  Pencil, Trash2, Check, X, Eye, EyeOff,
} from 'lucide-react'

/**
 * Karta pojedynczego urządzenia. Sterowanie (wł./wył.) dochodzi w Slice 3 —
 * tu przełącznik jest tylko odczytem stanu.
 */
export const SmartDeviceCard = ({
  device, status, isOwner, onRefresh, onRename, onToggleActive, onRemove,
}) => {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(device.displayName)
  const [busy, setBusy] = useState(false)

  const online = status?.ok && status?.online
  const hasReading = status?.ok

  const saveName = async () => {
    if (!name.trim() || name.trim() === device.displayName) { setEditing(false); return }
    setBusy(true)
    try { await onRename(device.id, name.trim()); setEditing(false) } finally { setBusy(false) }
  }

  return (
    <div className={`bg-slate-800/50 border rounded-2xl p-4 ${device.isActive ? 'border-slate-700/50' : 'border-slate-800 opacity-60'}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Power className={`w-5 h-5 shrink-0 ${status?.switchOn ? 'text-emerald-400' : 'text-slate-500'}`} />
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false) }}
                className="px-2 py-1 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 w-40"
                autoFocus
              />
              <button onClick={saveName} disabled={busy} className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded"><Check className="w-4 h-4" /></button>
              <button onClick={() => setEditing(false)} className="p-1 text-slate-400 hover:bg-slate-600 rounded"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <h4 className="text-white font-medium truncate">{device.displayName}</h4>
          )}
        </div>
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs shrink-0 ${online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}`}>
          {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {online ? 'Połączone' : 'Brak połączenia'}
        </span>
      </div>

      {/* Pomiary */}
      {hasReading ? (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Metric icon={Zap} label="Moc" value={status.powerW != null ? `${status.powerW} W` : '—'} />
          <Metric icon={Gauge} label="Napięcie" value={status.voltageV != null ? `${status.voltageV} V` : '—'} />
          <Metric icon={Activity} label="Zużycie" value={status.energyKwh != null ? `${status.energyKwh} kWh` : '—'} />
        </div>
      ) : (
        <p className="text-xs text-slate-500 mb-3">Nie udało się odświeżyć statusu.</p>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onRefresh(device.id)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Odśwież
        </button>

        {isOwner && (
          <div className="flex items-center gap-1">
            <button onClick={() => { setName(device.displayName); setEditing(true) }} title="Zmień nazwę" className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"><Pencil className="w-3.5 h-3.5" /></button>
            <button
              onClick={() => onToggleActive(device.id, !device.isActive)}
              title={device.isActive ? 'Wstrzymaj odświeżanie' : 'Wznów'}
              className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
            >
              {device.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => onRemove(device)} title="Usuń urządzenie" className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
    </div>
  )
}

const Metric = ({ icon: Icon, label, value }) => (
  <div className="bg-slate-900/40 rounded-lg p-2 text-center">
    <Icon className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1" />
    <p className="text-sm text-white font-medium leading-tight">{value}</p>
    <p className="text-[10px] text-slate-500">{label}</p>
  </div>
)
