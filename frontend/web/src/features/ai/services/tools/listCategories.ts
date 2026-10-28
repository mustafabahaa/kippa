import { ledgerLib } from '@/libs/ledger';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const listCategoriesTool = defineAiTool({
  description: 'List active income and expense categories with stable IDs needed by transaction and budget tools.',
  inputSchema: emptyInput,
  risk: 'read',
  execute: (_, context) => ledgerLib.getCategories(context.householdId),
});
