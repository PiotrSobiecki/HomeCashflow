import { useMemo, useState, useEffect, useCallback } from 'react';
import { History, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trash2, Undo2 } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { fetchActionLog, undoActionLogEntry } from '../lib/api';

const PAGE_SIZE = 8;
// Okno cofania = 24h. Po wygaśnięciu przycisk Cofnij znika; backend i tak
// odrzuci żądanie. Świadoma decyzja: brak hotkey Ctrl+Z, tylko przycisk —
// hotkey był zbyt łatwo wciskany przypadkowo.
const UNDO_WINDOW_MS = 24 * 60 * 60 * 1000;

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
  if (entry.operation === 'UNDO' || entry.action === 'undo') {
    return 'cofnął(a) poprzednią akcję';
  }

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
  if (kind === 'categoryBudget') {
    if (act === 'add') return `dodał(a) budżet kategorii ${name}${amt ? ` ${amt}` : ''}`;
    if (act === 'update') return `zmienił(a) budżet kategorii ${name}${amt ? ` ${amt}` : ''}`;
    if (act === 'delete') return `usunął(a) budżet kategorii ${name}${amt ? ` ${amt}` : ''}`;
  }
  if (kind === 'savingsGoal' && act === 'update') {
    return `zmienił(a) cel oszczędnościowy`;
  }

  return `${act} • ${kind}${name ? ` ${name}` : ''}`;
}

function mapServerEntry(raw) {
  let kind = null;
  if (raw.resourceType === 'transaction') {
    kind = raw.txnKind === 'income' ? 'income' : 'expense';
  } else if (raw.resourceType === 'savings_account') {
    kind = 'savings';
  } else if (raw.resourceType === 'category_budget') {
    kind = 'categoryBudget';
  } else if (raw.resourceType === 'savings_goal') {
    kind = 'savingsGoal';
  }

  const opMap = { CREATE: 'add', UPDATE: 'update', DELETE: 'delete', UNDO: 'undo' };

  return {
    id: raw.id,
    at: raw.at,
    userName: raw.actorName,
    actorId: raw.actorId,
    month: raw.month,
    kind,
    action: opMap[raw.operation] || String(raw.operation || '').toLowerCase(),
    label: raw.label,
    amount: raw.amount,
    operation: raw.operation,
    undoneAt: raw.undoneAt,
    undoneByName: raw.undoneByName,
    source: 'server',
  };
}

function matchesMonth(entry, selectedMonth) {
  if (entry.month == null) return true;
  return entry.month === selectedMonth;
}

