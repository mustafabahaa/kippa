import { describe, it, expect } from 'vitest';
import { computeDashboard } from './selectors';
import type { Account, FinanceTransaction, LedgerLine } from '@/domain/financeTypes';

const mkAccount = (id: string, currency: string, type: Account['type'] = 'running'): Account => ({
  id, householdId: 'h', name: id, type, currency, isActive: true, sortOrder: 1, createdAt: '',
});

const mkLine = (id: string, accId: string, amount: number, currency: string): LedgerLine => ({
  id, householdId: 'h', transactionId: id, accountId: accId, signedAmount: amount, currency, createdAt: '',
});

// A posted transaction that matches a ledger line's transactionId (line id == tx id in mkLine).
const mkTx = (id: string): FinanceTransaction => ({
  id, householdId: 'h', type: 'income', date: '2026-01-01', status: 'posted', createdBy: 'u', createdAt: '', updatedAt: '',
});

describe('computeDashboard (base-currency agnostic)', () => {
  it('sums same-currency balances directly into totalBaseEquivalent', () => {
    const accounts = [mkAccount('a1', 'SAR'), mkAccount('a2', 'SAR')];
    const lines = [mkLine('l1', 'a1', 1000, 'SAR'), mkLine('l2', 'a2', 500, 'SAR')];
    const txs = [mkTx('l1'), mkTx('l2')];
    const data = computeDashboard(accounts, txs, lines, [], null, [], [], {}, 'SAR');
    expect(data.totalBaseEquivalent).toBe(1500);
    expect(data.baseCurrency).toBe('SAR');
  });

  it('converts foreign-currency balances via displayRates', () => {
    const accounts = [mkAccount('a1', 'SAR'), mkAccount('a2', 'USD')];
    const lines = [mkLine('l1', 'a1', 1000, 'SAR'), mkLine('l2', 'a2', 100, 'USD')];
    const txs = [mkTx('l1'), mkTx('l2')];
    // USD→SAR rate = 3.75 (1 USD = 3.75 SAR). So 100 USD = 375 SAR.
    const data = computeDashboard(accounts, txs, lines, [], null, [], [], { USD: 3.75 }, 'SAR');
    expect(data.totalBaseEquivalent).toBe(1000 + 100 * 3.75);
  });

  it('uses rate of 1 for currencies missing from displayRates', () => {
    const accounts = [mkAccount('a1', 'SAR'), mkAccount('a2', 'GBP')];
    const lines = [mkLine('l1', 'a1', 500, 'SAR'), mkLine('l2', 'a2', 200, 'GBP')];
    const txs = [mkTx('l1'), mkTx('l2')];
    // GBP not in the map → treated as 1
    const data = computeDashboard(accounts, txs, lines, [], null, [], [], {}, 'SAR');
    expect(data.totalBaseEquivalent).toBe(700);
  });
});
