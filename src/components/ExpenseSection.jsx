import { useEffect, useState } from 'react';
import { TrendingDown, Plus, Pencil, Trash2, Check, X, CalendarDays, Lock, ShoppingBag } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
  }).format(amount);

const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

export const ExpenseSection = ({
  expenses,
  addExpense,
  updateExpense,
  deleteExpense,
  categoryBudgets = [],
}) => {
  const getDefaultCategory = () => {
    const hasInne = categoryBudgets.some((c) => c.name === 'Inne');
    if (hasInne) return 'Inne';
    return categoryBudgets[0]?.name || '';
  };

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newIsFixed, setNewIsFixed] = useState(false);
  const [newCategory, setNewCategory] = useState(getDefaultCategory);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editIsFixed, setEditIsFixed] = useState(false);
  const [editCategory, setEditCategory] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formError, setFormError] = useState('');

  const hasCategories = categoryBudgets.length > 0;

  const getDefaultDate = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleAdd = () => {
    if (!newName.trim() || !newAmount) return;
    if (!newIsFixed && (!hasCategories || !newCategory)) {
      setFormError('Kazdy wydatek musi miec kategorie z budzetu.');
      return;
    }

    addExpense(newName.trim(), newAmount, newDate || getDefaultDate(), newIsFixed, newIsFixed ? null : newCategory);
    setNewName('');
    setNewAmount('');
    setNewDate('');
    setNewIsFixed(false);
    setNewCategory(getDefaultCategory());
    setFormError('');
    setIsAdding(false);
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setEditName(expense.name);
    setEditAmount(expense.amount.toString());
    setEditDate(expense.date || '');
    setEditIsFixed(expense.isFixed || false);
    setEditCategory(expense.category || getDefaultCategory());
    setFormError('');
  };

  const handleSaveEdit = (id) => {
    if (!editName.trim() || !editAmount) return;
    if (!editIsFixed && (!hasCategories || !editCategory)) {
      setFormError('Kazdy wydatek musi miec kategorie z budzetu.');
      return;
    }
    updateExpense(id, editName.trim(), editAmount, editDate, editIsFixed, editIsFixed ? null : editCategory);
    setEditingId(null);
    setFormError('');
  };

  const sortedExpenses = [...expenses].sort((a, b) => {
    if (a.isFixed && !b.isFixed) return -1;
    if (!a.isFixed && b.isFixed) return 1;
    return new Date(b.date || 0) - new Date(a.date || 0);
  });
  const fixedExpenses = expenses.filter((e) => e.isFixed);
  const variableExpenses = expenses.filter((e) => !e.isFixed);

  useEffect(() => {
    const openAddExpense = () => {
      setIsAdding(true);
      setNewDate(getDefaultDate());
      setNewCategory(getDefaultCategory());
      setFormError('');
    };
    window.addEventListener('financeflow:add-expense', openAddExpense);
    return () => window.removeEventListener('financeflow:add-expense', openAddExpense);
  }, [categoryBudgets]);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-rose-500/20 p-2.5 rounded-xl">
            <TrendingDown className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Wydatki</h3>
            <p className="text-xs text-slate-400">
              <span className="text-rose-400">{fixedExpenses.length} stalych</span> •{' '}
              <span className="text-orange-400">{variableExpenses.length} zmiennych</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setNewDate(getDefaultDate());
            setNewCategory(getDefaultCategory());
            setFormError('');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-xl transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          Dodaj
        </button>
      </div>

      {isAdding && (
        <div className="mb-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
          {!hasCategories && (
            <p className="text-xs text-amber-300 mb-3">
              Najpierw dodaj minimum jedna kategorie w sekcji "Budzety kategorii". Bez tego nie mozna zapisac wydatku.
            </p>
          )}
          {formError && <p className="text-xs text-rose-300 mb-3">{formError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="Nazwa wydatku"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
              autoFocus
            />
            <input
              type="number"
              placeholder="Kwota (PLN)"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
              step="0.01"
              min="0"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-rose-500"
            />
            <button
              onClick={() => {
                const next = !newIsFixed;
                setNewIsFixed(next);
                if (next) setNewCategory('');
                else setNewCategory(getDefaultCategory());
              }}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${newIsFixed ? 'bg-rose-500/30 border-rose-400/50 text-rose-300' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-rose-500/50'}`}
            >
              {newIsFixed ? <Lock className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              {newIsFixed ? 'Wydatek staly' : 'Wydatek zmienny'}
            </button>
            {!newIsFixed && (
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">Wybierz kategorie</option>
                {categoryBudgets.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setIsAdding(false);
                setNewName('');
                setNewAmount('');
                setNewDate('');
                setNewIsFixed(false);
                setNewCategory('');
                setFormError('');
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all font-medium"
            >
              Anuluj
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all font-medium"
            >
              Zapisz
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {sortedExpenses.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Brak wydatkow w tym miesiacu</p>
        ) : (
          sortedExpenses.map((expense) => (
            <div
              key={expense.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${expense.isFixed ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-400/50' : 'bg-slate-700/30 border-slate-600/30 hover:border-orange-500/30'}`}
            >
              {editingId === expense.id ? (
                <div className="flex-1 flex flex-col gap-3">
                  {formError && <p className="text-xs text-rose-300">{formError}</p>}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-rose-500"
                    />
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-rose-500"
                      step="0.01"
                    />
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const next = !editIsFixed;
                          setEditIsFixed(next);
                          if (next) setEditCategory('');
                          else setEditCategory(getDefaultCategory());
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${editIsFixed ? 'bg-rose-500/30 text-rose-300' : 'bg-slate-700 text-slate-400'}`}
                      >
                        {editIsFixed ? <Lock className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                        {editIsFixed ? 'Staly' : 'Zmienny'}
                      </button>
                      {!editIsFixed && (
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
                        >
                          <option value="">Wybierz kategorie</option>
                          {categoryBudgets.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(expense.id)}
                        className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setFormError('');
                        }}
                        className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {expense.isFixed && <Lock className="w-3.5 h-3.5 text-rose-400" />}
                      <p className="font-medium text-white">{expense.name}</p>
                      {expense.isFixed && <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 text-xs rounded">staly</span>}
                      {!expense.isFixed && expense.category && (
                        <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded">{expense.category}</span>
                      )}
                    </div>
                    {expense.date && (
                      <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                        <CalendarDays className="w-3 h-3" />
                        {formatDate(expense.date)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-semibold ${expense.isFixed ? 'text-rose-400' : 'text-orange-400'}`}>{formatCurrency(expense.amount)}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            id: expense.id,
                            name: expense.name,
                            amountLabel: formatCurrency(expense.amount),
                          })
                        }
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteExpense(deleteTarget.id);
          setDeleteTarget(null);
        }}
        title="Usunac wydatek?"
        description={
          deleteTarget
            ? `Wpis „${deleteTarget.name}” (${deleteTarget.amountLabel}) zostanie trwale usuniety z tego miesiaca. Tej operacji nie mozna cofnac.`
            : ''
        }
        confirmLabel="Tak, usun"
        cancelLabel="Anuluj"
        variant="danger"
      />
    </div>
  );
};
