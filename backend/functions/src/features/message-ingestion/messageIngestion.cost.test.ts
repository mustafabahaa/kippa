import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ rows: new Map<string, Record<string, unknown>[]>(), reads: [] as { path: string; filters: [string, string, unknown][] }[] }));

vi.mock('firebase-admin/firestore', () => ({ FieldValue: { delete: () => '__delete__' }, getFirestore: () => ({
  collection: (path: string) => ({ where: (field: string, op: string, value: unknown) => {
    const filters: [string, string, unknown][] = [[field, op, value]];
    const query = { where: (nextField: string, nextOp: string, nextValue: unknown) => { filters.push([nextField, nextOp, nextValue]); return query; }, get: async () => {
      mocks.reads.push({ path, filters: [...filters] });
      const docs = (mocks.rows.get(path) ?? []).filter((row) => filters.every(([key, operator, expected]) => operator === '==' ? row[key] === expected : operator === 'in' ? (expected as unknown[]).includes(row[key]) : false)).map((row) => ({ id: String(row.id), data: () => row }));
      return { docs };
    } };
    return query;
  } }),
}) }));
vi.mock('firebase-functions/params', () => ({ projectID: { value: () => 'test' } }));
vi.mock('firebase-functions/v2/https', () => ({ onCall: (handler: unknown) => handler, onRequest: (handler: unknown) => handler, HttpsError: class extends Error {} }));

import { resolveLoanSuggestion } from './messageIngestion.js';

const householdId = 'h1';
const parsed = { kind: 'expense', amount: 100, currency: 'USD', date: '2025-01-15' } as const;
const loan = (id: string, overrides: Record<string, unknown> = {}) => ({ id, status: 'active', paymentAccountId: 'a1', currency: 'USD', installmentAmount: 100, totalInstallments: 10, firstPaymentDate: '2025-01-15', dueDay: 15, name: id, ...overrides });
const txn = (id: string, loanId: string, status = 'posted') => ({ id, loanId, status });

describe('resolveLoanSuggestion Firestore reads', () => {
  beforeEach(() => { mocks.rows.clear(); mocks.reads.length = 0; });

  it('does not read transactions when no loan matches account, currency, and amount', async () => {
    mocks.rows.set(`households/${householdId}/loans`, [loan('wrong-account', { paymentAccountId: 'a2' }), loan('wrong-currency', { currency: 'EUR' }), loan('wrong-amount', { installmentAmount: 200 })]);
    expect(await resolveLoanSuggestion(householdId, parsed as never, 'a1')).toBeNull();
    expect(mocks.reads).toHaveLength(1);
    expect(mocks.reads[0].path).toBe(`households/${householdId}/loans`);
  });

  it('counts only posted candidate payments and reads only candidate loan IDs', async () => {
    mocks.rows.set(`households/${householdId}/loans`, [loan('match'), loan('other', { installmentAmount: 250 })]);
    mocks.rows.set(`households/${householdId}/transactions`, [txn('posted', 'match'), txn('draft', 'match', 'draft'), txn('void', 'match', 'voided'), txn('unrelated', 'other')]);
    expect(await resolveLoanSuggestion(householdId, { ...parsed, date: '2025-02-15' } as never, 'a1')).toMatchObject({ loanId: 'match', installmentNumber: 2 });
    const reads = mocks.reads.filter((read) => read.path.endsWith('/transactions'));
    expect(reads).toHaveLength(1);
    expect(reads[0].filters).toContainEqual(['loanId', 'in', ['match']]);
  });

  it('keeps ambiguous suggestions null and batches candidate IDs in groups of ten', async () => {
    mocks.rows.set(`households/${householdId}/loans`, [...Array(21).keys()].map((i) => loan(`loan-${i}`)));
    mocks.rows.set(`households/${householdId}/transactions`, []);
    expect(await resolveLoanSuggestion(householdId, parsed as never, 'a1')).toBeNull();
    const reads = mocks.reads.filter((read) => read.path.endsWith('/transactions'));
    expect(reads).toHaveLength(3);
    expect(reads.map((read) => (read.filters[0][2] as string[]).length)).toEqual([10, 10, 1]);
    expect(reads.flatMap((read) => read.filters[0][2] as string[])).toEqual([...Array(21).keys()].map((i) => `loan-${i}`));
  });
});
