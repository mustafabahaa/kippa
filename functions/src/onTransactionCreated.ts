import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import type {
  FinanceTransaction,
  LedgerLine,
  BudgetCycle,
  BudgetAllocation,
  NotificationSettings,
  NotificationState,
  UserProfile,
} from './types.js';
import { shouldWarnCategory, spentPercentage } from './warnings.js';
import { buildMessagePayload, getTokensForUsers, sendToMany } from './sendToMany.js';
import { todayInTz } from './timezone.js';

/**
 * Firestore trigger: fires whenever a new transaction is created.
 * - Pushes a notification to all other household members.
 * - If the transaction is an expense, checks whether the category crossed
 *   80% of its allocation and pushes a warning (once per category per day).
 */
export const onTransactionCreated = onDocumentCreated(
  'households/{householdId}/transactions/{transactionId}',
  async (event) => {
    const householdId = event.params.householdId;
    const txn = event.data?.data() as FinanceTransaction | undefined;
    if (!txn || txn.status === 'voided') return;

    const db = getFirestore();

    // --- 1. Fetch all household members ---
    const membersSnap = await db
      .collection('users')
      .where('householdId', '==', householdId)
      .get();
    const members = membersSnap.docs.map((d) => ({
      uid: d.id,
      ...(d.data() as Omit<UserProfile, 'uid'>),
    }));

    // --- 2. Transaction push to everyone except the author ---
    const recipientUids = members.filter((m) => m.uid !== txn.createdBy).map((m) => m.uid);

    if (recipientUids.length > 0) {
      const author = members.find((m) => m.uid === txn.createdBy);
      const authorName = author?.displayName ?? 'Someone';
      const desc = txn.description || txn.type;
      const tokens = await getTokensForUsers(householdId, recipientUids);
      if (tokens.length > 0) {
        await sendToMany(
          householdId,
          tokens,
          buildMessagePayload({
            type: 'transaction',
            title: 'New transaction',
            body: `${authorName} added ${txn.type} — ${desc}`,
            householdId,
            deepLink: '/',
          }),
        );
      }
    }

    // --- 3. Category warning (expenses only) ---
    if (txn.type === 'expense' && txn.categoryId) {
      await checkCategoryWarning(db, householdId, txn);
    }
  },
);

async function checkCategoryWarning(
  db: FirebaseFirestore.Firestore,
  householdId: string,
  txn: FinanceTransaction,
): Promise<void> {
  const categoryId = txn.categoryId!;

  // Find the open budget cycle
  const cycleSnap = await db
    .collection(`households/${householdId}/budgetCycles`)
    .where('status', '==', 'open')
    .limit(1)
    .get();
  if (cycleSnap.empty) return;
  const cycle = cycleSnap.docs[0].data() as BudgetCycle;
  const cycleId = cycleSnap.docs[0].id;

  // Find the allocation for this category
  const allocSnap = await db
    .collection(`households/${householdId}/budgetAllocations`)
    .where('budgetCycleId', '==', cycleId)
    .where('categoryId', '==', categoryId)
    .limit(1)
    .get();
  if (allocSnap.empty) return;
  const allocation = allocSnap.docs[0].data() as BudgetAllocation;
  if (allocation.plannedAmount <= 0) return;

  // Sum posted expense ledger lines for this category in this cycle.
  const txnsSnap = await db
    .collection(`households/${householdId}/transactions`)
    .where('categoryId', '==', categoryId)
    .where('status', '==', 'posted')
    .get();
  const postedTxnIds = new Set(
    txnsSnap.docs
      .filter((d) => (d.data() as FinanceTransaction).budgetCycleId === cycleId)
      .map((d) => d.id),
  );
  if (postedTxnIds.size === 0) return;

  // Fetch ledger lines for these transactions and sum the debit amounts.
  // signedAmount is negative for debits; we use absolute value.
  const linesSnap = await db.collection(`households/${householdId}/ledgerLines`).get();
  let spent = 0;
  for (const lineDoc of linesSnap.docs) {
    const line = lineDoc.data() as LedgerLine;
    if (postedTxnIds.has(line.transactionId) && line.signedAmount < 0) {
      spent += Math.abs(line.signedAmount);
    }
  }

  if (!shouldWarnCategory(spent, allocation.plannedAmount)) return;

  // Dedup: check if we already warned for this category+cycle today.
  // Warnings are household-scoped, so we use a household-level state doc.
  const householdStateRef = db.doc(
    `households/${householdId}/notificationState/_household`,
  );
  const stateSnap = await householdStateRef.get();
  const state = (stateSnap.data() as NotificationState) ?? {};
  const warningKey = `${categoryId}_${cycleId}`;
  const today = todayInTz(new Date(), 'UTC'); // warning dedup is UTC-daily

  if (state.lastWarningFor?.[warningKey] === today) return;

  // Find members with categoryWarningEnabled
  const settingsSnap = await db
    .collection(`households/${householdId}/notificationSettings`)
    .where('categoryWarningEnabled', '==', true)
    .get();
  const settingsUids = settingsSnap.docs.map((d) => (d.data() as NotificationSettings).userId);

  if (settingsUids.length > 0) {
    const tokens = await getTokensForUsers(householdId, settingsUids);
    const pct = spentPercentage(spent, allocation.plannedAmount);
    if (tokens.length > 0) {
      await sendToMany(
        householdId,
        tokens,
        buildMessagePayload({
          type: 'category_warning',
          title: 'Budget warning',
          body: `Spending is at ${pct}% of the budget for this category.`,
          householdId,
          deepLink: '/budget',
        }),
      );
    }
  }

  // Record that we warned today
  const updatedWarningFor = {
    ...(state.lastWarningFor ?? {}),
    [warningKey]: today,
  };
  await householdStateRef.set({ lastWarningFor: updatedWarningFor }, { merge: true });
}
