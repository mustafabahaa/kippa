import { z } from 'zod';
import { ledgerLib } from '@/libs/ledger';
import { calculateAccountBalance } from '@/libs/financeCalculations';
import { loansLib } from '@/libs/loans';
import { getLoanProgress } from '@/libs/loanCalculations';
import { defineAiTool } from '../toolRegistry';
import { id } from './shared';

export const getLoanProgressTool = defineAiTool({
  description: 'Get accurate paid, remaining, next due, payoff, and account-readiness information for one loan.',
  inputSchema: z.object({ loanId: id }).strict(),
  risk: 'read',
  async execute({ loanId }, context) {
    const { householdId } = context;
    const [loans, accounts] = await Promise.all([loansLib.getLoans(householdId), ledgerLib.getAccounts(householdId)]);
    const loan = loans.find((item) => item.id === loanId);
    if (!loan) throw new Error('Loan not found.');
    const [paymentHistory, accountHistory] = await Promise.all([
      ledgerLib.getLoanPaymentHistory(householdId, [loan.id]),
      ledgerLib.getAccountHistory(householdId, accounts.filter((account) => account.id === loan.paymentAccountId)),
    ]);
    const progress = getLoanProgress(loan, paymentHistory.transactions, paymentHistory.lines);
    const accountBalance = calculateAccountBalance(loan.paymentAccountId, accountHistory.transactions, accountHistory.lines);
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
