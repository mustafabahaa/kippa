import type { Account, FinanceTransaction, LedgerLine } from '@kippa/domain';
import type { DocumentData, Firestore, Transaction } from 'firebase-admin/firestore';
import {
  applyPostings, combineProjection, SUMMARY_COLLECTION, SUMMARY_STATE,
  SUMMARY_VERSION, type CycleSummary, type LedgerHistory, type LedgerState, type Projection,
} from './projection.js';

import { recordCardFeesForWrite, requiresCardFeeDecision } from './canonicalCardFees.js';

export const ledgerCollections = new Set(['transactions', 'ledgerLines', 'accounts', 'conversionDetails', 'cards']);

export type LedgerOperation = {
  type: 'set' | 'delete';
  collectionName: string;
  docId: string;
  data?: DocumentData;
};

const emptyProjection = (): Projection => ({ balances: {}, cycles: new Map() });

function batches(ids: Iterable<string>) {
  const list = [...new Set(ids)];
  const groups = [];
  for (let start = 0; start < list.length; start += 30) groups.push(list.slice(start, start + 30));
  return groups;
}

function mapDocuments<T>(docs: { id: string; data(): unknown }[]) {
  return new Map(docs.filter((doc) => doc.data() !== undefined).map((doc) => [doc.id, { ...doc.data() as T, id: doc.id }]));
}

function applyOperations<T>(documents: Map<string, T>, operations: LedgerOperation[], collectionName: string) {
  const result = new Map(documents);
  for (const operation of operations) {
    if (operation.collectionName !== collectionName) continue;
    if (operation.type === 'delete') result.delete(operation.docId);
    else result.set(operation.docId, operation.data as T);
  }
  return result;
}

function projectDifference(before: LedgerHistory, after: LedgerHistory) {
  const delta = emptyProjection();
  applyPostings(delta, before, -1);
  applyPostings(delta, after, 1);
  return delta;
}

type Household = ReturnType<Firestore['doc']>;

function withRecordedFees(operations: LedgerOperation[], fees: Map<string, LedgerLine>) {
  const replacements = [...fees].map(([docId, data]): LedgerOperation => ({
    type: 'set', collectionName: 'ledgerLines', docId, data,
  }));
  return [...operations.filter((op) => op.collectionName !== 'ledgerLines' || !fees.has(op.docId)), ...replacements];
}

function commitOperations(transaction: Transaction, household: Household, operations: LedgerOperation[]) {
  for (const operation of operations) {
    const ref = household.collection(operation.collectionName).doc(operation.docId);
    if (operation.type === 'delete') transaction.delete(ref);
    else transaction.set(ref, operation.data!);
  }
}

async function createLedgerSummary(transaction: Transaction, household: Household, operations: LedgerOperation[] = []) {
  const summary = household.collection(SUMMARY_COLLECTION);
  const [transactions, lines, accountDocs] = await Promise.all([
    transaction.get(household.collection('transactions')),
    transaction.get(household.collection('ledgerLines')),
    operations.length ? transaction.get(household.collection('accounts')) : undefined,
  ]);
  const before = {
    transactions: mapDocuments<FinanceTransaction>(transactions.docs),
    lines: mapDocuments<LedgerLine>(lines.docs),
  };
  const after = {
    transactions: applyOperations(before.transactions, operations, 'transactions'),
    lines: applyOperations(before.lines, operations, 'ledgerLines'),
  };
  const accounts = applyOperations(mapDocuments<Account>(accountDocs?.docs ?? []), operations, 'accounts');
  const fees = recordCardFeesForWrite(before, after, accounts);
  for (const [id, line] of fees) after.lines.set(id, line);
  const finalOperations = withRecordedFees(operations, fees);
  const projection = emptyProjection();
  applyPostings(projection, after, 1);
  if (projection.cycles.size + finalOperations.length >= 499)
    throw new Error('This ledger is too large to initialize in one transaction.');
  const revision = 1;
  const next: LedgerState = {
    version: SUMMARY_VERSION, revision,
    cycleRevisions: Object.fromEntries([...projection.cycles.keys()].map((id) => [id, revision])),
    balances: projection.balances,
  };
  for (const [id, cycle] of projection.cycles) transaction.set(summary.doc(id), { ...cycle, revision });
  transaction.set(summary.doc(SUMMARY_STATE), next);
  commitOperations(transaction, household, finalOperations);
  return next;
}

