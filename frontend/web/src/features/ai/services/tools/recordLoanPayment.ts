import { z } from 'zod';
import { loansLib } from '@/libs/loans';
import { defineAiTool } from '../toolRegistry';
import { auditUser, id, isoDate, money } from './shared';

export const recordLoanPaymentTool = defineAiTool({
  description:
    'Propose recording the next loan installment. This atomically creates a direct loan expense and advances progress without using a category. Duplicate installment numbers are rejected. Requires confirmation.',
  inputSchema: z.object({ loanId: id, amount: money, date: isoDate, budgetCycleId: id.nullable().optional() }).strict(),
  risk: 'write',
  confirmation: (input) => `Record loan payment of ${input.amount}`,
  execute: ({ loanId, amount, date, budgetCycleId }, context) =>
    loansLib.recordPayment(
      context.householdId,
      loanId,
      { amount, date, budgetCycleId },
      context.userId,
      auditUser(context),
    ),
});
