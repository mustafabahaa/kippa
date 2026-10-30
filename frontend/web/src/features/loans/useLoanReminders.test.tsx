import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Loan } from '@kippa/domain';

const mocks = vi.hoisted(() => ({
  loans: [] as Loan[],
  transactionsReady: false,
  linesReady: false,
  transactionOptions: [] as { enabled?: boolean }[],
  lineOptions: [] as { enabled?: boolean }[],
  enqueueSnackbar: vi.fn(),
}));

vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }) }));
vi.mock('@/hooks/useAppContext', () => ({ useAppContext: () => ({ householdId: 'h1' }) }));
vi.mock('@/hooks/useFinance', () => ({
  useLoans: () => ({ data: mocks.loans }),
  useAccounts: () => ({ data: [{ id: 'cash', type: 'running', currency: 'USD' }] }),
  useTransactions: (_householdId: string, _cycleId: string | undefined, options: { enabled?: boolean }) => {
    void _householdId;
    void _cycleId;
    mocks.transactionOptions.push(options);
    return { data: [], isSuccess: mocks.transactionsReady };
  },
  useLedgerLines: (_householdId: string, _cycleId: string | undefined, options: { enabled?: boolean }) => {
    void _householdId;
    void _cycleId;
    mocks.lineOptions.push(options);
    return { data: [], isSuccess: mocks.linesReady };
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
    mocks.transactionsReady = false;
    mocks.linesReady = false;
    mocks.transactionOptions = [];
    mocks.lineOptions = [];
    mocks.enqueueSnackbar.mockClear();
    localStorage.clear();
    vi.stubGlobal('Notification', { permission: 'default' });
  });

  it('disables transaction and ledger history queries when there are no active loans', () => {
    mocks.loans = [{ ...activeLoan, status: 'paid' }];
    renderHook(() => useLoanReminders());

    expect(mocks.transactionOptions.at(-1)).toEqual({ enabled: false });
    expect(mocks.lineOptions.at(-1)).toEqual({ enabled: false });
    expect(mocks.enqueueSnackbar).not.toHaveBeenCalled();
  });

  it('enables histories for active loans and waits for both before showing a shortfall reminder', async () => {
    mocks.loans = [activeLoan];
    const { rerender } = renderHook(() => useLoanReminders());
    expect(mocks.transactionOptions.at(-1)).toEqual({ enabled: true });
    expect(mocks.lineOptions.at(-1)).toEqual({ enabled: true });
    expect(mocks.enqueueSnackbar).not.toHaveBeenCalled();

    mocks.transactionsReady = true;
    rerender();
    expect(mocks.enqueueSnackbar).not.toHaveBeenCalled();

    mocks.linesReady = true;
    rerender();
    await waitFor(() => expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
      expect.stringContaining('Car loan: add 100 USD before'),
      { variant: 'warning', persist: true },
    ));
  });
});
