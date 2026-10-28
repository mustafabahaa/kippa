import { z } from 'zod';
import { aiMemoryService } from '../memory';
import { defineAiTool } from '../toolRegistry';
import { id } from './shared';

export const forgetUserMemoryTool = defineAiTool({
  description:
    'Forget one saved memory only when the user explicitly asks to forget it. Call listMemories first to obtain the exact memory ID.',
  inputSchema: z.object({ memoryId: id }).strict(),
  risk: 'memory',
  execute: ({ memoryId }, context) => aiMemoryService.forget(context.householdId, context.userId, memoryId),
});
