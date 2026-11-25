import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Loan } from '@kippa/domain';

const mocks = vi.hoisted(() => ({
  loans: [] as Loan[],
  paymentsReady: false,
  fundingReady: false,
  loanIds: [] as string[],
  balanceEnabled: false,
  enqueueSnackbar: vi.fn(),
}));

vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }) }));
vi.mock('@/hooks/useAppContext', () => ({ useAppContext: () => ({ householdId: 'h1' }) }));
vi.mock('@/hooks/useFinance', () => ({
  useLoans: () => ({ data: mocks.loans }),
  useAccounts: () => ({ data: [{ id: 'cash', type: 'running', currency: 'USD' }] }),
  useLoanPaymentHistory: (_householdId: string, ids: string[]) => {
    void _householdId;
    mocks.loanIds = ids;
    return { data: mocks.paymentsReady ? { transactions: [], lines: [] } : undefined };
  },
  useLedgerSnapshot: (_householdId: string, _scope: undefined, enabled: boolean) => {
    void _householdId;
    void _scope;
    mocks.balanceEnabled = enabled;
    return { data: mocks.fundingReady ? { balances: { cash: 0 } } : undefined };
  },
}));

import { useLoanReminders } from './useLoanReminders';

const today = new Date().toISOString().slice(0, 10);
const activeLoan: Loan = {
  id: 'loan-1', householdId: 'h1', name: 'Car loan', currency: 'USD', originalTotal: 1000,
  installmentAmount: 100, totalInstallments: 10, firstPaymentDate: `${today.slice(0, 8)}01`,
  dueDay: Number(today.slice(8)), paymentAccountId: 'cash', status: 'active', createdAt: '', updatedAt: '',
};

describe('useLoanReminders history query costs', () => {
  beforeEach(() => {
    mocks.loans = [];
    mocks.paymentsReady = false;
    mocks.fundingReady = false;
    mocks.loanIds = [];
    mocks.balanceEnabled = false;
    mocks.enqueueSnackbar.mockClear();
    localStorage.clear();
    vi.stubGlobal('Notification', { permission: 'default' });
  });

  it('disables transaction and ledger history queries when there are no active loans', () => {
    mocks.loans = [{ ...activeLoan, status: 'paid' }];
    renderHook(() => useLoanReminders());

    expect(mocks.loanIds).toEqual([]);
    expect(mocks.balanceEnabled).toBe(false);
    expect(mocks.enqueueSnackbar).not.toHaveBeenCalled();
  });

  it('reads only loan payments and the stored funding-account balance before showing a shortfall reminder', async () => {
    mocks.loans = [activeLoan];
    const { rerender } = renderHook(() => useLoanReminders());
    expect(mocks.loanIds).toEqual(['loan-1']);
    expect(mocks.balanceEnabled).toBe(false);
    expect(mocks.enqueueSnackbar).not.toHaveBeenCalled();

    mocks.paymentsReady = true;
    rerender();
    expect(mocks.balanceEnabled).toBe(true);
    expect(mocks.enqueueSnackbar).not.toHaveBeenCalled();

    mocks.fundingReady = true;
    rerender();
    await waitFor(() => expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
      expect.stringContaining('Car loan: add 100 USD before'),
      { variant: 'warning', persist: true },
    ));
  });
});
