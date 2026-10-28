import { loansLib, loanInputSchema } from '@/libs/loans';
import { defineAiTool } from '../toolRegistry';
import { auditUser } from './shared';

export const createLoanTool = defineAiTool({
  description:
    'Propose creating a validated fixed-payment loan connected to a paying account. Active loans are included directly in cycle commitments, outside categories. Requires confirmation.',
  inputSchema: loanInputSchema,
  risk: 'write',
  confirmation: (input) => `Add loan ${input.name} at ${input.installmentAmount} ${input.currency} per month`,
  execute: (input, context) => loansLib.createLoan(context.householdId, input, auditUser(context)),
});
