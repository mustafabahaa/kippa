import { z } from 'zod';
import { messageIngestionLib } from '@/libs/messageIngestion';
import { defineAiTool } from '../toolRegistry';
import { id } from './shared';

export const restoreDiscardedPendingTransactionTool = defineAiTool({
  description: 'Propose restoring a discarded imported financial message to pending review. Requires confirmation.',
  inputSchema: z.object({ pendingId: id }).strict(),
  risk: 'write',
  confirmation: () => 'Restore this pending transaction',
  execute: ({ pendingId }, context) => messageIngestionLib.restoreDiscarded(context.householdId, pendingId),
});
