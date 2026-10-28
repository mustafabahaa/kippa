import { aiMemoryService } from '../memory';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const listMemoriesTool = defineAiTool({
  description:
    'List the durable facts, preferences, goals, decisions, and corrections Kip currently remembers about this user. Use when the user asks what you remember or before correcting/forgetting a memory.',
  inputSchema: emptyInput,
  risk: 'read',
  execute: (...[, context]) => aiMemoryService.listActive(context.householdId, context.userId),
});
