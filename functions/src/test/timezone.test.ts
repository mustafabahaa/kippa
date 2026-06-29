import { describe, it, expect } from 'vitest';
import { shouldRemindNow, todayInTz } from '../timezone.js';

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

describe('shouldRemindNow', () => {
  it('returns true when local HH:MM matches reminder time', () => {
    // 2026-06-29T19:00:00Z = 22:00 in Africa/Cairo (UTC+3 summer DST)
    const now = new Date('2026-06-29T19:00:00Z');
    expect(shouldRemindNow(now, '22:00', 'Africa/Cairo')).toBe(true);
  });

  it('returns false when local time does not match', () => {
    const now = new Date('2026-06-29T19:00:00Z'); // 22:00 Cairo
    expect(shouldRemindNow(now, '21:00', 'Africa/Cairo')).toBe(false);
  });

  it('handles timezone where local date differs from UTC date', () => {
    // 2026-06-29T21:00:00Z = 2026-06-30T00:00 in Cairo (UTC+3) — reminder at 00:00
    const now = new Date('2026-06-29T21:00:00Z');
    expect(shouldRemindNow(now, '00:00', 'Africa/Cairo')).toBe(true);
  });

  it('returns false for invalid timezone (falls back gracefully)', () => {
    const now = new Date('2026-06-29T19:00:00Z');
    expect(shouldRemindNow(now, '22:00', 'Invalid/Zone')).toBe(false);
  });
});
