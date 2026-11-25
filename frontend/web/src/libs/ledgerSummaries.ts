import { documentId, where } from 'firebase/firestore';
import type { BudgetCycle, FinanceTransaction, LedgerLine } from '@kippa/domain';
import { dbLib } from '@/libs/db';
import type { CycleSummary, LedgerState } from '../../../../backend/functions/src/features/ledger/projection';

const COLLECTION = 'ledgerSummaries';
const STATE = '_state';

export type LedgerSnapshot = { balances: Record<string, number>; cycles: CycleSummary[] };
type Scope = string | 'all' | undefined;

const initializing = new Map<string, Promise<void>>();

export async function getLedgerSnapshot(householdId: string, scope?: Scope): Promise<LedgerSnapshot> {
  async function read() {
    if (scope === 'all') return dbLib.getDocs(householdId, COLLECTION) as Promise<(LedgerState | CycleSummary)[]>;
    if (!scope) {
      const state = await dbLib.getDoc(householdId, COLLECTION, STATE) as LedgerState | null;
      return state ? [state] : [];
    }
    const { items } = await dbLib.getDocsPage(householdId, COLLECTION, 2, undefined, [
      where(documentId(), 'in', [STATE, `cycle-${scope}`]),
    ]);
    return items as (LedgerState | CycleSummary)[];
  }

  let documents = await read();
  let state = documents.find((document) => 'version' in document);
  if (state?.version !== 1) {
    let pending = initializing.get(householdId);
    if (!pending) {
      pending = dbLib.initializeLedgerSummary(householdId).finally(() => initializing.delete(householdId));
      initializing.set(householdId, pending);
    }
    await pending;
    documents = await read();
    state = documents.find((document) => 'version' in document);
  }
  if (state?.version !== 1) throw new Error('The ledger summary is unavailable.');
  const cycles = documents.filter((document) => 'flows' in document);
  const revisions = new Map(cycles.map((document) => [document.summaryId, document.revision]));
  const expected = scope === 'all' ? Object.keys(state.cycleRevisions) : scope ? [`cycle-${scope}`] : [];
  if (expected.some((id) => state.cycleRevisions[id] !== revisions.get(id)))
    throw new Error('The ledger summary is incomplete. Reconnect to refresh it.');
  return { balances: state.balances, cycles };
}

/** Adapt grouped signed amounts for the existing finance selectors. These rows have no transaction identity. */
export function summaryActivity(summaries: CycleSummary[]) {
  const transactions: FinanceTransaction[] = [];
  const lines: LedgerLine[] = [];
  for (const summary of summaries) {
    for (const flow of Object.values(summary.flows)) {
      const id = String(transactions.length);
      transactions.push({
        id, householdId: '', type: flow.type, date: '', status: 'posted', createdBy: '',
        createdAt: '', updatedAt: '', budgetCycleId: summary.cycleId, categoryId: flow.categoryId, loanId: flow.loanId,
      });
      lines.push({
        id, householdId: '', transactionId: id, accountId: flow.accountId, signedAmount: flow.amount,
        currency: flow.currency, createdAt: '',
      });
    }
  }
  return { transactions, lines };
}

export function cycleReportInputs(snapshot: LedgerSnapshot, cycle: BudgetCycle, allCycles: BudgetCycle[]) {
  const opening = new Map<string, number>();
  const known = new Map(allCycles.map((item) => [item.id, item]));
  const current = snapshot.cycles.find((item) => item.cycleId === cycle.id);
  for (const summary of snapshot.cycles) {
    if (summary.cycleId === cycle.id) continue;
    const assigned = summary.cycleId ? known.get(summary.cycleId) : undefined;
    if (cycle.status !== 'open' && assigned && assigned.startDate >= cycle.startDate) continue;
    for (const [date, amounts] of Object.entries(summary.dailyBalances)) {
      if (cycle.status !== 'open' && !assigned && date > (cycle.endDate ?? cycle.startDate)) continue;
      for (const [accountId, amount] of Object.entries(amounts)) opening.set(accountId, (opening.get(accountId) ?? 0) + amount);
    }
  }
  return {
    ...summaryActivity(current ? [current] : []),
    opening,
    transactionCounts: current?.transactionCounts ?? {},
  };
}
