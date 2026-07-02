import type { CurrencyCode } from '@/domain/financeTypes';

/**
 * Format a monetary amount as `CODE <number>` (e.g. "EGP 1,234").
 * Replaces every former hardcoded `EGP {amount}` prefix in the UI.
 */
export const formatCurrency = (
  amount: number,
  code: CurrencyCode,
  maxDigits = 0
): string =>
  `${code} ${amount.toLocaleString(undefined, { maximumFractionDigits: maxDigits })}`;
