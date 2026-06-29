import { describe, it, expect } from 'vitest';
import {
  spentPercentage,
  checkPercentageThresholds,
  checkVelocitySpike,
  isVelocityKeyExpired,
  buildCategoryWarningNotification,
  sumAmounts,
  countUniqueDays,
  type SpendingEntry,
} from '../warnings.js';

// --- Helpers ---

const makeEntries = (entries: { amount: number; day: number }[]): SpendingEntry[] =>
  entries.map((e) => ({ amount: e.amount, date: `2026-06-${String(e.day).padStart(2, '0')}` }));

// --- Percentage ---

describe('spentPercentage', () => {
  it('returns rounded integer percentage', () => {
    expect(spentPercentage(833, 1000)).toBe(83);
  });
  it('returns 0 when planned is 0', () => {
    expect(spentPercentage(500, 0)).toBe(0);
  });
  it('can exceed 100', () => {
    expect(spentPercentage(1500, 1000)).toBe(150);
  });
});

describe('checkPercentageThresholds', () => {
  it('returns 80 when spend is exactly 80%', () => {
    expect(checkPercentageThresholds(800, 1000)).toBe(80);
  });
  it('returns 100 when spend equals planned', () => {
    expect(checkPercentageThresholds(1000, 1000)).toBe(100);
  });
  it('returns 100 when spend exceeds planned', () => {
    expect(checkPercentageThresholds(1200, 1000)).toBe(100);
  });
  it('returns null when spend is below 80%', () => {
    expect(checkPercentageThresholds(799, 1000)).toBe(null);
  });
  it('returns null when planned is zero', () => {
    expect(checkPercentageThresholds(500, 0)).toBe(null);
  });
  it('returns 80 when spend is between 80% and 100%', () => {
    expect(checkPercentageThresholds(900, 1000)).toBe(80);
  });
});

// --- Velocity spike ---

describe('checkVelocitySpike', () => {
  it('returns true when recent 7-day avg is >2x earlier avg', () => {
    const earlier = makeEntries(
      Array.from({ length: 13 }, (_, i) => ({ amount: 100, day: i + 1 })),
    );
    const recent = makeEntries(
      Array.from({ length: 7 }, (_, i) => ({ amount: 300, day: 14 + i })),
    );
    expect(checkVelocitySpike(earlier, recent, 3000)).toBe(true);
  });

  it('returns false when recent avg is <2x earlier avg', () => {
    const earlier = makeEntries(
      Array.from({ length: 13 }, (_, i) => ({ amount: 100, day: i + 1 })),
    );
    const recent = makeEntries(
      Array.from({ length: 7 }, (_, i) => ({ amount: 150, day: 14 + i })),
    );
    expect(checkVelocitySpike(earlier, recent, 3000)).toBe(false);
  });

  it('returns false when earlier avg is zero (no baseline)', () => {
    const earlier: SpendingEntry[] = [];
    const recent = makeEntries(
      Array.from({ length: 7 }, (_, i) => ({ amount: 200, day: 14 + i })),
    );
    expect(checkVelocitySpike(earlier, recent, 3000)).toBe(false);
  });

  it('returns false when recent daily avg is below minimum absolute threshold', () => {
    const earlier = makeEntries(
      Array.from({ length: 13 }, (_, i) => ({ amount: 10, day: i + 1 })),
    );
    const recent = makeEntries(
      Array.from({ length: 7 }, (_, i) => ({ amount: 50, day: 14 + i })),
    );
    // Budget 30,000, planned/30 = 1000/day. Recent avg = 50/day (< threshold).
    expect(checkVelocitySpike(earlier, recent, 30000)).toBe(false);
  });

  it('returns false when not enough recent data (fewer than 2 days)', () => {
    const earlier = makeEntries(
      Array.from({ length: 13 }, (_, i) => ({ amount: 100, day: i + 1 })),
    );
    const recent = makeEntries([{ amount: 500, day: 14 }]);
    expect(checkVelocitySpike(earlier, recent, 3000)).toBe(false);
  });

  it('returns false when not enough earlier data (fewer than 3 days)', () => {
    const earlier = makeEntries([{ amount: 100, day: 1 }, { amount: 100, day: 2 }]);
    const recent = makeEntries(
      Array.from({ length: 7 }, (_, i) => ({ amount: 300, day: 3 + i })),
    );
    expect(checkVelocitySpike(earlier, recent, 3000)).toBe(false);
  });

  it('returns false when recent spending is zero', () => {
    const earlier = makeEntries(
      Array.from({ length: 13 }, (_, i) => ({ amount: 100, day: i + 1 })),
    );
    const recent = makeEntries(
      Array.from({ length: 7 }, (_, i) => ({ amount: 0, day: 14 + i })),
    );
    expect(checkVelocitySpike(earlier, recent, 3000)).toBe(false);
  });

  it('returns false when planned is zero', () => {
    const earlier = makeEntries(
      Array.from({ length: 13 }, (_, i) => ({ amount: 100, day: i + 1 })),
    );
    const recent = makeEntries(
      Array.from({ length: 7 }, (_, i) => ({ amount: 300, day: 14 + i })),
    );
    expect(checkVelocitySpike(earlier, recent, 0)).toBe(false);
  });
});

