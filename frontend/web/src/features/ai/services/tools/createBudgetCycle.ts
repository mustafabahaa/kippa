import { z } from 'zod';
import { cyclesLib } from '@/libs/cycles';
import { defineAiTool } from '../toolRegistry';
import { auditUser, isoDate, name } from './shared';

export const createBudgetCycleTool = defineAiTool({
  description: 'Propose creating a budget cycle. Requires user confirmation.',
  inputSchema: z
    .object({
      name,
      startDate: isoDate,
      endDate: isoDate.nullable().optional(),
      status: z.enum(['planned', 'open']).default('planned'),
    })
    .strict()
    .refine((value) => !value.endDate || value.startDate <= value.endDate, {
      message: 'startDate must be on or before endDate',
    }),
  risk: 'write',
  confirmation: (input) => `Create budget cycle ${input.name}`,
  execute: (input, context) => cyclesLib.createCycle(context.householdId, input, auditUser(context)),
});
