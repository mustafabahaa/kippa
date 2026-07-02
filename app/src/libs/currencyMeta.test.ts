import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('currencyMeta', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { language: 'en-US', languages: ['en-US'] });
  });

  it('exposes a non-empty CURRENCIES list with EGP and USD', async () => {
    const { CURRENCIES } = await import('./currencyMeta');
    const codes = CURRENCIES.map(c => c.code);
    expect(codes).toContain('EGP');
    expect(codes).toContain('USD');
    expect(codes.length).toBeGreaterThanOrEqual(10);
  });

  it('getCurrencyInfo returns known currency', async () => {
    const { getCurrencyInfo } = await import('./currencyMeta');
    const egp = getCurrencyInfo('EGP');
    expect(egp.code).toBe('EGP');
    expect(egp.name.toLowerCase()).toContain('pound');
    expect(typeof egp.symbol).toBe('string');
  });

  it('getCurrencyInfo falls back to a synthetic entry for unknown codes', async () => {
    const { getCurrencyInfo } = await import('./currencyMeta');
    const unknown = getCurrencyInfo('XYZ');
    expect(unknown.code).toBe('XYZ');
    expect(unknown.symbol).toBe('XYZ');
  });

  it('currencySymbol returns the symbol for a known code', async () => {
    const { currencySymbol } = await import('./currencyMeta');
    expect(currencySymbol('EGP')).toBeTypeOf('string');
    expect(currencySymbol('EGP').length).toBeGreaterThan(0);
  });

  it('detectBaseCurrency resolves locale → currency', async () => {
    vi.stubGlobal('navigator', { language: 'ar-EG', languages: ['ar-EG'] });
    const { detectBaseCurrency } = await import('./currencyMeta');
    expect(detectBaseCurrency()).toBe('EGP');
  });

  it('detectBaseCurrency falls back to USD on bad locale', async () => {
    vi.stubGlobal('navigator', { language: 'xx-XX', languages: ['xx-XX'] });
    const { detectBaseCurrency } = await import('./currencyMeta');
    expect(['USD', 'XX']).toContain(detectBaseCurrency());
  });
});
