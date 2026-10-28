import { z } from 'zod';
import { transactionsLib } from '@/libs/transactions';
import { defineAiTool } from '../toolRegistry';
import { auditUser, id } from './shared';

export const voidTransactionTool = defineAiTool({
  description: 'Propose voiding a transaction. Requires user confirmation.',
  inputSchema: z.object({ transactionId: id }).strict(),
  risk: 'write',
  confirmation: () => 'Void this transaction',
  async execute({ transactionId }, context) {
    await transactionsLib.voidTransaction(context.householdId, transactionId, auditUser(context));
    return { transactionId };
  },
});
