import { z } from 'zod';
import { loansLib, loanInputSchema } from '@/libs/loans';
import { defineAiTool } from '../toolRegistry';
import { auditUser, id } from './shared';

export const updateLoanTool = defineAiTool({
  description: 'Propose replacing the validated terms or status of an existing loan. Requires confirmation.',
  inputSchema: z.object({ loanId: id, loan: loanInputSchema }).strict(),
  risk: 'write',
  confirmation: (input) => `Update loan ${input.loan.name}`,
  async execute({ loanId, loan }, context) {
    await loansLib.updateLoan(context.householdId, loanId, loan, auditUser(context));
    return { loanId };
  },
});
