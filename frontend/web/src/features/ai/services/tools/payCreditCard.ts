import { z } from 'zod';
import { cardsLib } from '@/libs/cards';
import { defineAiTool } from '../toolRegistry';
import { auditUser, id, money } from './shared';

export const payCreditCardTool = defineAiTool({
  description:
    'Propose paying a credit card from its configured payment account. Requires user confirmation. When settling specific charges, pass fee: {amount, rate} matching the bank fee included in amount so the settled charge lines absorb the fee instead of leaving unapplied credit.',
  inputSchema: z
    .object({
      cardId: id,
      amount: money,
      budgetCycleId: id.nullable().optional(),
      settlesChargeIds: z.array(id).max(100).optional(),
      fee: z
        .object({
          amount: z.number().min(0).max(1_000_000_000),
          rate: z.number().min(0).max(100),
        })
        .strict()
        .optional(),
    })
    .strict(),
  risk: 'write',
  confirmation: (input) =>
    `Pay ${input.amount} toward this card${input.fee ? ` (incl. ${input.fee.amount} fee)` : ''}`,
  async execute({ cardId, amount, budgetCycleId, settlesChargeIds, fee }, context) {
    const card = (await cardsLib.getCards(context.householdId)).find((item) => item.id === cardId);
    if (!card || card.kind !== 'credit') throw new Error('Credit card not found.');
    return cardsLib.payCard(
      context.householdId,
      card,
      amount,
      auditUser(context),
      settlesChargeIds,
      budgetCycleId,
      undefined,
      fee,
    );
  },
});
