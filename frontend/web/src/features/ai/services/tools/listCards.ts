import { cardsLib } from '@/libs/cards';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const listCardsTool = defineAiTool({
  description: 'List debit and credit cards and their linked accounts.',
  inputSchema: emptyInput,
  risk: 'read',
  execute: (_, context) => cardsLib.getCards(context.householdId),
});
