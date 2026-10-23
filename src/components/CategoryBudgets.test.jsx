import { describe, expect, it } from 'vitest';
import { maxEditLimit } from './CategoryBudgets';

const budgets = [
  { id: 'food', name: 'Jedzenie', limit: 500 },
  { id: 'fun', name: 'Rozrywka', limit: 200 },
];

describe('maxEditLimit', () => {
  it('lets an overspent category raise its limit up to what others leave free', () => {
    expect(maxEditLimit('food', budgets, { Jedzenie: 1000, Rozrywka: 300 }, 1000)).toBe(700);
  });
  it('still counts other categories overspend against the pool', () => {
    expect(maxEditLimit('fun', budgets, { Jedzenie: 1000, Rozrywka: 100 }, 1000)).toBe(0);
  });
  it('without overspend equals the free pool plus the current limit', () => {
    expect(maxEditLimit('food', budgets, {}, 1000)).toBe(800);
  });
});
