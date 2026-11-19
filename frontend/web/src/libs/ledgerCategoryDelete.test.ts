import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BudgetAllocation, Category, FinanceTransaction } from '@kippa/domain';
import { ledgerLib } from './ledger';

const mocks = vi.hoisted(() => ({
  getDocs: vi.fn(),
  executeBatch: vi.fn().mockResolvedValue(undefined),
  logAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/libs/db', () => ({ dbLib: { getDocs: mocks.getDocs, executeBatch: mocks.executeBatch } }));
vi.mock('@/libs/auditLog', () => ({ auditLogLib: { logAction: mocks.logAction } }));

const source: Category = {
  id: 'food-old',
  householdId: 'household',
  name: 'Food old',
  type: 'expense',
  isActive: true,
  createdAt: '',
};
const replacement: Category = {
  id: 'food',
  householdId: 'household',
  name: 'Food',
  type: 'expense',
  isActive: true,
  createdAt: '',
};

describe('ledgerLib.deleteCategoryAndReassign', () => {
  beforeEach(() => {
    mocks.getDocs.mockReset();
    mocks.executeBatch.mockReset().mockResolvedValue(undefined);
    mocks.logAction.mockReset().mockResolvedValue(undefined);
  });

  it('moves transactions, merges same-cycle allocations, then deletes the old category', async () => {
    const transaction: FinanceTransaction = {
      id: 'txn-1',
      householdId: 'household',
      type: 'expense',
      date: '2026-11-19',
      categoryId: source.id,
      createdBy: 'user',
      createdAt: '',
      updatedAt: '',
      status: 'posted',
    };
    const oldAllocation: BudgetAllocation = {
      id: 'cycle-1_food-old',
      householdId: 'household',
      budgetCycleId: 'cycle-1',
      categoryId: source.id,
      plannedAmount: 100,
      currency: 'EGP',
      carryLeftover: false,
    };
    const currentAllocation: BudgetAllocation = {
      id: 'cycle-1_food',
      householdId: 'household',
      budgetCycleId: 'cycle-1',
      categoryId: replacement.id,
      plannedAmount: 50,
      currency: 'EGP',
      carryLeftover: true,
    };
    mocks.getDocs.mockImplementation(async (householdId: string, collectionName: string) => {
      void householdId;
      if (collectionName === 'categories') return [source, replacement];
      if (collectionName === 'transactions') return [transaction];
      if (collectionName === 'budgetAllocations') return [oldAllocation, currentAllocation];
      throw new Error(`Unexpected collection ${collectionName}`);
    });

    await ledgerLib.deleteCategoryAndReassign('household', source.id, replacement.id);

    expect(mocks.executeBatch).toHaveBeenCalledTimes(3);
    expect(mocks.executeBatch.mock.calls[0][1]).toEqual([
      expect.objectContaining({
        type: 'set',
        collectionName: 'transactions',
        docId: transaction.id,
        data: expect.objectContaining({ categoryId: replacement.id }),
      }),
    ]);
    expect(mocks.executeBatch.mock.calls[1][1]).toEqual([
      expect.objectContaining({
        type: 'set',
        collectionName: 'budgetAllocations',
        docId: 'cycle-1_food',
        data: expect.objectContaining({ plannedAmount: 150, carryLeftover: true }),
      }),
      expect.objectContaining({ type: 'delete', collectionName: 'budgetAllocations', docId: oldAllocation.id }),
    ]);
    expect(mocks.executeBatch.mock.calls[2][1]).toEqual([
      { type: 'delete', collectionName: 'categories', docId: source.id },
    ]);
  });

  it('deletes an unused category without a replacement', async () => {
    mocks.getDocs.mockImplementation(async (householdId: string, collectionName: string) => {
      void householdId;
      if (collectionName === 'categories') return [source];
      return [];
    });

    await ledgerLib.deleteCategoryAndReassign('household', source.id);

    expect(mocks.executeBatch).toHaveBeenCalledWith('household', [
      { type: 'delete', collectionName: 'categories', docId: source.id },
    ]);
  });
});
