import { z } from 'zod';
import { ledgerLib } from '@/libs/ledger';
import { defineAiTool } from '../toolRegistry';

export const listReconciliationsTool = defineAiTool({
  description: 'List account reconciliation history, most recent first, up to a limit.',
  inputSchema: z.object({ limit: z.number().int().min(1).max(100).default(20) }).strict(),
  risk: 'read',
  execute: async ({ limit }, context) =>
    (await ledgerLib.getReconciliations(context.householdId))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit),
});
