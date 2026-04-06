import { useState } from 'react';
import { LayoutGrid, Plus, Pencil, Trash2, Check, X, AlertTriangle, ChevronDown } from 'lucide-react';
import { DEFAULT_BUDGET_CATEGORIES } from '../hooks/useFinanceData';
import { ConfirmDialog } from './ConfirmDialog';

const formatCurrency = (amount) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2 }).format(amount);

export const CategoryBudgets = ({
  categoryBudgets, categorySpending, totalCategoryLimits,
  addCategoryBudget, updateCategoryBudget, deleteCategoryBudget,
  totalIncome, fixedExpenses, variableExpenses, savingsGoalData,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [editName, setEditName] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const monthlyTarget = savingsGoalData.type !== 'none' ? savingsGoalData.monthlyTarget : 0;
  const availablePool = totalIncome - fixedExpenses - monthlyTarget;
  const totalOverspend = categoryBudgets.reduce((sum, cat) => {
    const spent = categorySpending[cat.name] || 0;
    return sum + Math.max(0, spent - cat.limit);
  }, 0);
  const unallocated = availablePool - totalCategoryLimits - totalOverspend;
  const overBudget = availablePool - totalCategoryLimits < 0;

  const effectivePool = Math.max(0, availablePool - totalOverspend);

  const usedCategoryNames = new Set(categoryBudgets.map(c => c.name));
  const suggestedCategories = DEFAULT_BUDGET_CATEGORIES.filter(name => !usedCategoryNames.has(name));

  // Max limit dla nowej kategorii = wolne miejsce w puli
  const maxNewLimit = Math.max(0, effectivePool - totalCategoryLimits);
  // Max limit dla edytowanej kategorii = wolne + aktualny limit tej kategorii
  const getMaxEditLimit = (currentLimit) => Math.max(0, effectivePool - totalCategoryLimits + currentLimit);

  const handleAdd = () => {
    if (newName.trim() && newLimit) {
      const clamped = Math.min(parseFloat(newLimit), maxNewLimit);
      if (clamped > 0) {
        addCategoryBudget(newName.trim(), clamped);
        setNewName(''); setNewLimit(''); setIsAdding(false);
      }
    }
  };

  const handleSetMaxNew = () => {
    setNewLimit(maxNewLimit > 0 ? maxNewLimit.toFixed(2) : '0');
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id); setEditName(cat.name); setEditLimit(cat.limit.toString());
  };

  const handleSetMaxEdit = (currentLimit) => {
    const max = getMaxEditLimit(currentLimit);
    setEditLimit(max > 0 ? max.toFixed(2) : '0');
  };

  const handleSaveEdit = (id) => {
    if (editName.trim() && editLimit) {
      const cat = categoryBudgets.find(c => c.id === id);
      const max = getMaxEditLimit(cat?.limit || 0);
      const clamped = Math.min(parseFloat(editLimit), max);
      updateCategoryBudget(id, editName.trim(), clamped);
      setEditingId(null);
    }
  };

  const getProgressColor = (spent, limit) => {
    const ratio = limit > 0 ? spent / limit : 0;
    if (ratio >= 1) return 'bg-rose-500';
    if (ratio >= 0.75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getTextColor = (spent, limit) => {
    const ratio = limit > 0 ? spent / limit : 0;
    if (ratio >= 1) return 'text-rose-400';
    if (ratio >= 0.75) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="bg-gradient-to-r from-violet-600/15 via-purple-500/10 to-violet-600/15 border border-violet-500/30 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCollapsed(c => !c)} className="flex items-center gap-3 group cursor-pointer bg-transparent border-none p-0 text-left">
          <div className="bg-violet-500/20 p-2.5 rounded-xl">
            <LayoutGrid className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">Budżety kategorii</h3>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`} />
            </div>
            <p className="text-xs text-slate-400">
              {categoryBudgets.length > 0
                ? <>Zaplanowano: <span className="text-violet-400 font-medium">{formatCurrency(totalCategoryLimits)}</span> z <span className={availablePool - totalOverspend >= totalCategoryLimits ? 'text-slate-300' : 'text-rose-400'}>{formatCurrency(Math.max(0, availablePool - totalOverspend))}</span> miesięcznej puli</>
                : 'Ustal miesięczne limity na kategorie wydatków'}
            </p>
          </div>
        </button>
        {!collapsed && <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-xl transition-all font-medium">
          <Plus className="w-4 h-4" />Dodaj
        </button>}
      </div>

      {/* Ostrzeżenie o przekroczeniu puli */}
      {!collapsed && overBudget && categoryBudgets.length > 0 && (
        <div className="mb-4 p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center gap-2 text-amber-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Suma limitów ({formatCurrency(totalCategoryLimits)}) przekracza dostępną pulę ({formatCurrency(Math.max(0, availablePool))}) o {formatCurrency(Math.abs(unallocated))}</span>
        </div>
      )}

      {/* Formularz dodawania */}
      {!collapsed && isAdding && (
        <div className="mb-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input type="text" placeholder="Nazwa kategorii" value={newName} onChange={(e) => setNewName(e.target.value)} className="px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-violet-500" autoFocus />
            <div className="flex gap-2">
              <input type="number" placeholder={`Limit (max ${formatCurrency(maxNewLimit)})`} value={newLimit} onChange={(e) => { const v = parseFloat(e.target.value); if (!e.target.value || v <= maxNewLimit) setNewLimit(e.target.value); }} className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-violet-500" step="0.01" min="0" max={maxNewLimit} />
              <button onClick={handleSetMaxNew} className="px-3 py-2.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-xl text-sm font-medium transition-all whitespace-nowrap">Max</button>
            </div>
          </div>
          {suggestedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestedCategories.map(name => (
                <button key={name} onClick={() => setNewName(name)} className={`px-3 py-1.5 rounded-lg text-xs transition-all ${newName === name ? 'bg-violet-500/30 border border-violet-400/50 text-violet-300' : 'bg-slate-800 border border-slate-600 text-slate-400 hover:border-violet-500/50'}`}>
                  {name}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setIsAdding(false); setNewName(''); setNewLimit(''); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all font-medium">Anuluj</button>
            <button onClick={handleAdd} className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-all font-medium">Zapisz</button>
          </div>
        </div>
      )}

      {/* Lista kategorii */}
      {!collapsed && <div className="space-y-3">
        {categoryBudgets.length === 0 && !isAdding ? (
          <p className="text-slate-500 text-center py-6">Ustal limity, żeby kontrolować wydatki w poszczególnych kategoriach</p>
        ) : categoryBudgets.map(cat => {
          const spent = categorySpending[cat.name] || 0;
          const remaining = cat.limit - spent;
          const ratio = cat.limit > 0 ? Math.min(spent / cat.limit, 1) : 0;

          return (
            <div key={cat.id} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-violet-500/30 transition-all">
              {editingId === cat.id ? (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-violet-500" />
                    <div className="flex gap-2">
                      <input type="number" value={editLimit} onChange={(e) => { const v = parseFloat(e.target.value); const max = getMaxEditLimit(cat.limit); if (!e.target.value || v <= max) setEditLimit(e.target.value); }} className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-violet-500" step="0.01" min="0" />
                      <button onClick={() => handleSetMaxEdit(cat.limit)} className="px-2.5 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg text-xs font-medium transition-all">Max</button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleSaveEdit(cat.id)} className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingId(null)} className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-all"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-white">{cat.name}</p>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-medium ${getTextColor(spent, cat.limit)}`}>
                        {remaining >= 0 ? `Zostało ${formatCurrency(remaining)}` : `Przekroczono o ${formatCurrency(Math.abs(remaining))}`}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(cat)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-all"><Pencil className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-600/50 rounded-full h-2.5 mb-1.5">
                    <div className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(spent, cat.limit)}`} style={{ width: `${ratio * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Wydano: {formatCurrency(spent)}</span>
                    <span>Limit: {formatCurrency(cat.limit)}</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>}

      {/* Podsumowanie nieprzydzielonej kwoty */}
      {!collapsed && categoryBudgets.length > 0 && !overBudget && (
        <div className="mt-4 pt-4 border-t border-slate-600/30">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Nieprzydzielone do kategorii</span>
            <span className={`font-medium ${unallocated >= 0 ? 'text-slate-300' : 'text-rose-400'}`}>{formatCurrency(unallocated)}</span>
          </div>
          {totalOverspend > 0 && (
            <p className="text-xs text-rose-400/70 mt-1">Uwzględniono przekroczenia: −{formatCurrency(totalOverspend)}</p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteCategoryBudget(deleteTarget.id);
          setDeleteTarget(null);
        }}
        title="Usunąć kategorię budżetu?"
        description={
          deleteTarget
            ? `Kategoria „${deleteTarget.name}" zostanie usunięta. Wydatki przypisane do tej kategorii staną się „Bez kategorii". Tej operacji nie można cofnąć.`
            : ''
        }
        confirmLabel="Tak, usuń"
        cancelLabel="Anuluj"
        variant="danger"
      />
    </div>
  );
};
