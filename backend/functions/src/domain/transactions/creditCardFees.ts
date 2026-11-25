import type { Account, FinanceTransaction, LedgerLine } from '@kippa/domain';
import { calculateCardPayment } from './cardPayment.js';

export const DEFAULT_CARD_FEE_RATE = 3;

export function withDefaultCardFee<
  Line extends Pick<LedgerLine, 'accountId' | 'signedAmount' | 'currency' | 'cardFee'>,
>(line: Line, account: Account | undefined, type: FinanceTransaction['type']): Line {
  if (
    line.cardFee ||
    type !== 'expense' ||
    line.signedAmount >= 0 ||
    account?.type !== 'credit' ||
    account.currency !== 'EGP' ||
    line.currency !== 'EGP'
  )
    return line;
  const payment = calculateCardPayment(Math.abs(line.signedAmount), DEFAULT_CARD_FEE_RATE);
  if (!payment.valid) return line;
  return {
    ...line,
    signedAmount: -payment.totalAmount,
    cardFee: { baseAmount: payment.baseAmount, rate: DEFAULT_CARD_FEE_RATE },
  };
}
