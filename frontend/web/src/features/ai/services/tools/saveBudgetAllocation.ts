import { cyclesLib } from '@/libs/cycles';
import { defineAiTool } from '../toolRegistry';
import { allocationInput, auditUser, requireCategory } from './shared';

export const saveBudgetAllocationTool = defineAiTool({
  description: 'Propose creating or replacing one category allocation for a cycle. Requires user confirmation.',
  inputSchema: allocationInput,
  risk: 'write',
  confirmation: (input) => `Allocate ${input.plannedAmount} ${input.currency}`,
  async execute(input, context) {
    await requireCategory(context.householdId, input.categoryId);
    return cyclesLib.saveBudgetAllocation(context.householdId, input, auditUser(context));
  },
});
