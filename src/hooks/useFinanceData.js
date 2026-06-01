import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  fetchFinanceData,
  saveFinanceDataOnServer,
  createTransaction,
  patchTransaction,
  deleteTransaction,
  createSavingsAccount,
  patchSavingsAccount,
  deleteSavingsAccount as apiDeleteSavingsAccount,
  createCategoryBudget,
  patchCategoryBudget,
  deleteCategoryBudget as apiDeleteCategoryBudget,
  putSavingsGoal,
  ConflictError,
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { usePolling } from './usePolling';

const POLLING_INTERVAL_MS = 30_000;

// Stałe
const GUEST_STORAGE_KEY = 'homecashflow-guest-data';
export const CURRENT_YEAR = 2026;
export const MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];
export const MONTHS_SHORT = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];

// Funkcje pomocnicze
export const getCurrentMonth = () => new Date().getMonth();
export const getCurrentDay = () => new Date().getDate();
export const getDaysRemainingInMonth = () => {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return lastDay.getDate() - today.getDate() + 1;
};
export const getTotalDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();

const createEmptyMonthData = () => ({ incomes: [], expenses: [], deletedFixed: { incomes: [], expenses: [] } });
const DEFAULT_EXPENSE_CATEGORY = 'Inne';

const ACTIVITY_LOG_MAX = 150;

// Predefiniowane kategorie budżetowe
export const DEFAULT_BUDGET_CATEGORIES = [
  'Żywność', 'Transport', 'Zdrowie i Higiena', 'Rozrywka',
  'Ubrania i Obuwie', 'Edukacja', 'Inne',
];

const createInitialData = () => {
  const data = {
    months: {},
    savingsGoal: { type: 'none', monthlyAmount: 0, yearlyAmount: 0, targetMonth: 11 },
    savingsAccounts: [],
    categoryBudgets: [],
    activityLog: [],
  };
  for (let month = 0; month < 12; month++) {
    data.months[month] = createEmptyMonthData();
  }
  return data;
};

/** Pełna struktura z API / localStorage — pusty {} z Neon po INSERT nie ma `months`. */
const normalizeFinanceData = (raw) => {
  const initial = createInitialData();
  if (!raw || typeof raw !== 'object') return initial;

  const months = { ...initial.months };
  if (raw.months && typeof raw.months === 'object') {
    for (let m = 0; m < 12; m++) {
      const src = raw.months[m] ?? raw.months[String(m)];
      if (src && typeof src === 'object') {
        months[m] = {
          incomes: Array.isArray(src.incomes) ? src.incomes : [],
          expenses: Array.isArray(src.expenses)
            ? src.expenses.map((exp) => ({
                ...exp,
                category: exp?.isFixed ? exp?.category : (exp?.category || DEFAULT_EXPENSE_CATEGORY),
              }))
            : [],
          deletedFixed: src.deletedFixed && typeof src.deletedFixed === 'object'
            ? {
                incomes: Array.isArray(src.deletedFixed.incomes) ? src.deletedFixed.incomes : [],
                expenses: Array.isArray(src.deletedFixed.expenses) ? src.deletedFixed.expenses : [],
              }
            : { incomes: [], expenses: [] },
        };
      }
    }
  }

  const sg = raw.savingsGoal && typeof raw.savingsGoal === 'object' ? raw.savingsGoal : {};
  const rawLog = Array.isArray(raw.activityLog) ? raw.activityLog : [];
  return {
    months,
    savingsGoal: { ...initial.savingsGoal, ...sg },
    savingsAccounts: Array.isArray(raw.savingsAccounts) ? raw.savingsAccounts : [],
    categoryBudgets: Array.isArray(raw.categoryBudgets) ? raw.categoryBudgets : [],
    activityLog: rawLog.slice(-ACTIVITY_LOG_MAX),
  };
};

const hasPersistedMonthShape = (payload) =>
  payload &&
  typeof payload === 'object' &&
  payload.months &&
  typeof payload.months === 'object' &&
  Object.keys(payload.months).length > 0;

