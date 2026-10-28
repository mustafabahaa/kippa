import { initializeApp } from 'firebase-admin/app';
import { createRequire } from 'node:module';

initializeApp();

export {
  getAiConnection,
  startAiConnection,
  cancelAiConnection,
  disconnectAiConnection,
} from './features/ai/codexConnection.js';
export { streamAiReply, submitAiToolResult } from './features/ai/streamAiReply.js';

export { onTransactionCreated } from './features/transactions/onTransactionCreated.js';
export { dailyReminderCron } from './features/notifications/dailyReminderCron.js';
export {
  createHousehold,
  requestToJoinHousehold,
  decideJoinRequest,
  leaveHousehold,
  listHouseholdMembers,
} from './features/households/householdMemberships.js';
export {
  approvePendingFinancialMessage,
  createMessageIngestionCredential,
  discardPendingFinancialMessage,
  deleteMessageIngestionCredential,
  ingestFinancialMessage,
  listMessageIngestionCredentials,
  listResolvedPendingFinancialMessages,
  revokeMessageIngestionCredential,
  restoreDiscardedPendingFinancialMessage,
} from './features/message-ingestion/messageIngestion.js';

// The MCP endpoint bundles Kippa's real tool implementations for server-side
// execution; see mcp/ and esbuild.mcp.mjs for how the frontend code is wired.
const { kippaMcp, kippaMcpAuth } = createRequire(import.meta.url)('../dist-bundle/mcp.cjs');
export { kippaMcp, kippaMcpAuth };

export { createMcpCredential, listMcpCredentials, revokeMcpCredential } from './features/mcp/mcpCredentials.js';
