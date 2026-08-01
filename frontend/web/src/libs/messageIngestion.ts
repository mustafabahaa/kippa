import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';
import { dbLib } from '@/libs/db';
import type { MessageIngestionCredential, PendingFinancialMessage } from '@kippa/domain';

function requireFunctions() {
  if (!functions) throw new Error('Firebase Functions is not configured.');
  return functions;
}

export const messageIngestionLib = {
  async getPending(householdId: string): Promise<PendingFinancialMessage[]> {
    const items = await dbLib.getDocs(householdId, 'pendingFinancialMessages') as PendingFinancialMessage[];
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async approve(data: {
    householdId: string;
    pendingId: string;
    categoryId: string;
    accountId: string;
    destinationAccountId?: string;
  }): Promise<string> {
    const callable = httpsCallable<typeof data, { transactionId: string }>(requireFunctions(), 'approvePendingFinancialMessage');
    return (await callable(data)).data.transactionId;
  },

  async discard(householdId: string, pendingId: string): Promise<void> {
    const callable = httpsCallable<{ householdId: string; pendingId: string }, { discarded: boolean }>(
      requireFunctions(),
      'discardPendingFinancialMessage',
    );
    await callable({ householdId, pendingId });
  },

  async createCredential(householdId: string): Promise<{ credentialId: string; token: string; endpoint: string }> {
    const callable = httpsCallable<
      { householdId: string; label: string },
      { credentialId: string; token: string; endpoint: string }
    >(requireFunctions(), 'createMessageIngestionCredential');
    return (await callable({ householdId, label: 'iPhone Shortcut' })).data;
  },

  async listCredentials(householdId: string): Promise<MessageIngestionCredential[]> {
    const callable = httpsCallable<
      { householdId: string },
      { credentials: MessageIngestionCredential[] }
    >(requireFunctions(), 'listMessageIngestionCredentials');
    return (await callable({ householdId })).data.credentials;
  },

  async revokeCredential(credentialId: string): Promise<void> {
    const callable = httpsCallable<{ credentialId: string }, { revoked: boolean }>(
      requireFunctions(),
      'revokeMessageIngestionCredential',
    );
    await callable({ credentialId });
  },
};
