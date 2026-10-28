import { z } from 'zod';
import { ledgerLib } from '@/libs/ledger';
import { cyclesLib } from '@/libs/cycles';
import { defineAiTool } from '../toolRegistry';
import { allocationInput, auditUser } from './shared';

export const saveBudgetAllocationsBatchTool = defineAiTool({
  description:
    'Propose replacing several category allocations for one cycle in a single operation. Requires confirmation.',
  inputSchema: z
    .object({ allocations: z.array(allocationInput).min(1).max(100) })
    .strict()
    .refine((value) => new Set(value.allocations.map((item) => item.budgetCycleId)).size === 1, {
      message: 'All allocations must belong to the same cycle.',
    })
    .refine((value) => new Set(value.allocations.map((item) => item.categoryId)).size === value.allocations.length, {
      message: 'Each category may appear only once.',
    }),
  risk: 'write',
  confirmation: (input) => `Save ${input.allocations.length} budget allocations`,
  async execute({ allocations }, context) {
    const categories = await ledgerLib.getCategories(context.householdId);
    const validIds = new Set(categories.map((category) => category.id));
    if (allocations.some((allocation) => !validIds.has(allocation.categoryId)))
      throw new Error('One or more categories do not exist.');
    await cyclesLib.saveBudgetAllocationsBatch(context.householdId, allocations, auditUser(context));
    return { count: allocations.length };
  },
});
