import { z } from 'zod';
import { cardsLib } from '@/libs/cards';
import { defineAiTool } from '../toolRegistry';
import { id } from './shared';

export const listCardStatementsTool = defineAiTool({
  description: 'List card statements newest first, optionally for one card, up to a limit.',
  inputSchema: z.object({ cardId: id.optional(), limit: z.number().int().min(1).max(100).default(20) }).strict(),
  risk: 'read',
  execute: async ({ cardId, limit }, context) =>
    (await cardsLib.getStatements(context.householdId, cardId)).slice(0, limit),
});
