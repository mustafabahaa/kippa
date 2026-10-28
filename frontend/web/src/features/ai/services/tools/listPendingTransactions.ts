import { messageIngestionLib } from '@/libs/messageIngestion';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const listPendingTransactionsTool = defineAiTool({
  description: 'List pending imported financial messages waiting for review.',
  inputSchema: emptyInput,
  risk: 'read',
  execute: (...[, context]) => messageIngestionLib.getPending(context.householdId),
});
