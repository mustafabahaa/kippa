import type { FinanceTransaction, LedgerLine } from '@kippa/domain';

export const SUMMARY_COLLECTION = 'ledgerSummaries';
export const SUMMARY_STATE = '_state';
export const SUMMARY_VERSION = 1;

export type Flow = {
  accountId: string;
  currency: LedgerLine['currency'];
  type: FinanceTransaction['type'];
  categoryId: string | null;
  loanId: string | null;
  positive: boolean;
  amount: number;
};

export type CycleSummary = {
  summaryId: string;
  revision: number;
  cycleId: string | null;
  flows: Record<string, Flow>;
  dailyBalances: Record<string, Record<string, number>>;
  transactionCounts: Record<string, number>;
  categoryDays: Record<string, Record<string, { amount: number; count: number }>>;
};

export type LedgerState = {
  version: typeof SUMMARY_VERSION;
  revision: number;
  cycleRevisions: Record<string, number>;
  balances: Record<string, number>;
};

export type LedgerHistory = {
  transactions: Map<string, FinanceTransaction>;
  lines: Map<string, LedgerLine>;
};

export type Projection = { balances: Record<string, number>; cycles: Map<string, CycleSummary> };

export function cycleSummaryId(cycleId: string) {
  return `cycle-${cycleId}`;
}

function bucket(transaction: FinanceTransaction) {
  return transaction.budgetCycleId ? cycleSummaryId(transaction.budgetCycleId) : `unassigned-${transaction.date.slice(0, 7)}`;
}

function accumulator(projection: Projection, transaction: FinanceTransaction) {
  const id = bucket(transaction);
  let summary = projection.cycles.get(id);
  if (!summary) {
    summary = { summaryId: id, revision: 0, cycleId: transaction.budgetCycleId ?? null, flows: {}, dailyBalances: {}, transactionCounts: {}, categoryDays: {} };
    projection.cycles.set(id, summary);
  }
  return summary;
}

function add(target: Record<string, number>, key: string, amount: number) {
  const value = (Object.prototype.hasOwnProperty.call(target, key) ? target[key] : 0) + amount;
  if (Math.abs(value) < 1e-10) delete target[key];
  else Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });
}

function applyLine(projection: Projection, transaction: FinanceTransaction, line: LedgerLine, change: number) {
  const summary = accumulator(projection, transaction);
  const flowFields = {
    accountId: line.accountId,
    currency: line.currency,
    type: transaction.type,
    categoryId: transaction.categoryId ?? null,
    loanId: transaction.loanId ?? null,
    positive: line.signedAmount >= 0,
  };
  const key = JSON.stringify(Object.values(flowFields));
  const amount = (summary.flows[key]?.amount ?? 0) + change;
  if (Math.abs(amount) < 1e-10) delete summary.flows[key];
  else summary.flows[key] = { ...flowFields, amount };
  add(projection.balances, line.accountId, change);
  const daily = summary.dailyBalances[transaction.date] ??= {};
  add(daily, line.accountId, change);
  if (Object.keys(daily).length === 0) delete summary.dailyBalances[transaction.date];
}

function addCategoryDay(
  target: CycleSummary['categoryDays'], categoryId: string, date: string, amount: number, count: number,
) {
  const key = `category-${categoryId}`;
  const days = target[key] ??= {};
  const day = days[date] ?? { amount: 0, count: 0 };
  const next = { amount: day.amount + amount, count: day.count + count };
  if (next.count === 0 && Math.abs(next.amount) < 1e-10) delete days[date];
  else days[date] = next;
  if (Object.keys(days).length === 0) delete target[key];
}

export function applyPostings(projection: Projection, history: LedgerHistory, direction: 1 | -1) {
  const counted = new Map<string, Set<string>>();
  const outgoing = new Map<string, number>();
  for (const line of history.lines.values()) {
    const transaction = history.transactions.get(line.transactionId);
    if (transaction?.status !== 'posted') continue;
    applyLine(projection, transaction, line, line.signedAmount * direction);
    if (line.signedAmount < 0) outgoing.set(transaction.id, (outgoing.get(transaction.id) ?? 0) - line.signedAmount);
    let accounts = counted.get(transaction.id);
    if (!accounts) {
      accounts = new Set();
      counted.set(transaction.id, accounts);
    }
    if (!accounts.has(line.accountId)) {
      accounts.add(line.accountId);
      add(accumulator(projection, transaction).transactionCounts, line.accountId, direction);
    }
  }
  for (const transaction of history.transactions.values()) {
    if (transaction.status !== 'posted' || !transaction.categoryId || !transaction.budgetCycleId) continue;
    addCategoryDay(accumulator(projection, transaction).categoryDays, transaction.categoryId, transaction.date,
      (outgoing.get(transaction.id) ?? 0) * direction, direction);
  }
}

export function combineProjection(target: Projection, change: Projection) {
  for (const [id, balance] of Object.entries(change.balances)) add(target.balances, id, balance);
  for (const [id, changeCycle] of change.cycles) {
    const cycle = target.cycles.get(id) ?? { summaryId: id, revision: 0, cycleId: changeCycle.cycleId, flows: {}, dailyBalances: {}, transactionCounts: {}, categoryDays: {} };
    for (const [key, flow] of Object.entries(changeCycle.flows)) {
      const amount = (cycle.flows[key]?.amount ?? 0) + flow.amount;
      if (Math.abs(amount) < 1e-10) delete cycle.flows[key];
      else cycle.flows[key] = { ...flow, amount };
    }
    for (const [date, balances] of Object.entries(changeCycle.dailyBalances)) {
      const day = cycle.dailyBalances[date] ??= {};
      for (const [accountId, amount] of Object.entries(balances)) add(day, accountId, amount);
      if (Object.keys(day).length === 0) delete cycle.dailyBalances[date];
    }
    for (const [accountId, count] of Object.entries(changeCycle.transactionCounts)) add(cycle.transactionCounts, accountId, count);
    for (const [key, days] of Object.entries(changeCycle.categoryDays)) {
      for (const [date, day] of Object.entries(days))
        addCategoryDay(cycle.categoryDays, key.slice('category-'.length), date, day.amount, day.count);
    }
    target.cycles.set(id, cycle);
  }
}
