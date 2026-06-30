import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import type { NotificationSettings, NotificationState, Card } from './types.js';
import { buildMessagePayload, getTokensForUsers, sendToMany } from './sendToMany.js';

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

    // Get all notification settings for this household (single read)
    const settingsSnap = await db
      .collection(`households/${householdId}/notificationSettings`)
      .get();

    for (const settingsDoc of settingsSnap.docs) {
      const settings = settingsDoc.data() as NotificationSettings;
      const { userId } = settings;

      const stateRef = db.doc(`households/${householdId}/notificationState/${userId}`);
      const stateSnap = await stateRef.get();
      const state = (stateSnap.data() as NotificationState) ?? {};

      // --- Send daily expense reminder? ---
      if (noExpensesToday && settings.dailyReminderEnabled) {
        if (state.lastReminderSentDate !== todayUtc) {
          const tokens = await getTokensForUsers(householdId, [userId]);
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

      // --- Card expiry warning? (spec §9.4) ---
      if (settings.cardExpiryWarningEnabled) {
        const cardsSnap = await db.collection(`households/${householdId}/cards`)
          .where('isActive', '==', true).get();
        for (const cardDoc of cardsSnap.docs) {
          const card = cardDoc.data() as Card;
          if (!card.expiryMonth || !card.expiryYear) continue;
          const expiry = new Date(Date.UTC(card.expiryYear, card.expiryMonth - 1, 1));
          const daysUntil = Math.round((expiry.getTime() - Date.now()) / 86400000);
          const alreadyNotified = card.notifiedCardExpiryAt === todayUtc;
          if (daysUntil <= 60 && daysUntil >= 0 && !alreadyNotified) {
            const mm = String(card.expiryMonth).padStart(2, '0');
            const yy = String(card.expiryYear).slice(-2);
            const tokens = await getTokensForUsers(householdId, [userId]);
            if (tokens.length > 0) {
              await sendToMany(householdId, tokens, buildMessagePayload({
                type: 'card_expiry',
                title: 'Card expiring soon',
                body: `Your ${card.name} expires ${mm}/${yy}. Watch for the replacement and add the new card.`,
                householdId, deepLink: '/accounts',
              }));
            }
            await cardDoc.ref.set({ notifiedCardExpiryAt: todayUtc }, { merge: true });
          }
        }
      }
    }
  }
});
