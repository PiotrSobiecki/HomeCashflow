import { useState, useEffect, useCallback } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { Loader2, Zap, Activity, Banknote } from 'lucide-react'
import { fetchDeviceHistory } from '../lib/api'
import { usePolling } from '../hooks/usePolling'

const RANGES = [
  { key: '7d', label: '7 dni' },
  { key: '30d', label: '30 dni' },
  { key: '90d', label: '90 dni' },
  { key: '1y', label: '1 rok' },
]

// Pomiary zapisywane w UTC — wyświetlamy zawsze w czasie warszawskim.
const TZ = 'Europe/Warsaw'

function formatTick(iso, range) {
  const d = new Date(iso)
  if (range === '7d') {
    return d.toLocaleString('pl-PL', { timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('pl-PL', { timeZone: TZ, day: '2-digit', month: '2-digit' })
}

// Małe zużycie (np. 0.021) potrzebuje 3 miejsc; przy większych 2 wystarczą.
const fmtKwh = (v) => {
  const n = v ?? 0
  return n !== 0 && Math.abs(n) < 1 ? n.toFixed(3) : n.toFixed(2)
}

export const DeviceEnergyChart = ({ deviceId, refreshKey = 0 }) => {
  const [range, setRange] = useState('30d')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // silent: odświeżenie w tle bez spinnera i bez kasowania danych przy błędzie
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    try {
      setData(await fetchDeviceHistory(deviceId, range))
    } catch {
      if (!silent) setData(null)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [deviceId, range])

  useEffect(() => { load() }, [load, refreshKey])

  const silentReload = useCallback(() => load({ silent: true }), [load])
  usePolling({ intervalMs: 600000, enabled: true, onTick: silentReload })

  const series = data?.series || []
  const summary = data?.summary

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/50">
      {/* Przełącznik zakresu */}
      <div className="flex items-center gap-1 mb-3">
        {RANGES.map((r) => (
          <button
            key={r.key} type="button" onClick={() => setRange(r.key)}
            className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
              range === r.key ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Podsumowanie — zużycie w okresie + szczyt mocy + koszt (przy ustawionej cenie kWh) */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-2.5">
          <p className="text-emerald-400 text-[11px] font-medium mb-0.5 flex items-center gap-1">
            <Activity className="w-3 h-3" /> Zużycie
          </p>
          <p className="text-lg font-bold text-white leading-none">
            <span className="sm:hidden">{(summary?.energyKwh ?? 0).toFixed(2)}</span>
            <span className="hidden sm:inline">{fmtKwh(summary?.energyKwh)}</span>{' '}
            <span className="text-xs font-medium text-slate-400">kWh</span>
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl p-2.5">
          <p className="text-amber-400 text-[11px] font-medium mb-0.5 flex items-center gap-1">
            <Zap className="w-3 h-3" /> <span className="sm:hidden">Szczyt</span><span className="hidden sm:inline">Szczyt mocy</span>
          </p>
          <p className="text-lg font-bold text-white leading-none">
            {summary?.peakW != null ? summary.peakW : '—'} <span className="text-xs font-medium text-slate-400">W</span>
          </p>
        </div>
        <div className="bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/30 rounded-xl p-2.5">
          <p className="text-sky-400 text-[11px] font-medium mb-0.5 flex items-center gap-1">
            <Banknote className="w-3 h-3" /> Koszt
          </p>
          <p className="text-lg font-bold text-white leading-none">
            {summary?.costPln != null ? summary.costPln.toFixed(2) : '—'} <span className="text-xs font-medium text-slate-400">zł</span>
          </p>
        </div>
      </div>

      {/* Wykres na gradientowym panelu */}
      <div className="bg-gradient-to-br from-indigo-500/15 to-purple-600/5 border border-indigo-500/25 rounded-xl p-2">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /></div>
        ) : series.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">Za mało pomiarów dla tego okresu.</p>
        ) : (
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${deviceId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f6e" vertical={false} />
              <XAxis
                dataKey="t" tickFormatter={(t) => formatTick(t, range)}
                tick={{ fontSize: 10, fill: '#a5b4fc' }} stroke="#3f3f6e" minTickGap={24}
              />
              <YAxis tick={{ fontSize: 10, fill: '#c7d2fe' }} stroke="#3f3f6e" width={44} unit=" W" tickFormatter={(v) => Math.round(v)} />
              <Tooltip
                contentStyle={{ background: '#1e1b4b', border: '1px solid #4f46e5', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#c7d2fe' }}
                labelFormatter={(t) => new Date(t).toLocaleString('pl-PL', { timeZone: TZ })}
                formatter={(v, name) => [`${v ?? '—'} W`, name === 'avgW' ? 'Śr. moc' : name]}
              />
              <Area type="monotone" dataKey="avgW" stroke="#a78bfa" strokeWidth={2} fill={`url(#grad-${deviceId})`} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
