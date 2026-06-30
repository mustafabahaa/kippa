// --- Percentage thresholds ---

export function spentPercentage(spent: number, planned: number): number {
  if (planned <= 0) return 0;
  return Math.round((spent / planned) * 100);
}

/**
 * Returns the highest crossed threshold (80 or 100), or null if below 80%.
 */
export function checkPercentageThresholds(
  spent: number,
  planned: number,
): 80 | 100 | null {
  if (planned <= 0) return null;
  const ratio = spent / planned;
  if (ratio >= 1.0) return 100;
  if (ratio >= 0.8) return 80;
  return null;
}

// --- Velocity spike detection ---

export interface SpendingEntry {
  amount: number;
  date: string; // YYYY-MM-DD
}

const VELOCITY_WINDOW_DAYS = 7;
const VELOCITY_MULTIPLIER = 2.0;
const MIN_EARLIER_DAYS = 3;
const MIN_RECENT_DAYS = 2;

/**
 * Returns true when the recent 7-day daily average is >2x the earlier daily average,
 * subject to minimum data and absolute thresholds.
 */
export function checkVelocitySpike(
  earlierEntries: SpendingEntry[],
  recentEntries: SpendingEntry[],
  plannedAmount: number,
): boolean {
  if (plannedAmount <= 0) return false;

  const earlierDays = countUniqueDays(earlierEntries);
  const recentDays = countUniqueDays(recentEntries);

  if (earlierDays < MIN_EARLIER_DAYS || recentDays < MIN_RECENT_DAYS) return false;

  const earlierTotal = sumAmounts(earlierEntries);
  const recentTotal = sumAmounts(recentEntries);

  const earlierAvg = earlierTotal / earlierDays;
  const recentAvg = recentTotal / recentDays;

  // No baseline
  if (earlierAvg <= 0) return false;

  // No recent spending
  if (recentAvg <= 0) return false;

  // Minimum absolute threshold: daily avg must be at least 1/30th of planned budget
  if (recentAvg < plannedAmount / 30) return false;

  return recentAvg / earlierAvg >= VELOCITY_MULTIPLIER;
}

// --- Velocity dedup ---

/**
 * Returns true when the velocity dedup key has expired (or never existed),
 * meaning it's OK to fire again.
 */
export function isVelocityKeyExpired(lastDate: string | undefined): boolean {
  if (!lastDate) return true;
  const then = new Date(lastDate + 'T00:00:00Z');
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= VELOCITY_WINDOW_DAYS;
}

// --- Notification builder ---

export interface VelocityContext {
  earlierAvg: number;
  recentAvg: number;
}

export interface CategoryWarningInput {
  categoryName: string;
  spent: number;
  planned: number;
  currency: string;
  threshold: 80 | 100 | null;
  velocityContext: VelocityContext | null;
}

/**
 * Builds the notification payload for a category warning.
 * Returns null when neither threshold nor velocity fired.
 */
export function buildCategoryWarningNotification(input: CategoryWarningInput): {
  type: 'category_warning';
  title: string;
  body: string;
} | null {
  const { categoryName, spent, planned, currency, threshold, velocityContext } = input;

  if (!threshold && !velocityContext) return null;

  let title: string;
  let body: string;

  if (threshold && velocityContext) {
    // Combined
    title = threshold === 100 ? 'Budget alert' : 'Budget heads-up';
    const pct = spentPercentage(spent, planned);
    body = `You've used ${pct}% of your ${categoryName} budget (${spent} / ${planned} ${currency}). Your daily spending has also increased — averaging ${velocityContext.recentAvg}/day vs ${velocityContext.earlierAvg}/day earlier.`;
  } else if (threshold) {
    title = threshold === 100 ? 'Budget alert' : 'Budget heads-up';
    if (threshold === 100) {
      body = `You've hit your ${categoryName} budget limit. ${spent} / ${planned} ${currency}.`;
    } else {
      body = `You've used 80% of your ${categoryName} budget. ${spent} / ${planned} ${currency}.`;
    }
  } else {
    title = 'Spending spike';
    const pct = spentPercentage(spent, planned);
    body = `Your spending in ${categoryName} has picked up. You were averaging ${velocityContext!.earlierAvg}/day, now ${velocityContext!.recentAvg}/day over the last 7 days. (${pct}% used)`;
  }

  return { type: 'category_warning', title, body };
}

// --- Helpers ---

export function sumAmounts(entries: SpendingEntry[]): number {
  return entries.reduce((sum, e) => sum + e.amount, 0);
}

export function countUniqueDays(entries: SpendingEntry[]): number {
  return new Set(entries.map((e) => e.date)).size;
}
