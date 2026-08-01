import type { FinanceTransaction, LedgerLine } from '@kippa/domain';

export function getAmountString(
  type: FinanceTransaction['type'],
  lines: Pick<LedgerLine, 'signedAmount' | 'currency'>[],
): string {
  if (type === 'transfer') {
    const debitLine = lines.find((line) => line.signedAmount < 0);
    const creditLine = lines.find((line) => line.signedAmount > 0);
    if (debitLine && creditLine && debitLine.currency !== creditLine.currency) {
      return `${Math.abs(debitLine.signedAmount)} ${debitLine.currency} to ${creditLine.signedAmount} ${creditLine.currency}`;
    }
    if (debitLine) return `${Math.abs(debitLine.signedAmount)} ${debitLine.currency}`;
    if (creditLine) return `${creditLine.signedAmount} ${creditLine.currency}`;
  } else {
    const line = lines[0];
    if (line) return `${Math.abs(line.signedAmount)} ${line.currency}`;
  }
  return '';
}

export function formatTransactionNotificationBody(
  authorName: string,
  transaction: Pick<FinanceTransaction, 'type' | 'description'>,
  amount: string,
  categoryName: string,
): string {
  let body = `${authorName} added ${transaction.type}`;
  if (amount) body += `: ${amount}`;
  if (categoryName) body += ` in ${categoryName}`;
  if (transaction.description) body += ` (${transaction.description})`;
  return body;
}
