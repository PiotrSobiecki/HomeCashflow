import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { History, Undo2, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchActionLog, undoActionLogEntry } from '../lib/api';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('pl-PL', {
    style: 'currency', currency: 'PLN', minimumFractionDigits: 2,
  }).format(amount);

const formatWhen = (iso) => {
  try {
    return new Date(iso).toLocaleString('pl-PL', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const RESOURCE_LABEL = {
  transaction: 'transakcję',
  savings_account: 'konto oszczędności',
  category_budget: 'budżet kategorii',
  savings_goal: 'cel oszczędnościowy',
};

const OP_VERB = {
  CREATE: 'dodał(a)',
  UPDATE: 'zmienił(a)',
  DELETE: 'usunął(a)',
  UNDO: 'cofnął(a)',
};

function describe(entry) {
  const resource = RESOURCE_LABEL[entry.resourceType] || entry.resourceType;
  const verb = OP_VERB[entry.operation] || entry.operation;
  const label = entry.label ? ` „${entry.label}”` : '';
  const amt = entry.amount != null && !Number.isNaN(entry.amount) ? ` ${formatCurrency(entry.amount)}` : '';
  return `${verb} ${resource}${label}${amt}`;
}

/**
 * Lista 20 ostatnich akcji household z opcją cofnięcia.
 * Ctrl+Z cofa najnowszą akcję bieżącego usera (nie cudzą).
 */
export function ActionLog({ currentUserId, isOwner, onAfterUndo }) {
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(true);
  const [pendingUndoId, setPendingUndoId] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const list = await fetchActionLog();
      setEntries(list);
    } catch (err) {
      setError(err.message || 'Nie udało się pobrać historii');
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Pollowanie wewnętrzne — co 30s, żeby cofnięcia z drugiego urządzenia stały się widoczne
  useEffect(() => {
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      refresh();
    }, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  const doUndo = useCallback(async (entry) => {
    if (!entry || entry.undoneAt || entry.operation === 'UNDO') return;
    // Permissions: tylko swoje, chyba że owner
    if (!isOwner && entry.actorId !== currentUserId) {
      setError('Możesz cofnąć tylko własne akcje');
      return;
    }
    setPendingUndoId(entry.id);
    setError(null);
    setNotice(null);
    try {
      const res = await undoActionLogEntry(entry.id);
      if (res.alreadyUndone) {
        setNotice('Ta akcja była już cofnięta.');
      } else if (res.notice) {
        setNotice(res.notice);
      }
      await refresh();
      if (typeof onAfterUndo === 'function') await onAfterUndo();
    } catch (err) {
      setError(err.message || 'Nie udało się cofnąć');
    } finally {
      setPendingUndoId(null);
    }
  }, [currentUserId, isOwner, refresh, onAfterUndo]);

  // Najnowsza moja niecofnięta akcja — kandydat na Ctrl+Z
  const myLatestUndoable = useMemo(() => {
    return entries.find(e =>
      e.actorId === currentUserId &&
      e.operation !== 'UNDO' &&
      !e.undoneAt,
    ) || null;
  }, [entries, currentUserId]);

  // Ref do najnowszej wartości, żeby handler keydown widział aktualny stan
  const latestRef = useRef(myLatestUndoable);
  useEffect(() => { latestRef.current = myLatestUndoable; }, [myLatestUndoable]);

  useEffect(() => {
    const onKey = (e) => {
      const isCtrlZ = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey;
      if (!isCtrlZ) return;
      // Nie przejmuj jeśli user pisze w inpucie/textarea/contenteditable
      const t = e.target;
      const tag = t?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || t?.isContentEditable) return;
      const candidate = latestRef.current;
      if (!candidate) return;
      e.preventDefault();
      doUndo(candidate);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doUndo]);

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6 mt-6">
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
            <h3 className="text-lg font-semibold text-white">Ostatnie akcje</h3>
            <p className="text-xs text-slate-400">
              {entries.length === 0 ? 'brak wpisów' : `${entries.length} ostatnich`}
              {myLatestUndoable && ' · Ctrl+Z cofa Twoją ostatnią akcję'}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

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
          {entries.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 border-t border-slate-700/50 pt-4">
              Brak zapisanych zdarzeń. Po dodaniu lub usunięciu wpisów pojawią się tutaj wraz z imieniem osoby.
            </p>
          ) : (
            <ul className="mt-4 space-y-2 border-t border-slate-700/50 pt-4">
              {entries.map((entry) => {
                const isOwn = entry.actorId === currentUserId;
                const canUndo = !entry.undoneAt && entry.operation !== 'UNDO' && (isOwner || isOwn);
                return (
                  <li
                    key={entry.id}
                    className="text-sm text-slate-300 py-2 px-3 rounded-xl bg-slate-900/40 border border-slate-700/30 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-indigo-300 font-medium">{entry.actorName || 'Nieznany'}</span>
                      <span className="text-slate-500"> · </span>
                      <span className="text-slate-500 text-xs whitespace-nowrap">{formatWhen(entry.at)}</span>
                      <span className="text-slate-600"> — </span>
                      <span>{describe(entry)}</span>
                      {entry.undoneAt && (
                        <span className="ml-2 text-xs text-amber-400">
                          (cofnięte{entry.undoneByName ? ` przez ${entry.undoneByName}` : ''})
                        </span>
                      )}
                    </div>
                    {canUndo ? (
                      <button
                        type="button"
                        onClick={() => doUndo(entry)}
                        disabled={pendingUndoId === entry.id}
                        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-slate-700/60 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Cofnij tę akcję"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        {pendingUndoId === entry.id ? 'Cofam…' : 'Cofnij'}
                      </button>
                    ) : entry.operation === 'UNDO' ? (
                      <span className="shrink-0 text-xs text-slate-500 italic">undo</span>
                    ) : !isOwn && !isOwner ? (
                      <span className="shrink-0 text-xs text-slate-600 italic" title="Tylko właściciel gospodarstwa może cofnąć cudze akcje">
                        cudza
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
