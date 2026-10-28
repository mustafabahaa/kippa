import { initializeApp } from 'firebase-admin/app';

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
