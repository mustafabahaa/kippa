import { z } from 'zod';
import type { LedgerLine } from '@kippa/domain';
import { accountsNeedingLegacyFeeHistory } from '@/libs/creditCardFees';
import { ledgerLib } from '@/libs/ledger';
import { defineAiTool } from '../toolRegistry';
import { id, isoDate } from './shared';

export const listTransactionsTool = defineAiTool({
  description:
    'List transactions filtered by cycle, date range, status, account, category, description search text, or amount range. Searches up to 100 transactions in the requested scope and returns matching rows with ledger lines. scanLimitReached means older transactions may also match; narrow the date range to search further.',
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
    const { householdId } = context;
    const hasLocalFilters = status || accountId || categoryId || search || minAmount !== undefined || maxAmount !== undefined;
    const pageSize = hasLocalFilters ? 100 : limit;
    const page = await ledgerLib.getTransactionHistoryPage(householdId, cycleId, pageSize, undefined, { startDate, endDate });
    const linesByTransaction = new Map<string, LedgerLine[]>();
    for (const line of page.lines) {
      const lines = linesByTransaction.get(line.transactionId) ?? [];
      lines.push(line);
      linesByTransaction.set(line.transactionId, lines);
    }
    const searchLower = search?.toLocaleLowerCase();
    const candidates = page.transactions.filter((item) =>
      (!status || item.status === status) &&
      (!accountId || (linesByTransaction.get(item.id) ?? []).some((line) => line.accountId === accountId)) &&
      (!categoryId || item.categoryId === categoryId) &&
      (!searchLower || (item.description ?? '').toLocaleLowerCase().includes(searchLower)),
    );
    const candidateIds = new Set(candidates.map((item) => item.id));
    const candidateLines = page.lines.filter((line) => candidateIds.has(line.transactionId));
    const couldNeedFees = candidateLines.some((line) => line.currency === 'EGP' && line.signedAmount < 0 && !line.cardFee) &&
      candidates.some((item) => item.type === 'expense' && item.status === 'posted');
    if (couldNeedFees) {
      const accounts = await ledgerLib.getAccounts(householdId);
      const feeAccounts = accountsNeedingLegacyFeeHistory(accounts, candidates, candidateLines);
      if (feeAccounts.length > 0) {
        const feeHistory = await ledgerLib.getAccountHistory(householdId, feeAccounts);
        const normalized = new Map(feeHistory.lines.map((line) => [line.id, line]));
        for (const [id, lines] of linesByTransaction) {
          linesByTransaction.set(id, lines.map((line) => normalized.get(line.id) ?? line));
        }
      }
    }
    const amountOf = (transactionId: string) =>
      (linesByTransaction.get(transactionId) ?? []).reduce((total, line) => total + Math.abs(line.signedAmount), 0);
    const filtered = candidates.filter((item) =>
      (minAmount === undefined || amountOf(item.id) >= minAmount) &&
      (maxAmount === undefined || amountOf(item.id) <= maxAmount),
    );
    const selected = filtered.slice(0, limit);
    return {
      transactions: selected,
      ledgerLines: selected.flatMap((item) => linesByTransaction.get(item.id) ?? []),
      hasMore: filtered.length > selected.length || !!page.nextCursor,
      scanLimitReached: !!hasLocalFilters && !!page.nextCursor,
    };
  },
});
