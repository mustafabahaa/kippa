import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import type { NotificationSettings, NotificationState, Card, FcmToken } from '@kippa/domain';
import { buildMessagePayload } from '../../domain/notifications/payload.js';
import { sendToMany } from '../../libs/notifications/sendToMany.js';

/**
 * Runs once per day at 09:00 UTC. For each household that had zero posted
 * transactions today, pushes a daily reminder to enabled members (once per user per day).
 */
export const dailyReminderCron = onSchedule('0 9 * * *', async () => {
  const db = getFirestore();

  const todayUtc = new Date().toISOString().slice(0, 10);
  const dayStart = `${todayUtc}T00:00:00Z`;

  // Get all households
  const householdsSnap = await db.collection('households').get();

  for (const householdDoc of householdsSnap.docs) {
    const householdId = householdDoc.id;

    // Check if any transaction was posted today (UTC day)
    const txnsTodaySnap = await db
      .collection(`households/${householdId}/transactions`)
      .where('createdAt', '>=', dayStart)
      .where('status', '==', 'posted')
      .limit(1)
      .get();

    const noExpensesToday = txnsTodaySnap.empty;

    // Preferences default to enabled when no settings document exists, matching
    // the defaults shown in the app. Only registered devices can receive pushes.
    const [settingsSnap, tokensSnap] = await Promise.all([
      db.collection(`households/${householdId}/notificationSettings`).get(),
      db.collection(`households/${householdId}/fcmTokens`).get(),
    ]);
    const settingsByUserId = new Map<string, NotificationSettings>();
    for (const settingsDoc of settingsSnap.docs) {
      settingsByUserId.set(settingsDoc.id, settingsDoc.data() as NotificationSettings);
    }
    const tokensByUserId = new Map<string, string[]>();
    for (const tokenDoc of tokensSnap.docs) {
      const tokenData = tokenDoc.data() as FcmToken;
      if (!tokenData.uid || !tokenData.token) continue;
      const userTokens = tokensByUserId.get(tokenData.uid) ?? [];
      userTokens.push(tokenData.token);
      tokensByUserId.set(tokenData.uid, userTokens);
    }

    for (const [userId, tokens] of tokensByUserId) {
      const settings = settingsByUserId.get(userId);
      const dailyReminderEnabled = settings?.dailyReminderEnabled ?? true;

      const stateRef = db.doc(`households/${householdId}/notificationState/${userId}`);
      const stateSnap = await stateRef.get();
      const state = (stateSnap.data() as NotificationState) ?? {};

      // --- Send daily expense reminder? ---
      if (noExpensesToday && dailyReminderEnabled) {
        if (state.lastReminderSentDate !== todayUtc) {
          if (tokens.length > 0) {
            await sendToMany(
              householdId,
              tokens,
              buildMessagePayload({
                type: 'daily_reminder',
                title: 'Daily reminder',
                body: 'No expenses recorded today. Add anything you spent before the day slips.',
                householdId,
                deepLink: '/',
              }),
            );
          }
          await stateRef.set({ lastReminderSentDate: todayUtc }, { merge: true });
        }
      }
    }

    // Send card expiry alerts to every enabled household member together.
    // The expiry marker belongs to the shared card, so setting it after a
    // single member's send would suppress delivery to the remaining members.
    const cardExpiryTokens = [...tokensByUserId].flatMap(([userId, tokens]) =>
      (settingsByUserId.get(userId)?.cardExpiryWarningEnabled ?? true) ? tokens : [],
    );
    if (cardExpiryTokens.length === 0) continue;

    const cardsSnap = await db.collection(`households/${householdId}/cards`).where('isActive', '==', true).get();
    for (const cardDoc of cardsSnap.docs) {
      const card = cardDoc.data() as Card;
      if (!card.expiryMonth || !card.expiryYear) continue;
      const expiry = new Date(Date.UTC(card.expiryYear, card.expiryMonth - 1, 1));
      const daysUntil = Math.round((expiry.getTime() - Date.now()) / 86400000);
      if (daysUntil > 60 || daysUntil < 0 || card.notifiedCardExpiryAt === todayUtc) continue;

      const mm = String(card.expiryMonth).padStart(2, '0');
      const yy = String(card.expiryYear).slice(-2);
      const sentCount = await sendToMany(
        householdId,
        cardExpiryTokens,
        buildMessagePayload({
          type: 'card_expiry',
          title: 'Card expiring soon',
          body: `Your ${card.name} expires ${mm}/${yy}. Watch for the replacement and add the new card.`,
          householdId,
          deepLink: '/accounts',
        }),
      );
      if (sentCount > 0) {
        await cardDoc.ref.set({ notifiedCardExpiryAt: todayUtc }, { merge: true });
      }
    }
  }
});
