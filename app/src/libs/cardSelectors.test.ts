import { describe, it, expect } from 'vitest';
import { computeCardSummary, currentCyclePurchases } from './cardSelectors';
import type { Card, CardStatement, LedgerLine, FinanceTransaction } from '@/domain/financeTypes';

const card: Card = {
  id: 'card', householdId: 'h', kind: 'credit', parentAccountId: 'credit',
  name: 'HSBC', bankId: 'hsbc', tierId: 'advance', currency: 'EGP', isActive: true, createdAt: '', creditLimit: 10000, paymentAccountId: 'bank',
};

const tx = (id: string, date: string): FinanceTransaction => ({
  id, householdId: 'h', type: 'expense', date, createdBy: 'u', createdAt: '', updatedAt: '', status: 'posted',
});
const line = (id: string, acc: string, amt: number): LedgerLine => ({
  id, householdId: 'h', transactionId: id, accountId: acc, signedAmount: amt, currency: 'EGP', createdAt: '',
});

describe('currentCyclePurchases', () => {
  it('sums expenses on credit account after last statement date', () => {
    const lines = [
      line('1', 'credit', -100),   // after statement
      line('2', 'credit', -250),   // after statement
      line('3', 'bank', -50),      // not credit
    ];
    const txs = [tx('1', '2026-06-20'), tx('2', '2026-06-25'), tx('3', '2026-06-22')];
    const lastStmt = { statementDate: '2026-06-15' } as CardStatement;
    expect(currentCyclePurchases(lines, txs, 'credit', lastStmt)).toBe(350);
  });

  it('excludes purchases on or before the statement date', () => {
    const lines = [line('1', 'credit', -100), line('2', 'credit', -200)];
    const txs = [tx('1', '2026-06-15'), tx('2', '2026-06-16')];
    const lastStmt = { statementDate: '2026-06-15' } as CardStatement;
    expect(currentCyclePurchases(lines, txs, 'credit', lastStmt)).toBe(200);
  });

  it('with no statement, sums all credit expenses', () => {
    const lines = [line('1', 'credit', -100), line('2', 'credit', -200)];
    const txs = [tx('1', '2026-01-01'), tx('2', '2026-05-01')];
    expect(currentCyclePurchases(lines, txs, 'credit', null)).toBe(300);
  });
});

describe('computeCardSummary', () => {
  it('computes debt, available credit, utilization from credit account balance', () => {
    const summary = computeCardSummary(card, -2500, null, []);
    expect(summary.currentDebt).toBe(2500);
    expect(summary.availableCredit).toBe(7500);
    expect(summary.utilization).toBeCloseTo(0.25);
  });

  it('reports nextDueDate from the last statement', () => {
    const stmt = { dueDate: '2026-07-05', statementDate: '2026-06-15', statementBalance: 700 } as CardStatement;
    const summary = computeCardSummary(card, -2500, stmt, []);
    expect(summary.nextDueDate).toBe('2026-07-05');
    expect(summary.lastStatementBalance).toBe(700);
  });
});
