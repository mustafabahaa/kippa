import { describe, expect, it } from 'vitest';
import { calculateCardActivity } from './cardActivity';

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
});
