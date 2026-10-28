import { z } from 'zod';
import { ledgerLib } from '@/libs/ledger';
import { cardsLib } from '@/libs/cards';
import { defineAiTool } from '../toolRegistry';
import { auditUser, cardDetails, id, money } from './shared';

export const createCreditCardTool = defineAiTool({
  description: 'Propose creating a credit card and its linked debt account. Requires confirmation.',
  inputSchema: z.object({ ...cardDetails, creditLimit: money, paymentAccountId: id }).strict(),
  risk: 'write',
  confirmation: (input) => `Create credit card ${input.name}`,
  async execute(input, context) {
    const accounts = await ledgerLib.getAccounts(context.householdId);
    const sortOrder = accounts.length ? Math.max(...accounts.map((account) => account.sortOrder)) + 1 : 1;
    return cardsLib.createCreditCard(
      context.householdId,
      { ...input, kind: 'credit', parentAccountId: '', isActive: true },
      accounts,
      sortOrder,
      auditUser(context),
    );
  },
});