export async function initializeLedgerSummaries(db: Firestore, householdId: string) {
  const household = db.collection('households').doc(householdId);
  return db.runTransaction(async (transaction) => {
    const state = (await transaction.get(household.collection(SUMMARY_COLLECTION).doc(SUMMARY_STATE))).data() as LedgerState | undefined;
    if (state?.version === SUMMARY_VERSION) return state;
    if (state && Number(state.version) !== 0) throw new Error('Ledger summary version is unsupported.');
    return createLedgerSummary(transaction, household);
  });
}

/** Read the authoritative old records inside the commit. Replays and concurrent writes use the actual committed state. */
export async function writeLedger(db: Firestore, transaction: Transaction, householdId: string, operations: LedgerOperation[]) {
  const household = db.collection('households').doc(householdId);
  const collection = (name: string) => household.collection(name);
  const stateRef = collection(SUMMARY_COLLECTION).doc(SUMMARY_STATE);
  const stored = (await transaction.get(stateRef)).data();
  if (stored && stored.version !== 0 && stored.version !== SUMMARY_VERSION) throw new Error('Ledger summary version is unsupported.');
  const state = stored?.version === SUMMARY_VERSION ? stored as LedgerState : undefined;
  if (!state) {
    await createLedgerSummary(transaction, household, operations);
    return;
  }
  if (operations.some((op) => op.collectionName !== 'conversionDetails' && op.collectionName !== 'cards')) {
    const lineWrites = operations.filter((op) => op.collectionName === 'ledgerLines');
    const priorWrittenLines = lineWrites.length ? mapDocuments<LedgerLine>(await transaction.getAll(
      ...lineWrites.map((op) => collection('ledgerLines').doc(op.docId)),
    )) : new Map<string, LedgerLine>();
    const transactionIds = new Set(operations.filter((op) => op.collectionName === 'transactions').map((op) => op.docId));
    for (const [id, line] of priorWrittenLines) {
      const replacement = lineWrites.find((op) => op.docId === id);
      if (replacement?.type === 'set' && replacement.data?.transactionId !== line.transactionId)
        throw new Error('Ledger lines cannot be moved between transactions.');
      transactionIds.add(line.transactionId);
    }
    for (const op of lineWrites) if (op.type === 'set') transactionIds.add(op.data?.transactionId as string);
    const readTransactions = async (ids: string[]) => ids.length
      ? mapDocuments<FinanceTransaction>(await transaction.getAll(...ids.map((id) => collection('transactions').doc(id))))
      : new Map<string, FinanceTransaction>();
    const readLines = async (field: string, ids: Iterable<string>) => mapDocuments<LedgerLine>(
      (await Promise.all(batches(ids).map((group) => transaction.get(collection('ledgerLines').where(field, 'in', group))))).flatMap((snap) => snap.docs),
    );
    const [oldTransactions, oldLines] = await Promise.all([
      readTransactions([...transactionIds]), readLines('transactionId', transactionIds),
    ]);
    const before = { transactions: oldTransactions, lines: oldLines };
    const after = {
      transactions: applyOperations(oldTransactions, operations, 'transactions'),
      lines: applyOperations(oldLines, operations, 'ledgerLines'),
    };
    const feeAccounts = [...new Set([...after.lines.values()]
      .filter((line) => requiresCardFeeDecision(after.transactions.get(line.transactionId), line))
      .map((line) => line.accountId))];
    if (feeAccounts.length) {
      const accounts = mapDocuments<Account>(await transaction.getAll(...feeAccounts.map((id) => collection('accounts').doc(id))));
      const fees = recordCardFeesForWrite(before, after, applyOperations(accounts, operations, 'accounts'));
      for (const [id, line] of fees) after.lines.set(id, line);
      operations = withRecordedFees(operations, fees);
    }
    const delta = projectDifference(before, after);
    const cycleIds = [...delta.cycles.keys()];
    const snapshots = cycleIds.length
      ? await transaction.getAll(...cycleIds.map((id) => collection(SUMMARY_COLLECTION).doc(id))) : [];
    const projection: Projection = {
      balances: { ...state.balances },
      cycles: new Map(snapshots.filter((doc) => doc.exists).map((doc) => [doc.id, doc.data() as CycleSummary])),
    };
    combineProjection(projection, delta);
    const revision = state.revision + 1;
    const cycleRevisions = { ...state.cycleRevisions };
    for (const [id, cycle] of projection.cycles) {
      transaction.set(collection(SUMMARY_COLLECTION).doc(id), { ...cycle, revision });
      cycleRevisions[id] = revision;
    }
    transaction.set(stateRef, {
      ...state, revision, cycleRevisions, balances: projection.balances,
    } satisfies LedgerState);
  }

  commitOperations(transaction, household, operations);
}
