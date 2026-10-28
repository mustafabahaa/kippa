import { z } from 'zod';
import type { LedgerLine } from '@kippa/domain';
import { ledgerLib } from '@/libs/ledger';
import { defineAiTool } from '../toolRegistry';
import { id, isoDate } from './shared';

export const listTransactionsTool = defineAiTool({
  description:
    'List transactions filtered by cycle, date range, status, account, category, description search text, or amount range. Returns matching transactions with their ledger lines.',
  inputSchema: z
    .object({
      cycleId: id.optional(),
      startDate: isoDate.optional(),
      endDate: isoDate.optional(),
      status: z.enum(['posted', 'voided', 'draft']).optional(),
      accountId: id.optional(),
      categoryId: id.optional(),
      search: z.string().trim().min(2).max(80).optional(),
      minAmount: z.number().min(0).max(1_000_000_000).optional(),
      maxAmount: z.number().min(0).max(1_000_000_000).optional(),
      limit: z.number().int().min(1).max(100).default(30),
    })
    .strict()
    .refine((value) => !value.startDate || !value.endDate || value.startDate <= value.endDate, {
      message: 'startDate must be on or before endDate',
    })
    .refine(
      (value) => value.minAmount === undefined || value.maxAmount === undefined || value.minAmount <= value.maxAmount,
      { message: 'minAmount must be at most maxAmount' },
    ),
  risk: 'read',
  async execute(
    { cycleId, startDate, endDate, status, accountId, categoryId, search, minAmount, maxAmount, limit },
    context,
  ) {
    const [transactions, lines] = await Promise.all([
      ledgerLib.getTransactions(context.householdId, cycleId),
      ledgerLib.getLedgerLines(context.householdId) as Promise<LedgerLine[]>,
    ]);
    const linesByTransaction = new Map<string, LedgerLine[]>();
    for (const line of lines)
      linesByTransaction.set(line.transactionId, [...(linesByTransaction.get(line.transactionId) ?? []), line]);
    const amountOf = (transactionId: string) =>
      (linesByTransaction.get(transactionId) ?? []).reduce((total, line) => total + Math.abs(line.signedAmount), 0);
    const searchLower = search?.toLocaleLowerCase();
    const filtered = transactions.filter(
      (item) =>
        (!startDate || item.date >= startDate) &&
        (!endDate || item.date <= endDate) &&
        (!status || item.status === status) &&
        (!accountId || (linesByTransaction.get(item.id) ?? []).some((line) => line.accountId === accountId)) &&
        (!categoryId || item.categoryId === categoryId) &&
        (!searchLower || (item.description ?? '').toLocaleLowerCase().includes(searchLower)) &&
        (minAmount === undefined || amountOf(item.id) >= minAmount) &&
        (maxAmount === undefined || amountOf(item.id) <= maxAmount),
    );
    const selected = filtered.slice(0, limit);
    const selectedIds = new Set(selected.map((item) => item.id));
    return {
      transactions: selected,
      ledgerLines: lines.filter((line) => selectedIds.has(line.transactionId)),
      hasMore: filtered.length > selected.length,
    };
  },
});
