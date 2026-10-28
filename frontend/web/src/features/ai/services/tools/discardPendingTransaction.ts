import { z } from 'zod';
import { messageIngestionLib } from '@/libs/messageIngestion';
import { defineAiTool } from '../toolRegistry';
import { id } from './shared';

export const discardPendingTransactionTool = defineAiTool({
  description: 'Propose discarding an imported pending financial message. Requires user confirmation.',
  inputSchema: z.object({ pendingId: id }).strict(),
  risk: 'write',
  confirmation: () => 'Discard this pending transaction',
  execute: ({ pendingId }, context) => messageIngestionLib.discard(context.householdId, pendingId),
});
