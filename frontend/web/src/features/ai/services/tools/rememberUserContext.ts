import { z } from 'zod';
import { aiMemoryService } from '../memory';
import { defineAiTool } from '../toolRegistry';
import { id } from './shared';

export const rememberUserContextTool = defineAiTool({
  description:
    'Save one durable, explicitly user-provided fact, preference, goal, decision, or correction for future conversations. Do not store transient requests, current balances, transaction facts already in Kippa, secrets, credentials, inferred traits, or assistant guesses. Use replacesMemoryId when correcting an existing memory.',
  inputSchema: z
    .object({
      kind: z.enum(['fact', 'preference', 'goal', 'decision', 'correction', 'pattern', 'outcome']),
      content: z.string().trim().min(3).max(500),
      replacesMemoryId: id.optional(),
    })
    .strict(),
  risk: 'memory',
  execute: ({ kind, content, replacesMemoryId }, context) =>
    aiMemoryService.remember({
      householdId: context.householdId,
      userId: context.userId,
      kind,
      content,
      replacesMemoryId,
      sourceMessageIds: context.sourceMessageIds ?? [],
    }),
});
