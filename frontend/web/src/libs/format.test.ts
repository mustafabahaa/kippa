import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format';

describe('formatCurrency', () => {
  it('prefixes the currency code', () => {
    expect(formatCurrency(1234, 'EGP')).toBe('EGP 1,234');
  });

  it('respects maxDigits', () => {
    expect(formatCurrency(1234.567, 'USD', 2)).toBe('USD 1,234.57');
  });

  it('handles zero', () => {
    expect(formatCurrency(0, 'SAR')).toBe('SAR 0');
  });

  it('handles negative amounts', () => {
    expect(formatCurrency(-500, 'EUR')).toBe('EUR -500');
  });
});
