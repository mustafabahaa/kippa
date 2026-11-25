import { describe, expect, it } from 'vitest';
import type { Account, BudgetCycle, FinanceTransaction, LedgerLine } from '@kippa/domain';
import {
  applyPostings,
  type Projection,
} from '../../../../backend/functions/src/features/ledger/projection';
import { calculateCycleReport } from './cycleReport';
import { calculateCycleData, calculateCategoryTrends } from './budgetAnalytics';
import { cycleReportInputs, summaryActivity } from './ledgerSummaries';

const cash: Account = {
  id: 'cash', householdId: 'mock', name: 'Cash', type: 'cash', currency: 'EGP',
  isActive: true, createdAt: '', sortOrder: 0,
};

const oldCycle: BudgetCycle = {
  id: 'old', householdId: 'mock', name: 'Old', startDate: '2026-11-01', endDate: '2026-11-15',
  status: 'closed',
};
const newCycle: BudgetCycle = {
  ...oldCycle, id: 'new', name: 'New', startDate: '2026-11-15', endDate: '2026-11-30',
};

const transaction = (
  id: string, type: FinanceTransaction['type'], date: string, budgetCycleId: string | null,
  categoryId: string | null = null,
): FinanceTransaction => ({
  id, householdId: 'mock', type, date, budgetCycleId, categoryId, status: 'posted', createdBy: 'mock', createdAt: '', updatedAt: '',
});
const line = (id: string, tx: FinanceTransaction, signedAmount: number): LedgerLine => ({
  id, householdId: 'mock', transactionId: tx.id, accountId: 'cash', signedAmount, currency: 'EGP', createdAt: '',
});

describe('ledger summaries', () => {
  it('preserves exact cycle totals, opening balances and unique transaction counts across a same-day rollover', () => {
    const earlier = transaction('deposit', 'income', '2026-11-15', oldCycle.id);
    const current = transaction('purchase', 'expense', '2026-11-15', newCycle.id, 'food');
    const unassigned = transaction('unassigned', 'adjustment', '2026-11-20', null);
    const later = transaction('late', 'income', '2026-12-01', null);
    const transactions = [earlier, current, unassigned, later];
    const lines = [
      line('salary', earlier, 500), line('product', current, -90), line('fee', current, -10),
      line('adjustment', unassigned, 20), line('late', later, 1000),
    ];
    const projection: Projection = { balances: {}, cycles: new Map() };
    applyPostings(projection, {
      transactions: new Map(transactions.map((tx) => [tx.id, tx])),
      lines: new Map(lines.map((entry) => [entry.id, entry])),
    }, 1);

    const cycles = [oldCycle, newCycle];
    const snapshot = { balances: projection.balances, cycles: [...projection.cycles.values()] };
    const activity = cycleReportInputs(snapshot, newCycle, cycles);
    const report = calculateCycleReport(
      newCycle, [cash], [], activity.transactions, activity.lines, [], 'EGP', {}, cycles, activity,
    );
    expect(report).toEqual(calculateCycleReport(newCycle, [cash], [], transactions, lines, [], 'EGP', {}, cycles));
    expect(report.accounts[0]).toMatchObject({ openingBalance: 520, transactionCount: 1, moneyOut: 100 });

    const grouped = summaryActivity(snapshot.cycles);
    expect(calculateCycleData(cycles, grouped.transactions, grouped.lines, [], [], 'EGP', {}))
      .toEqual(calculateCycleData(cycles, transactions, lines, [], [], 'EGP', {}));
    expect(calculateCategoryTrends(cycles, grouped.transactions, grouped.lines, 'food', 'EGP', {}))
      .toEqual(calculateCategoryTrends(cycles, transactions, lines, 'food', 'EGP', {}));
  });
});
