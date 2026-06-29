import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import type { NotificationSettings, NotificationState } from './types.js';
import { shouldRemindNow, todayInTz } from './timezone.js';
import { buildMessagePayload, getTokensForUsers, sendToMany } from './sendToMany.js';

/**
 * Runs every 1 minute. For each household that had zero posted transactions
 * today, pushes a daily reminder to members whose local reminder time matches
 * "now" (once per user per day).
 */
export const dailyReminderCron = onSchedule('every 1 minutes', async () => {
  const db = getFirestore();
  const nowUtc = new Date();

  // Get all households
  const householdsSnap = await db.collection('households').get();

  for (const householdDoc of householdsSnap.docs) {
    const householdId = householdDoc.id;

    // Check if any transaction was created today (UTC day).
    // createdAt is stored as an ISO string; lexicographic comparison works.
    const todayUtc = todayInTz(nowUtc, 'UTC');
    const dayStart = `${todayUtc}T00:00:00Z`;

    const txnsTodaySnap = await db
      .collection(`households/${householdId}/transactions`)
      .where('createdAt', '>=', dayStart)
      .where('status', '==', 'posted')
      .limit(1)
      .get();

    // If there were transactions today, skip the reminder entirely
    if (!txnsTodaySnap.empty) continue;

    // Find members with dailyReminderEnabled whose local time matches
    const settingsSnap = await db
      .collection(`households/${householdId}/notificationSettings`)
      .where('dailyReminderEnabled', '==', true)
      .get();

    for (const settingsDoc of settingsSnap.docs) {
      const settings = settingsDoc.data() as NotificationSettings;
      const { dailyReminderTime, timezone, userId } = settings;

      // Does the user's local time match their configured reminder time?
      if (!shouldRemindNow(nowUtc, dailyReminderTime, timezone)) continue;

      // Dedup: already reminded today (in user's local day)?
      const userLocalToday = todayInTz(nowUtc, timezone);
      const stateRef = db.doc(`households/${householdId}/notificationState/${userId}`);
      const stateSnap = await stateRef.get();
      const state = (stateSnap.data() as NotificationState) ?? {};
      if (state.lastReminderSentDate === userLocalToday) continue;

      // Send the reminder
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

      // Record that we reminded today
      await stateRef.set({ lastReminderSentDate: userLocalToday }, { merge: true });
    }
  }
});
