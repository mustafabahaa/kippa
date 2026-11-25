import type { Account, FinanceTransaction, LedgerLine } from '@kippa/domain';
import { calculateCardActivity } from './cardActivity.js';
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

export function accountsNeedingLegacyFeeHistory(
  accounts: Account[],
  transactions: FinanceTransaction[],
  lines: LedgerLine[],
): Account[] {
  const purchases = new Set(transactions.filter((transaction) =>
    transaction.type === 'expense' && transaction.status === 'posted' &&
    !transaction.loanId && !transaction.description?.startsWith('Card fee ('),
  ).map((transaction) => transaction.id));
  const accountIds = new Set(lines.filter((line) =>
    line.currency === 'EGP' && line.signedAmount < 0 && !line.cardFee && purchases.has(line.transactionId),
  ).map((line) => line.accountId));
  return accounts.filter((account) =>
    account.type === 'credit' && account.currency === 'EGP' && accountIds.has(account.id),
  );
}

/** Upgrade the read view of legacy unpaid purchases without rewriting paid history. */
export function includeUnrecordedCardFees(
  accounts: Account[],
  transactions: FinanceTransaction[],
  lines: LedgerLine[],
): LedgerLine[] {
  const byId = new Map(transactions.map((transaction) => [transaction.id, transaction]));
  const unpaid = new Set<string>();
  accounts
    .filter((account) => account.type === 'credit' && account.currency === 'EGP')
    .forEach((account) => {
      calculateCardActivity(account.id, transactions, lines, [])
        .charges.filter((charge) => !charge.paid && charge.txType === 'expense')
        .forEach((charge) => unpaid.add(charge.lineId));
    });
  const byAccount = new Map(accounts.map((account) => [account.id, account]));
  return lines.map((line) => {
    const transaction = byId.get(line.transactionId);
    if (
      !transaction ||
      transaction.status !== 'posted' ||
      !unpaid.has(line.id) ||
      transaction.loanId ||
      transaction.description?.startsWith('Card fee (')
    )
      return line;
    return withDefaultCardFee(line, byAccount.get(line.accountId), transaction.type);
  });
}
