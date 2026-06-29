import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import type { BudgetCycle, NotificationSettings } from './types.js';
import { buildMessagePayload, getTokensForUsers, sendToMany } from './sendToMany.js';
import { todayInTz } from './timezone.js';

/**
 * Runs daily at 00:10 UTC. Finds open budget cycles whose endDate has passed
 * and pushes a "close your cycle" reminder to members (once per cycle).
 */
export const cycleCloseCron = onSchedule('10 0 * * *', async () => {
  const db = getFirestore();
  const todayUtc = todayInTz(new Date(), 'UTC');

  // Find open cycles past their endDate via collection group (covers all
  // households). Then filter in memory for status / endDate / notified.
  const cyclesSnap = await db.collectionGroup('budgetCycles').get();

  for (const cycleDoc of cyclesSnap.docs) {
    const cycle = cycleDoc.data() as BudgetCycle;

    if (cycle.status !== 'open') continue;
    if (!cycle.endDate || cycle.endDate >= todayUtc) continue;
    if (cycle.notifiedCycleClose === true) continue;

    // Extract householdId from the doc path: households/{hid}/budgetCycles/{cid}
    const pathParts = cycleDoc.ref.path.split('/');
    const householdId = pathParts[1];

    // Find members with cycleCloseReminderEnabled
    const settingsSnap = await db
      .collection(`households/${householdId}/notificationSettings`)
      .where('cycleCloseReminderEnabled', '==', true)
      .get();
    const settingsUids = settingsSnap.docs.map((d) => (d.data() as NotificationSettings).userId);

    if (settingsUids.length > 0) {
      const tokens = await getTokensForUsers(householdId, settingsUids);
      if (tokens.length > 0) {
        await sendToMany(
          householdId,
          tokens,
          buildMessagePayload({
            type: 'cycle_close',
            title: 'Cycle closing',
            body: `Your budget cycle "${cycle.name}" is past its end date. Review and close it.`,
            householdId,
            deepLink: '/budget',
          }),
        );
      }
    }

    // Mark as notified (once per cycle)
    await cycleDoc.ref.set({ notifiedCycleClose: true }, { merge: true });
  }
});
