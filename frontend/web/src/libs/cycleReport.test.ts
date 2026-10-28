import type { Account, BudgetAllocation, BudgetCycle, Category, FinanceTransaction, LedgerLine } from '@kippa/domain';
import { describe, expect, it } from 'vitest';
import { calculateCycleReport } from './cycleReport';
import { calculateAccountBalances } from './financeCalculations';

const cycle: BudgetCycle = {
  id: 'c1',
  householdId: 'h',
  name: 'April',
  startDate: '2026-04-01',
  endDate: '2026-04-30',
  status: 'closed',
};
const account = (id: string, currency = 'EGP', isActive = true): Account => ({
  id,
  householdId: 'h',
  name: id,
  type: 'running',
  currency,
  isActive,
  sortOrder: 0,
  createdAt: '',
});
const transaction = (
  id: string,
  type: FinanceTransaction['type'],
  date: string,
  budgetCycleId: string | null = 'c1',
  status: FinanceTransaction['status'] = 'posted',
  categoryId: string | null = null,
): FinanceTransaction => ({
  id,
  householdId: 'h',
  type,
  date,
  budgetCycleId,
  categoryId,
  status,
  createdBy: 'u',
  createdAt: '',
  updatedAt: '',
});
const line = (
  id: string,
  transactionId: string,
  accountId: string,
  signedAmount: number,
  currency = 'EGP',
): LedgerLine => ({ id, householdId: 'h', transactionId, accountId, signedAmount, currency, createdAt: '' });
const allocation = (categoryId: string, plannedAmount: number, currency = 'EGP'): BudgetAllocation => ({
  id: `${categoryId}-a`,
  householdId: 'h',
  budgetCycleId: 'c1',
  categoryId,
  plannedAmount,
  currency,
  carryLeftover: false,
});
const category = (id: string, name: string): Category => ({
  id,
  householdId: 'h',
  name,
  type: 'expense',
  isActive: true,
  createdAt: '',
});
const report = (
  accounts: Account[],
  transactions: FinanceTransaction[],
  lines: LedgerLine[],
  allocations: BudgetAllocation[] = [],
  categories: Category[] = [],
  rates: Record<string, number> = {},
  cycles: BudgetCycle[] = [],
) => calculateCycleReport(cycle, accounts, categories, transactions, lines, allocations, 'EGP', rates, cycles);

