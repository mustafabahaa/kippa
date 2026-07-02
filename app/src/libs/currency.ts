/**
 * currency.ts
 * Fetches live exchange rates for any currency pair from the Frankfurter API
 * (free, no API key needed), with open.er-api.com as a fallback.
 *
 * All functions return a rate such that:  amountInForeign * rate = amountInBase.
 */
import type { CurrencyCode } from '@/domain/financeTypes';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const TIMEOUT_MS = 5000;

const cacheKey = (from: string, to: string) => `finance_rate_${from}_${to}`;

const readCache = (from: string, to: string): number | null => {
  try {
    const raw = sessionStorage.getItem(cacheKey(from, to));
    if (!raw) return null;
    const { rate, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < CACHE_TTL_MS) return rate;
  } catch {
    // ignore corrupt cache
  }
  return null;
};

const writeCache = (from: string, to: string, rate: number) => {
  try {
    sessionStorage.setItem(cacheKey(from, to), JSON.stringify({ rate, timestamp: Date.now() }));
  } catch {
    // ignore quota errors
  }
};

const fetchFrankfurter = async (from: string, to: string): Promise<number | null> => {
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
      { signal: AbortSignal.timeout(TIMEOUT_MS) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.[to];
    return typeof rate === 'number' ? rate : null;
  } catch {
    return null;
  }
};

const fetchErApi = async (from: string, to: string): Promise<number | null> => {
  try {
    const res = await fetch(
      `https://open.er-api.com/v6/latest/${from}`,
      { signal: AbortSignal.timeout(TIMEOUT_MS) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.[to];
    return typeof rate === 'number' ? rate : null;
  } catch {
    return null;
  }
};

export const currencyLib = {
  /**
   * Get the live rate for `from → to` such that `amountInFrom * rate = amountInTo`.
   * Falls back to the cached value, or 1 if everything fails.
   */
  async getRate(from: CurrencyCode, to: CurrencyCode): Promise<number> {
    if (from === to) return 1;

    const cached = readCache(from, to);
    if (cached !== null) return cached;

    const rate = (await fetchFrankfurter(from, to)) ?? (await fetchErApi(from, to));
    if (rate !== null) {
      writeCache(from, to, rate);
      return rate;
    }

    // Last resort: stale cache, or treat as same currency.
    const stale = readCache(from, to);
    if (stale !== null) return stale;
    console.warn(`[currency] failed to fetch ${from}→${to}, assuming rate 1`);
    return 1;
  },

  /**
   * Bulk-fetch rates for a set of foreign currencies into `base`.
   * Returns { [foreignCode]: rate }. The base currency itself is omitted.
   */
  async getRatesToBase(
    base: CurrencyCode,
    foreignCodes: CurrencyCode[]
  ): Promise<Record<string, number>> {
    const distinct = Array.from(new Set(foreignCodes.filter(c => c !== base)));
    const entries = await Promise.all(
      distinct.map(async c => [c, await this.getRate(c, base)] as const)
    );
    return Object.fromEntries(entries);
  },
};