export const ActivityHistory = ({
  entries: guestEntries,
  MONTHS,
  canClear,
  onClear,
  selectedMonth,
  isGuest,
  currentUserId,
  isOwner,
  onAfterUndo,
}) => {
  const [open, setOpen] = useState(true);
  const [page, setPage] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [undoTarget, setUndoTarget] = useState(null);
  const [serverEntries, setServerEntries] = useState([]);
  const [pendingUndoId, setPendingUndoId] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const refreshServer = useCallback(async () => {
    if (isGuest) return;
    try {
      const list = await fetchActionLog();
      setServerEntries(list.map(mapServerEntry));
      setError(null);
    } catch (err) {
      setError(err.message || 'Nie udało się pobrać historii');
    }
  }, [isGuest]);

  useEffect(() => {
    refreshServer();
  }, [refreshServer]);

  useEffect(() => {
    if (isGuest) return;
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      refreshServer();
    }, 30000);
    return () => clearInterval(id);
  }, [isGuest, refreshServer]);

  const sorted = useMemo(() => {
    const list = isGuest
      ? (Array.isArray(guestEntries) ? [...guestEntries] : [])
      : [...serverEntries];
    return list.sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [isGuest, guestEntries, serverEntries]);

  const filtered = useMemo(
    () => sorted.filter((e) => matchesMonth(e, selectedMonth)),
    [sorted, selectedMonth],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSlice = useMemo(
    () => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtered, page],
  );

  // Tick co 60s, żeby `canUndo` przeliczył się i przycisk znikł po wygaśnięciu
  // okna bez ręcznego refreshu strony.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (isGuest) return;
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, [isGuest]);

  const doUndo = useCallback(
    async (entry) => {
      if (!entry || entry.undoneAt || entry.operation === 'UNDO') return;
      if (!isOwner && entry.actorId !== currentUserId) {
        setError('Możesz cofnąć tylko własne akcje');
        return;
      }
      setPendingUndoId(entry.id);
      setError(null);
      setNotice(null);
      try {
        const res = await undoActionLogEntry(entry.id);
        if (res.alreadyUndone) setNotice('Ta akcja była już cofnięta.');
        else if (res.notice) setNotice(res.notice);
        await refreshServer();
        if (typeof onAfterUndo === 'function') await onAfterUndo();
      } catch (err) {
        setError(err.message || 'Nie udało się cofnąć');
      } finally {
        setPendingUndoId(null);
      }
    },
    [currentUserId, isOwner, refreshServer, onAfterUndo],
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
        <>
          {error && (
            <div className="mt-4 text-sm text-rose-400 border border-rose-500/30 bg-rose-500/10 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
          {notice && (
            <div className="mt-4 text-sm text-amber-300 border border-amber-500/30 bg-amber-500/10 rounded-xl px-3 py-2">
              {notice}
            </div>
          )}
          {filtered.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 border-t border-slate-700/50 pt-4">
              Brak zapisanych zdarzeń. Po dodaniu lub usunięciu wpisów pojawią się tutaj wraz z
              imieniem osoby.
            </p>
          ) : (
            <>
              <ul className="mt-4 space-y-2 border-t border-slate-700/50 pt-4">
                {pageSlice.map((entry) => {
                  const isOwn = entry.actorId === currentUserId;
                  const entryAtMs = entry.at ? new Date(entry.at).getTime() : NaN;
                  const ageMs = Number.isFinite(entryAtMs) ? now - entryAtMs : Infinity;
                  const withinWindow = ageMs <= UNDO_WINDOW_MS;
                  const canUndo =
                    !isGuest &&
                    !entry.undoneAt &&
                    entry.operation !== 'UNDO' &&
                    (isOwner || isOwn) &&
                    withinWindow;
                  return (
                    <li
                      key={entry.id}
                      className="text-sm text-slate-300 py-2 px-3 rounded-xl bg-slate-900/40 border border-slate-700/30 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-indigo-300 font-medium">
                          {entry.userName || 'Nieznany'}
                        </span>
                        <span className="text-slate-500"> · </span>
                        <span className="text-slate-500 text-xs whitespace-nowrap">
                          {formatWhen(entry.at)}
                        </span>
                        <span className="text-slate-600"> — </span>
                        <span>{describeActivity(entry, MONTHS)}</span>
                        {entry.undoneAt && (
                          <span className="ml-2 text-xs text-amber-400">
                            (cofnięte
                            {entry.undoneByName ? ` przez ${entry.undoneByName}` : ''})
                          </span>
                        )}
                      </div>
                      {canUndo ? (
                        <button
                          type="button"
                          onClick={() => setUndoTarget(entry)}
                          disabled={pendingUndoId === entry.id}
                          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-700/60 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Cofnij tę akcję (do 24h od dodania)"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          {pendingUndoId === entry.id ? 'Cofam…' : 'Cofnij'}
                        </button>
                      ) : null}
                    </li>
                  );
                })}
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
          )}
        </>
      )}

      <ConfirmDialog
        open={undoTarget !== null}
        onClose={() => setUndoTarget(null)}
        onConfirm={() => {
          const entry = undoTarget;
          setUndoTarget(null);
          if (entry) doUndo(entry);
        }}
        title="Cofnąć akcję?"
        description={
          undoTarget
            ? `Dane finansowe wrócą do stanu sprzed tej zmiany (przychody, wydatki, oszczędności itd.).\n\nOperacja: ${describeActivity(undoTarget, MONTHS)}`
            : ''
        }
        confirmLabel="Tak, cofnij"
        cancelLabel="Anuluj"
        variant="danger"
      />
      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          onClear();
        }}
        title="Wyczyścić historię zmian?"
        description="Wszystkie wpisy w historii zostaną trwale usunięte. Tej operacji nie można cofnąć. Dane finansowe (przychody, wydatki, oszczędności) pozostaną bez zmian."
        confirmLabel="Tak, wyczyść historię"
        cancelLabel="Anuluj"
        variant="danger"
      />
    </div>
  );
};
