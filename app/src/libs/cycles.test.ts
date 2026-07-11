import { describe, it, expect } from 'vitest';
import { dedupeAllocations } from './allocations';
import type { BudgetAllocation } from '@/domain/financeTypes';

const mk = (overrides: Partial<BudgetAllocation> & Pick<BudgetAllocation, 'budgetCycleId' | 'categoryId'>): BudgetAllocation => ({
  id: `${overrides.budgetCycleId}_${overrides.categoryId}`,
  householdId: 'h',
  plannedAmount: 1000,
  currency: 'EGP',
  carryLeftover: false,
  notes: null,
  ...overrides,
});

describe('dedupeAllocations', () => {
  it('returns an empty array for empty input', () => {
    expect(dedupeAllocations([])).toEqual([]);
  });

  it('keeps distinct (cycle, category) pairs separate', () => {
    const a = mk({ budgetCycleId: 'c1', categoryId: 'groceries', plannedAmount: 500 });
    const b = mk({ budgetCycleId: 'c1', categoryId: 'rent', plannedAmount: 1000 });
    const c = mk({ budgetCycleId: 'c2', categoryId: 'groceries', plannedAmount: 300 });
    const out = dedupeAllocations([a, b, c]);
    expect(out).toHaveLength(3);
    expect(out.map(o => o.categoryId).sort()).toEqual(['groceries', 'groceries', 'rent']);
  });

  it('collapses two identical allocations for the same (cycle, category) into one', () => {
    const a = mk({ id: 'random-uuid-1', budgetCycleId: 'c1', categoryId: 'groceries', plannedAmount: 500 });
    const b = mk({ id: 'random-uuid-2', budgetCycleId: 'c1', categoryId: 'groceries', plannedAmount: 500 });
    const out = dedupeAllocations([a, b]);
    expect(out).toHaveLength(1);
    expect(out[0].categoryId).toBe('groceries');
    expect(out[0].plannedAmount).toBe(500);
  });

  it('prefers the canonical-id doc as the keeper', () => {
    const canonical = mk({ id: 'c1_groceries', budgetCycleId: 'c1', categoryId: 'groceries', plannedAmount: 400 });
    const stray = mk({ id: 'random-uuid', budgetCycleId: 'c1', categoryId: 'groceries', plannedAmount: 999 });
    const out = dedupeAllocations([stray, canonical]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('c1_groceries');
    expect(out[0].plannedAmount).toBe(400); // canonical wins even though its amount is lower
  });

  it('promotes the highest-plannedAmount doc when no canonical id is present', () => {
    const a = mk({ id: 'uuid-1', budgetCycleId: 'c1', categoryId: 'groceries', plannedAmount: 300 });
    const b = mk({ id: 'uuid-2', budgetCycleId: 'c1', categoryId: 'groceries', plannedAmount: 800 });
    const c = mk({ id: 'uuid-3', budgetCycleId: 'c1', categoryId: 'groceries', plannedAmount: 500 });
    const out = dedupeAllocations([a, b, c]);
    expect(out).toHaveLength(1);
    expect(out[0].plannedAmount).toBe(800);
  });

  it('keeps all fields of the keeper', () => {
    const keeper = mk({
      id: 'uuid-1', budgetCycleId: 'c1', categoryId: 'groceries',
      plannedAmount: 800, currency: 'USD', carryLeftover: true, notes: 'weekly',
    });
    const stray = mk({ id: 'uuid-2', budgetCycleId: 'c1', categoryId: 'groceries', plannedAmount: 100 });
    const out = dedupeAllocations([stray, keeper]);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual(keeper);
  });
});
