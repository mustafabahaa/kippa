import { z } from 'zod';
import { cyclesLib } from '@/libs/cycles';
import { defineAiTool } from '../toolRegistry';
import { id } from './shared';

export const getCyclePlanTool = defineAiTool({
  description: 'Get allocations and expected incomes for a budget cycle.',
  inputSchema: z.object({ cycleId: id }).strict(),
  risk: 'read',
  async execute({ cycleId }, context) {
    const [allocations, expectedIncomes] = await Promise.all([
      cyclesLib.getBudgetAllocations(context.householdId, cycleId),
      cyclesLib.getExpectedIncomes(context.householdId, cycleId),
    ]);
    return { allocations, expectedIncomes };
  },
});
