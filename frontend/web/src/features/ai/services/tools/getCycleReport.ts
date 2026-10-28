import { z } from 'zod';
import type { LedgerLine } from '@kippa/domain';
import { ledgerLib } from '@/libs/ledger';
import { cyclesLib } from '@/libs/cycles';
import { currencyLib } from '@/libs/currency';
import { calculateCycleReport } from '@/libs/cycleReport';
import { defineAiTool } from '../toolRegistry';
import { id } from './shared';

export const getCycleReportTool = defineAiTool({
  description:
    'Get a full budget-cycle report: opening and closing balances, income, spending, net cash flow, savings rate, per-account activity, and planned-versus-spent variance per category including loan payments. Defaults to the open cycle. Use for month summaries and budget-versus-actual questions.',
  inputSchema: z.object({ cycleId: id.optional() }).strict(),
  risk: 'read',
  async execute({ cycleId }, context) {
    const [accounts, categories, cycles, transactions, ledgerLines, allocations, household] = await Promise.all([
      ledgerLib.getAccounts(context.householdId),
      ledgerLib.getCategories(context.householdId),
      cyclesLib.getCycles(context.householdId),
      ledgerLib.getTransactions(context.householdId),
      ledgerLib.getLedgerLines(context.householdId) as Promise<LedgerLine[]>,
      cyclesLib.getAllBudgetAllocations(context.householdId),
      ledgerLib.getHouseholdInfo(context.householdId),
    ]);
    const cycle =
      (cycleId ? cycles.find((item) => item.id === cycleId) : cycles.find((item) => item.status === 'open')) ?? null;
    if (!cycle) throw new Error(cycleId ? 'Budget cycle not found.' : 'No open budget cycle exists.');
    const baseCurrency = household?.baseCurrency ?? 'EGP';
    const rates = await currencyLib.getRatesToBase(
      baseCurrency,
      accounts.map((account) => account.currency),
    );
    return {
      cycleId: cycle.id,
      cycleName: cycle.name,
      cycleStartDate: cycle.startDate,
      cycleEndDate: cycle.endDate ?? null,
      baseCurrency,
      report: calculateCycleReport(
        cycle,
        accounts,
        categories,
        transactions,
        ledgerLines,
        allocations,
        baseCurrency,
        rates,
      ),
    };
  },
});
