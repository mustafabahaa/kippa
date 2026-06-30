import { Card, CardStatement, FinanceTransaction, LedgerLine } from '@/domain/financeTypes';

export interface CardSummary {
  currentDebt: number;
  availableCredit: number | null;
  utilization: number | null;
  lastStatement: CardStatement | null;
  lastStatementBalance: number | null;
  nextDueDate: string | null;
  currentCyclePurchases: number;
}

/**
 * Sum of expenses posted to the credit account since the last statement date.
 * Statement-anchored: if no statement, sums all (spec §5.1, §9.5).
 * Pure function.
 */
export function currentCyclePurchases(
  lines: LedgerLine[],
  transactions: FinanceTransaction[],
  creditAccountId: string,
  lastStatement: CardStatement | null
): number {
  const postedTxIds = new Set(transactions.filter(t => t.status === 'posted').map(t => t.id));
  const cutoff = lastStatement?.statementDate ?? '';
  let total = 0;
  for (const line of lines) {
    if (line.accountId !== creditAccountId) continue;
    if (!postedTxIds.has(line.transactionId)) continue;
    if (line.signedAmount >= 0) continue; // only outflows (purchases)
    const tx = transactions.find(t => t.id === line.transactionId);
    if (!tx) continue;
    if (cutoff && tx.date <= cutoff) continue;
    total += Math.abs(line.signedAmount);
  }
  return total;
}

export function computeCardSummary(
  card: Card,
  creditAccountBalance: number, // ledger balance of the credit account (negative = debt)
  lastStatement: CardStatement | null,
  _allStatements: CardStatement[]
): CardSummary {
  const currentDebt = Math.max(0, -creditAccountBalance);
  const hasLimit = card.creditLimit != null;
  return {
    currentDebt,
    availableCredit: hasLimit ? (card.creditLimit! - currentDebt) : null,
    utilization: hasLimit && card.creditLimit! > 0 ? currentDebt / card.creditLimit! : null,
    lastStatement,
    lastStatementBalance: lastStatement?.statementBalance ?? null,
    nextDueDate: lastStatement?.dueDate ?? null,
    currentCyclePurchases: 0, // filled by caller using currentCyclePurchases(); kept 0 here to stay pure of lines.
  };
}
