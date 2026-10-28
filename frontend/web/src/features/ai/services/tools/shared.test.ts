import { describe, expect, it } from 'vitest';
import { trimCardActivity } from './shared';
import { calculateCardActivity } from '@/libs/cardActivity';
import type { FinanceTransaction, LedgerLine } from '@kippa/domain';

const tx = (id: string, date: string, overrides: Partial<FinanceTransaction> = {}): FinanceTransaction =>
  ({
    id,
    date,
    status: 'posted',
    type: 'expense',
    budgetCycleId: 'cycle',
    description: id,
    ...overrides,
  }) as FinanceTransaction;

const line = (id: string, transactionId: string, signedAmount: number): LedgerLine =>
  ({ id, transactionId, accountId: 'credit', signedAmount }) as LedgerLine;

describe('trimCardActivity', () => {
  it('preserves the reconciliation fields the model needs to explain card debt', () => {
    // 21 exactly-settled charges force trimming, plus one unpaid charge and a
    // pool payment too small to cover it, leaving unapplied credit behind.
    const transactions: FinanceTransaction[] = [];
    const lines: LedgerLine[] = [];
    for (let i = 0; i < 21; i++) {
      const id = `paid-${i}`;
      const date = `2026-09-${String(i + 1).padStart(2, '0')}`;
      const amount = 100 + i;
      transactions.push(tx(id, date));
      lines.push(line(`l-${id}`, id, -amount));
      transactions.push(tx(`pay-${i}`, date, { type: 'transfer', settlesChargeIds: [id] }));
      lines.push(line(`l-pay-${i}`, `pay-${i}`, amount));
    }
    transactions.push(tx('unpaid', '2026-10-20', { description: 'Unpaid charge' }));
    lines.push(line('l-unpaid', 'unpaid', -113.3));
    transactions.push(tx('pay-pool', '2026-10-02', { type: 'transfer' }));
    lines.push(line('l-pay-pool', 'pay-pool', 3.3));
    const cycles = [
      {
        id: 'cycle',
        householdId: 'household-1',
        name: 'Sep/Oct 2026',
        startDate: '2026-09-01',
        endDate: '2026-10-25',
        status: 'closed' as const,
      },
    ];

    const activity = calculateCardActivity('credit', transactions, lines, cycles);
    expect(activity.unallocatedCredit).toBeCloseTo(3.3);

    const trimmed = trimCardActivity(activity);

    expect(trimmed.truncated).toBe(true);
    expect(trimmed.totalDebt).toBeCloseTo(113.3);
    expect(trimmed.unallocatedCredit).toBeCloseTo(3.3);
    expect(trimmed.unallocatedCredits).toEqual([
      { txId: 'pay-pool', date: '2026-10-02', description: 'pay-pool', amount: 3.3 },
    ]);
    expect(trimmed.accountBalance).toBeCloseTo(trimmed.unallocatedCredit - trimmed.totalDebt, 6);
  });
});
