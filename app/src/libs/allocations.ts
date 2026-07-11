import type { BudgetAllocation } from '@/domain/financeTypes';

/**
 * Canonical budget-allocation doc id: `${budgetCycleId}_${categoryId}`.
 * Re-saving an allocation must upsert the same doc rather than create a new
 * one. saveBudgetAllocation(Batch) writes to this id; dedupeAllocations and the
 * Firestore migration both key off it.
 */
export function allocationDocId(budgetCycleId: string, categoryId: string): string {
  return `${budgetCycleId}_${categoryId}`;
}

/**
 * Collapse duplicate budget allocations to one doc per (cycle, category).
 *
 * Background: saveBudgetAllocation used to mint a fresh random id on every
 * save, so re-saving created duplicate docs that inflated the dashboard's
 * spending breakdown. The write path now uses a canonical id (see
 * allocationDocId); this helper deduplicates whatever stale duplicates remain
 * on read, so every consumer (dashboard selector, config screen, edit form)
 * sees exactly one row per category.
 *
 * Keeper selection per group:
 *  1. the doc already at the canonical id, if present (matches the write
 *     contract), otherwise
 *  2. the doc with the highest plannedAmount.
 *
 * Pure and dependency-free so it can be unit-tested without the Firestore layer.
 */
export function dedupeAllocations(allocations: BudgetAllocation[]): BudgetAllocation[] {
  const groups = new Map<string, BudgetAllocation[]>();

  for (const alloc of allocations) {
    const key = allocationDocId(alloc.budgetCycleId, alloc.categoryId);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(alloc);
    } else {
      groups.set(key, [alloc]);
    }
  }

  const result: BudgetAllocation[] = [];
  for (const [key, bucket] of groups) {
    if (bucket.length === 1) {
      result.push(bucket[0]);
      continue;
    }

    // Prefer the doc already living at the canonical id.
    const canonical = bucket.find(a => a.id === key);
    if (canonical) {
      result.push(canonical);
      continue;
    }

    // No canonical doc yet — keep the highest plannedAmount (latest intent).
    const keeper = bucket.reduce((best, cur) =>
      cur.plannedAmount > best.plannedAmount ? cur : best
    );
    result.push(keeper);
  }

  return result;
}
