import { getLedgerSnapshot, summaryActivity } from '@/libs/ledgerSummaries';
import { ledgerLib } from '@/libs/ledger';
import { cyclesLib } from '@/libs/cycles';
import { currencyLib } from '@/libs/currency';
import { computeDashboard } from '@/libs/selectors';
import { loansLib } from '@/libs/loans';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const getDashboardSummaryTool = defineAiTool({
  description:
    'Get the same actionable current-cycle summary used by the dashboard: balances converted to base currency, spending, income, savings status, safe daily spend, and category status.',
  inputSchema: emptyInput,
  risk: 'read',
  async execute(...[, context]) {
    const [accounts, categories, activeCycle, household, loans] = await Promise.all([
      ledgerLib.getAccounts(context.householdId),
      ledgerLib.getCategories(context.householdId),
      cyclesLib.getActiveCycle(context.householdId),
      ledgerLib.getHouseholdInfo(context.householdId),
      loansLib.getLoans(context.householdId),
    ]);
    const [snapshot, allocations, expectedIncomes] = await Promise.all([
      getLedgerSnapshot(context.householdId, activeCycle?.id),
      activeCycle ? cyclesLib.getBudgetAllocations(context.householdId, activeCycle.id) : [],
      activeCycle ? cyclesLib.getExpectedIncomes(context.householdId, activeCycle.id) : [],
    ]);
    const { transactions, lines: ledgerLines } = summaryActivity(snapshot.cycles);
    const baseCurrency = household?.baseCurrency ?? 'EGP';
    const rates = await currencyLib.getRatesToBase(
      baseCurrency,
      accounts.map((account) => account.currency),
    );
    return computeDashboard(
      accounts,
      transactions,
      ledgerLines,
      categories,
      activeCycle,
      allocations.filter((item) => item.budgetCycleId === activeCycle?.id),
      expectedIncomes.filter((item) => item.budgetCycleId === activeCycle?.id),
      rates,
      baseCurrency,
      loans,
      snapshot.balances,
    );
  },
});
