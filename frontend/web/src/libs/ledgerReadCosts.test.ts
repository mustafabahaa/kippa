import { documentId, orderBy, where } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Account, FinanceTransaction, LedgerLine } from '@kippa/domain';

const mocks = vi.hoisted(() => ({ getDocs: vi.fn(), getDocsPage: vi.fn() }));

vi.mock('@/libs/db', () => ({ dbLib: { getDocs: mocks.getDocs, getDocsPage: mocks.getDocsPage } }));
vi.mock('@/libs/auditLog', () => ({ auditLogLib: { logAction: vi.fn() } }));
vi.mock('@/libs/currencyMeta', () => ({ detectBaseCurrency: () => 'EGP', currencySymbol: () => 'ج.م' }));

import { ledgerLib } from './ledger';

const account: Account = { id: 'credit', householdId: 'h1', name: 'Card', type: 'credit', currency: 'EGP', isActive: true, sortOrder: 0, createdAt: '' };
const transaction: FinanceTransaction = { id: 'purchase', householdId: 'h1', type: 'expense', date: '2026-01-10', createdBy: 'u1', createdAt: '', updatedAt: '', status: 'posted' };
const line: LedgerLine = { id: 'line-1', householdId: 'h1', transactionId: 'purchase', accountId: 'credit', signedAmount: -100, currency: 'EGP', createdAt: '' };

describe('ledger read cost', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getDocs.mockResolvedValue([line]); });

  it('uses supplied accounts and transactions to apply legacy card fees without reading them again', async () => {
    const result = await ledgerLib.getLedgerLines('h1', { accounts: [account], transactions: [transaction] });

    expect(mocks.getDocs).toHaveBeenCalledTimes(1);
    expect(mocks.getDocs).toHaveBeenCalledWith('h1', 'ledgerLines');
    expect(result[0]).toMatchObject({ signedAmount: -103, cardFee: { baseAmount: 100, rate: 3 } });
  });

  it('reads ledger entries only for the transactions on the requested history page', async () => {
    const cursor = {} as import('firebase/firestore').QueryDocumentSnapshot;
    mocks.getDocsPage.mockResolvedValue({ items: [transaction], nextCursor: cursor });

    const result = await ledgerLib.getTransactionHistoryPage('h1', 'cycle-a', 1, cursor);

    expect(mocks.getDocsPage).toHaveBeenCalledWith('h1', 'transactions', 1, cursor, [
      where('budgetCycleId', '==', 'cycle-a'),
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc'),
    ]);
    expect(mocks.getDocs).toHaveBeenCalledExactlyOnceWith('h1', 'ledgerLines', [
      { field: 'transactionId', op: 'in', value: [transaction.id] },
    ]);
    expect(result).toEqual({ transactions: [transaction], lines: [line], nextCursor: cursor });
  });

  it('bounds category ranking to 100 recent transactions', async () => {
    mocks.getDocsPage.mockResolvedValue({ items: [transaction], nextCursor: null });

    expect(await ledgerLib.getRecentCategoryTransactions('h1', '2026-01-01')).toEqual([transaction]);
    expect(mocks.getDocsPage).toHaveBeenCalledExactlyOnceWith('h1', 'transactions', 100, undefined, [
      where('date', '>=', '2026-01-01'),
      orderBy('date', 'desc'),
    ]);
    expect(mocks.getDocs).not.toHaveBeenCalled();
  });

  it('reads only the account ledger and matching transaction documents for a balance', async () => {
    mocks.getDocsPage.mockResolvedValue({ items: [transaction], nextCursor: null });

    const result = await ledgerLib.getAccountHistory('h1', [account]);

    expect(mocks.getDocs).toHaveBeenCalledExactlyOnceWith('h1', 'ledgerLines', [
      { field: 'accountId', op: 'in', value: [account.id] },
    ]);
    expect(mocks.getDocsPage).toHaveBeenCalledExactlyOnceWith('h1', 'transactions', 1, undefined, [
      where(documentId(), 'in', [transaction.id]),
    ]);
    expect(result.lines[0]).toMatchObject({ signedAmount: -103, cardFee: { baseAmount: 100, rate: 3 } });
  });

  it('does not query ledger entries for an empty page', async () => {
    mocks.getDocsPage.mockResolvedValue({ items: [], nextCursor: null });

    expect(await ledgerLib.getTransactionHistoryPage('h1', undefined, 25)).toEqual({
      transactions: [],
      lines: [],
      nextCursor: null,
    });
    expect(mocks.getDocsPage).toHaveBeenCalledWith('h1', 'transactions', 25, undefined, [
      orderBy('date', 'desc'),
      orderBy('createdAt', 'desc'),
    ]);
    expect(mocks.getDocs).not.toHaveBeenCalled();
  });

  it('keeps reconciliation history ordered by creation date', async () => {
    const page = { items: [], nextCursor: null };
    mocks.getDocsPage.mockResolvedValue(page);

    expect(await ledgerLib.getReconciliationsPage('h1', 7)).toBe(page);
    expect(mocks.getDocsPage).toHaveBeenCalledWith('h1', 'reconciliations', 7, undefined, [
      orderBy('createdAt', 'desc'),
    ]);
  });
});