// --- Velocity dedup ---

describe('isVelocityKeyExpired', () => {
  it('returns true when key date is older than 7 days', () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    const dateStr = eightDaysAgo.toISOString().slice(0, 10);
    expect(isVelocityKeyExpired(dateStr)).toBe(true);
  });

  it('returns false when key date is within 7 days', () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const dateStr = fiveDaysAgo.toISOString().slice(0, 10);
    expect(isVelocityKeyExpired(dateStr)).toBe(false);
  });

  it('returns true when key date is exactly 7 days ago', () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().slice(0, 10);
    expect(isVelocityKeyExpired(dateStr)).toBe(true);
  });

  it('returns true when key is undefined (never fired)', () => {
    expect(isVelocityKeyExpired(undefined)).toBe(true);
  });
});

// --- Notification builder ---

describe('buildCategoryWarningNotification', () => {
  it('builds 80% threshold notification', () => {
    const result = buildCategoryWarningNotification({
      categoryName: 'Food',
      spent: 800,
      planned: 1000,
      currency: 'EGP',
      threshold: 80,
      velocityContext: null,
    });
    expect(result).toEqual({
      type: 'category_warning',
      title: 'Budget heads-up',
      body: "You've used 80% of your Food budget. 800 / 1000 EGP.",
    });
  });

  it('builds 100% threshold notification', () => {
    const result = buildCategoryWarningNotification({
      categoryName: 'Transport',
      spent: 1200,
      planned: 1000,
      currency: 'EGP',
      threshold: 100,
      velocityContext: null,
    });
    expect(result).toEqual({
      type: 'category_warning',
      title: 'Budget alert',
      body: "You've hit your Transport budget limit. 1200 / 1000 EGP.",
    });
  });

  it('builds velocity-only notification', () => {
    const result = buildCategoryWarningNotification({
      categoryName: 'Food',
      spent: 800,
      planned: 3000,
      currency: 'EGP',
      threshold: null,
      velocityContext: { earlierAvg: 100, recentAvg: 400 },
    });
    expect(result).toEqual({
      type: 'category_warning',
      title: 'Spending spike',
      body: 'Your spending in Food has picked up. You were averaging 100/day, now 400/day over the last 7 days. (27% used)',
    });
  });

  it('builds combined notification when both threshold and velocity fire', () => {
    const result = buildCategoryWarningNotification({
      categoryName: 'Food',
      spent: 800,
      planned: 1000,
      currency: 'EGP',
      threshold: 80,
      velocityContext: { earlierAvg: 100, recentAvg: 400 },
    });
    expect(result).toEqual({
      type: 'category_warning',
      title: 'Budget heads-up',
      body: "You've used 80% of your Food budget (800 / 1000 EGP). Your daily spending has also increased — averaging 400/day vs 100/day earlier.",
    });
  });

  it('returns null when neither threshold nor velocity fires', () => {
    const result = buildCategoryWarningNotification({
      categoryName: 'Food',
      spent: 500,
      planned: 3000,
      currency: 'EGP',
      threshold: null,
      velocityContext: null,
    });
    expect(result).toBe(null);
  });
});

// --- Helpers ---

describe('sumAmounts', () => {
  it('sums all entry amounts', () => {
    const entries = makeEntries([{ amount: 100, day: 1 }, { amount: 200, day: 2 }, { amount: 50, day: 3 }]);
    expect(sumAmounts(entries)).toBe(350);
  });
  it('returns 0 for empty array', () => {
    expect(sumAmounts([])).toBe(0);
  });
});

describe('countUniqueDays', () => {
  it('counts unique dates', () => {
    const entries = makeEntries([{ amount: 100, day: 1 }, { amount: 200, day: 1 }, { amount: 50, day: 2 }]);
    expect(countUniqueDays(entries)).toBe(2);
  });
  it('returns 0 for empty array', () => {
    expect(countUniqueDays([])).toBe(0);
  });
});
