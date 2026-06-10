import { useState, useEffect } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { Loader2, Zap } from 'lucide-react'
import { fetchDeviceHistory } from '../lib/api'

const RANGES = [
  { key: '7d', label: '7 dni' },
  { key: '30d', label: '30 dni' },
  { key: '90d', label: '90 dni' },
  { key: '1y', label: '1 rok' },
]

function formatTick(iso, range) {
  const d = new Date(iso)
  if (range === '7d') {
    return d.toLocaleString('pl-PL', { weekday: 'short', hour: '2-digit' })
  }
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })
}

export const DeviceEnergyChart = ({ deviceId }) => {
  const [range, setRange] = useState('30d')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchDeviceHistory(deviceId, range)
      .then((d) => { if (alive) setData(d) })
      .catch(() => { if (alive) setData(null) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [deviceId, range])

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

      {/* Podsumowanie */}
      {summary && (
        <div className="flex items-center gap-4 mb-2 text-xs">
          <span className="text-slate-300">
            Zużycie: <span className="text-white font-medium">{(summary.energyKwh ?? 0).toFixed(2)} kWh</span>
          </span>
          {summary.peakW != null && (
            <span className="text-slate-300 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Szczyt: <span className="text-white font-medium">{summary.peakW} W</span>
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /></div>
      ) : series.length === 0 ? (
        <p className="text-xs text-slate-500 py-6 text-center">Za mało pomiarów dla tego okresu.</p>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${deviceId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="t" tickFormatter={(t) => formatTick(t, range)}
              tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" minTickGap={24}
            />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" width={32} unit="W" />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#cbd5e1' }}
              labelFormatter={(t) => new Date(t).toLocaleString('pl-PL')}
              formatter={(v, name) => [`${v ?? '—'} W`, name === 'avgW' ? 'Śr. moc' : name]}
            />
            <Area type="monotone" dataKey="avgW" stroke="#818cf8" strokeWidth={2} fill={`url(#grad-${deviceId})`} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
