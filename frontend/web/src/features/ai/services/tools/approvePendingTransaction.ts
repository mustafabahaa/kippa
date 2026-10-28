import { z } from 'zod';
import { messageIngestionLib } from '@/libs/messageIngestion';
import { defineAiTool } from '../toolRegistry';
import { id, requireAccount, requireCategory } from './shared';

export const approvePendingTransactionTool = defineAiTool({
  description: 'Propose approving an imported pending financial message as a transaction. Requires user confirmation.',
  inputSchema: z.object({ pendingId: id, categoryId: id, accountId: id, destinationAccountId: id.optional() }).strict(),
  risk: 'write',
  confirmation: () => 'Approve this pending transaction',
  async execute(input, context) {
    await requireCategory(context.householdId, input.categoryId);
    await requireAccount(context.householdId, input.accountId);
    if (input.destinationAccountId) await requireAccount(context.householdId, input.destinationAccountId);
    return messageIngestionLib.approve({ householdId: context.householdId, ...input });
  },
});