describe('calculateCycleReport', () => {
  it('excludes voided transactions and calculates opening and closing balances', () => {
    const a = account('bank');
    const transactions = [
      transaction('old', 'income', '2026-03-20', null),
      transaction('in', 'income', '2026-04-02'),
      transaction('void', 'income', '2026-04-03', 'c1', 'voided'),
    ];
    const result = report([a], transactions, [
      line('l1', 'old', 'bank', 100),
      line('l2', 'in', 'bank', 50),
      line('l3', 'void', 'bank', 999),
    ]);
    expect(result.openingBalance).toBe(100);
    expect(result.closingBalance).toBe(150);
    expect(result.totalIncome).toBe(50);
  });

  it('does not count a backdated cycle transaction in both opening and cycle activity', () => {
    const result = report(
      [account('bank')],
      [transaction('backdated', 'income', '2026-03-31')],
      [line('l1', 'backdated', 'bank', 75)],
    );
    expect(result.openingBalance).toBe(0);
    expect(result.closingBalance).toBe(75);
    expect(result.totalIncome).toBe(75);
  });

  it('excludes transfers from income and spending but keeps their account activity', () => {
    const transactions = [transaction('t', 'transfer', '2026-04-03')];
    const result = report([account('a'), account('b')], transactions, [
      line('l1', 't', 'a', -20),
      line('l2', 't', 'b', 20),
    ]);
    expect(result.totalIncome).toBe(0);
    expect(result.totalSpending).toBe(0);
    expect(result.accounts.map((item) => item.transactionCount)).toEqual([1, 1]);
  });

  it('groups category spending, planned allocations, and per-account counts', () => {
    const transactions = [
      transaction('e1', 'expense', '2026-04-03', 'c1', 'posted', 'food'),
      transaction('e2', 'expense', '2026-04-04'),
    ];
    const result = report(
      [account('bank')],
      transactions,
      [line('l1', 'e1', 'bank', -30), line('l2', 'e1', 'bank', -5), line('l3', 'e2', 'bank', -10)],
      [allocation('food', 50)],
      [category('food', 'Food')],
    );
    expect(result.accounts[0].transactionCount).toBe(2);
    expect(result.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ categoryId: 'food', categoryName: 'Food', planned: 50, spent: 35, variance: 15 }),
        expect.objectContaining({ categoryId: null, categoryName: 'Uncategorized', spent: 10 }),
      ]),
    );
    expect(result.categories.find((item) => item.categoryId === 'food')?.share).toBeCloseTo(35 / 45);
  });

  it('groups loan expenses under loan payments instead of uncategorized', () => {
    const loanExpense = { ...transaction('loan', 'expense', '2026-04-10'), loanId: 'loan-1' };
    const result = report([account('bank')], [loanExpense], [line('l1', 'loan', 'bank', -250)]);
    expect(result.categories).toEqual([
      expect.objectContaining({ categoryId: '__loan_payments__', categoryName: 'Loan payments', spent: 250 }),
    ]);
  });

  it('converts multi-currency household totals and safely handles zero income', () => {
    const result = report(
      [account('usd', 'USD')],
      [transaction('e', 'expense', '2026-04-03')],
      [line('l', 'e', 'usd', -10, 'USD')],
      [],
      [],
      { USD: 2 },
    );
    expect(result.totalSpending).toBe(20);
    expect(result.closingBalance).toBe(-20);
    expect(result.savingsRate).toBe(0);
  });

  it('reconciles an open cycle to the live ledger when prior-cycle transactions share its start date', () => {
    const openCycle = {
      ...cycle,
      id: 'oct',
      name: 'Oct/Nov',
      startDate: '2026-10-26',
      endDate: '2026-11-25',
      status: 'open' as const,
    };
    const cash = account('cash');
    const priorCycle = { ...cycle, id: 'sep', name: 'Previous', startDate: '2026-09-29', endDate: '2026-10-26' };
    const transactions = [
      transaction('opening', 'income', '2026-09-20', 'sep'),
      ...[35, 600, 20, 50, 425, 75].map((amount, index) =>
        transaction(`boundary-${index}-${amount}`, 'expense', '2026-10-26', 'sep'),
      ),
      transaction('current-1', 'expense', '2026-10-27', 'oct'),
      transaction('current-2', 'expense', '2026-10-27', 'oct'),
    ];
    const lines = [
      line('opening-line', 'opening', 'cash', 4097),
      ...[35, 600, 20, 50, 425, 75].map((amount, index) =>
        line(`boundary-line-${index}`, `boundary-${index}-${amount}`, 'cash', -amount),
      ),
      line('current-line-1', 'current-1', 'cash', -20),
      line('current-line-2', 'current-2', 'cash', -50),
    ];
    const result = calculateCycleReport(openCycle, [cash], [], transactions, lines, [], 'EGP', {}, [
      priorCycle,
      openCycle,
    ]);

    expect(result.openingBalance).toBe(2892);
    expect(result.closingBalance).toBe(2822);
    expect(result.closingBalance).toBe(calculateAccountBalances([cash], transactions, lines).cash);
    const previousReport = calculateCycleReport(priorCycle, [cash], [], transactions, lines, [], 'EGP', {}, [
      priorCycle,
      openCycle,
    ]);
    expect(previousReport.closingBalance).toBe(result.openingBalance);
  });

  it('includes posted non-cycle transfers and adjustments after an open cycle starts in its opening balance', () => {
    const openCycle = { ...cycle, status: 'open' as const };
    const transactions = [
      transaction('opening-transfer', 'transfer', '2026-04-10', 'previous'),
      transaction('opening-adjustment', 'adjustment', '2026-04-11', 'previous'),
      transaction('in', 'income', '2026-04-12', 'c1'),
    ];
    const result = calculateCycleReport(
      openCycle,
      [account('bank')],
      [],
      transactions,
      [
        line('transfer', 'opening-transfer', 'bank', -25),
        line('adjustment', 'opening-adjustment', 'bank', 10),
        line('income', 'in', 'bank', 30),
      ],
      [],
      'EGP',
      {},
    );

    expect(result.openingBalance).toBe(-15);
    expect(result.closingBalance).toBe(15);
    expect(result.totalIncome).toBe(30);
  });

  it('uses assigned cycle chronology for closed history and date fallback for unassigned transactions', () => {
    const historicalCycle = { ...cycle, id: 'history', startDate: '2026-04-01', endDate: '2026-04-30' };
    const earlier = { ...cycle, id: 'earlier', startDate: '2026-03-01', endDate: '2026-03-31' };
    const later = { ...cycle, id: 'later', startDate: '2026-05-01', endDate: '2026-05-31' };
    const transactions = [
      transaction('earlier-same-day', 'income', '2026-04-30', 'earlier'),
      transaction('later-same-day', 'income', '2026-04-30', 'later'),
      transaction('unassigned-in-range', 'income', '2026-04-30', null),
      transaction('unassigned-after', 'income', '2026-05-01', null),
      transaction('unknown-cycle-in-range', 'income', '2026-04-30', 'unknown'),
      transaction('unknown-cycle-after', 'income', '2026-05-01', 'unknown'),
      transaction('selected-backdated', 'income', '2026-03-15', 'history'),
    ];
    const result = calculateCycleReport(
      historicalCycle,
      [account('bank')],
      [],
      transactions,
      transactions.map((tx) => line(`line-${tx.id}`, tx.id, 'bank', 10)),
      [],
      'EGP',
      {},
      [earlier, historicalCycle, later],
    );

    expect(result.openingBalance).toBe(30);
    expect(result.closingBalance).toBe(40);
    expect(result.totalIncome).toBe(10);
  });

  it('ignores draft, voided, and orphan ledger rows when forming an open cycle balance', () => {
    const openCycle = { ...cycle, status: 'open' as const };
    const transactions = [
      transaction('posted-prior', 'income', '2026-04-02', 'previous'),
      transaction('draft', 'income', '2026-04-03', 'previous', 'draft'),
      transaction('voided', 'income', '2026-04-04', 'previous', 'voided'),
    ];
    const result = calculateCycleReport(
      openCycle,
      [account('bank')],
      [],
      transactions,
      [
        line('posted', 'posted-prior', 'bank', 25),
        line('draft-line', 'draft', 'bank', 100),
        line('voided-line', 'voided', 'bank', 200),
        line('orphan-line', 'orphan', 'bank', 300),
      ],
      [],
      'EGP',
      {},
    );

    expect(result.openingBalance).toBe(25);
    expect(result.closingBalance).toBe(25);
  });
});
