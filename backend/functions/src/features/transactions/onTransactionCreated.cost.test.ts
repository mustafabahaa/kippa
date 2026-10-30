import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rows: new Map<string, Record<string, unknown>[]>(),
  reads: [] as { path: string; filters: [string, string, unknown][] }[],
  warning: vi.fn(() => ({ title: 'warning', body: 'warning', type: 'category_warning' })),
}));

vi.mock('firebase-functions/v2/firestore', () => ({ onDocumentCreated: (...args: unknown[]) => args[1] }));
vi.mock('firebase-admin/firestore', () => ({ getFirestore: () => ({}), FieldValue: { delete: () => '__delete__' } }));
vi.mock('../../domain/notifications/warnings.js', async (importOriginal) => ({ ...(await importOriginal<typeof import('../../domain/notifications/warnings.js')>()), buildCategoryWarningNotification: mocks.warning }));
vi.mock('../../libs/notifications/sendToMany.js', () => ({ getTokensForUsers: vi.fn(async () => []), sendToMany: vi.fn() }));

import { checkCategoryWarning } from './onTransactionCreated.js';

function mockDb() {
  return {
    collection(path: string) {
      const filters: [string, string, unknown][] = [];
      const query = {
        where(field: string, op: string, value: unknown) { filters.push([field, op, value]); return query; },
        limit() { return query; },
        async get() {
          mocks.reads.push({ path, filters: [...filters] });
          const docs = (mocks.rows.get(path) ?? []).filter((row) => filters.every(([key, operator, expected]) => operator === '==' ? row[key] === expected : operator === 'in' ? (expected as unknown[]).includes(row[key]) : false)).map((row) => ({ id: String(row.id), data: () => row }));
          return { docs, empty: docs.length === 0 };
        },
      };
      return query;
    },
    doc(path: string) {
      return {
        async get() { const row = (mocks.rows.get(path) ?? [])[0]; return { exists: Boolean(row), data: () => row }; },
        async set() {},
      };
    },
  };
}

const householdId = 'h1';
const categoryId = 'food';
const cycleId = 'cycle-current';
const ago = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
const transaction = (id: string, date: string, budgetCycleId: string, status = 'posted') => ({ id, date, budgetCycleId, categoryId, status });
const line = (id: string, transactionId: string, signedAmount: number) => ({ id, transactionId, signedAmount });

describe('checkCategoryWarning Firestore reads', () => {
  beforeEach(() => { mocks.rows.clear(); mocks.reads.length = 0; mocks.warning.mockClear(); });

  it('reads ledger lines only for posted transactions in the open cycle and preserves spend and velocity totals', async () => {
    mocks.rows.set(`households/${householdId}/budgetCycles`, [{ id: cycleId, status: 'open' }]);
    mocks.rows.set(`households/${householdId}/budgetAllocations`, [{ id: 'alloc', budgetCycleId: cycleId, categoryId, plannedAmount: 40, currency: 'USD' }]);
    mocks.rows.set(`households/${householdId}/transactions`, [
      transaction('old-a', ago(12), cycleId), transaction('old-b', ago(11), cycleId), transaction('old-c', ago(10), cycleId),
      transaction('recent-a', ago(3), cycleId), transaction('recent-b', ago(2), cycleId),
      transaction('draft', ago(1), cycleId, 'draft'), transaction('prior-cycle', ago(1), 'cycle-old'),
    ]);
    mocks.rows.set(`households/${householdId}/ledgerLines`, [
      line('l1', 'old-a', -5), line('l2', 'old-b', -5), line('l3', 'old-c', -5),
      line('l4', 'recent-a', -20), line('l5', 'recent-b', -20), line('credit', 'recent-b', 100),
      line('draft-line', 'draft', -700), line('old-cycle-line', 'prior-cycle', -900),
    ]);

    const txn = { id: 'recent-b', type: 'expense', categoryId } as never;
    await checkCategoryWarning(mockDb() as never, householdId, txn);

    const ledgerReads = mocks.reads.filter((read) => read.path.endsWith('/ledgerLines'));
    expect(ledgerReads).toHaveLength(1);
    expect(ledgerReads[0].filters).toContainEqual(['transactionId', 'in', ['old-a', 'old-b', 'old-c', 'recent-a', 'recent-b']]);
    expect(mocks.reads.find((read) => read.path.endsWith('/transactions'))?.filters).toEqual([['categoryId', '==', categoryId], ['status', '==', 'posted']]);
    expect(mocks.warning).toHaveBeenCalledWith(expect.objectContaining({
      spent: 55,
      threshold: 100,
      velocityContext: { earlierAvg: 5, recentAvg: 20 },
    }));
  });
});
