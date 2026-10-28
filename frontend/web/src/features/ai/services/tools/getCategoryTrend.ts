import { z } from 'zod';
import type { LedgerLine } from '@kippa/domain';
import { ledgerLib } from '@/libs/ledger';
import { cyclesLib } from '@/libs/cycles';
import { currencyLib } from '@/libs/currency';
import { calculateCategoryTrends } from '@/libs/budgetAnalytics';
import { defineAiTool } from '../toolRegistry';
import { id, requireCategory } from './shared';

export const getCategoryTrendTool = defineAiTool({
  description:
    'Get one expense category spending trend across budget cycles. Use before rendering a category trend chart.',
  inputSchema: z.object({ categoryId: id }).strict(),
  risk: 'read',
  async execute({ categoryId }, context) {
    await requireCategory(context.householdId, categoryId);
    const [accounts, cycles, transactions, ledgerLines, household] = await Promise.all([
      ledgerLib.getAccounts(context.householdId),
      cyclesLib.getCycles(context.householdId),
      ledgerLib.getTransactions(context.householdId),
      ledgerLib.getLedgerLines(context.householdId) as Promise<LedgerLine[]>,
      ledgerLib.getHouseholdInfo(context.householdId),
    ]);
    const baseCurrency = household?.baseCurrency ?? 'EGP';
    const rates = await currencyLib.getRatesToBase(
      baseCurrency,
      accounts.map((account) => account.currency),
    );
    return {
      baseCurrency,
      trend: calculateCategoryTrends(cycles, transactions, ledgerLines, categoryId, baseCurrency, rates),
    };
  },
});
