import { useMemo, useState } from 'react';
import { History, ChevronDown, ChevronUp } from 'lucide-react';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
  }).format(amount);

const formatWhen = (iso) => {
  try {
    return new Date(iso).toLocaleString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

/** Czytelny opis jednego wpisu historii (PL). */
export function describeActivity(entry, MONTHS) {
  const name = entry.label ? `„${entry.label}”` : '';
  const amt = entry.amount != null && !Number.isNaN(entry.amount) ? formatCurrency(entry.amount) : '';
  const monthName = entry.month != null && MONTHS[entry.month] ? MONTHS[entry.month] : null;
  const monthBit = monthName ? ` (${monthName})` : '';

  if (entry.action === 'clear' && entry.kind === 'all') {
    return `wyczyścił(a) wszystkie dane finansowe`;
  }

  const kind = entry.kind;
  const act = entry.action;

  if (kind === 'income') {
    if (act === 'add') return `dodał(a) przychód ${name}${amt ? ` ${amt}` : ''}${monthBit}`;
    if (act === 'update') return `zmienił(a) przychód ${name}${amt ? ` ${amt}` : ''}${monthBit}`;
    if (act === 'delete') return `usunął(a) przychód ${name}${amt ? ` ${amt}` : ''}${monthBit}`;
  }
  if (kind === 'expense') {
    if (act === 'add') return `dodał(a) wydatek ${name}${amt ? ` ${amt}` : ''}${monthBit}`;
    if (act === 'update') return `zmienił(a) wydatek ${name}${amt ? ` ${amt}` : ''}${monthBit}`;
    if (act === 'delete') return `usunął(a) wydatek ${name}${amt ? ` ${amt}` : ''}${monthBit}`;
  }
  if (kind === 'savings') {
    if (act === 'add') return `dodał(a) wpis oszczędności ${name}${amt ? ` ${amt}` : ''}`;
    if (act === 'update') return `zmienił(a) wpis oszczędności ${name}${amt ? ` ${amt}` : ''}`;
    if (act === 'delete') return `usunął(a) wpis oszczędności ${name}${amt ? ` ${amt}` : ''}`;
  }
  if (kind === 'savingsGoal' && act === 'update') {
    return `zmienił(a) cel oszczędnościowy`;
  }

  return `${act} • ${kind}${name ? ` ${name}` : ''}`;
}

export const ActivityHistory = ({ entries, MONTHS }) => {
  const [open, setOpen] = useState(true);

  const sorted = useMemo(() => {
    const list = Array.isArray(entries) ? [...entries] : [];
    return list.sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [entries]);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="bg-slate-700/80 p-2.5 rounded-xl">
            <History className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Historia zmian</h3>
            <p className="text-xs text-slate-400">
              Kto dodał, edytował lub usunął przychody, wydatki i oszczędności
              {sorted.length > 0 ? ` (${sorted.length})` : ''}
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
        )}
      </button>

      {open && (
        sorted.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 border-t border-slate-700/50 pt-4">
            Brak zapisanych zdarzeń. Po dodaniu lub usunięciu wpisów pojawią się tutaj wraz z imieniem osoby.
          </p>
        ) : (
          <ul className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1 border-t border-slate-700/50 pt-4">
            {sorted.map((entry) => (
              <li
                key={entry.id}
                className="text-sm text-slate-300 py-2 px-3 rounded-xl bg-slate-900/40 border border-slate-700/30"
              >
                <span className="text-indigo-300 font-medium">{entry.userName || 'Nieznany'}</span>
                <span className="text-slate-500"> · </span>
                <span className="text-slate-500 text-xs whitespace-nowrap">{formatWhen(entry.at)}</span>
                <span className="text-slate-600"> — </span>
                <span>{describeActivity(entry, MONTHS)}</span>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
};
