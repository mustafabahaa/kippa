import { z } from 'zod';
import { auditLogLib } from '@/libs/auditLog';
import { defineAiTool } from '../toolRegistry';

export const getRecentActivityTool = defineAiTool({
  description: 'Get recent household audit activity.',
  inputSchema: z.object({ limit: z.number().int().min(1).max(50).default(20) }).strict(),
  risk: 'read',
  execute: ({ limit }, context) => auditLogLib.getRecentLogs(context.householdId, limit),
});
