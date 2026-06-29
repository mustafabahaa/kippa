import { describe, it, expect } from 'vitest';
import { buildMessagePayload } from '../sendToMany.js';

describe('buildMessagePayload', () => {
  it('builds a transaction notification payload', () => {
    const payload = buildMessagePayload({
      type: 'transaction',
      title: 'New transaction',
      body: 'Sarah added an expense — Coffee',
      householdId: 'hh1',
    });
    expect(payload).toEqual({
      notification: { title: 'New transaction', body: 'Sarah added an expense — Coffee' },
      data: { type: 'transaction', householdId: 'hh1', deepLink: '/' },
    });
  });

  it('builds a category_warning payload with deepLink to budget', () => {
    const payload = buildMessagePayload({
      type: 'category_warning',
      title: 'Budget warning',
      body: 'Food is at 85% of budget',
      householdId: 'hh1',
      deepLink: '/budget',
    });
    expect(payload.data).toEqual({
      type: 'category_warning',
      householdId: 'hh1',
      deepLink: '/budget',
    });
  });

  it('builds a daily_reminder payload', () => {
    const payload = buildMessagePayload({
      type: 'daily_reminder',
      title: 'Daily reminder',
      body: 'No expenses recorded today.',
      householdId: 'hh1',
    });
    expect(payload.data.type).toBe('daily_reminder');
  });
});
