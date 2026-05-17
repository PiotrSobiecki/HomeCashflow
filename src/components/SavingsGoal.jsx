import { useState } from 'react';
import { Target, Calendar, Check, X, Settings, Trophy, Flag } from 'lucide-react';

const formatCurrency = (amount) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

// Cel oszczędnościowy to singleton bez `created_by` — backend pozwala mutować tylko ownerowi.
// `canEdit` ze strony Dashboard ukrywa przyciski, jeśli user nie jest ownerem (gość ma true).
export const SavingsGoal = ({ savingsGoal, savingsGoalData, updateSavingsGoal, months, canEdit = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editType, setEditType] = useState(savingsGoal.type);
  const [editMonthlyAmount, setEditMonthlyAmount] = useState(savingsGoal.monthlyAmount.toString());
  const [editYearlyAmount, setEditYearlyAmount] = useState(savingsGoal.yearlyAmount.toString());
  const [editTargetMonth, setEditTargetMonth] = useState(savingsGoal.targetMonth);

  const handleSave = () => {
    updateSavingsGoal({ type: editType, monthlyAmount: parseFloat(editMonthlyAmount) || 0, yearlyAmount: parseFloat(editYearlyAmount) || 0, targetMonth: editTargetMonth });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditType(savingsGoal.type); setEditMonthlyAmount(savingsGoal.monthlyAmount.toString());
    setEditYearlyAmount(savingsGoal.yearlyAmount.toString()); setEditTargetMonth(savingsGoal.targetMonth);
    setIsEditing(false);
  };

  if (savingsGoalData.type === 'none' && !isEditing) {
    return (
      <div className="bg-gradient-to-r from-slate-700/30 via-slate-600/20 to-slate-700/30 border border-slate-600/40 rounded-2xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-slate-600/30 p-4 rounded-2xl"><Target className="w-8 h-8 text-slate-400" /></div>
            <div><h3 className="text-lg font-bold text-white">Cel Oszczędnościowy</h3><p className="text-slate-400 text-sm">Ustaw cel, żeby wiedzieć ile możesz wydać bez wyrzutów sumienia</p></div>
          </div>
          {canEdit && <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-xl transition-all font-medium"><Target className="w-4 h-4" />Ustaw cel</button>}
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="bg-gradient-to-r from-indigo-600/20 via-purple-500/10 to-indigo-600/20 border border-indigo-500/30 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6"><div className="bg-indigo-500/20 p-2 rounded-xl"><Settings className="w-5 h-5 text-indigo-400" /></div><h3 className="text-lg font-bold text-white">Ustaw Cel Oszczędnościowy</h3></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <button onClick={() => setEditType('none')} className={`p-4 rounded-xl border transition-all ${editType === 'none' ? 'bg-slate-500/30 border-slate-400/50 text-white' : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-slate-600'}`}><X className="w-5 h-5 mx-auto mb-2" /><p className="font-medium">Brak celu</p><p className="text-xs opacity-70">Bez ograniczeń</p></button>
          <button onClick={() => setEditType('monthly')} className={`p-4 rounded-xl border transition-all ${editType === 'monthly' ? 'bg-emerald-500/30 border-emerald-400/50 text-emerald-300' : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-emerald-600/50'}`}><Calendar className="w-5 h-5 mx-auto mb-2" /><p className="font-medium">Cel miesięczny</p><p className="text-xs opacity-70">Stała kwota co miesiąc</p></button>
          <button onClick={() => setEditType('yearly')} className={`p-4 rounded-xl border transition-all ${editType === 'yearly' ? 'bg-amber-500/30 border-amber-400/50 text-amber-300' : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-amber-600/50'}`}><Trophy className="w-5 h-5 mx-auto mb-2" /><p className="font-medium">Cel roczny</p><p className="text-xs opacity-70">Kwota do określonego miesiąca</p></button>
        </div>
        {editType === 'monthly' && (<div className="mb-6"><label className="block text-sm text-slate-400 mb-2">Ile chcesz oszczędzać miesięcznie?</label><div className="relative"><input type="number" value={editMonthlyAmount} onChange={(e) => setEditMonthlyAmount(e.target.value)} placeholder="np. 2000" className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-lg" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">PLN / miesiąc</span></div></div>)}
        {editType === 'yearly' && (<div className="space-y-4 mb-6"><div><label className="block text-sm text-slate-400 mb-2">Ile chcesz zaoszczędzić łącznie?</label><div className="relative"><input type="number" value={editYearlyAmount} onChange={(e) => setEditYearlyAmount(e.target.value)} placeholder="np. 24000" className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 text-lg" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">PLN</span></div></div><div><label className="block text-sm text-slate-400 mb-2">Do kiedy?</label><select value={editTargetMonth} onChange={(e) => setEditTargetMonth(parseInt(e.target.value))} className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-amber-500">{months.map((month, index) => (<option key={month} value={index}>{month}</option>))}</select></div></div>)}
        <div className="flex gap-3 justify-end"><button onClick={handleCancel} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all font-medium">Anuluj</button><button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all font-medium"><Check className="w-4 h-4" />Zapisz cel</button></div>
      </div>
    );
  }

  const isMonthly = savingsGoalData.type === 'monthly';
  const colors = isMonthly ? { bg: 'from-emerald-600/20 via-teal-500/10 to-emerald-600/20', border: 'border-emerald-500/30', text: 'text-emerald-400', iconBg: 'bg-emerald-500/20', bar: 'from-emerald-500 to-teal-400' } : { bg: 'from-amber-600/20 via-yellow-500/10 to-amber-600/20', border: 'border-amber-500/30', text: 'text-amber-400', iconBg: 'bg-amber-500/20', bar: 'from-amber-500 to-yellow-400' };

  return (
    <div className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-2xl p-6 mb-6`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`${colors.iconBg} p-4 rounded-2xl`}>{isMonthly ? <Flag className={`w-8 h-8 ${colors.text}`} /> : <Trophy className={`w-8 h-8 ${colors.text}`} />}</div>
          <div><div className="flex items-center gap-2"><h3 className="text-lg font-bold text-white">{isMonthly ? 'Cel miesięczny' : 'Cel roczny'}</h3>{savingsGoalData.onTrack ? <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Na dobrej drodze ✓</span> : <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs rounded-full">Do nadrobienia</span>}</div><p className="text-slate-400 text-sm">{isMonthly ? `Oszczędzaj ${formatCurrency(savingsGoalData.targetAmount)} miesięcznie` : `Zaoszczędź ${formatCurrency(savingsGoalData.targetAmount)} do ${months[savingsGoalData.targetMonth]}`}</p></div>
        </div>
        <div className="flex flex-wrap gap-4 lg:gap-6">
          <div className="text-center lg:text-right"><p className="text-slate-500 text-xs uppercase tracking-wide mb-1">{isMonthly ? 'Ten miesiąc' : 'Zebrano'}</p><p className={`text-xl font-bold ${colors.text}`}>{formatCurrency(savingsGoalData.currentSavings)}</p></div>
          <div className="text-center lg:text-right"><p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Zostało</p><p className="text-xl font-bold text-white">{formatCurrency(savingsGoalData.remaining)}</p></div>
          {!isMonthly && <div className="text-center lg:text-right"><p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Mies. cel</p><p className="text-xl font-bold text-white">{formatCurrency(savingsGoalData.monthlyTarget)}</p></div>}
          {canEdit && <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all self-center" title="Edytuj cel"><Settings className="w-5 h-5" /></button>}
        </div>
      </div>
      <div className="mt-4"><div className="flex justify-between text-xs text-slate-400 mb-1"><span>{savingsGoalData.progress.toFixed(0)}% celu</span><span>{formatCurrency(savingsGoalData.currentSavings)} / {formatCurrency(savingsGoalData.targetAmount)}</span></div><div className="h-3 bg-slate-700/50 rounded-full overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-500`} style={{ width: `${Math.min(100, savingsGoalData.progress)}%` }} /></div></div>
    </div>
  );
};
