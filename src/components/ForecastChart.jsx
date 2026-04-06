import { TrendingUp, Eye, Target } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart, Line } from 'recharts';
import { getCurrentMonth, MONTHS_SHORT } from '../hooks/useFinanceData';

const formatCurrency = (amount) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2 }).format(amount);
const formatCurrencyShort = (amount) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (<div className="bg-slate-800 border border-slate-600 rounded-xl p-4 shadow-xl"><p className="font-semibold text-white mb-2">{d.name}</p><div className="space-y-1 text-sm">{d.balance !== null && <p className="text-indigo-400"><span className="text-slate-400">Bilans: </span>{formatCurrency(d.balance)}</p>}{d.forecast !== null && d.balance === null && <p className="text-amber-400"><span className="text-slate-400">Prognoza: </span>{formatCurrency(d.forecast)}</p>}<p className="text-emerald-400"><span className="text-slate-400">Przychody: </span>{formatCurrency(d.income)}{!d.isReal && <span className="text-amber-400/70"> (śr.)</span>}</p><p className="text-rose-400"><span className="text-slate-400">Wydatki: </span>{formatCurrency(d.expenses)}{!d.isReal && <span className="text-amber-400/70"> (śr.)</span>}</p></div>{!d.isReal && <p className="text-xs text-amber-400/70 mt-2 pt-2 border-t border-slate-700">📊 Wartości prognozowane</p>}</div>);
  }
  return null;
};

const getTodayPosition = () => {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), month + 1, 0).getDate();
  return month + (day - 1) / daysInMonth;
};

export const ForecastChart = ({ forecastData, year }) => {
  const { chartData, avgIncome, avgExpenses, avgBalance, hasData } = forecastData;
  const currentMonth = getCurrentMonth();

  if (!hasData) {
    return (<div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6"><div className="flex items-center gap-3 mb-6"><div className="bg-indigo-500/20 p-2.5 rounded-xl"><TrendingUp className="w-5 h-5 text-indigo-400" /></div><h3 className="text-lg font-semibold text-white">Prognoza Finansowa {year}</h3></div><div className="flex items-center justify-center h-64 text-slate-500"><p>Dodaj przychody i wydatki, aby zobaczyć prognozę</p></div></div>);
  }

  const allValues = chartData.flatMap(d => [d.balance, d.forecast].filter(v => v !== null));
  const minValue = Math.min(...allValues, 0);
  const maxValue = Math.max(...allValues);
  const padding = (maxValue - minValue) * 0.1;
  const todayX = getTodayPosition();

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3"><div className="bg-indigo-500/20 p-2.5 rounded-xl"><TrendingUp className="w-5 h-5 text-indigo-400" /></div><div><h3 className="text-lg font-semibold text-white">Prognoza Finansowa {year}</h3><p className="text-sm text-slate-400">Kumulatywny bilans z projekcją do końca roku</p></div></div>
        <div className="flex flex-wrap gap-4 text-sm"><div className="flex items-center gap-2"><div className="w-4 h-1 bg-indigo-500 rounded" /><span className="text-slate-400">Rzeczywiste dane</span></div><div className="flex items-center gap-2"><div className="w-4 h-1 rounded" style={{ background: 'repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 4px, transparent 4px, transparent 8px)' }} /><span className="text-slate-400">Prognoza</span></div></div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
            <defs><linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient><linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="month" type="number" domain={[0, 11]} ticks={[0,1,2,3,4,5,6,7,8,9,10,11]} tickFormatter={(v) => MONTHS_SHORT[v] || ''} stroke="#64748b" fontSize={12} tickLine={false} axisLine={{ stroke: '#334155' }} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={{ stroke: '#334155' }} tickFormatter={(v) => Math.abs(v) >= 1000 ? `${(v/1000).toFixed(0)}k` : v} domain={[minValue - padding, maxValue + padding]} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
            <ReferenceLine x={todayX} stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" label={{ value: 'Dziś', position: 'top', fill: '#6366f1', fontSize: 12 }} />
            <Area type="monotone" dataKey="balance" stroke="none" fill="url(#balanceGradient)" connectNulls={false} />
            <Area type="monotone" dataKey="forecast" stroke="none" fill="url(#forecastGradient)" connectNulls={false} />
            <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }} connectNulls={false} />
            <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="8 4" dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }} activeDot={{ r: 5, stroke: '#f59e0b', strokeWidth: 2, fill: '#fff' }} connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-700/50">
        <div className="text-center"><div className="flex items-center justify-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-emerald-400" /><p className="text-xs text-slate-500 uppercase">Śr. przychody</p></div><p className="text-lg font-semibold text-emerald-400">{formatCurrencyShort(avgIncome)}</p></div>
        <div className="text-center"><div className="flex items-center justify-center gap-2 mb-1"><Eye className="w-4 h-4 text-rose-400" /><p className="text-xs text-slate-500 uppercase">Śr. wydatki</p></div><p className="text-lg font-semibold text-rose-400">{formatCurrencyShort(avgExpenses)}</p></div>
        <div className="text-center"><div className="flex items-center justify-center gap-2 mb-1"><Target className="w-4 h-4 text-indigo-400" /><p className="text-xs text-slate-500 uppercase">Śr. bilans</p></div><p className={`text-lg font-semibold ${avgBalance >= 0 ? 'text-indigo-400' : 'text-orange-400'}`}>{formatCurrencyShort(avgBalance)}</p></div>
      </div>
    </div>
  );
};
