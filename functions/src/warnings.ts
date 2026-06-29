export const WARNING_THRESHOLD = 0.8;

/**
 * Returns true when category spend has crossed the warning threshold
 * (80% of the planned allocation).
 *
 * @param spent   - total spent in this category (absolute value, base currency)
 * @param planned - BudgetAllocation.plannedAmount for this category
 */
export function shouldWarnCategory(spent: number, planned: number): boolean {
  if (planned <= 0) return false;
  return spent / planned >= WARNING_THRESHOLD;
}

/**
 * Returns the spend percentage as a rounded integer (0-100+).
 */
export function spentPercentage(spent: number, planned: number): number {
  if (planned <= 0) return 0;
  return Math.round((spent / planned) * 100);
}
