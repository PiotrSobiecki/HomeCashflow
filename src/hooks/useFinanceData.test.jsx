import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useFinanceData } from './useFinanceData';
import { fetchFinanceData, deleteTransaction } from '../lib/api';

vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: user, isGuest: false }) }));
vi.mock('./usePolling', () => ({ usePolling: () => {} }));
vi.mock('../lib/api', async (importOriginal) => ({
  ...await importOriginal(), fetchFinanceData: vi.fn(), patchTransaction: vi.fn(), deleteTransaction: vi.fn(),
}));
const user = { id: 'user' };
const month = new Date().getMonth();
const date = `${new Date().getFullYear()}-${String(month + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

beforeEach(() => {
  vi.clearAllMocks();
  fetchFinanceData.mockResolvedValue({ data: { months: { [month]: {
    incomes: [{ id: 'income', amount: 5000 }],
    expenses: [
      { id: 'bank', source: 'bank', name: 'Przelew', amount: 2000, date, excludeFromAnalysis: true, updatedAt: 'before' },
      { id: 'shop', name: 'Zakupy', amount: 100, date, category: 'Inne' },
    ],
  } }, savingsGoal: { type: 'yearly', yearlyAmount: 10000, targetMonth: 11 } } });
});

it('keeps ignored transfers visible but excludes them from every financial summary', async () => {
  const { result } = renderHook(() => useFinanceData());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.currentMonthData.expenses).toHaveLength(2);
  expect(result.current.totalExpenses).toBe(100);
  expect(result.current.categorySpending).toEqual({ Inne: 100 });
  expect(result.current.balance).toBe(4900);
  expect(result.current.yearlySummary.expenses).toBe(100);
  expect(result.current.monthlySummaries[month].expenses).toBe(100);
  expect(result.current.forecastData.avgExpenses).toBe(100);
  expect(result.current.financialRunway.avgMonthlyExpenses).toBe(100);
  expect(result.current.guiltFreeBurn.todaySpent).toBe(100);
  expect(result.current.savingsGoalData.currentSavings).toBe(4900);

});

it('sends deletion to the server even when React defers state updates', async () => {
  const { result } = renderHook(() => useFinanceData());
  await waitFor(() => expect(result.current.loading).toBe(false));
  deleteTransaction.mockResolvedValue(undefined);
  await act(() => result.current.deleteExpense('bank'));
  expect(deleteTransaction).toHaveBeenCalledWith('bank', 'before');
  expect(result.current.currentMonthData.expenses.some(e => e.id === 'bank')).toBe(false);
});

it('restores a fixed item and its exclusion list if deletion fails', async () => {
  const payload = await fetchFinanceData();
  payload.data.months[month].expenses[0].isFixed = true;
  const { result } = renderHook(() => useFinanceData());
  await waitFor(() => expect(result.current.loading).toBe(false));
  const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
  deleteTransaction.mockRejectedValue(new Error('offline'));
  await act(() => result.current.deleteExpense('bank'));
  expect(result.current.currentMonthData.expenses.some(e => e.id === 'bank')).toBe(true);
  expect(result.current.currentMonthData.deletedFixed.expenses).toEqual([]);
  errorLog.mockRestore();
});

it('does not pretend to delete a transaction that is still being saved', async () => {
  const payload = await fetchFinanceData();
  payload.data.months[month].expenses[0].id = 'temp-bank';
  payload.data.months[month].expenses[0].updatedAt = null;
  const { result } = renderHook(() => useFinanceData());
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(() => result.current.deleteExpense('temp-bank'));
  expect(deleteTransaction).not.toHaveBeenCalled();
  expect(result.current.currentMonthData.expenses.some(e => e.id === 'temp-bank')).toBe(true);
});
