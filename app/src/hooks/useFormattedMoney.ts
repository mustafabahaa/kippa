import type { CurrencyCode } from '@/domain/financeTypes';
import { formatCurrency } from '@/libs/format';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';

/**
 * Returns a currency formatter that respects the global privacy mode.
 * When privacy mode is ON, the numeric portion is masked (`CODE ••••••`);
 * otherwise it delegates to `formatCurrency`. Use this when you need a
 * string (e.g. building labels like `Pay all (...)`).
 */
export function useFormattedMoney() {
  const { privacyMode } = usePrivacyMode();
  return (amount: number, code: CurrencyCode, maxDigits?: number) =>
    privacyMode ? `${code} ••••••` : formatCurrency(amount, code, maxDigits ?? 0);
}
