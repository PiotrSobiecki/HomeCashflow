import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchFinanceData, saveFinanceDataOnServer } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

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
          expenses: Array.isArray(src.expenses) ? src.expenses : [],
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
          const response = await fetchFinanceData();
          const payload = response?.data;
          const normalized = normalizeFinanceData(
            payload && typeof payload === 'object' ? payload : null
          );
          setData(normalized);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isGuest]);

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
      .map(i => ({ ...i, id: Date.now() + Math.random() }));
    const newFixedExpenses = source.expenses
      .filter(e => e.isFixed && !existingExpenseNames.has(e.name) && !deletedFixedExpenseNames.has(e.name))
      .map(e => ({ ...e, id: Date.now() + Math.random(), date: `${CURRENT_YEAR}-${String(selectedMonth + 1).padStart(2, '0')}-01` }));

    if (newFixedIncomes.length === 0 && newFixedExpenses.length === 0) return;

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
  }, [selectedMonth, loading]);

  // ============ CRUD DLA PRZYCHODÓW ============
  const addIncome = (name, amount, isFixed = false, date = '') => {
    const amt = parseFloat(amount);
    updateData(prev => ({
      ...prev,
      activityLog: appendActivity(prev, { action: 'add', kind: 'income', month: selectedMonth, label: name, amount: amt }),
      months: {
        ...prev.months,
        [selectedMonth]: {
          ...prev.months[selectedMonth],
          incomes: [...prev.months[selectedMonth].incomes, { id: Date.now(), name, amount: amt, isFixed, date }]
        }
      }
    }));
  };

  const updateIncome = (id, name, amount, isFixed, date) => {
    const amt = parseFloat(amount);
    updateData(prev => ({
      ...prev,
      activityLog: appendActivity(prev, { action: 'update', kind: 'income', month: selectedMonth, label: name, amount: amt }),
      months: {
        ...prev.months,
        [selectedMonth]: {
          ...prev.months[selectedMonth],
          incomes: prev.months[selectedMonth].incomes.map(inc =>
            inc.id === id ? { ...inc, name, amount: amt, isFixed, date } : inc
          )
        }
      }
    }));
  };

  const deleteIncome = (id) => {
    updateData(prev => {
      const inc = prev.months[selectedMonth]?.incomes.find(i => i.id === id);
      const monthData = prev.months[selectedMonth];
      const prevDeleted = monthData.deletedFixed ?? { incomes: [], expenses: [] };
      const deletedFixed = inc?.isFixed
        ? { ...prevDeleted, incomes: [...prevDeleted.incomes, inc.name] }
        : prevDeleted;
      return {
        ...prev,
        activityLog: appendActivity(prev, {
          action: 'delete',
          kind: 'income',
          month: selectedMonth,
          label: inc?.name,
          amount: inc?.amount,
        }),
        months: {
          ...prev.months,
          [selectedMonth]: {
            ...monthData,
            deletedFixed,
            incomes: monthData.incomes.filter(i => i.id !== id)
          }
        }
      };
    });
  };

  // ============ CRUD DLA WYDATKÓW ============
  const addExpense = (name, amount, date, isFixed = false, category = null) => {
    const amt = parseFloat(amount);
    updateData(prev => ({
      ...prev,
      activityLog: appendActivity(prev, { action: 'add', kind: 'expense', month: selectedMonth, label: name, amount: amt }),
      months: {
        ...prev.months,
        [selectedMonth]: {
          ...prev.months[selectedMonth],
          expenses: [...prev.months[selectedMonth].expenses, { id: Date.now(), name, amount: amt, date, isFixed, ...(category ? { category } : {}) }]
        }
      }
    }));
  };

  const updateExpense = (id, name, amount, date, isFixed, category = null) => {
    const amt = parseFloat(amount);
    updateData(prev => ({
      ...prev,
      activityLog: appendActivity(prev, { action: 'update', kind: 'expense', month: selectedMonth, label: name, amount: amt }),
      months: {
        ...prev.months,
        [selectedMonth]: {
          ...prev.months[selectedMonth],
          expenses: prev.months[selectedMonth].expenses.map(exp =>
            exp.id === id ? { ...exp, name, amount: amt, date, isFixed, ...(category ? { category } : { category: undefined }) } : exp
          )
        }
      }
    }));
  };

  const deleteExpense = (id) => {
    updateData(prev => {
      const exp = prev.months[selectedMonth]?.expenses.find(e => e.id === id);
      const monthData = prev.months[selectedMonth];
      const prevDeleted = monthData.deletedFixed ?? { incomes: [], expenses: [] };
      const deletedFixed = exp?.isFixed
        ? { ...prevDeleted, expenses: [...prevDeleted.expenses, exp.name] }
        : prevDeleted;
      return {
        ...prev,
        activityLog: appendActivity(prev, {
          action: 'delete',
          kind: 'expense',
          month: selectedMonth,
          label: exp?.name,
          amount: exp?.amount,
        }),
        months: {
          ...prev.months,
          [selectedMonth]: {
            ...monthData,
            deletedFixed,
            expenses: monthData.expenses.filter(e => e.id !== id)
          }
        }
      };
    });
  };

  // ============ CEL OSZCZĘDNOŚCIOWY ============
  const updateSavingsGoal = (goalData) => {
    updateData(prev => ({
      ...prev,
      activityLog: appendActivity(prev, { action: 'update', kind: 'savingsGoal', label: 'Cel oszczędnościowy' }),
      savingsGoal: { ...prev.savingsGoal, ...goalData }
    }));
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

  // ============ CRUD DLA OSZCZĘDNOŚCI ============
  const addSavingsAccount = (name, amount, icon = 'bank') => {
    const amt = parseFloat(amount);
    updateData(prev => ({
      ...prev,
      activityLog: appendActivity(prev, { action: 'add', kind: 'savings', label: name, amount: amt }),
      savingsAccounts: [...prev.savingsAccounts, { id: Date.now(), name, amount: amt, icon }]
    }));
  };

  const updateSavingsAccount = (id, name, amount, icon) => {
    const amt = parseFloat(amount);
    updateData(prev => ({
      ...prev,
      activityLog: appendActivity(prev, { action: 'update', kind: 'savings', label: name, amount: amt }),
      savingsAccounts: prev.savingsAccounts.map(acc =>
        acc.id === id ? { ...acc, name, amount: amt, icon } : acc
      )
    }));
  };

  const deleteSavingsAccount = (id) => {
    updateData(prev => {
      const acc = prev.savingsAccounts.find(a => a.id === id);
      return {
        ...prev,
        activityLog: appendActivity(prev, {
          action: 'delete',
          kind: 'savings',
          label: acc?.name,
          amount: acc?.amount,
        }),
        savingsAccounts: prev.savingsAccounts.filter(a => a.id !== id)
      };
    });
  };

  // ============ CRUD DLA BUDŻETÓW KATEGORII ============
  const addCategoryBudget = (name, limit) => {
    const amt = parseFloat(limit);
    updateData(prev => ({
      ...prev,
      activityLog: appendActivity(prev, { action: 'add', kind: 'categoryBudget', label: name, amount: amt }),
      categoryBudgets: [...prev.categoryBudgets, { id: Date.now(), name, limit: amt }]
    }));
  };

  const updateCategoryBudget = (id, name, limit) => {
    const amt = parseFloat(limit);
    updateData(prev => ({
      ...prev,
      activityLog: appendActivity(prev, { action: 'update', kind: 'categoryBudget', label: name, amount: amt }),
      categoryBudgets: prev.categoryBudgets.map(c =>
        c.id === id ? { ...c, name, limit: amt } : c
      )
    }));
  };

  const deleteCategoryBudget = (id) => {
    updateData(prev => {
      const cat = prev.categoryBudgets.find(c => c.id === id);
      return {
        ...prev,
        activityLog: appendActivity(prev, { action: 'delete', kind: 'categoryBudget', label: cat?.name, amount: cat?.limit }),
        categoryBudgets: prev.categoryBudgets.filter(c => c.id !== id)
      };
    });
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

    const monthData = data.months[currentMonth] || createEmptyMonthData();
    const monthIncome = monthData.incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const monthFixedExpenses = monthData.expenses.filter(e => e.isFixed).reduce((sum, exp) => sum + exp.amount, 0);
    const monthVariableExpenses = monthData.expenses.filter(e => !e.isFixed).reduce((sum, exp) => sum + exp.amount, 0);

    const availableAfterFixed = monthIncome - monthFixedExpenses;
    const remainingAfterVariable = availableAfterFixed - monthVariableExpenses;
    const monthlyTarget = savingsGoalData.type !== 'none' ? savingsGoalData.monthlyTarget : 0;
    const guiltFreeFunds = remainingAfterVariable - monthlyTarget;
    const dailyLimit = daysRemaining > 0 ? guiltFreeFunds / daysRemaining : 0;

    const idealDailyBudget = (availableAfterFixed - monthlyTarget) / totalDays;
    const idealSpentByNow = idealDailyBudget * (currentDay - 1);
    const spendingStatus = monthVariableExpenses <= idealSpentByNow ? 'under' : 'over';
    const spendingDiff = Math.abs(monthVariableExpenses - idealSpentByNow);

    const monthProgress = (currentDay / totalDays) * 100;
    const budgetForVariable = availableAfterFixed - monthlyTarget;
    const budgetUsed = budgetForVariable > 0 ? (monthVariableExpenses / budgetForVariable) * 100 : 0;

    return {
      dailyLimit: Math.max(0, dailyLimit), guiltFreeFunds, remainingAfterVariable, daysRemaining, currentDay, totalDays,
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
    MONTHS, MONTHS_SHORT, CURRENT_YEAR, getCurrentMonth, loading, saving
  };
};
