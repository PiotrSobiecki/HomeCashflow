import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useFinanceData } from './useFinanceData';
import { fetchFinanceData, patchTransaction } from '../lib/api';

vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: user, isGuest: false }) }));
vi.mock('./usePolling', () => ({ usePolling: () => {} }));
vi.mock('../lib/api', async (importOriginal) => ({
  ...await importOriginal(), fetchFinanceData: vi.fn(), patchTransaction: vi.fn(),
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

  patchTransaction.mockResolvedValue({ excludeFromAnalysis: false, updatedAt: 'after' });
  await act(() => result.current.toggleExpenseAnalysis('bank'));
  expect(patchTransaction).toHaveBeenCalledWith('bank', 'before', { excludeFromAnalysis: false });
  expect(result.current.totalExpenses).toBe(2100);
});

it('retains the saved setting if saving fails', async () => {
  const { result } = renderHook(() => useFinanceData());
  await waitFor(() => expect(result.current.loading).toBe(false));
  patchTransaction.mockRejectedValue(new Error('offline'));
  await act(async () => {
    await expect(result.current.toggleExpenseAnalysis('bank')).rejects.toThrow('offline');
  });
  expect(result.current.totalExpenses).toBe(100);
  expect(result.current.saving).toBe(false);
});
