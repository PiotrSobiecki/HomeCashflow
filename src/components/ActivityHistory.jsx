import { useMemo, useState, useEffect } from 'react';
import { History, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

const PAGE_SIZE = 8;

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

export const ActivityHistory = ({ entries, MONTHS, canClear, onClear, selectedMonth }) => {
  const [open, setOpen] = useState(true);
  const [page, setPage] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);

  const sorted = useMemo(() => {
    const list = Array.isArray(entries) ? [...entries] : [];
    return list.sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [entries]);

  const filtered = useMemo(() => {
    return sorted.filter(e => e.month === selectedMonth);
  }, [sorted, selectedMonth]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSlice = useMemo(
    () => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtered, page]
  );

  useEffect(() => {
    setPage(0);
  }, [selectedMonth]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1);
    setPage((p) => Math.min(p, maxPage));
  }, [filtered.length]);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6 mt-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex-1 flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-slate-700/80 p-2.5 rounded-xl">
              <History className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Historia zmian</h3>
              <p className="text-xs text-slate-400">
                {MONTHS[selectedMonth]}
                {filtered.length > 0 ? ` (${filtered.length})` : ' — brak wpisów'}
              </p>
            </div>
          </div>
          {open ? (
            <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
          )}
        </button>
        {open && canClear && sorted.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all shrink-0"
            title="Wyczyść historię"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        filtered.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 border-t border-slate-700/50 pt-4">
            Brak zapisanych zdarzeń. Po dodaniu lub usunięciu wpisów pojawią się tutaj wraz z imieniem osoby.
          </p>
        ) : (
          <>
            <ul className="mt-4 space-y-2 border-t border-slate-700/50 pt-4">
              {pageSlice.map((entry) => (
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
            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-700/50">
                <button
                  type="button"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Poprzednia
                </button>
                <span className="text-xs text-slate-400 tabular-nums">
                  Strona {page + 1} z {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Następna
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )
      )}

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => { setConfirmClear(false); onClear(); }}
        title="Wyczyścić historię zmian?"
        description="Wszystkie wpisy w historii zostaną trwale usunięte. Tej operacji nie można cofnąć. Dane finansowe (przychody, wydatki, oszczędności) pozostaną bez zmian."
        confirmLabel="Tak, wyczyść historię"
        cancelLabel="Anuluj"
        variant="danger"
      />
    </div>
  );
};
