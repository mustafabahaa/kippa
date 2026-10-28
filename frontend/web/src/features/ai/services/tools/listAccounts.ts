import { ledgerLib } from '@/libs/ledger';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const listAccountsTool = defineAiTool({
  description: 'List household accounts, including inactive accounts and stable IDs needed by action tools.',
  inputSchema: emptyInput,
  risk: 'read',
  execute: (_, context) => ledgerLib.getAccounts(context.householdId),
});
