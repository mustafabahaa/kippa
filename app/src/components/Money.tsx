import type { JSX } from 'react';
import type { CurrencyCode } from '@/domain/financeTypes';
import { useFormattedMoney } from '@/hooks/useFormattedMoney';

/**
 * Renders a formatted monetary value, masked when privacy mode is ON.
 * Drops cleanly into existing `<Typography>` children as a `<span>`.
 */
export function Money({
  amount,
  code,
  maxDigits,
}: {
  amount: number;
  code: CurrencyCode;
  maxDigits?: number;
}): JSX.Element {
  const format = useFormattedMoney();
  return <span>{format(amount, code, maxDigits)}</span>;
}
