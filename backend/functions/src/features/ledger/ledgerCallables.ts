import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { initializeLedgerSummaries, ledgerCollections, writeLedger } from './writeLedger.js';

const id = z.string().min(1).max(256).regex(/^[^/]+$/).refine((value) => value !== '.' && value !== '..');
const input = z.object({
  householdId: id,
  operations: z.array(z.discriminatedUnion('type', [
    z.object({ type: z.literal('set'), collectionName: z.string(), docId: id, data: z.record(z.string(), z.unknown()) }),
    z.object({ type: z.literal('delete'), collectionName: z.string(), docId: id }),
  ])).min(1).max(450),
});

async function requireMembership(uid: string | undefined, access: unknown, householdId: string) {
  if (!uid || access !== true) throw new HttpsError('permission-denied', 'Kippa access is required.');
  const db = getFirestore();
  const profile = await db.doc(`users/${uid}`).get();
  if (profile.get('householdId') !== householdId) throw new HttpsError('permission-denied', 'Switch to this household first.');
  return db;
}

export const initializeLedgerSummary = onCall({ timeoutSeconds: 300 }, async (request) => {
  const household = id.safeParse(request.data?.householdId);
  if (!household.success) throw new HttpsError('invalid-argument', 'Invalid household.');
  const db = await requireMembership(request.auth?.uid, request.auth?.token.kippaAccess, household.data);
  return initializeLedgerSummaries(db, household.data);
});

function validatedOperations(value: unknown) {
  const parsed = input.safeParse(value);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid ledger operation.');
  const { householdId, operations } = parsed.data;
  const seen = new Set<string>();
  for (const operation of operations) {
    const key = `${operation.collectionName}/${operation.docId}`;
    if (!ledgerCollections.has(operation.collectionName) || seen.has(key))
      throw new HttpsError('invalid-argument', 'Invalid or duplicate ledger write.');
    seen.add(key);
    if (operation.type !== 'set') continue;
    const { data } = operation;
    if (operation.collectionName !== 'conversionDetails' && (data.id !== operation.docId || data.householdId !== householdId))
      throw new HttpsError('invalid-argument', 'Mismatched ledger document identity.');
    if (operation.collectionName === 'transactions' &&
        (!z.enum(['income', 'expense', 'transfer', 'adjustment']).safeParse(data.type).success ||
         !z.enum(['draft', 'posted', 'voided']).safeParse(data.status).success ||
         typeof data.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date) ||
         (data.budgetCycleId != null && !id.safeParse(data.budgetCycleId).success)))
      throw new HttpsError('invalid-argument', 'Invalid transaction data.');
    if (operation.collectionName === 'ledgerLines' &&
        (!id.safeParse(data.transactionId).success || !id.safeParse(data.accountId).success ||
         typeof data.signedAmount !== 'number' || !Number.isFinite(data.signedAmount) || typeof data.currency !== 'string'))
      throw new HttpsError('invalid-argument', 'Invalid ledger line.');
  }
  return { householdId, operations };
}

export const commitLedgerOperations = onCall(async (request) => {
  const { householdId, operations } = validatedOperations(request.data);
  const db = await requireMembership(request.auth?.uid, request.auth?.token.kippaAccess, householdId);
  await db.runTransaction((transaction) => writeLedger(db, transaction, householdId, operations));
  return { committed: true };
});

export const commitQueuedLedgerOperations = onDocumentCreated({
  document: 'households/{householdId}/ledgerWriteRequests/{requestId}',
  retry: true,
}, async (event) => {
  if (!event.data) return;
  const { householdId, requestId } = event.params;
  const db = getFirestore();
  const ref = db.collection('households').doc(householdId).collection('ledgerWriteRequests').doc(requestId);
  try {
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const data = snapshot.data();
      if (!data || data.status !== 'pending') return;
      let operations;
      try {
        operations = validatedOperations({ householdId, operations: data.operations }).operations;
      } catch (error) {
        transaction.update(ref, { status: 'rejected', error: error instanceof Error ? error.message : 'Invalid write.' });
        return;
      }
      // The document's create rule binds createdBy to the authenticated
      // household member. A trigger replay sees the committed receipt and exits.
      const profile = await transaction.get(db.collection('users').doc(data.createdBy));
      if (profile.get('householdId') !== householdId) {
        transaction.update(ref, { status: 'rejected', error: 'Switch back to this household and retry.' });
        return;
      }
      await writeLedger(db, transaction, householdId, operations);
      transaction.update(ref, { status: 'committed' });
    });
  } catch (error) {
    // Firestore retries aborted or unavailable writes. Invalid writes are
    // terminal and are recorded separately, after the failed commit rolls back.
    const code = (error as { code?: unknown } | null)?.code;
    const permanent = typeof code === 'number' ? [3, 5, 7, 9, 11].includes(code) : error instanceof Error;
    if (!permanent) throw error;
    await db.runTransaction(async (transaction) => {
      const receipt = await transaction.get(ref);
      if (receipt.get('status') === 'pending')
        transaction.update(ref, { status: 'rejected', error: 'The ledger change could not be applied. Review it and try again.' });
    });
  }
});
