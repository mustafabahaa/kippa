import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';
import type { FcmToken } from './types.js';

export type NotificationType =
  | 'transaction'
  | 'category_warning'
  | 'daily_reminder'
  | 'card_expiry';

export interface PayloadInput {
  type: NotificationType;
  title: string;
  body: string;
  householdId: string;
  deepLink?: string;
}

/**
 * Builds the FCM message payload (notification + data) for a given push.
 * Pure function — unit-tested independently of the messaging SDK.
 */
export function buildMessagePayload(input: PayloadInput) {
  return {
    notification: { title: input.title, body: input.body },
    data: {
      type: input.type,
      householdId: input.householdId,
      deepLink: input.deepLink ?? '/',
    },
  };
}

/**
 * Fetches all FCM tokens for a set of user UIDs within a household.
 * Reads the whole household token collection then filters in memory, to
 * avoid the Firestore `in` query 10-element limit.
 */
export async function getTokensForUsers(
  householdId: string,
  uids: string[],
): Promise<string[]> {
  if (uids.length === 0) return [];
  const db = getFirestore();
  const tokensSnap = await db
    .collection(`households/${householdId}/fcmTokens`)
    .get();

  const uidSet = new Set(uids);
  return tokensSnap.docs
    .map((d) => d.data() as FcmToken)
    .filter((t) => uidSet.has(t.uid))
    .map((t) => t.token);
}

/**
 * Sends a push to a list of tokens within a household. Deletes tokens that FCM
 * reports as invalid (UNREGISTERED / INVALID_ARGUMENT).
 *
 * @param householdId - used to locate token docs for cleanup
 * @returns the count of successful sends
 */
export async function sendToMany(
  householdId: string,
  tokens: string[],
  payload: ReturnType<typeof buildMessagePayload>,
): Promise<number> {
  if (tokens.length === 0) return 0;

  const message = {
    ...payload,
    tokens,
  };

  const response = await getMessaging().sendEachForMulticast(message);
  const db = getFirestore();

  // Clean up invalid tokens
  const invalidTokens: string[] = [];
  response.responses.forEach((resp, idx) => {
    if (!resp.success && resp.error) {
      const code = resp.error.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-argument'
      ) {
        invalidTokens.push(tokens[idx]);
      }
    }
  });

  if (invalidTokens.length > 0) {
    const batch = db.batch();
    for (const token of invalidTokens) {
      const ref = db.doc(`households/${householdId}/fcmTokens/${token}`);
      batch.delete(ref);
    }
    await batch.commit().catch(() => {
      // Best-effort cleanup — don't fail the send
    });
  }

  return response.successCount;
}
