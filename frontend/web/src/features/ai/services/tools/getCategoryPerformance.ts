import { z } from 'zod';
import type { LedgerLine } from '@kippa/domain';
import { ledgerLib } from '@/libs/ledger';
import { getPostedLedgerLines } from '@/libs/financeCalculations';
import { defineAiTool } from '../toolRegistry';
import { isoDate, name } from './shared';

export const getCategoryPerformanceTool = defineAiTool({
  description: 'Get posted spending totals by expense category for an explicit date period.',
  inputSchema: z
    .object({ startDate: isoDate, endDate: isoDate, categoryName: name.optional() })
    .strict()
    .refine((value) => value.startDate <= value.endDate, { message: 'startDate must be on or before endDate' }),
  risk: 'read',
  async execute({ startDate, endDate, categoryName }, context) {
    const [categories, transactions, ledgerLines] = await Promise.all([
      ledgerLib.getCategories(context.householdId),
      ledgerLib.getTransactions(context.householdId),
      ledgerLib.getLedgerLines(context.householdId) as Promise<LedgerLine[]>,
    ]);
    const normalized = categoryName?.toLocaleLowerCase();
    const selected = normalized
      ? categories.filter((category) => category.name.toLocaleLowerCase() === normalized)
      : categories.filter((category) => category.type === 'expense');
    if (normalized && selected.length === 0) throw new Error(`No active category named "${categoryName}" exists.`);
    const selectedIds = new Set(selected.map((category) => category.id));
    const relevant = transactions.filter(
      (transaction) =>
        transaction.status === 'posted' &&
        transaction.type === 'expense' &&
        transaction.date >= startDate &&
        transaction.date <= endDate &&
        !!transaction.categoryId &&
        selectedIds.has(transaction.categoryId),
    );
    const transactionById = new Map(relevant.map((transaction) => [transaction.id, transaction]));
    const categoriesById = new Map(categories.map((category) => [category.id, category]));
    const totals: Record<string, Record<string, number>> = {};
    for (const line of getPostedLedgerLines(relevant, ledgerLines)) {
      const transaction = transactionById.get(line.transactionId);
      if (!transaction?.categoryId || line.signedAmount >= 0) continue;
      const categoryNameValue = categoriesById.get(transaction.categoryId)?.name ?? 'Unknown';
      totals[categoryNameValue] ??= {};
      totals[categoryNameValue][line.currency] =
        (totals[categoryNameValue][line.currency] ?? 0) + Math.abs(line.signedAmount);
    }
    return { startDate, endDate, totals };
  },
});
