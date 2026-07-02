import type { FinanceTransaction } from '@/domain/financeTypes';

export const WINDOW_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(fromISODate: string, toISODate: string): number {
  const from = new Date(fromISODate + 'T00:00:00.000Z').getTime();
  const to = new Date(toISODate + 'T00:00:00.000Z').getTime();
  return Math.floor((to - from) / MS_PER_DAY);
}

/**
 * Compute a recency+frequency score per categoryId using linear time decay.
 * Each transaction within the last WINDOW_DAYS days contributes
 * weight = 1 - (daysOld / WINDOW_DAYS). Weight is clamped to [0, 1].
 * Future-dated transactions contribute weight 1.
 *
 * Returns a map of categoryId -> summed score.
 */
export function computeFrequencyScores(
  transactions: FinanceTransaction[] | undefined,
  type: 'income' | 'expense',
  today: string // YYYY-MM-DD
): Record<string, number> {
  const scores: Record<string, number> = {};
  if (!transactions?.length) return scores;

  for (const t of transactions) {
    if (t.type !== type) continue;
    if (t.status === 'voided') continue;
    if (!t.categoryId) continue;

    const daysOld = daysBetween(t.date, today);
    if (daysOld < 0) {
      // future-dated: clamp to full weight
      scores[t.categoryId] = (scores[t.categoryId] ?? 0) + 1;
      continue;
    }
    if (daysOld >= WINDOW_DAYS) continue; // outside window (day 30 -> weight 0)

    const weight = 1 - daysOld / WINDOW_DAYS;
    scores[t.categoryId] = (scores[t.categoryId] ?? 0) + weight;
  }
  return scores;
}
