import type { Account, FinanceTransaction, LedgerLine } from '@kippa/domain';
import { withDefaultCardFee } from '../../domain/transactions/creditCardFees.js';
import type { LedgerHistory } from './projection.js';

export function requiresCardFeeDecision(transaction: FinanceTransaction | undefined, line: LedgerLine) {
  return transaction?.type === 'expense' && !transaction.loanId && !transaction.description?.startsWith('Card fee (') &&
    line.currency === 'EGP' && line.signedAmount < 0 && !line.cardFee;
}

export function recordCardFeesForWrite(before: LedgerHistory, after: LedgerHistory, accounts: Map<string, Account>) {
  const changes = new Map<string, LedgerLine>();
  for (const [id, line] of after.lines) {
    const transaction = after.transactions.get(line.transactionId);
    const account = accounts.get(line.accountId);
    if (!requiresCardFeeDecision(transaction, line) || account?.type !== 'credit' || account.currency !== 'EGP') continue;
    const previous = before.lines.get(id);
    const recorded = previous?.accountId === line.accountId ? previous.cardFee : undefined;
    if (recorded) {
      changes.set(id, {
        ...line,
        cardFee: {
          rate: recorded.rate,
          baseAmount: Number((Math.abs(line.signedAmount) / (1 + recorded.rate / 100)).toFixed(2)),
        },
      });
      continue;
    }
    if (transaction?.status !== 'posted') continue;
    const rated = withDefaultCardFee(line, account, 'expense');
    changes.set(id, rated.cardFee ? rated : { ...line, cardFee: { baseAmount: Math.abs(line.signedAmount), rate: 0 } });
  }
  return changes;
}
