import { useState } from 'react';
import { PiggyBank, Plus, Pencil, Trash2, Check, X, Landmark, Wallet, TrendingUp } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

const formatCurrency = (amount) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2 }).format(amount);

const ICONS = {
  bank: Landmark,
  wallet: Wallet,
  invest: TrendingUp,
  piggy: PiggyBank,
};

const ICON_OPTIONS = [
  { key: 'bank', label: 'Konto' },
  { key: 'wallet', label: 'Gotówka' },
  { key: 'invest', label: 'Inwestycje' },
  { key: 'piggy', label: 'Skarbonka' },
];

export const SavingsAccounts = ({ accounts, totalSavings, addAccount, updateAccount, deleteAccount }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newIcon, setNewIcon] = useState('bank');
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editIcon, setEditIcon] = useState('bank');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleAdd = () => {
    if (newName.trim() && newAmount) {
      addAccount(newName.trim(), newAmount, newIcon);
      setNewName(''); setNewAmount(''); setNewIcon('bank'); setIsAdding(false);
    }
  };

  const handleEdit = (acc) => {
    setEditingId(acc.id); setEditName(acc.name); setEditAmount(acc.amount.toString()); setEditIcon(acc.icon || 'bank');
  };

  const handleSaveEdit = (id) => {
    if (editName.trim() && editAmount) {
      updateAccount(id, editName.trim(), editAmount, editIcon);
      setEditingId(null);
    }
  };

  const iconColors = {
    bank: 'text-blue-400',
    wallet: 'text-emerald-400',
    invest: 'text-purple-400',
    piggy: 'text-amber-400',
  };

  return (
    <div className="bg-gradient-to-r from-indigo-600/15 via-blue-500/10 to-indigo-600/15 border border-indigo-500/30 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2.5 rounded-xl">
            <PiggyBank className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Moje oszczędności</h3>
            <p className="text-xs text-slate-400">
              {accounts.length > 0
                ? <>Łącznie: <span className="text-indigo-400 font-medium">{formatCurrency(totalSavings)}</span> w {accounts.length} {accounts.length === 1 ? 'źródle' : 'źródłach'}</>
                : 'Dodaj swoje konta i źródła oszczędności'}
            </p>
          </div>
        </div>
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-xl transition-all font-medium">
          <Plus className="w-4 h-4" />Dodaj
        </button>
      </div>

      {/* Formularz dodawania */}
      {isAdding && (
        <div className="mb-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input type="text" placeholder="Nazwa (np. Konto oszczędnościowe)" value={newName} onChange={(e) => setNewName(e.target.value)} className="px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" autoFocus />
            <input type="number" placeholder="Kwota (PLN)" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" step="0.01" min="0" />
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {ICON_OPTIONS.map(opt => {
              const Icon = ICONS[opt.key];
              return (
                <button key={opt.key} onClick={() => setNewIcon(opt.key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${newIcon === opt.key ? 'bg-indigo-500/30 border border-indigo-400/50 text-indigo-300' : 'bg-slate-800 border border-slate-600 text-slate-400 hover:border-indigo-500/50'}`}>
                  <Icon className="w-3.5 h-3.5" />{opt.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setIsAdding(false); setNewName(''); setNewAmount(''); setNewIcon('bank'); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all font-medium">Anuluj</button>
            <button onClick={handleAdd} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all font-medium">Zapisz</button>
          </div>
        </div>
      )}

      {/* Lista kont */}
      <div className="space-y-3">
        {accounts.length === 0 && !isAdding ? (
          <p className="text-slate-500 text-center py-6">Wpisz ile masz odłożone, żeby widzieć realny obraz finansów</p>
        ) : accounts.map(acc => {
          const Icon = ICONS[acc.icon] || ICONS.bank;
          const color = iconColors[acc.icon] || iconColors.bank;

          return (
            <div key={acc.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-indigo-500/30 transition-all">
              {editingId === acc.id ? (
                <div className="flex-1 flex flex-col gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
                    <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500" step="0.01" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {ICON_OPTIONS.map(opt => {
                        const OptIcon = ICONS[opt.key];
                        return (
                          <button key={opt.key} onClick={() => setEditIcon(opt.key)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${editIcon === opt.key ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-700 text-slate-400'}`}>
                            <OptIcon className="w-3 h-3" />{opt.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEdit(acc.id)} className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-all"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-slate-800/50`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <p className="font-medium text-white">{acc.name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-indigo-400 font-semibold">{formatCurrency(acc.amount)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(acc)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-all"><Pencil className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setDeleteTarget({ id: acc.id, name: acc.name, amountLabel: formatCurrency(acc.amount) })} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteAccount(deleteTarget.id);
          setDeleteTarget(null);
        }}
        title="Usunąć źródło oszczędności?"
        description={
          deleteTarget
            ? `Wpis „${deleteTarget.name}” (${deleteTarget.amountLabel}) zostanie trwale usunięty z listy oszczędności. Tej operacji nie można cofnąć.`
            : ''
        }
        confirmLabel="Tak, usuń"
        cancelLabel="Anuluj"
        variant="danger"
      />
    </div>
  );
};
