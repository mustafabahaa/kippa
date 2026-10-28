import { z } from 'zod';
import { ledgerLib } from '@/libs/ledger';
import { cardsLib } from '@/libs/cards';
import { defineAiTool } from '../toolRegistry';
import { auditUser, cardNetwork, id, money, name } from './shared';

export const updateCardTool = defineAiTool({
  description: 'Propose updating an existing debit or credit card. Requires confirmation.',
  inputSchema: z
    .object({
      cardId: id,
      name: name.optional(),
      last4: z.string().trim().max(4).optional(),
      network: cardNetwork.optional(),
      bankId: z.string().trim().min(1).max(80).optional(),
      tierId: z.string().trim().max(80).optional(),
      expiryMonth: z.number().int().min(1).max(12).optional(),
      expiryYear: z.number().int().min(2020).max(2200).optional(),
      isActive: z.boolean().optional(),
      creditLimit: money.optional(),
      paymentAccountId: id.optional(),
    })
    .strict()
    .refine((value) => Object.keys(value).some((key) => key !== 'cardId'), {
      message: 'At least one card change is required.',
    }),
  risk: 'write',
  confirmation: () => 'Update this card',
  async execute({ cardId, ...updates }, context) {
    const accounts = await ledgerLib.getAccounts(context.householdId);
    await cardsLib.updateCard(context.householdId, cardId, updates, accounts, auditUser(context));
    return { cardId };
  },
});
