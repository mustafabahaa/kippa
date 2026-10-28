import { describe, expect, it } from 'vitest';
import { calculateCardActivity } from './cardActivity';
import type { FinanceTransaction, LedgerLine } from '@kippa/domain';

type TxOverrides = Partial<FinanceTransaction> & Record<string, unknown>;
type LineOverrides = Partial<LedgerLine> & Record<string, unknown>;

const tx = (id: string, overrides: TxOverrides = {}): FinanceTransaction =>
  ({
    id,
    date: '2026-10-01',
    status: 'posted',
    type: 'expense',
    budgetCycleId: 'cycle',
    description: id,
    ...overrides,
  }) as FinanceTransaction;

const line = (id: string, transactionId: string, signedAmount: number, overrides: LineOverrides = {}): LedgerLine =>
  ({ id, transactionId, accountId: 'credit', signedAmount, ...overrides }) as LedgerLine;

const expectReconciles = (activity: ReturnType<typeof calculateCardActivity>) =>
  expect(activity.accountBalance).toBeCloseTo(activity.unallocatedCredit - activity.totalDebt, 6);

describe('calculateCardActivity', () => {
  it('orders charges newest-first within a cycle', () => {
    const transactions = [
      { id: 'june', date: '2026-06-14', status: 'posted', type: 'expense', budgetCycleId: 'cycle' },
      { id: 'july-late', date: '2026-07-18', status: 'posted', type: 'expense', budgetCycleId: 'cycle' },
      { id: 'july-early', date: '2026-07-02', status: 'posted', type: 'expense', budgetCycleId: 'cycle' },
    ];
    const lines = [
      { id: 'line-june', transactionId: 'june', accountId: 'credit', signedAmount: -103 },
      { id: 'line-july-late', transactionId: 'july-late', accountId: 'credit', signedAmount: -1029.99 },
      { id: 'line-july-early', transactionId: 'july-early', accountId: 'credit', signedAmount: -113.29 },
    ];
    const cycles = [{ id: 'cycle', name: 'June/July 2026', startDate: '2026-06-25', endDate: '2026-07-27' }];

    const activity = calculateCardActivity('credit', transactions as any, lines as any, cycles as any);

    expect(activity.cycleGroups[0].charges.map((charge) => charge.date)).toEqual([
      '2026-07-18',
      '2026-07-02',
      '2026-06-14',
    ]);
  });

  it('treats a partial pool payment as unapplied credit while the charge stays unpaid', () => {
    const transactions = [tx('charge', { date: '2026-10-01' }), tx('pay', { date: '2026-10-05', type: 'transfer' })];
    const lines = [line('l-charge', 'charge', -100), line('l-pay', 'pay', 40)];

    const activity = calculateCardActivity('credit', transactions, lines, []);

    expect(activity.charges[0].paid).toBe(false);
    expect(activity.totalDebt).toBe(100);
    expect(activity.unallocatedCredit).toBeCloseTo(40);
    expect(activity.unallocatedCredits).toEqual([
      { txId: 'pay', date: '2026-10-05', description: 'pay', amount: 40 },
    ]);
    expectReconciles(activity);
  });

  it('reports a fee-inclusive settlement of a charge recorded without its fee as unapplied credit', () => {
    // Production shape of the HSBC reconciliation gap: the payment carried the
    // 3% fee but the settled charge line was never rewritten, so the fee
    // reduced the balance without applying to any charge.
    const transactions = [
      tx('netflix', { date: '2026-08-14', description: 'NETFLIX.COM' }),
      tx('payment', {
        date: '2026-10-06',
        type: 'transfer',
        description: 'Card payment — NETFLIX.COM',
        settlesChargeIds: ['netflix'],
      }),
    ];
    const lines = [line('l-netflix', 'netflix', -110), line('l-payment', 'payment', 113.3)];

    const activity = calculateCardActivity('credit', transactions, lines, []);

    expect(activity.charges[0].paid).toBe(true);
    expect(activity.totalDebt).toBe(0);
    expect(activity.unallocatedCredit).toBeCloseTo(3.3);
    expect(activity.unallocatedCredits).toHaveLength(1);
    expect(activity.unallocatedCredits[0].txId).toBe('payment');
    expect(activity.unallocatedCredits[0].date).toBe('2026-10-06');
    expect(activity.unallocatedCredits[0].description).toBe('Card payment — NETFLIX.COM');
    expect(activity.unallocatedCredits[0].amount).toBeCloseTo(3.3);
    expect(activity.accountBalance).toBeCloseTo(3.3);
    expectReconciles(activity);
  });

  it('leaves no unapplied credit when a settlement matches the recorded fee-inclusive charge', () => {
    const transactions = [
      tx('openai', { date: '2026-10-19', description: 'OPENAI' }),
      tx('payment', { date: '2026-10-25', type: 'transfer', settlesChargeIds: ['openai'] }),
    ];
    const lines = [
      line('l-openai', 'openai', -1029.99, { cardFee: { baseAmount: 999.99, rate: 3 } }),
      line('l-payment', 'payment', 1029.99),
    ];

    const activity = calculateCardActivity('credit', transactions, lines, []);

    expect(activity.charges[0].paid).toBe(true);
    expect(activity.totalDebt).toBe(0);
    expect(activity.unallocatedCredit).toBe(0);
    expect(activity.unallocatedCredits).toEqual([]);
    expectReconciles(activity);
  });

  it('keeps pool credit in its own cycle and reports leftovers no charge consumed', () => {
    const transactions = [
      tx('charge-a', { date: '2026-09-01', budgetCycleId: 'cycle-sep' }),
      tx('charge-b', { date: '2026-10-01', budgetCycleId: 'cycle-oct' }),
      tx('pay-sep', { date: '2026-09-20', type: 'transfer', budgetCycleId: 'cycle-sep' }),
      tx('pay-oct', { date: '2026-10-20', type: 'transfer', budgetCycleId: 'cycle-oct' }),
    ];
    const lines = [
      line('l-a', 'charge-a', -200),
      line('l-b', 'charge-b', -200),
      line('l-pay-sep', 'pay-sep', 150),
      line('l-pay-oct', 'pay-oct', 200),
    ];

    const activity = calculateCardActivity('credit', transactions, lines, []);

    // October's pool fully covers its charge; September's 150 cannot fully
    // cover its larger charge, so it stays unpaid and the pool is unapplied.
    const byTx = new Map(activity.charges.map((charge) => [charge.txId, charge]));
    expect(byTx.get('charge-a')!.paid).toBe(false);
    expect(byTx.get('charge-b')!.paid).toBe(true);
    expect(activity.totalDebt).toBe(200);
    expect(activity.unallocatedCredit).toBeCloseTo(150);
    expect(activity.unallocatedCredits.map((credit) => credit.txId)).toEqual(['pay-sep']);
    expectReconciles(activity);
  });

  it('nets an underpaid settlement to a negative unapplied credit while the identity still holds', () => {
    const transactions = [
      tx('charge', { date: '2026-10-01' }),
      tx('payment', { date: '2026-10-05', type: 'transfer', settlesChargeIds: ['charge'] }),
    ];
    const lines = [line('l-charge', 'charge', -130), line('l-payment', 'payment', 100)];

    const activity = calculateCardActivity('credit', transactions, lines, []);

    expect(activity.charges[0].paid).toBe(true);
    expect(activity.totalDebt).toBe(0);
    expect(activity.unallocatedCredit).toBeCloseTo(-30);
    expect(activity.unallocatedCredits).toEqual([]);
    expectReconciles(activity);
  });

  it('does not let a second payment absorb a charge amount twice', () => {
    const transactions = [
      tx('charge', { date: '2026-10-01' }),
      tx('pay-1', { date: '2026-10-05', type: 'transfer', settlesChargeIds: ['charge'] }),
      tx('pay-2', { date: '2026-10-06', type: 'transfer', settlesChargeIds: ['charge'] }),
    ];
    const lines = [line('l-charge', 'charge', -110), line('l-pay-1', 'pay-1', 113.3), line('l-pay-2', 'pay-2', 113.3)];

    const activity = calculateCardActivity('credit', transactions, lines, []);

    expect(activity.unallocatedCredit).toBeCloseTo(116.6);
    // Settlements apply newest-first, so pay-2 absorbs the charge and pay-1
    // is unapplied in full.
    expect(activity.unallocatedCredits.map((credit) => credit.txId)).toEqual(['pay-2', 'pay-1']);
    expect(activity.unallocatedCredits.find((credit) => credit.txId === 'pay-2')!.amount).toBeCloseTo(3.3);
    expect(activity.unallocatedCredits.find((credit) => credit.txId === 'pay-1')!.amount).toBeCloseTo(113.3);
    expectReconciles(activity);
  });

  it('reports unapplied credit for a settlement naming no charge on this account', () => {
    const transactions = [
      tx('charge', { date: '2026-10-01' }),
      tx('payment', { date: '2026-10-05', type: 'transfer', settlesChargeIds: ['other-account-charge'] }),
    ];
    const lines = [line('l-charge', 'charge', -100), line('l-payment', 'payment', 51.01)];

    const activity = calculateCardActivity('credit', transactions, lines, []);

    expect(activity.charges[0].paid).toBe(false);
    expect(activity.unallocatedCredit).toBeCloseTo(51.01);
    expect(activity.unallocatedCredits[0].amount).toBeCloseTo(51.01);
    expectReconciles(activity);
  });
});
