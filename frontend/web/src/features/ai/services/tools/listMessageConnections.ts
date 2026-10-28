import { messageIngestionLib } from '@/libs/messageIngestion';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const listMessageConnectionsTool = defineAiTool({
  description: 'List iPhone message-ingestion connections. Tokens are never returned.',
  inputSchema: emptyInput,
  risk: 'read',
  execute: (_, context) => messageIngestionLib.listCredentials(context.householdId),
});
