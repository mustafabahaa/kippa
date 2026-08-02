import { describe, expect, it } from 'vitest';
import type { Account, FinanceTransaction, LedgerLine } from '@kippa/domain';
import { calculateAccountBalances, getPostedLedgerLines, getTransferLines } from './financeCalculations';

const accounts = [{ id: 'cash' }, { id: 'bank' }] as Account[];
const transactions = [{ id: 'posted', status: 'posted' }, { id: 'voided', status: 'voided' }] as FinanceTransaction[];
const lines = [
  { id: '1', transactionId: 'posted', accountId: 'cash', signedAmount: -25 },
  { id: '2', transactionId: 'posted', accountId: 'bank', signedAmount: 25 },
  { id: '3', transactionId: 'voided', accountId: 'cash', signedAmount: -100 },
] as LedgerLine[];

describe('finance calculations', () => {
  it('excludes ledger lines belonging to non-posted transactions', () => {
    expect(getPostedLedgerLines(transactions, lines)).toHaveLength(2);
    expect(calculateAccountBalances(accounts, transactions, lines)).toEqual({ cash: -25, bank: 25 });
  });

  it('identifies transfer source and destination consistently', () => {
    expect(getTransferLines(lines.slice(0, 2))).toEqual({ source: lines[0], destination: lines[1] });
  });
});
