import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = (rates: Record<string, number>) =>
  vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ rates }),
  } as Response);

describe('currencyLib', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('getRate returns the rate from Frankfurter', async () => {
    const { currencyLib } = await import('./currency');
    vi.stubGlobal('fetch', mockFetch({ SAR: 3.75 }));
    const rate = await currencyLib.getRate('USD', 'SAR');
    expect(rate).toBe(3.75);
  });

  it('getRate uses sessionStorage cache on second call', async () => {
    const { currencyLib } = await import('./currency');
    const fetchMock = mockFetch({ AED: 3.67 });
    vi.stubGlobal('fetch', fetchMock);
    await currencyLib.getRate('USD', 'AED');
    await currencyLib.getRate('USD', 'AED');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('getRate falls back to open.er-api.com when Frankfurter fails', async () => {
    const { currencyLib } = await import('./currency');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false } as Response).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rates: { EGP: 48 } }),
    } as Response));
    const rate = await currencyLib.getRate('USD', 'EGP');
    expect(rate).toBe(48);
  });

  it('getRatesToBase returns a map of foreign → base rates', async () => {
    const { currencyLib } = await import('./currency');
    // getRate(foreign, base) reads data.rates[base], so the mock returns USD rate per call.
    // SAR→USD = 0.267, EUR→USD = 1.087
    const callCount: Record<string, number> = { USD: 0 };
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      callCount.USD += 1;
      // Both SAR→USD and EUR→USD read data.rates.USD; return distinct values per call.
      const rate = callCount.USD === 1 ? 0.267 : 1.087;
      return Promise.resolve({ ok: true, json: async () => ({ rates: { USD: rate } }) });
    }));
    const rates = await currencyLib.getRatesToBase('USD', ['SAR', 'EUR']);
    expect(rates.SAR).toBe(0.267);
    expect(rates.EUR).toBe(1.087);
  });

  it('getRatesToBase omits the base currency itself', async () => {
    const { currencyLib } = await import('./currency');
    vi.stubGlobal('fetch', mockFetch({ USD: 0.267 }));
    const rates = await currencyLib.getRatesToBase('USD', ['USD', 'SAR']);
    expect(rates.SAR).toBe(0.267);
    expect(rates.USD).toBeUndefined();
  });
});
