import { loansLib } from '@/libs/loans';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const listLoansTool = defineAiTool({
  description:
    'List every loan contract, its fixed schedule, paying account, and status. Loans are direct commitments, not categories.',
  inputSchema: emptyInput,
  risk: 'read',
  execute: (_, context) => loansLib.getLoans(context.householdId),
});
