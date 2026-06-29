import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import type { NotificationSettings, NotificationState } from './types.js';
import { buildMessagePayload, getTokensForUsers, sendToMany } from './sendToMany.js';

/**
 * Runs once per day at 09:00 UTC. Two independent reminders per run:
 *
 * 1. Daily expense logging: for each household that had zero posted transactions
 *    today, pushes a reminder to enabled members (once per user per day).
 *
 * 2. Audit reminder: gentle nudge to check cash/bank balances, sent to enabled
 *    members (once per user per day).
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

      // --- Send audit reminder? ---
      if (settings.auditReminderEnabled) {
        if (state.lastAuditReminderSentDate !== todayUtc) {
          const tokens = await getTokensForUsers(householdId, [userId]);
          if (tokens.length > 0) {
            await sendToMany(
              householdId,
              tokens,
              buildMessagePayload({
                type: 'audit_reminder',
                title: 'Audit reminder',
                body: 'Time to do a quick audit — check your cash, bank balances, and make sure everything lines up.',
                householdId,
                deepLink: '/accounts',
              }),
            );
          }
          await stateRef.set({ lastAuditReminderSentDate: todayUtc }, { merge: true });
        }
      }
    }
  }
});
