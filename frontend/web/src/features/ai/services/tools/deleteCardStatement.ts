import { z } from 'zod';
import { cardsLib } from '@/libs/cards';
import { defineAiTool } from '../toolRegistry';
import { id } from './shared';

export const deleteCardStatementTool = defineAiTool({
  description:
    'Propose deleting an unpaid card statement. Statements linked to payments cannot be deleted. Requires confirmation.',
  inputSchema: z.object({ statementId: id }).strict(),
  risk: 'sensitive',
  confirmation: () => 'Delete this card statement',
  execute: ({ statementId }, context) => cardsLib.deleteStatement(context.householdId, statementId),
});
