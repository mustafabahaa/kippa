import { describe, it, expect } from 'vitest';
import { todayInTz } from '../timezone.js';

describe('todayInTz', () => {
  it('returns YYYY-MM-DD for a given UTC instant in the given timezone', () => {
    // 2026-06-29T22:00:00Z is 2026-06-30T01:00 in Africa/Cairo (UTC+3 in summer DST)
    const now = new Date('2026-06-29T22:00:00Z');
    expect(todayInTz(now, 'Africa/Cairo')).toBe('2026-06-30');
  });

  it('handles UTC timezone', () => {
    const now = new Date('2026-06-29T03:30:00Z');
    expect(todayInTz(now, 'UTC')).toBe('2026-06-29');
  });
});
