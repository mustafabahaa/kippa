import { z } from 'zod';
import { cyclesLib } from '@/libs/cycles';
import { defineAiTool } from '../toolRegistry';
import { auditUser, id, isoDate } from './shared';

export const updateBudgetCycleStatusTool = defineAiTool({
  description: 'Propose opening, planning, or closing a budget cycle. Requires user confirmation.',
  inputSchema: z
    .object({ cycleId: id, status: z.enum(['planned', 'open', 'closed']), endDate: isoDate.optional() })
    .strict(),
  risk: 'write',
  confirmation: (input) => `${input.status === 'closed' ? 'Close' : 'Set'} this budget cycle`,
  execute: ({ cycleId, status, endDate }, context) =>
    cyclesLib.updateCycleStatus(
      context.householdId,
      cycleId,
      status,
      {
        ...(endDate ? { endDate } : {}),
        ...(status === 'closed' ? { closedAt: new Date().toISOString(), closedBy: context.userId } : {}),
      },
      auditUser(context),
    ),
});
