import { z } from 'zod';
import { messageIngestionLib } from '@/libs/messageIngestion';
import { defineAiTool } from '../toolRegistry';

export const listResolvedPendingTransactionsTool = defineAiTool({
  description: 'List previously approved or discarded imported financial messages, up to a limit.',
  inputSchema: z.object({ limit: z.number().int().min(1).max(100).default(20) }).strict(),
  risk: 'read',
  execute: async ({ limit }, context) => (await messageIngestionLib.getResolved(context.householdId)).slice(0, limit),
});
