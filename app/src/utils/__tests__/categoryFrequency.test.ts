import { describe, it, expect } from 'vitest';
import { computeFrequencyScores, WINDOW_DAYS } from '../categoryFrequency';
import type { FinanceTransaction } from '@/domain/financeTypes';

const ISO = (d: string) => d; // YYYY-MM-DD matches the date field format
const tx = (over: Partial<FinanceTransaction>): FinanceTransaction => ({
  id: over.id ?? 'x',
  householdId: 'h',
  type: over.type ?? 'expense',
  date: over.date ?? '2024-01-01',
  categoryId: over.categoryId ?? null,
  status: over.status ?? 'posted',
  createdBy: 'u',
  createdAt: over.createdAt ?? '2024-01-01T00:00:00.000Z',
  updatedAt: over.updatedAt ?? '2024-01-01T00:00:00.000Z',
} as FinanceTransaction);

describe('computeFrequencyScores', () => {
  it('returns empty object for no transactions', () => {
    expect(computeFrequencyScores([], 'expense', '2024-01-30')).toEqual({});
  });

  it('sums linear-decay weight per category within window', () => {
    // today = 2024-01-30
    const txs = [
      tx({ id: '1', categoryId: 'food', date: '2024-01-30', type: 'expense' }), // daysOld 0 -> 1
      tx({ id: '2', categoryId: 'food', date: '2024-01-15', type: 'expense' }), // daysOld 15 -> 0.5
      tx({ id: '3', categoryId: 'rent', date: '2024-01-23', type: 'expense' }), // daysOld 7 -> ~0.7667
    ];
    const scores = computeFrequencyScores(txs, 'expense', '2024-01-30');
    expect(scores['food']).toBeCloseTo(1.5, 5);
    expect(scores['rent']).toBeCloseTo(1 - 7 / 30, 5);
  });

  it('excludes transactions older than the window', () => {
    const txs = [tx({ id: '1', categoryId: 'old', date: '2023-12-20', type: 'expense' })];
    expect(computeFrequencyScores(txs, 'expense', '2024-01-30')).toEqual({});
  });

  it('excludes transactions of the wrong type', () => {
    const txs = [tx({ id: '1', categoryId: 'food', date: '2024-01-30', type: 'income' })];
    expect(computeFrequencyScores(txs, 'expense', '2024-01-30')).toEqual({});
  });

  it('excludes voided transactions', () => {
    const txs = [tx({ id: '1', categoryId: 'food', date: '2024-01-30', status: 'voided' })];
    expect(computeFrequencyScores(txs, 'expense', '2024-01-30')).toEqual({});
  });

  it('excludes transactions with no categoryId', () => {
    const txs = [tx({ id: '1', categoryId: null, date: '2024-01-30' })];
    expect(computeFrequencyScores(txs, 'expense', '2024-01-30')).toEqual({});
  });

  it('clamps future-dated transactions to weight 1.0', () => {
    const txs = [tx({ id: '1', categoryId: 'future', date: '2024-02-05', type: 'expense' })];
    const scores = computeFrequencyScores(txs, 'expense', '2024-01-30');
    expect(scores['future']).toBe(1);
  });

  it('excludes a transaction exactly at day 30 (weight 0)', () => {
    const txs = [tx({ id: '1', categoryId: 'edge', date: '2023-12-31', type: 'expense' })]; // 30 days
    expect(computeFrequencyScores(txs, 'expense', '2024-01-30')).toEqual({});
  });
});

// Reference the constant so it's part of the test surface.
void WINDOW_DAYS;
void ISO;
