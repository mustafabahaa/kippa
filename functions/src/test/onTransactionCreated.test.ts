import { describe, it, expect } from 'vitest';
import { getAmountString, formatTransactionNotificationBody } from '../onTransactionCreated.js';

describe('getAmountString', () => {
  it('formats expense correctly', () => {
    const lines = [
      { signedAmount: -150, currency: 'EGP' }
    ];
    expect(getAmountString('expense', lines)).toBe('150 EGP');
  });

  it('formats income correctly', () => {
    const lines = [
      { signedAmount: 5000, currency: 'EGP' }
    ];
    expect(getAmountString('income', lines)).toBe('5000 EGP');
  });

  it('formats transfer correctly', () => {
    const lines = [
      { signedAmount: -1000, currency: 'USD' },
      { signedAmount: 1000, currency: 'USD' }
    ];
    expect(getAmountString('transfer', lines)).toBe('1000 USD');
  });

  it('formats cross-currency transfer with both amounts', () => {
    const lines = [
      { signedAmount: -100, currency: 'USD' },
      { signedAmount: 3100, currency: 'EGP' }
    ];
    expect(getAmountString('transfer', lines)).toBe('100 USD to 3100 EGP');
  });
});

describe('formatTransactionNotificationBody', () => {
  it('formats notification without category or description', () => {
    const txn = { type: 'expense' as const };
    const body = formatTransactionNotificationBody('Mustafa Baha', txn, '150 EGP', '');
    expect(body).toBe('Mustafa Baha added expense: 150 EGP');
  });

  it('formats notification with category', () => {
    const txn = { type: 'expense' as const };
    const body = formatTransactionNotificationBody('Mustafa Baha', txn, '150 EGP', 'Food');
    expect(body).toBe('Mustafa Baha added expense: 150 EGP in Food');
  });

  it('formats notification with description and category', () => {
    const txn = { type: 'expense' as const, description: 'McDonalds dinner' };
    const body = formatTransactionNotificationBody('Mustafa Baha', txn, '150 EGP', 'Food');
    expect(body).toBe('Mustafa Baha added expense: 150 EGP in Food (McDonalds dinner)');
  });
});
