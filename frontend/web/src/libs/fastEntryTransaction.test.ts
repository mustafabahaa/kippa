import { describe, expect, it } from 'vitest';
import type { Account, Category } from '@kippa/domain';
import { buildFastEntryTransaction } from './fastEntryTransaction';

const source = { id: 'egp', currency: 'EGP', name: 'Cash' } as Account;
const destination = { id: 'usd', currency: 'USD', name: 'USD account' } as Account;
const common = { activeCycle: null, amountText: '100', category: { id: 'food' } as Category, createdBy: 'user', date: '2026-08-02', description: '', destinationAccount: null, destinationAmountText: '0', sourceAccount: source };

describe('fast entry transaction builder', () => {
  it('builds signed expense ledger lines', () => {
    const result = buildFastEntryTransaction({ ...common, mode: 'expense' });
    expect(result.lines[0].signedAmount).toBe(-100);
  });

  it('builds cross-currency transfer conversion details', () => {
    const result = buildFastEntryTransaction({ ...common, mode: 'transfer', category: null, destinationAccount: destination, destinationAmountText: '2' });
    expect(result.lines.map((line) => line.signedAmount)).toEqual([-100, 2]);
    expect('conversionDetails' in result && result.conversionDetails?.effectiveRate).toBe(0.02);
  });

  it('rejects invalid amounts before mutation code runs', () => {
    expect(() => buildFastEntryTransaction({ ...common, mode: 'expense', amountText: '0' })).toThrow('valid amount');
  });
});
