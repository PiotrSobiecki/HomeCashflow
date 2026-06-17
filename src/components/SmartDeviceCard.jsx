import { useState } from 'react'
import {
  Power, Wifi, WifiOff, Zap, Activity, Gauge, RefreshCw, Clock,
  Pencil, Trash2, Check, X, Eye, EyeOff, BarChart3, ChevronDown,
} from 'lucide-react'
import { DeviceControls } from './DeviceControls'
import { AcControls } from './AcControls'
import { RemoteControls } from './RemoteControls'
import { DeviceEnergyChart } from './DeviceEnergyChart'

/**
 * Karta pojedynczego urządzenia: status na żywo + sterowanie (Slice 3).
 */
export const SmartDeviceCard = ({
  device, status, isOwner, onRefresh, onRename, onToggleActive, onRemove, onSend,
}) => {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(device.displayName)
  const [busy, setBusy] = useState(false)
  const [cmdError, setCmdError] = useState('')
  const [showChart, setShowChart] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const online = status?.ok && status?.online
  const hasReading = status?.ok
  const isIrAc = device.deviceType === 'ir_ac'
  const isIrRemote = device.deviceType === 'ir_remote'
  const isIr = isIrAc || isIrRemote

  // Statystyki dzisiejsze (od północy czasu warszawskiego) — liczone w backendzie
  const todayKwh = status?.todayKwh ?? null
  const todayUptimeMin = status?.todayUptimeMin ?? null
  const fmtKwh = (v) => (v !== 0 && Math.abs(v) < 1 ? v.toFixed(3) : v.toFixed(2))
  const fmtUptime = (min) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`)

  const handleSend = async (commands) => {
    setCmdError('')
    try {
      await onSend(device.id, commands)
    } catch {
      setCmdError('Nie udało się wysłać polecenia — stan bez zmian.')
    }
  }

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    setRefreshKey((k) => k + 1) // przeładuj wykres (ma własny cache, więc fetch leci w tle)
    try { await onRefresh(device.id) } finally { setRefreshing(false) }
  }

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

      {/* Pomiary (gniazdka — urządzenia IR to piloty, bez pomiaru energii) */}
      {!isIr && (hasReading ? (
        <div className="mb-3">
          <div className="grid grid-cols-3 gap-2">
            <Metric icon={Zap} label="Moc" value={status.powerW != null ? `${status.powerW} W` : '—'} />
            <Metric icon={Gauge} label="Napięcie" value={status.voltageV != null ? `${status.voltageV} V` : '—'} />
            <Metric icon={Activity} label="Zużycie dziś" value={todayKwh != null ? `${fmtKwh(todayKwh)} kWh` : '—'} />
          </div>
          {todayUptimeMin != null && (
            <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-1.5">
              <Clock className="w-3 h-3" /> Czas poboru mocy dziś: {fmtUptime(todayUptimeMin)}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500 mb-3">Nie udało się odświeżyć statusu.</p>
      ))}

      {/* Sterowanie — klima IR: panel AC; pilot IR: siatka przycisków; reszta: DP urządzenia */}
      {isIrAc ? (
        <AcControls ac={status?.ac} onSend={handleSend} disabled={!online} />
      ) : isIrRemote ? (
        <RemoteControls deviceId={device.id} disabled={!online} />
      ) : (
        <DeviceControls
          functionsJson={device.functionsJson}
          raw={status?.raw}
          onSend={handleSend}
          disabled={!online}
        />
      )}

      {cmdError && <p className="text-xs text-rose-400 mb-2">{cmdError}</p>}

      {/* Wykres zużycia (rozwijany — montowany dopiero po otwarciu); urządzenia IR bez pomiaru */}
      {!isIr && (
        <>
          <button
            type="button"
            onClick={() => setShowChart((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors mb-1"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Zużycie
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showChart ? 'rotate-180' : ''}`} />
          </button>
          {showChart && <DeviceEnergyChart deviceId={device.id} refreshKey={refreshKey} />}
        </>
      )}

      <div className="flex items-center justify-between mt-2">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Odśwież
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
