import { useState, useEffect } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { Loader2, Clock, Activity } from 'lucide-react'
import { fetchDeviceHistory } from '../lib/api'

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

      {/* Podsumowanie — ostatnia godzina + całe zużycie w wybranym zakresie */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/30 rounded-xl p-2.5">
          <p className="text-sky-400 text-[11px] font-medium mb-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Ostatnia godzina
          </p>
          <p className="text-lg font-bold text-white leading-none">
            {fmtKwh(summary?.lastHourKwh)} <span className="text-xs font-medium text-slate-400">kWh</span>
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-2.5">
          <p className="text-emerald-400 text-[11px] font-medium mb-0.5 flex items-center gap-1">
            <Activity className="w-3 h-3" /> Zużycie w okresie
          </p>
          <p className="text-lg font-bold text-white leading-none">
            {fmtKwh(summary?.energyKwh)} <span className="text-xs font-medium text-slate-400">kWh</span>
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
            <BarChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${deviceId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f6e" vertical={false} />
              <XAxis
                dataKey="t" tickFormatter={(t) => formatTick(t, range)}
                tick={{ fontSize: 10, fill: '#a5b4fc' }} stroke="#3f3f6e" minTickGap={24}
              />
              <YAxis tick={{ fontSize: 10, fill: '#c7d2fe' }} stroke="#3f3f6e" width={44} unit=" kWh" tickFormatter={fmtKwh} />
              <Tooltip
                contentStyle={{ background: '#1e1b4b', border: '1px solid #4f46e5', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#c7d2fe' }}
                cursor={{ fill: '#818cf820' }}
                labelFormatter={(t) => new Date(t).toLocaleString('pl-PL', { timeZone: TZ })}
                formatter={(v) => [`${fmtKwh(v)} kWh`, 'Zużycie']}
              />
              <Bar dataKey="energyKwh" fill={`url(#grad-${deviceId})`} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
