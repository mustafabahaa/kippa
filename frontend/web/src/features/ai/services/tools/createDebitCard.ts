import { z } from 'zod';
import { ledgerLib } from '@/libs/ledger';
import { cardsLib } from '@/libs/cards';
import { defineAiTool } from '../toolRegistry';
import { auditUser, cardDetails, id } from './shared';

export const createDebitCardTool = defineAiTool({
  description: 'Propose creating a debit card linked to an existing running or savings account. Requires confirmation.',
  inputSchema: z.object({ ...cardDetails, parentAccountId: id }).strict(),
  risk: 'write',
  confirmation: (input) => `Create debit card ${input.name}`,
  async execute(input, context) {
    const accounts = await ledgerLib.getAccounts(context.householdId);
    return cardsLib.createDebitCard(
      context.householdId,
      { ...input, kind: 'debit', isActive: true },
      accounts,
      auditUser(context),
    );
  },
});
