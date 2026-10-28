import { z } from 'zod';
import { cardsLib } from '@/libs/cards';
import { defineAiTool } from '../toolRegistry';
import { auditUser, id, money } from './shared';

export const payCreditCardTool = defineAiTool({
  description: 'Propose paying a credit card from its configured payment account. Requires user confirmation.',
  inputSchema: z
    .object({
      cardId: id,
      amount: money,
      budgetCycleId: id.nullable().optional(),
      settlesChargeIds: z.array(id).max(100).optional(),
    })
    .strict(),
  risk: 'write',
  confirmation: (input) => `Pay ${input.amount} toward this card`,
  async execute({ cardId, amount, budgetCycleId, settlesChargeIds }, context) {
    const card = (await cardsLib.getCards(context.householdId)).find((item) => item.id === cardId);
    if (!card || card.kind !== 'credit') throw new Error('Credit card not found.');
    return cardsLib.payCard(context.householdId, card, amount, auditUser(context), settlesChargeIds, budgetCycleId);
  },
});