export const useFinanceData = () => {
  const { user, isGuest } = useAuth();
  const [data, setData] = useState(createInitialData());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Konflikt 409 z per-row mutacji — Dashboard renderuje ConflictDialog
  const [conflict, setConflict] = useState(null);
  const clearConflict = useCallback(() => setConflict(null), []);

  // Tryb live: user zalogowany i nie gość — używamy per-row API z backendem
  const isLive = !!user && !isGuest;

  // savingRef: usePolling musi mieć stabilne ref do flagi (nie odpalać tick gdy mutacja w toku)
  const savingRef = useRef(false);
  const repairedFixedDatesRef = useRef(new Set());
  useEffect(() => { savingRef.current = saving; }, [saving]);

  // Wspólne pobranie z API (reuse w initial load + polling)
  const refetchFromApi = useCallback(async () => {
    const response = await fetchFinanceData();
    const payload = response?.data;
    const normalized = normalizeFinanceData(payload && typeof payload === 'object' ? payload : null);
    setData(normalized);
  }, []);

  // Pobierz dane - z API (Neon) lub localStorage
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (isGuest) {
          // Tryb gościa - użyj localStorage
          const saved = localStorage.getItem(GUEST_STORAGE_KEY);
          if (saved) {
            try {
              setData(normalizeFinanceData(JSON.parse(saved)));
            } catch {
              setData(createInitialData());
            }
          } else {
            setData(createInitialData());
          }
        } else {
          // Zalogowany użytkownik - użyj backendu opartego o Neon
          await refetchFromApi();
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isGuest]);

  // Polling: co 30s odśwież stan z API. Skip gdy tab schowany albo mutacja w toku.
  // Powrót do tabu → natychmiastowy refetch (Page Visibility API).
  const pollingTick = useCallback(async () => {
    if (!isLive) return;
    try {
      await refetchFromApi();
    } catch (err) {
      console.error('polling error:', err);
    }
  }, [isLive, refetchFromApi]);

  const pollingBlocked = useCallback(() => savingRef.current, []);

  usePolling({
    intervalMs: POLLING_INTERVAL_MS,
    enabled: isLive,
    onTick: pollingTick,
    isBlocked: pollingBlocked,
  });

  // Zapisz dane - do API (Neon) lub localStorage
  const saveData = useCallback(async (newData) => {
    if (!user) return;
    setSaving(true);
    try {
      if (isGuest) {
        // Tryb gościa - zapisz do localStorage
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(newData));
      } else {
        // Zalogowany użytkownik - zapisz do backendu opartego o Neon
        await saveFinanceDataOnServer(newData);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  }, [user, isGuest]);

  // Funkcja pomocnicza do aktualizacji danych
  const updateData = useCallback((updater) => {
    setData(prev => {
      const newData = updater(prev);
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  const appendActivity = useCallback((prev, partial) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      at: new Date().toISOString(),
      userId: user?.id ?? null,
      userName: user?.name || (user?.email ? user.email.split('@')[0] : '') || 'Gość',
      ...partial,
    };
    const log = Array.isArray(prev.activityLog) ? prev.activityLog : [];
    return [...log, entry].slice(-ACTIVITY_LOG_MAX);
  }, [user]);

  const monthDefaultDate = (monthIdx) =>
    `${CURRENT_YEAR}-${String(monthIdx + 1).padStart(2, '0')}-01`;

  /** Stałe: ten sam dzień miesiąca w roku bieżącym (np. 20.05 → 20.06; 31.01 → 28.02). */
  const shiftFixedDateToMonth = (sourceDateStr, targetMonthIdx, year = CURRENT_YEAR) => {
    const m = sourceDateStr?.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const day = m ? Math.max(1, Math.min(31, parseInt(m[3], 10) || 1)) : 1;
    const lastDay = getTotalDaysInMonth(targetMonthIdx, year);
    const safeDay = Math.min(day, lastDay);
    return `${year}-${String(targetMonthIdx + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
  };

  const buildTxnDate = (date, monthIdx) => date || monthDefaultDate(monthIdx);

  const txnDateMonthIndex = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const m = dateStr.match(/^(\d{4})-(\d{2})/);
    if (!m) return null;
    const idx = parseInt(m[2], 10) - 1;
    return idx >= 0 && idx <= 11 ? idx : null;
  };

  // ============ AUTO-PRZENOSZENIE STAŁYCH ============
  // Przy wejściu w miesiąc, dokopiuj brakujące stałe przychody/wydatki z poprzedniego miesiąca
  useEffect(() => {
    if (loading) return;
    if (selectedMonth === 0) return;

    const monthData = data.months[selectedMonth];
    if (!monthData) return;

    // Szukaj najbliższego wcześniejszego miesiąca ze stałymi
    let sourceMonth = null;
    for (let m = selectedMonth - 1; m >= 0; m--) {
      const md = data.months[m];
      if (md && (md.incomes.some(i => i.isFixed) || md.expenses.some(e => e.isFixed))) {
        sourceMonth = m;
        break;
      }
    }
    if (sourceMonth === null) return;

    const source = data.months[sourceMonth];
    const existingIncomeNames = new Set(monthData.incomes.filter(i => i.isFixed).map(i => i.name));
    const existingExpenseNames = new Set(monthData.expenses.filter(e => e.isFixed).map(e => e.name));
    const deletedFixedIncomeNames = new Set(monthData.deletedFixed?.incomes ?? []);
    const deletedFixedExpenseNames = new Set(monthData.deletedFixed?.expenses ?? []);

    const newFixedIncomes = source.incomes
      .filter(i => i.isFixed && !existingIncomeNames.has(i.name) && !deletedFixedIncomeNames.has(i.name))
      .map(i => ({
        name: i.name,
        amount: i.amount,
        isFixed: true,
        id: Date.now() + Math.random(),
        date: shiftFixedDateToMonth(i.date, selectedMonth),
      }));
    const newFixedExpenses = source.expenses
      .filter(e => e.isFixed && !existingExpenseNames.has(e.name) && !deletedFixedExpenseNames.has(e.name))
      .map(e => ({
        name: e.name,
        amount: e.amount,
        isFixed: true,
        category: e.category,
        id: Date.now() + Math.random(),
        date: shiftFixedDateToMonth(e.date, selectedMonth),
      }));

    if (newFixedIncomes.length === 0 && newFixedExpenses.length === 0) return;

    if (!isLive) {
      // Guest mode — stary path (localStorage przez updateData)
      updateData(prev => ({
        ...prev,
        months: {
          ...prev.months,
          [selectedMonth]: {
            ...prev.months[selectedMonth],
            incomes: [...prev.months[selectedMonth].incomes, ...newFixedIncomes],
            expenses: [...prev.months[selectedMonth].expenses, ...newFixedExpenses],
          }
        }
      }));
      return;
    }

    // Live mode — per-row POST per kopiowaną stałą (liveCreate wstawia optimistic + utrwala)
    for (const inc of newFixedIncomes) {
      liveCreate('income', selectedMonth, { name: inc.name, amount: inc.amount, isFixed: true, date: inc.date });
    }
    for (const exp of newFixedExpenses) {
      liveCreate('expense', selectedMonth, {
        name: exp.name,
        amount: exp.amount,
        isFixed: true,
        date: exp.date,
        ...(exp.category ? { category: exp.category } : {}),
      });
    }
  }, [selectedMonth, loading]);

  // ============ CRUD DLA PRZYCHODÓW ============
  // Live mode (zalogowany, nie gość) → per-row API z optimistic+rollback+conflict.
  // Guest mode → stary path przez updateData → localStorage.

  const replaceItem = (collection, predicate, value) =>
    collection.map(it => (predicate(it) ? value : it));

  const upsertTxnLocal = (kind, monthIdx, predicate, nextItem) =>
    setData(prev => ({
      ...prev,
      months: {
        ...prev.months,
        [monthIdx]: {
          ...prev.months[monthIdx],
          [kind === 'income' ? 'incomes' : 'expenses']: replaceItem(
            prev.months[monthIdx][kind === 'income' ? 'incomes' : 'expenses'],
            predicate,
            nextItem,
          ),
        },
      },
    }));

  const removeTxnLocal = (kind, monthIdx, predicate) =>
    setData(prev => ({
      ...prev,
      months: {
        ...prev.months,
        [monthIdx]: {
          ...prev.months[monthIdx],
          [kind === 'income' ? 'incomes' : 'expenses']: prev.months[monthIdx][
            kind === 'income' ? 'incomes' : 'expenses'
          ].filter(it => !predicate(it)),
        },
      },
    }));

  const insertTxnLocal = (kind, monthIdx, item) =>
    setData(prev => ({
      ...prev,
      months: {
        ...prev.months,
        [monthIdx]: {
          ...prev.months[monthIdx],
          [kind === 'income' ? 'incomes' : 'expenses']: [
            ...prev.months[monthIdx][kind === 'income' ? 'incomes' : 'expenses'],
            item,
          ],
        },
      },
    }));

  // === Per-row helpers ===
  const liveCreate = async (kind, monthIdx, fields) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const txnDate = buildTxnDate(fields.date, monthIdx);
    const optimistic = { id: tempId, ...fields, date: txnDate, updatedAt: null };
    insertTxnLocal(kind, monthIdx, optimistic);
    setSaving(true);
    try {
      const saved = await createTransaction({
        kind, name: fields.name, amount: fields.amount, txnDate,
        year: CURRENT_YEAR, month: monthIdx,
        isFixed: !!fields.isFixed,
        ...(kind === 'expense' && !fields.isFixed && fields.category ? { category: fields.category } : {}),
      });
      upsertTxnLocal(kind, monthIdx, it => it.id === tempId, {
        id: saved.id, name: saved.name, amount: saved.amount,
        isFixed: saved.isFixed, date: saved.txnDate, updatedAt: saved.updatedAt,
        createdBy: saved.createdBy ?? null,
        ...(saved.category ? { category: saved.category } : {}),
      });
    } catch (err) {
      console.error(`add ${kind} error:`, err);
      removeTxnLocal(kind, monthIdx, it => it.id === tempId);
    } finally {
      setSaving(false);
    }
  };

  const liveUpdate = async (kind, monthIdx, id, fields) => {
    // Snapshot poprzedniego rekordu do rollback / current.updatedAt do PATCH
    let prevItem = null;
    setData(prev => {
      const list = prev.months[monthIdx][kind === 'income' ? 'incomes' : 'expenses'];
      prevItem = list.find(it => it.id === id) ?? null;
      const nextItem = prevItem ? { ...prevItem, ...fields, date: buildTxnDate(fields.date, monthIdx) } : null;
      if (!nextItem) return prev;
      return {
        ...prev,
        months: { ...prev.months, [monthIdx]: {
          ...prev.months[monthIdx],
          [kind === 'income' ? 'incomes' : 'expenses']: list.map(it => it.id === id ? nextItem : it),
        }},
      };
    });
    if (!prevItem?.updatedAt) {
      // Brak updatedAt (POST jeszcze w locie) — pomijamy PATCH; stan lokalny zaktualizowany,
      // serwerowa wersja zostaje z POST-a. Akceptowalna race condition.
      return;
    }
    setSaving(true);
    const txnDate = buildTxnDate(fields.date, monthIdx);
    const changes = { name: fields.name, amount: fields.amount, txnDate };
    try {
      const saved = await patchTransaction(id, prevItem.updatedAt, changes);
      upsertTxnLocal(kind, monthIdx, it => it.id === id, {
        id: saved.id, name: saved.name, amount: saved.amount,
        isFixed: saved.isFixed, date: saved.txnDate, updatedAt: saved.updatedAt,
        createdBy: saved.createdBy ?? null,
        ...(saved.category ? { category: saved.category } : {}),
      });
    } catch (err) {
      if (err instanceof ConflictError) {
        setConflict({
          resourceLabel: prevItem.name,
          yours: { name: fields.name, amount: fields.amount },
          theirs: { name: err.current.name, amount: err.current.amount },
          onOverride: async () => {
            try {
              const saved = await patchTransaction(id, err.current.updatedAt, changes);
              upsertTxnLocal(kind, monthIdx, it => it.id === id, {
                id: saved.id, name: saved.name, amount: saved.amount,
                isFixed: saved.isFixed, date: saved.txnDate, updatedAt: saved.updatedAt,
                ...(saved.category ? { category: saved.category } : {}),
              });
            } catch (e) {
              console.error('override retry error:', e);
            } finally {
              clearConflict();
            }
          },
          onCancel: () => {
            upsertTxnLocal(kind, monthIdx, it => it.id === id, {
              id: err.current.id, name: err.current.name, amount: err.current.amount,
              isFixed: err.current.isFixed, date: err.current.txnDate, updatedAt: err.current.updatedAt,
              ...(err.current.category ? { category: err.current.category } : {}),
            });
            clearConflict();
          },
        });
      } else {
        console.error(`update ${kind} error:`, err);
        if (prevItem) upsertTxnLocal(kind, monthIdx, it => it.id === id, prevItem);
      }
    } finally {
      setSaving(false);
    }
  };

  const liveDelete = async (kind, monthIdx, id) => {
    let prevItem = null;
    setData(prev => {
      const list = prev.months[monthIdx][kind === 'income' ? 'incomes' : 'expenses'];
      prevItem = list.find(it => it.id === id) ?? null;
      const monthData = prev.months[monthIdx];
      const prevDeleted = monthData.deletedFixed ?? { incomes: [], expenses: [] };
      const deletedFixed = prevItem?.isFixed
        ? { ...prevDeleted, [kind === 'income' ? 'incomes' : 'expenses']:
            [...prevDeleted[kind === 'income' ? 'incomes' : 'expenses'], prevItem.name] }
        : prevDeleted;
      return {
        ...prev,
        months: { ...prev.months, [monthIdx]: {
          ...monthData,
          deletedFixed,
          [kind === 'income' ? 'incomes' : 'expenses']: list.filter(it => it.id !== id),
        }},
      };
    });
    if (!prevItem?.updatedAt) return; // niezpersystowany jeszcze rekord
    setSaving(true);
    try {
      await deleteTransaction(id, prevItem.updatedAt);
    } catch (err) {
      if (err instanceof ConflictError) {
        console.warn(`Konflikt przy DELETE ${id} — ktoś inny zmienił. Odświeżam stan po prostu nic nie robiąc.`);
        // Optymistycznie usunęliśmy lokalnie — to OK; przy najbliższym GET zobaczymy świeży stan.
      } else {
        console.error(`delete ${kind} error:`, err);
        // Rollback: wstaw z powrotem
        if (prevItem) insertTxnLocal(kind, monthIdx, prevItem);
      }
    } finally {
      setSaving(false);
    }
  };

  // Stałe skopiowane wcześniej bez poprawnej daty (np. maj w widoku czerwca) — jednorazowa korekta
  useEffect(() => {
    if (loading) return;
    const repairKey = `${CURRENT_YEAR}-${selectedMonth}`;
    if (repairedFixedDatesRef.current.has(repairKey)) return;

    const monthData = data.months[selectedMonth];
    if (!monthData) return;

    let sourceMonth = null;
    for (let m = selectedMonth - 1; m >= 0; m--) {
      const md = data.months[m];
      if (md && (md.incomes.some(i => i.isFixed) || md.expenses.some(e => e.isFixed))) {
        sourceMonth = m;
        break;
      }
    }
    const source = sourceMonth !== null ? data.months[sourceMonth] : null;

    const expectedFixedDate = (item, sourceList) => {
      const src = sourceList?.find((x) => x.isFixed && x.name === item.name);
      if (src) return shiftFixedDateToMonth(src.date, selectedMonth);
      if (txnDateMonthIndex(item.date) !== selectedMonth) {
        return shiftFixedDateToMonth(item.date, selectedMonth);
      }
      return null;
    };

    const fixIncome = monthData.incomes
      .map((inc) => {
        if (!inc.isFixed) return null;
        const expected = expectedFixedDate(inc, source?.incomes);
        return expected && inc.date !== expected ? { ...inc, expected } : null;
      })
      .filter(Boolean);
    const fixExpense = monthData.expenses
      .map((exp) => {
        if (!exp.isFixed) return null;
        const expected = expectedFixedDate(exp, source?.expenses);
        return expected && exp.date !== expected ? { ...exp, expected } : null;
      })
      .filter(Boolean);
    if (fixIncome.length === 0 && fixExpense.length === 0) {
      repairedFixedDatesRef.current.add(repairKey);
      return;
    }

    if (!isLive) {
      updateData((prev) => ({
        ...prev,
        months: {
          ...prev.months,
          [selectedMonth]: {
            ...prev.months[selectedMonth],
            incomes: prev.months[selectedMonth].incomes.map((inc) => {
              const fix = fixIncome.find((f) => f.id === inc.id);
              return fix ? { ...inc, date: fix.expected } : inc;
            }),
            expenses: prev.months[selectedMonth].expenses.map((exp) => {
              const fix = fixExpense.find((f) => f.id === exp.id);
              return fix ? { ...exp, date: fix.expected } : exp;
            }),
          },
        },
      }));
      repairedFixedDatesRef.current.add(repairKey);
      return;
    }

    let cancelled = false;
    (async () => {
      for (const inc of fixIncome) {
        if (cancelled || !inc.updatedAt || String(inc.id).startsWith('temp-')) continue;
        upsertTxnLocal('income', selectedMonth, (it) => it.id === inc.id, { ...inc, date: inc.expected });
        try {
          const saved = await patchTransaction(inc.id, inc.updatedAt, {
            name: inc.name,
            amount: inc.amount,
            txnDate: inc.expected,
          });
          if (cancelled) return;
          upsertTxnLocal('income', selectedMonth, (it) => it.id === inc.id, {
            id: saved.id,
            name: saved.name,
            amount: saved.amount,
            isFixed: saved.isFixed,
            date: saved.txnDate,
            updatedAt: saved.updatedAt,
            createdBy: saved.createdBy ?? null,
          });
        } catch (err) {
          console.error('repair fixed income date:', err);
        }
      }
      for (const exp of fixExpense) {
        if (cancelled || !exp.updatedAt || String(exp.id).startsWith('temp-')) continue;
        upsertTxnLocal('expense', selectedMonth, (it) => it.id === exp.id, { ...exp, date: exp.expected });
        try {
          const saved = await patchTransaction(exp.id, exp.updatedAt, {
            name: exp.name,
            amount: exp.amount,
            txnDate: exp.expected,
          });
          if (cancelled) return;
          upsertTxnLocal('expense', selectedMonth, (it) => it.id === exp.id, {
            id: saved.id,
            name: saved.name,
            amount: saved.amount,
            isFixed: saved.isFixed,
            date: saved.txnDate,
            updatedAt: saved.updatedAt,
            createdBy: saved.createdBy ?? null,
            ...(saved.category ? { category: saved.category } : {}),
          });
        } catch (err) {
          console.error('repair fixed expense date:', err);
        }
      }
      if (!cancelled) repairedFixedDatesRef.current.add(repairKey);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedMonth, loading, isLive, data.months, updateData]);

  const addIncome = (name, amount, isFixed = false, date = '') => {
    const amt = parseFloat(amount);
    if (!isLive) {
      updateData(prev => ({
        ...prev,
        activityLog: appendActivity(prev, { action: 'add', kind: 'income', month: selectedMonth, label: name, amount: amt }),
        months: { ...prev.months, [selectedMonth]: {
          ...prev.months[selectedMonth],
          incomes: [...prev.months[selectedMonth].incomes, { id: Date.now(), name, amount: amt, isFixed, date }],
        }},
      }));
      return;
    }
    liveCreate('income', selectedMonth, { name, amount: amt, isFixed, date });
  };

  const updateIncome = (id, name, amount, isFixed, date) => {
    const amt = parseFloat(amount);
    if (!isLive || String(id).startsWith('temp-')) {
      // Guest albo wpis jeszcze nieutrwalony — fallback do starego flow
      updateData(prev => ({
        ...prev,
        activityLog: appendActivity(prev, { action: 'update', kind: 'income', month: selectedMonth, label: name, amount: amt }),
        months: { ...prev.months, [selectedMonth]: {
          ...prev.months[selectedMonth],
          incomes: prev.months[selectedMonth].incomes.map(inc =>
            inc.id === id ? { ...inc, name, amount: amt, isFixed, date } : inc
          ),
        }},
      }));
      return;
    }
    liveUpdate('income', selectedMonth, id, { name, amount: amt, isFixed, date });
  };

  const deleteIncome = (id) => {
    if (!isLive || String(id).startsWith('temp-')) {
      updateData(prev => {
        const inc = prev.months[selectedMonth]?.incomes.find(i => i.id === id);
        const monthData = prev.months[selectedMonth];
        const prevDeleted = monthData.deletedFixed ?? { incomes: [], expenses: [] };
        const deletedFixed = inc?.isFixed
          ? { ...prevDeleted, incomes: [...prevDeleted.incomes, inc.name] }
          : prevDeleted;
        return {
          ...prev,
          activityLog: appendActivity(prev, { action: 'delete', kind: 'income', month: selectedMonth, label: inc?.name, amount: inc?.amount }),
          months: { ...prev.months, [selectedMonth]: { ...monthData, deletedFixed, incomes: monthData.incomes.filter(i => i.id !== id) } },
        };
      });
      return;
    }
    liveDelete('income', selectedMonth, id);
  };

  // ============ CRUD DLA WYDATKÓW ============
  const addExpense = (name, amount, date, isFixed = false, category = null) => {
    const amt = parseFloat(amount);
    const allowedCategories = new Set((data.categoryBudgets || []).map(c => c.name));
    if (!isFixed && (!category || !allowedCategories.has(category))) return;
    const storedCategory = isFixed ? null : category;
    if (!isLive) {
      updateData(prev => ({
        ...prev,
        activityLog: appendActivity(prev, { action: 'add', kind: 'expense', month: selectedMonth, label: name, amount: amt }),
        months: { ...prev.months, [selectedMonth]: {
          ...prev.months[selectedMonth],
          expenses: [...prev.months[selectedMonth].expenses, { id: Date.now(), name, amount: amt, date, isFixed, ...(storedCategory ? { category: storedCategory } : {}) }],
        }},
      }));
      return;
    }
    liveCreate('expense', selectedMonth, { name, amount: amt, isFixed, date, category: storedCategory });
  };

  const updateExpense = (id, name, amount, date, isFixed, category = null) => {
    const amt = parseFloat(amount);
    const allowedCategories = new Set((data.categoryBudgets || []).map(c => c.name));
    if (!isFixed && (!category || !allowedCategories.has(category))) return;
    const storedCategory = isFixed ? null : category;
    if (!isLive || String(id).startsWith('temp-')) {
      updateData(prev => ({
        ...prev,
        activityLog: appendActivity(prev, { action: 'update', kind: 'expense', month: selectedMonth, label: name, amount: amt }),
        months: { ...prev.months, [selectedMonth]: {
          ...prev.months[selectedMonth],
          expenses: prev.months[selectedMonth].expenses.map(exp =>
            exp.id === id
              ? { ...exp, name, amount: amt, date, isFixed, ...(storedCategory ? { category: storedCategory } : { category: undefined }) }
              : exp
          ),
        }},
      }));
      return;
    }
    liveUpdate('expense', selectedMonth, id, { name, amount: amt, isFixed, date, category: storedCategory });
  };

  const deleteExpense = (id) => {
    if (!isLive || String(id).startsWith('temp-')) {
      updateData(prev => {
        const exp = prev.months[selectedMonth]?.expenses.find(e => e.id === id);
        const monthData = prev.months[selectedMonth];
        const prevDeleted = monthData.deletedFixed ?? { incomes: [], expenses: [] };
        const deletedFixed = exp?.isFixed
          ? { ...prevDeleted, expenses: [...prevDeleted.expenses, exp.name] }
          : prevDeleted;
        return {
          ...prev,
          activityLog: appendActivity(prev, { action: 'delete', kind: 'expense', month: selectedMonth, label: exp?.name, amount: exp?.amount }),
          months: { ...prev.months, [selectedMonth]: { ...monthData, deletedFixed, expenses: monthData.expenses.filter(e => e.id !== id) } },
        };
      });
      return;
    }
    liveDelete('expense', selectedMonth, id);
  };

  // ============ CEL OSZCZĘDNOŚCIOWY ============
  const updateSavingsGoal = (goalData) => {
    if (!isLive) {
      updateData(prev => ({
        ...prev,
        activityLog: appendActivity(prev, { action: 'update', kind: 'savingsGoal', label: 'Cel oszczędnościowy' }),
        savingsGoal: { ...prev.savingsGoal, ...goalData }
      }));
      return;
    }
    const merged = { ...data.savingsGoal, ...goalData };
    setData(prev => ({ ...prev, savingsGoal: merged }));
    setSaving(true);
    putSavingsGoal({
      type: merged.type,
      monthlyAmount: merged.monthlyAmount ?? 0,
      yearlyAmount: merged.yearlyAmount ?? 0,
      targetMonth: merged.targetMonth ?? 11,
    })
      .then(saved => setData(prev => ({ ...prev, savingsGoal: { ...prev.savingsGoal, ...saved } })))
      .catch(err => console.error('updateSavingsGoal error:', err))
      .finally(() => setSaving(false));
  };

  const clearAllData = () => {
    const initialData = createInitialData();
    const entry = {
      id: `${Date.now()}-clear`,
      at: new Date().toISOString(),
      userId: user?.id ?? null,
      userName: user?.name || (user?.email ? user.email.split('@')[0] : '') || 'Gość',
      action: 'clear',
      kind: 'all',
      label: 'Wszystkie dane finansowe',
    };
    initialData.activityLog = [entry];
    setData(initialData);
    saveData(initialData);
  };

  // ============ GENERIC HELPERY DLA LIST PER-ROW (savings, categories) ============
  // Per-row CRUD z optimistic insert/update/delete + rollback przy błędzie + conflict dialog przy 409.

  const liveListAdd = async (listKey, apiCreate, body, optimisticItem) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimistic = { id: tempId, ...optimisticItem, updatedAt: null };
    setData(prev => ({ ...prev, [listKey]: [...prev[listKey], optimistic] }));
    setSaving(true);
    try {
      const saved = await apiCreate(body);
      setData(prev => ({
        ...prev,
        [listKey]: prev[listKey].map(it => it.id === tempId ? { ...saved } : it),
      }));
    } catch (err) {
      console.error(`add ${listKey} error:`, err);
      setData(prev => ({ ...prev, [listKey]: prev[listKey].filter(it => it.id !== tempId) }));
    } finally {
      setSaving(false);
    }
  };

  const liveListUpdate = async (listKey, apiPatch, id, changes, optimisticChanges, conflictLabel) => {
    let prevItem = null;
    setData(prev => {
      prevItem = prev[listKey].find(it => it.id === id) ?? null;
      if (!prevItem) return prev;
      return { ...prev, [listKey]: prev[listKey].map(it => it.id === id ? { ...it, ...optimisticChanges } : it) };
    });
    if (!prevItem?.updatedAt) return;
    setSaving(true);
    try {
      const saved = await apiPatch(id, prevItem.updatedAt, changes);
      setData(prev => ({ ...prev, [listKey]: prev[listKey].map(it => it.id === id ? { ...it, ...saved } : it) }));
    } catch (err) {
      if (err instanceof ConflictError) {
        setConflict({
          resourceLabel: conflictLabel ?? prevItem.name,
          yours: { name: optimisticChanges.name ?? prevItem.name, amount: optimisticChanges.amount ?? optimisticChanges.limit ?? prevItem.amount ?? prevItem.limit },
          theirs: { name: err.current.name, amount: err.current.amount ?? err.current.limit },
          onOverride: async () => {
            try {
              const saved = await apiPatch(id, err.current.updatedAt, changes);
              setData(prev => ({ ...prev, [listKey]: prev[listKey].map(it => it.id === id ? { ...it, ...saved } : it) }));
            } catch (e) { console.error('override retry error:', e); }
            finally { clearConflict(); }
          },
          onCancel: () => {
            setData(prev => ({ ...prev, [listKey]: prev[listKey].map(it => it.id === id ? { ...err.current } : it) }));
            clearConflict();
          },
        });
      } else {
        console.error(`update ${listKey} error:`, err);
        if (prevItem) setData(prev => ({ ...prev, [listKey]: prev[listKey].map(it => it.id === id ? prevItem : it) }));
      }
    } finally {
      setSaving(false);
    }
  };

  const liveListDelete = async (listKey, apiDelete, id) => {
    let prevItem = null;
    setData(prev => {
      prevItem = prev[listKey].find(it => it.id === id) ?? null;
      return { ...prev, [listKey]: prev[listKey].filter(it => it.id !== id) };
    });
    if (!prevItem?.updatedAt) return;
    setSaving(true);
    try {
      await apiDelete(id, prevItem.updatedAt);
    } catch (err) {
      if (err instanceof ConflictError) {
        console.warn(`Konflikt przy DELETE ${listKey}/${id} — ktoś zmienił równolegle.`);
      } else {
        console.error(`delete ${listKey} error:`, err);
        if (prevItem) setData(prev => ({ ...prev, [listKey]: [...prev[listKey], prevItem] }));
      }
    } finally {
      setSaving(false);
    }
  };

  // ============ CRUD DLA OSZCZĘDNOŚCI ============
  const addSavingsAccount = (name, amount, icon = 'bank') => {
    const amt = parseFloat(amount);
    if (!isLive) {
      updateData(prev => ({
        ...prev,
        activityLog: appendActivity(prev, { action: 'add', kind: 'savings', label: name, amount: amt }),
        savingsAccounts: [...prev.savingsAccounts, { id: Date.now(), name, amount: amt, icon }],
      }));
      return;
    }
    liveListAdd('savingsAccounts', createSavingsAccount, { name, amount: amt, icon }, { name, amount: amt, icon });
  };

  const updateSavingsAccount = (id, name, amount, icon) => {
    const amt = parseFloat(amount);
    if (!isLive || String(id).startsWith('temp-')) {
      updateData(prev => ({
        ...prev,
        activityLog: appendActivity(prev, { action: 'update', kind: 'savings', label: name, amount: amt }),
        savingsAccounts: prev.savingsAccounts.map(acc => acc.id === id ? { ...acc, name, amount: amt, icon } : acc),
      }));
      return;
    }
    liveListUpdate('savingsAccounts', patchSavingsAccount, id, { name, amount: amt, icon }, { name, amount: amt, icon });
  };

  const deleteSavingsAccount = (id) => {
    if (!isLive || String(id).startsWith('temp-')) {
      updateData(prev => {
        const acc = prev.savingsAccounts.find(a => a.id === id);
        return {
          ...prev,
          activityLog: appendActivity(prev, { action: 'delete', kind: 'savings', label: acc?.name, amount: acc?.amount }),
          savingsAccounts: prev.savingsAccounts.filter(a => a.id !== id),
        };
      });
      return;
    }
    liveListDelete('savingsAccounts', apiDeleteSavingsAccount, id);
  };

  // ============ CRUD DLA BUDŻETÓW KATEGORII ============
  const addCategoryBudget = (name, limit) => {
    const amt = parseFloat(limit);
    if (!isLive) {
      updateData(prev => ({
        ...prev,
        activityLog: appendActivity(prev, { action: 'add', kind: 'categoryBudget', label: name, amount: amt }),
        categoryBudgets: [...prev.categoryBudgets, { id: Date.now(), name, limit: amt }],
      }));
      return;
    }
    liveListAdd('categoryBudgets', createCategoryBudget, { name, limit: amt }, { name, limit: amt });
  };

  const updateCategoryBudget = (id, name, limit) => {
    const amt = parseFloat(limit);
    if (!isLive || String(id).startsWith('temp-')) {
      updateData(prev => ({
        ...prev,
        activityLog: appendActivity(prev, { action: 'update', kind: 'categoryBudget', label: name, amount: amt }),
        categoryBudgets: prev.categoryBudgets.map(c => c.id === id ? { ...c, name, limit: amt } : c),
      }));
      return;
    }
    liveListUpdate('categoryBudgets', patchCategoryBudget, id, { name, limit: amt }, { name, limit: amt });
  };

  const deleteCategoryBudget = (id) => {
    if (!isLive || String(id).startsWith('temp-')) {
      updateData(prev => {
        const cat = prev.categoryBudgets.find(c => c.id === id);
        return {
          ...prev,
          activityLog: appendActivity(prev, { action: 'delete', kind: 'categoryBudget', label: cat?.name, amount: cat?.limit }),
          categoryBudgets: prev.categoryBudgets.filter(c => c.id !== id),
        };
      });
      return;
    }
    liveListDelete('categoryBudgets', apiDeleteCategoryBudget, id);
  };

  // ============ OBLICZENIA ============
  const currentMonthData = data.months[selectedMonth] || createEmptyMonthData();

  const totalIncome = useMemo(() =>
    currentMonthData.incomes.reduce((sum, inc) => sum + inc.amount, 0),
    [currentMonthData.incomes]
  );

  const fixedExpenses = useMemo(() =>
    currentMonthData.expenses.filter(exp => exp.isFixed).reduce((sum, exp) => sum + exp.amount, 0),
    [currentMonthData.expenses]
  );

  const variableExpenses = useMemo(() =>
    currentMonthData.expenses.filter(exp => !exp.isFixed).reduce((sum, exp) => sum + exp.amount, 0),
    [currentMonthData.expenses]
  );

  const totalExpenses = useMemo(() => fixedExpenses + variableExpenses, [fixedExpenses, variableExpenses]);
  const balance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const totalSavingsAccounts = useMemo(() =>
    data.savingsAccounts.reduce((sum, acc) => sum + acc.amount, 0),
    [data.savingsAccounts]
  );

  // ============ BUDŻETY KATEGORII - OBLICZENIA ============
  const categorySpending = useMemo(() => {
    const variableExps = currentMonthData.expenses.filter(e => !e.isFixed);
    const spending = {};
    for (const exp of variableExps) {
      const cat = exp.category || null;
      spending[cat] = (spending[cat] || 0) + exp.amount;
    }
    return spending;
  }, [currentMonthData.expenses]);

  const totalCategoryLimits = useMemo(() =>
    data.categoryBudgets.reduce((sum, c) => sum + c.limit, 0),
    [data.categoryBudgets]
  );

  // ============ CEL OSZCZĘDNOŚCIOWY - OBLICZENIA ============
  const savingsGoalData = useMemo(() => {
    const goal = data.savingsGoal;
    const currentMonth = getCurrentMonth();
    
    if (goal.type === 'none') {
      return { type: 'none', targetAmount: 0, monthlyTarget: 0, currentSavings: 0, remaining: 0, progress: 0, onTrack: true, monthsLeft: 0 };
    }

    let currentSavings = 0;
    for (let i = 0; i <= currentMonth; i++) {
      const monthData = data.months[i] || createEmptyMonthData();
      const income = monthData.incomes.reduce((s, inc) => s + inc.amount, 0);
      const expenses = monthData.expenses.reduce((s, exp) => s + exp.amount, 0);
      currentSavings += (income - expenses);
    }

    if (goal.type === 'monthly') {
      const targetAmount = goal.monthlyAmount;
      const thisMonthSavings = balance;
      const remaining = Math.max(0, targetAmount - thisMonthSavings);
      const progress = targetAmount > 0 ? Math.min(100, (thisMonthSavings / targetAmount) * 100) : 0;
      return { type: 'monthly', targetAmount, monthlyTarget: targetAmount, currentSavings: thisMonthSavings, remaining, progress, onTrack: thisMonthSavings >= targetAmount, monthsLeft: 1 };
    }

    if (goal.type === 'yearly') {
      const targetAmount = goal.yearlyAmount;
      const targetMonth = goal.targetMonth;
      const monthsLeft = Math.max(1, targetMonth - currentMonth + 1);
      const remaining = Math.max(0, targetAmount - currentSavings);
      const monthlyTarget = remaining / monthsLeft;
      const progress = targetAmount > 0 ? Math.min(100, (currentSavings / targetAmount) * 100) : 0;
      return { type: 'yearly', targetAmount, monthlyTarget, currentSavings, remaining, progress, onTrack: currentSavings >= (targetAmount * (currentMonth + 1) / (targetMonth + 1)), monthsLeft, targetMonth };
    }

    return { type: 'none', targetAmount: 0, monthlyTarget: 0, currentSavings: 0, remaining: 0, progress: 0, onTrack: true, monthsLeft: 0 };
  }, [data, balance]);

  // ============ GUILT-FREE BURN TRACKER ============
  const guiltFreeBurn = useMemo(() => {
    const currentMonth = getCurrentMonth();
    const daysRemaining = getDaysRemainingInMonth();
    const currentDay = getCurrentDay();
    const totalDays = getTotalDaysInMonth(currentMonth, CURRENT_YEAR);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const monthData = data.months[currentMonth] || createEmptyMonthData();
    const monthIncome = monthData.incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const monthFixedExpenses = monthData.expenses.filter(e => e.isFixed).reduce((sum, exp) => sum + exp.amount, 0);
    const monthVariableExpenses = monthData.expenses.filter(e => !e.isFixed).reduce((sum, exp) => sum + exp.amount, 0);

    const availableAfterFixed = monthIncome - monthFixedExpenses;
    const remainingAfterVariable = availableAfterFixed - monthVariableExpenses;
    const monthlyTarget = savingsGoalData.type !== 'none' ? savingsGoalData.monthlyTarget : 0;
    const guiltFreeFunds = remainingAfterVariable - monthlyTarget;
    const baseDailyLimit = daysRemaining > 0 ? guiltFreeFunds / daysRemaining : 0;
    const todaySpent = monthData.expenses
      .filter(e => !e.isFixed && e.date === todayStr)
      .reduce((sum, exp) => sum + exp.amount, 0);
    const dailyLimit = Math.max(0, baseDailyLimit - todaySpent);

    const idealDailyBudget = (availableAfterFixed - monthlyTarget) / totalDays;
    const idealSpentByNow = idealDailyBudget * (currentDay - 1);
    const spendingStatus = monthVariableExpenses <= idealSpentByNow ? 'under' : 'over';
    const spendingDiff = Math.abs(monthVariableExpenses - idealSpentByNow);

    const monthProgress = (currentDay / totalDays) * 100;
    const budgetForVariable = availableAfterFixed - monthlyTarget;
    const budgetUsed = budgetForVariable > 0 ? (monthVariableExpenses / budgetForVariable) * 100 : 0;

    return {
      dailyLimit, baseDailyLimit: Math.max(0, baseDailyLimit), todaySpent,
      guiltFreeFunds, remainingAfterVariable, daysRemaining, currentDay, totalDays,
      monthIncome, monthFixedExpenses, monthVariableExpenses, availableAfterFixed, monthlyTarget,
      spendingStatus, spendingDiff, monthProgress, budgetUsed, budgetForVariable,
      hasData: monthIncome > 0, hasGoal: savingsGoalData.type !== 'none'
    };
  }, [data, savingsGoalData]);

  // ============ PODSUMOWANIE ROCZNE ============
  const yearlySummary = useMemo(() => {
    let income = 0, fixedExp = 0, variableExp = 0;
    Object.values(data.months).forEach(monthData => {
      income += monthData.incomes.reduce((sum, inc) => sum + inc.amount, 0);
      fixedExp += monthData.expenses.filter(e => e.isFixed).reduce((sum, exp) => sum + exp.amount, 0);
      variableExp += monthData.expenses.filter(e => !e.isFixed).reduce((sum, exp) => sum + exp.amount, 0);
    });
    return { income, expenses: fixedExp + variableExp, fixedExpenses: fixedExp, variableExpenses: variableExp, balance: income - fixedExp - variableExp };
  }, [data]);

  // ============ PODSUMOWANIA MIESIĘCZNE ============
  const monthlySummaries = useMemo(() => {
    return MONTHS.map((name, index) => {
      const monthData = data.months[index] || createEmptyMonthData();
      const income = monthData.incomes.reduce((sum, inc) => sum + inc.amount, 0);
      const fixed = monthData.expenses.filter(e => e.isFixed).reduce((sum, exp) => sum + exp.amount, 0);
      const variable = monthData.expenses.filter(e => !e.isFixed).reduce((sum, exp) => sum + exp.amount, 0);
      return { name: name.substring(0, 3), income, expenses: fixed + variable, fixedExpenses: fixed, variableExpenses: variable, balance: income - fixed - variable };
    });
  }, [data]);

  // ============ FINANCIAL RUNWAY ============
  const financialRunway = useMemo(() => {
    const currentMonth = getCurrentMonth();
    let totalSavings = 0, totalExpensesSum = 0, monthsWithExpenses = 0;

    for (let i = 0; i <= currentMonth; i++) {
      const monthData = data.months[i] || createEmptyMonthData();
      const income = monthData.incomes.reduce((sum, inc) => sum + inc.amount, 0);
      const expenses = monthData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      totalSavings += (income - expenses);
      if (expenses > 0) { totalExpensesSum += expenses; monthsWithExpenses++; }
    }

    const realSavings = totalSavingsAccounts > 0 ? totalSavingsAccounts : totalSavings;
    const avgMonthlyExpenses = monthsWithExpenses > 0 ? totalExpensesSum / monthsWithExpenses : 0;
    const months = avgMonthlyExpenses > 0 ? realSavings / avgMonthlyExpenses : 0;
    return { totalSavings: realSavings, avgMonthlyExpenses, months: Math.max(0, months), hasData: monthsWithExpenses > 0, hasRealSavings: totalSavingsAccounts > 0 };
  }, [data, totalSavingsAccounts]);

  // ============ FORECAST DATA ============
  const forecastData = useMemo(() => {
    const currentMonth = getCurrentMonth();
    let totalIncomeSum = 0, totalExpensesSum = 0, monthsWithData = 0;

    for (let i = 0; i <= currentMonth; i++) {
      const monthData = data.months[i] || createEmptyMonthData();
      const income = monthData.incomes.reduce((sum, inc) => sum + inc.amount, 0);
      const expenses = monthData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      if (income > 0 || expenses > 0) { totalIncomeSum += income; totalExpensesSum += expenses; monthsWithData++; }
    }

    const avgIncome = monthsWithData > 0 ? totalIncomeSum / monthsWithData : 0;
    const avgExpenses = monthsWithData > 0 ? totalExpensesSum / monthsWithData : 0;
    const avgBalance = avgIncome - avgExpenses;

    let cumulativeBalance = 0, forecastStartBalance = 0;
    const chartData = [];

    for (let i = 0; i < 12; i++) {
      const monthData = data.months[i] || createEmptyMonthData();
      const income = monthData.incomes.reduce((sum, inc) => sum + inc.amount, 0);
      const expenses = monthData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const isCurrentOrPast = i <= currentMonth;
      const hasRealData = income > 0 || expenses > 0;

      if (isCurrentOrPast && hasRealData) {
        cumulativeBalance += (income - expenses);
        forecastStartBalance = cumulativeBalance;
        chartData.push({ name: MONTHS_SHORT[i], month: i, balance: cumulativeBalance, forecast: null, income, expenses, isReal: true });
      } else if (isCurrentOrPast) {
        chartData.push({ name: MONTHS_SHORT[i], month: i, balance: cumulativeBalance, forecast: null, income: 0, expenses: 0, isReal: true });
      } else {
        forecastStartBalance += avgBalance;
        chartData.push({ name: MONTHS_SHORT[i], month: i, balance: null, forecast: forecastStartBalance, income: avgIncome, expenses: avgExpenses, isReal: false });
      }
    }

    if (currentMonth < 11 && chartData[currentMonth] && chartData[currentMonth + 1]) {
      chartData[currentMonth].forecast = chartData[currentMonth].balance;
    }

    return { chartData, avgIncome, avgExpenses, avgBalance, hasData: monthsWithData > 0 };
  }, [data]);

  const activityLog = useMemo(() => {
    const log = Array.isArray(data.activityLog) ? [...data.activityLog] : [];
    return log.sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [data.activityLog]);

  const clearActivityLog = () => {
    updateData(prev => ({ ...prev, activityLog: [] }));
  };

  return {
    data, selectedMonth, setSelectedMonth, currentMonthData, totalIncome, totalExpenses, fixedExpenses, variableExpenses, balance,
    yearlySummary, monthlySummaries, addIncome, updateIncome, deleteIncome, addExpense, updateExpense, deleteExpense, clearAllData,
    financialRunway, forecastData, guiltFreeBurn, savingsGoal: data.savingsGoal, savingsGoalData, updateSavingsGoal,
    savingsAccounts: data.savingsAccounts, totalSavingsAccounts, addSavingsAccount, updateSavingsAccount, deleteSavingsAccount,
    categoryBudgets: data.categoryBudgets, categorySpending, totalCategoryLimits,
    addCategoryBudget, updateCategoryBudget, deleteCategoryBudget,
    activityLog, clearActivityLog,
    MONTHS, MONTHS_SHORT, CURRENT_YEAR, getCurrentMonth, loading, saving,
    conflict, clearConflict,
    refetchFromApi,
  };
};
