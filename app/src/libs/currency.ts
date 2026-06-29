/**
 * currency.ts
 * Fetches live exchange rates from the Frankfurter API (free, no API key needed).
 */

const CACHE_KEY = 'finance_usd_egp_rate';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const currencyLib = {
  /**
   * Get the live USD → EGP rate.
   * Falls back to a cached value or a safe default if the API is unreachable.
   */
  async getUsdToEgpRate(): Promise<number> {
    // Try in-memory cache first
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rate, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL_MS) {
        return rate;
      }
    }

    try {
      // ExchangeRate.host is free and supports EGP
      const response = await fetch(
        'https://api.frankfurter.app/latest?from=USD&to=EGP',
        { signal: AbortSignal.timeout(5000) }
      );
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      const rate: number = data?.rates?.EGP;
      if (!rate) throw new Error('EGP rate missing');

      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }));
      return rate;
    } catch {
      // Fallback: try exchangerate-api.com
      try {
        const response = await fetch(
          'https://open.er-api.com/v6/latest/USD',
          { signal: AbortSignal.timeout(5000) }
        );
        if (!response.ok) throw new Error('Fallback API error');
        const data = await response.json();
        const rate: number = data?.rates?.EGP;
        if (!rate) throw new Error('EGP rate missing');

        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }));
        return rate;
      } catch {
        // Return last cached value or safe default
        if (cached) {
          return JSON.parse(cached).rate;
        }
        return 50.0; // last resort fallback
      }
    }
  }
};
