import { messageIngestionLib } from '@/libs/messageIngestion';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const createMessageConnectionTool = defineAiTool({
  description:
    'Propose creating a private iPhone Shortcut message-ingestion connection. The one-time token is shown only after confirmation and is not saved in chat history.',
  inputSchema: emptyInput,
  risk: 'sensitive',
  confirmation: () => 'Create a secure message connection',
  execute: (...[, context]) => messageIngestionLib.createCredential(context.householdId),
});
