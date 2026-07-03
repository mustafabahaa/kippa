import { usePrivacyMode } from '@/hooks/usePrivacyMode';

const DOT = '••••';
const NUMBER_MASK = DOT;

/**
 * Hook returning helpers that mask arbitrary sensitive values when privacy
 * mode is ON. Companion to `useFormattedMoney` (which handles currency).
 *
 * - `maskNumber(value)`     → `••••` when ON, else the number as a string.
 * - `maskText(value)`       → `••••` when ON, else the original string.
 * - `maskDigits(value)`     → replaces every digit [0-9] with `•` when ON,
 *                             preserving non-digit chars (signs, separators,
 *                             currency codes, spaces). Useful for prose where
 *                             you want to keep structure but hide numerics.
 * - `privacyMode`           → the raw boolean for conditional rendering.
 */
export function usePrivacyMask() {
  const { privacyMode } = usePrivacyMode();

  const maskNumber = (value: number | string) =>
    privacyMode ? NUMBER_MASK : String(value);

  const maskText = (value: string) =>
    privacyMode ? DOT : value;

  const maskDigits = (value: string) =>
    privacyMode ? value.replace(/[0-9]/g, '•') : value;

  return { privacyMode, maskNumber, maskText, maskDigits };
}
