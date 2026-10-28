import { z } from 'zod';
import type { LedgerLine } from '@kippa/domain';
import { ledgerLib } from '@/libs/ledger';
import { loansLib } from '@/libs/loans';
import { getLoanProgress } from '@/libs/loanCalculations';
import { defineAiTool } from '../toolRegistry';
import { id, money } from './shared';

export const simulateLoanExtraPaymentTool = defineAiTool({
  description:
    'Simulate how a one-time extra payment changes a fixed loan payoff. This is informational and does not write data.',
  inputSchema: z.object({ loanId: id, extraAmount: money }).strict(),
  risk: 'read',
  async execute({ loanId, extraAmount }, context) {
    const [loans, transactions, lines] = await Promise.all([
      loansLib.getLoans(context.householdId),
      ledgerLib.getTransactions(context.householdId),
      ledgerLib.getLedgerLines(context.householdId) as Promise<LedgerLine[]>,
    ]);
    const loan = loans.find((item) => item.id === loanId);
    if (!loan) throw new Error('Loan not found.');
    const progress = getLoanProgress(loan, transactions, lines);
    const newRemaining = Math.max(0, progress.remainingAmount - extraAmount);
    const installmentsSaved = Math.max(
      0,
      progress.remainingInstallments - Math.ceil(newRemaining / loan.installmentAmount),
    );
    return {
      currentRemaining: progress.remainingAmount,
      extraAmount: Math.min(extraAmount, progress.remainingAmount),
      newRemaining,
      installmentsSaved,
      estimatedRemainingInstallments: Math.ceil(newRemaining / loan.installmentAmount),
      note: 'This assumes the lender applies extra money directly to the remaining fixed contract amount; confirm early-payment rules with the lender.',
    };
  },
});
