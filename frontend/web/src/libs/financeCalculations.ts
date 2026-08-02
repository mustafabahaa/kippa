import type { Account, CurrencyCode, FinanceTransaction, LedgerLine } from '@kippa/domain';

export const getPostedTransactions = (transactions: FinanceTransaction[]) => transactions.filter((transaction) => transaction.status === 'posted');

export function getPostedLedgerLines(transactions: FinanceTransaction[], ledgerLines: LedgerLine[]) {
  const postedIds = new Set(getPostedTransactions(transactions).map((transaction) => transaction.id));
  return ledgerLines.filter((line) => postedIds.has(line.transactionId));
}

export function calculateAccountBalances(accounts: Account[], transactions: FinanceTransaction[], ledgerLines: LedgerLine[]) {
  const balances = Object.fromEntries(accounts.map((account) => [account.id, 0])) as Record<string, number>;
  getPostedLedgerLines(transactions, ledgerLines).forEach((line) => {
    if (line.accountId in balances) balances[line.accountId] += line.signedAmount;
  });
  return balances;
}

export function calculateAccountBalance(accountId: string, transactions: FinanceTransaction[], ledgerLines: LedgerLine[]) {
  return getPostedLedgerLines(transactions, ledgerLines).filter((line) => line.accountId === accountId).reduce((total, line) => total + line.signedAmount, 0);
}

export function convertToBaseCurrency(amount: number, currency: CurrencyCode, baseCurrency: CurrencyCode, rates: Partial<Record<CurrencyCode, number>>) {
  return amount * (currency === baseCurrency ? 1 : (rates[currency] ?? 1));
}

export const getTransactionLines = (transactionId: string, ledgerLines: LedgerLine[]) => ledgerLines.filter((line) => line.transactionId === transactionId);

export function getTransferLines(lines: LedgerLine[]) {
  return { source: lines.find((line) => line.signedAmount < 0) ?? null, destination: lines.find((line) => line.signedAmount > 0) ?? null };
}
