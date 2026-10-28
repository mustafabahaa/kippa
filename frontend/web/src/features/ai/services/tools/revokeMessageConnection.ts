import { z } from 'zod';
import { messageIngestionLib } from '@/libs/messageIngestion';
import { defineAiTool } from '../toolRegistry';
import { id } from './shared';

export const revokeMessageConnectionTool = defineAiTool({
  description: 'Propose permanently revoking a message-ingestion connection. Requires confirmation.',
  inputSchema: z.object({ credentialId: id }).strict(),
  risk: 'sensitive',
  confirmation: () => 'Revoke this message connection',
  execute: ({ credentialId }) => messageIngestionLib.revokeCredential(credentialId),
});
