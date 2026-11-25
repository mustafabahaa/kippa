import { getLedgerSnapshot, summaryActivity } from '@/libs/ledgerSummaries';
import { ledgerLib } from '@/libs/ledger';
import { cyclesLib } from '@/libs/cycles';
import { currencyLib } from '@/libs/currency';
import { calculateCycleData } from '@/libs/budgetAnalytics';
import { loansLib } from '@/libs/loans';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const getCycleAnalyticsTool = defineAiTool({
  description:
    'Get income, expense, planned-budget, expected-income, and savings totals across all budget cycles. Use this before rendering cycle trend charts.',
  inputSchema: emptyInput,
  risk: 'read',
  async execute(...[, context]) {
    const [accounts, snapshot, cycles, allocations, expectedIncomes, household, loans] = await Promise.all([
      ledgerLib.getAccounts(context.householdId),
      getLedgerSnapshot(context.householdId, 'all'),
      cyclesLib.getCycles(context.householdId),
      cyclesLib.getAllBudgetAllocations(context.householdId),
      cyclesLib.getAllExpectedIncomes(context.householdId),
      ledgerLib.getHouseholdInfo(context.householdId),
      loansLib.getLoans(context.householdId),
    ]);
    const { transactions, lines: ledgerLines } = summaryActivity(snapshot.cycles);
    const baseCurrency = household?.baseCurrency ?? 'EGP';
    const rates = await currencyLib.getRatesToBase(
      baseCurrency,
      accounts.map((account) => account.currency),
    );
    return {
      baseCurrency,
      cycles: calculateCycleData(
        cycles,
        transactions,
        ledgerLines,
        allocations,
        expectedIncomes,
        baseCurrency,
        rates,
        loans,
      ),
    };
  },
});
