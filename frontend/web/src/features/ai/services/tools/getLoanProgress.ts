import { z } from 'zod';
import type { LedgerLine } from '@kippa/domain';
import { ledgerLib } from '@/libs/ledger';
import { calculateAccountBalances } from '@/libs/financeCalculations';
import { loansLib } from '@/libs/loans';
import { getLoanProgress } from '@/libs/loanCalculations';
import { defineAiTool } from '../toolRegistry';
import { id } from './shared';

export const getLoanProgressTool = defineAiTool({
  description: 'Get accurate paid, remaining, next due, payoff, and account-readiness information for one loan.',
  inputSchema: z.object({ loanId: id }).strict(),
  risk: 'read',
  async execute({ loanId }, context) {
    const [loans, transactions, lines, accounts] = await Promise.all([
      loansLib.getLoans(context.householdId),
      ledgerLib.getTransactions(context.householdId),
      ledgerLib.getLedgerLines(context.householdId) as Promise<LedgerLine[]>,
      ledgerLib.getAccounts(context.householdId),
    ]);
    const loan = loans.find((item) => item.id === loanId);
    if (!loan) throw new Error('Loan not found.');
    const progress = getLoanProgress(loan, transactions, lines);
    const balances = calculateAccountBalances(accounts, transactions, lines);
    const accountBalance = balances[loan.paymentAccountId] ?? 0;
    return {
      loan,
      ...progress,
      payments: progress.payments.map((payment) => ({
        transactionId: payment.transaction.id,
        date: payment.transaction.date,
        installmentNumber: payment.transaction.loanInstallmentNumber,
        amount: payment.amount,
      })),
      accountBalance,
      accountShortfall: Math.max(0, loan.installmentAmount - accountBalance),
    };
  },
});
