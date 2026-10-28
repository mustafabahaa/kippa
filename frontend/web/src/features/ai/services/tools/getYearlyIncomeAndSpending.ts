import { z } from 'zod';
import type { LedgerLine } from '@kippa/domain';
import { ledgerLib } from '@/libs/ledger';
import { getPostedLedgerLines } from '@/libs/financeCalculations';
import { defineAiTool } from '../toolRegistry';

export const getYearlyIncomeAndSpendingTool = defineAiTool({
  description:
    'Calculate posted income and expense totals for a calendar year. Transfers and adjustments are excluded.',
  inputSchema: z.object({ year: z.number().int().min(2000).max(2100) }).strict(),
  risk: 'read',
  async execute({ year }, context) {
    const [transactions, ledgerLines] = await Promise.all([
      ledgerLib.getTransactions(context.householdId),
      ledgerLib.getLedgerLines(context.householdId) as Promise<LedgerLine[]>,
    ]);
    const relevant = transactions.filter(
      (transaction) =>
        transaction.status === 'posted' &&
        transaction.date.startsWith(`${year}-`) &&
        (transaction.type === 'income' || transaction.type === 'expense'),
    );
    const relevantIds = new Set(relevant.map((transaction) => transaction.id));
    const transactionById = new Map(relevant.map((transaction) => [transaction.id, transaction]));
    const totals: Record<string, { income: number; spending: number }> = {};
    for (const line of getPostedLedgerLines(relevant, ledgerLines).filter((line) =>
      relevantIds.has(line.transactionId),
    )) {
      const transaction = transactionById.get(line.transactionId);
      if (!transaction) continue;
      const bucket = totals[line.currency] ?? { income: 0, spending: 0 };
      if (transaction.type === 'income' && line.signedAmount > 0) bucket.income += line.signedAmount;
      if (transaction.type === 'expense' && line.signedAmount < 0) bucket.spending += Math.abs(line.signedAmount);
      totals[line.currency] = bucket;
    }
    return { year, totals };
  },
});
