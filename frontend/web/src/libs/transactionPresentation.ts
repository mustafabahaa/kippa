import { Account, CurrencyCode, FinanceTransaction, LedgerLine } from '@kippa/domain';
import { getTransactionLines, getTransferLines } from './financeCalculations';

export function getTransactionPresentation(transaction: FinanceTransaction, ledgerLines: LedgerLine[], accounts: Account[], baseCurrency: CurrencyCode) {
  const lines = getTransactionLines(transaction.id, ledgerLines);
  const primaryLine = lines.find((line) => line.signedAmount !== 0) ?? lines[0];
  const amount = primaryLine ? Number(Math.abs(primaryLine.signedAmount).toFixed(2)) : 0;
  const currency = primaryLine?.currency ?? baseCurrency;
  const isIncome = transaction.type === 'income' || (transaction.type === 'adjustment' && (primaryLine?.signedAmount ?? 0) >= 0);
  const account = accounts.find((item) => item.id === primaryLine?.accountId);
  const transfer = getTransferLines(lines);
  const isCrossCurrencyTransfer = !!transfer.source && !!transfer.destination && transfer.source.currency !== transfer.destination.currency;

  let details = account?.name ?? 'Account';
  if (transaction.type === 'transfer') {
    const sourceAccount = accounts.find((item) => item.id === transfer.source?.accountId);
    const destinationAccount = accounts.find((item) => item.id === transfer.destination?.accountId);
    details = isCrossCurrencyTransfer
      ? `${Math.abs(transfer.source!.signedAmount)} ${transfer.source!.currency} (${sourceAccount?.name ?? 'Wallet'}) ➔ ${Math.abs(transfer.destination!.signedAmount)} ${transfer.destination!.currency} (${destinationAccount?.name ?? 'Bank'})`
      : `${sourceAccount?.name ?? 'Wallet'} ➔ ${destinationAccount?.name ?? 'Bank'}`;
  }

  return { amount, currency, details, isCrossCurrencyTransfer, isIncome, isCreditCard: transaction.type === 'expense' && account?.type === 'credit' };
}
