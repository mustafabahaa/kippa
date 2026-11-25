import type { Account, FinanceTransaction, LedgerLine } from '@kippa/domain';
import type { DocumentData, Firestore, Transaction } from 'firebase-admin/firestore';
import {
  applyLegacyFees, applyPostings, combineProjection, isLegacyFeeCandidate, SUMMARY_COLLECTION, SUMMARY_STATE,
  SUMMARY_VERSION, type CycleSummary, type LedgerHistory, type LedgerState, type Projection,
} from './projection.js';

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

export async function initializeLedgerSummaries(db: Firestore, householdId: string) {
  const household = db.collection('households').doc(householdId);
  const summary = household.collection(SUMMARY_COLLECTION);
  return db.runTransaction(async (transaction) => {
    const stateRef = summary.doc(SUMMARY_STATE);
    const current = (await transaction.get(stateRef)).data() as LedgerState | undefined;
    if (current?.version === SUMMARY_VERSION) return current;
    const [transactions, lines, accounts] = await Promise.all([
      transaction.get(household.collection('transactions')),
      transaction.get(household.collection('ledgerLines')),
      transaction.get(household.collection('accounts')),
    ]);
    const history = { transactions: mapDocuments<FinanceTransaction>(transactions.docs), lines: mapDocuments<LedgerLine>(lines.docs) };
    const projection = emptyProjection();
    applyPostings(projection, history, 1);
    const legacyAccountIds = new Set<string>();
    for (const line of history.lines.values()) {
      if (isLegacyFeeCandidate(history.transactions.get(line.transactionId), line)) legacyAccountIds.add(line.accountId);
    }
    applyLegacyFees(projection, history, [...mapDocuments<Account>(accounts.docs).values()].filter((account) =>
      legacyAccountIds.has(account.id),
    ), 1);
    if (projection.cycles.size >= 499) throw new Error('Ledger migration requires a partitioned backfill for this household.');
    const next: LedgerState = {
      version: SUMMARY_VERSION, revision: 1,
      cycleRevisions: Object.fromEntries([...projection.cycles.keys()].map((id) => [id, 1])),
      balances: projection.balances, legacyAccountIds: [...legacyAccountIds],
    };
    for (const [id, cycle] of projection.cycles) transaction.set(summary.doc(id), { ...cycle, revision: 1 });
    transaction.set(stateRef, next);
    return next;
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

  if (state && operations.some((op) => op.collectionName !== 'conversionDetails' && op.collectionName !== 'cards')) {
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
    const delta = projectDifference(before, after);

    const possibleLegacy = new Set(state.legacyAccountIds);
    const affectedAccounts = new Set(operations.filter((op) => op.collectionName === 'accounts').map((op) => op.docId));
    for (const line of oldLines.values()) affectedAccounts.add(line.accountId);
    for (const line of after.lines.values()) {
      affectedAccounts.add(line.accountId);
      if (isLegacyFeeCandidate(after.transactions.get(line.transactionId), line)) possibleLegacy.add(line.accountId);
    }
    const impacted = [...affectedAccounts].filter((id) => possibleLegacy.has(id));
    if (impacted.length) {
      const oldAccounts = mapDocuments<Account>(await transaction.getAll(...impacted.map((id) => collection('accounts').doc(id))));
      const newAccounts = applyOperations(oldAccounts, operations.filter((op) => impacted.includes(op.docId)), 'accounts');
      const normalizationIds = impacted.filter((id) => [oldAccounts.get(id), newAccounts.get(id)].some((account) =>
        account?.type === 'credit' && account.currency === 'EGP',
      ));
      if (normalizationIds.length) {
        const legacyLines = await readLines('accountId', normalizationIds);
        const otherIds = [...new Set([...legacyLines.values()].map((line) => line.transactionId))]
          .filter((id) => !transactionIds.has(id));
        const legacyTransactions = new Map([...oldTransactions, ...await readTransactions(otherIds)]);
        const adjustedLines = applyOperations(legacyLines, lineWrites, 'ledgerLines');
        // Admin queries do not all return in document ID order under an IN
        // filter. Match the stable order that the original ledger uses for
        // allocating card payments on the same calendar day.
        const stableLines = (lines: Map<string, LedgerLine>) => new Map([...lines].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
        applyLegacyFees(delta, { transactions: legacyTransactions, lines: stableLines(legacyLines) }, [...oldAccounts.values()], -1);
        const adjustedTransactions = applyOperations(legacyTransactions, operations, 'transactions');
        applyLegacyFees(delta, { transactions: adjustedTransactions, lines: stableLines(adjustedLines) }, [...newAccounts.values()], 1);
        for (const id of normalizationIds) {
          if (![...adjustedLines.values()].some((line) => line.accountId === id && isLegacyFeeCandidate(adjustedTransactions.get(line.transactionId), line)))
            possibleLegacy.delete(id);
        }
      }
    }

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
      ...state, revision, cycleRevisions, balances: projection.balances, legacyAccountIds: [...possibleLegacy],
    } satisfies LedgerState);
  } else if (!state) {
    // Fence the initial backfill even when a concurrent commit adds a document
    // that did not exist when the initializer read its collection queries.
    transaction.set(stateRef, { version: 0 });
  }

  for (const operation of operations) {
    const ref = collection(operation.collectionName).doc(operation.docId);
    if (operation.type === 'delete') transaction.delete(ref);
    else transaction.set(ref, operation.data!);
  }
}
