import { cyclesLib } from '@/libs/cycles';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const listBudgetCyclesTool = defineAiTool({
  description: 'List all budget cycles and their statuses.',
  inputSchema: emptyInput,
  risk: 'read',
  execute: (_, context) => cyclesLib.getCycles(context.householdId),
});
