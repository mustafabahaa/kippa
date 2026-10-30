import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Account, FinanceTransaction, LedgerLine } from '@kippa/domain';

const mocks = vi.hoisted(() => ({ getDocs: vi.fn() }));

vi.mock('@/libs/db', () => ({ dbLib: { getDocs: mocks.getDocs } }));
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
});
