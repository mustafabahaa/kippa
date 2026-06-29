import { describe, it, expect } from 'vitest';
import { shouldWarnCategory, WARNING_THRESHOLD, spentPercentage } from '../warnings.js';

describe('WARNING_THRESHOLD', () => {
  it('is 0.8 (80%)', () => {
    expect(WARNING_THRESHOLD).toBe(0.8);
  });
});

describe('shouldWarnCategory', () => {
  it('returns true when spend crosses 80% of planned', () => {
    expect(shouldWarnCategory(800, 1000)).toBe(true);
  });

  it('returns true when spend is exactly 80%', () => {
    expect(shouldWarnCategory(80, 100)).toBe(true);
  });

  it('returns false when spend is below 80%', () => {
    expect(shouldWarnCategory(799, 1000)).toBe(false);
  });

  it('returns true when spend exceeds planned (over budget)', () => {
    expect(shouldWarnCategory(1200, 1000)).toBe(true);
  });

  it('returns false when planned is zero (no budget set)', () => {
    expect(shouldWarnCategory(500, 0)).toBe(false);
  });

  it('returns false when planned is negative', () => {
    expect(shouldWarnCategory(100, -50)).toBe(false);
  });
});

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
