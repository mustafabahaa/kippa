import { describe, expect, it } from 'vitest';
import type { Category, PendingFinancialMessage } from '@kippa/domain';
import {
  dedupeMerchantKeywords,
  normalizeMerchantText,
  suggestCategoryId,
  suggestCategoryIds,
} from './merchantSuggestions';

const category = (overrides: Partial<Category>): Category => ({
  id: 'cat',
  householdId: 'hh',
  name: 'cat',
  type: 'expense',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const item = (overrides: Partial<PendingFinancialMessage>): PendingFinancialMessage => ({
  id: 'p1',
  householdId: 'hh',
  receivedBy: 'u1',
  kind: 'expense',
  source: 'ios-shortcut',
  provider: 'hsbc',
  amount: 100,
  currency: 'EGP',
  date: '2026-10-08',
  description: '',
  messagePreview: '',
  createdAt: '2026-10-08T00:00:00.000Z',
  status: 'pending',
  ...overrides,
});

describe('normalizeMerchantText', () => {
  it('collapses case, symbols and spacing', () => {
    expect(normalizeMerchantText('SEOUDI-DREAM')).toBe('SEOUDI DREAM');
    expect(normalizeMerchantText('fawry*mobil fardous')).toBe('FAWRY MOBIL FARDOUS');
    expect(normalizeMerchantText('  APPLE.COM/bill  ')).toBe('APPLE COM BILL');
  });
});

describe('dedupeMerchantKeywords', () => {
  it('drops empty and duplicate-after-normalization entries', () => {
    expect(dedupeMerchantKeywords(['Seoudi', 'SEOUDI ', '', '  ', 'Picnic Market'])).toEqual([
      'Seoudi',
      'Picnic Market',
    ]);
  });
});

describe('suggestCategoryId', () => {
  const groceries = category({ id: 'masrof-bet', name: 'super market', merchantKeywords: ['Seoudi', 'Picnic Market'] });
  const dining = category({ id: '5rogoat', name: '5rogoat', merchantKeywords: ['BEANOS', 'Dunkin'] });
  const incomeCat = category({ id: 'salary', name: 'Salary', type: 'income', merchantKeywords: ['Payroll'] });

  it('matches merchant text from the counterparty across symbols and case', () => {
    expect(suggestCategoryId(item({ counterparty: 'SEOUDI MARKET DREAM' }), [groceries, dining])).toBe('masrof-bet');
    expect(suggestCategoryId(item({ counterparty: 'fawrypf*beanos' }), [groceries, dining])).toBe('5rogoat');
  });

  it('falls back to the description when there is no counterparty', () => {
    expect(suggestCategoryId(item({ counterparty: null, description: 'Seoudi-Dream' }), [groceries, dining])).toBe('masrof-bet');
  });

  it('prefers the longest (most specific) matching keyword', () => {
    const generic = category({ id: 'other', name: 'Other', merchantKeywords: ['MARKET'] });
    expect(suggestCategoryId(item({ counterparty: 'SEOUDI MARKET DREAM' }), [groceries, generic])).toBe('masrof-bet');
  });

  it('ignores inactive categories and mismatched types', () => {
    const inactive = category({ id: 'x', isActive: false, merchantKeywords: ['BEANOS'] });
    expect(suggestCategoryId(item({ counterparty: 'BEANOS MOE' }), [inactive])).toBeNull();
    expect(suggestCategoryId(item({ kind: 'income', counterparty: 'Payroll' }), [groceries])).toBeNull();
    expect(suggestCategoryId(item({ kind: 'income', counterparty: 'Payroll' }), [incomeCat])).toBe('salary');
  });

  it('never suggests for transfers or loan payments', () => {
    expect(suggestCategoryId(item({ kind: 'transfer', counterparty: 'Seoudi' }), [groceries])).toBeNull();
    expect(suggestCategoryId(item({ suggestedLoanId: 'loan-1', counterparty: 'Seoudi' }), [groceries])).toBeNull();
  });

  it('returns null for unknown merchants', () => {
    expect(suggestCategoryId(item({ counterparty: 'SOME UNKNOWN SHOP' }), [groceries, dining])).toBeNull();
  });

  it('returns every matching category, most specific keyword first', () => {
    const fuel = category({ id: 'sgayer', name: 'sgayer', merchantKeywords: ['MOBIL FARDOUS'] });
    const petrol = category({ id: 'bnzen', name: 'bnzen', merchantKeywords: ['MOBIL FARDOUS'] });
    const generic = category({ id: 'other', name: 'Other', merchantKeywords: ['FARDOUS'] });
    expect(suggestCategoryIds(item({ counterparty: 'FAWRY*MOBIL FARDOUS' }), [petrol, fuel, generic]))
      .toEqual(['bnzen', 'sgayer', 'other']);
    expect(suggestCategoryId(item({ counterparty: 'FAWRY*MOBIL FARDOUS' }), [petrol, fuel, generic])).toBe('bnzen');
  });
});
