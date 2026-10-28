import { z } from 'zod';
import type { LedgerLine } from '@kippa/domain';
import { ledgerLib } from '@/libs/ledger';
import { transactionsLib } from '@/libs/transactions';
import { calculateAccountBalances } from '@/libs/financeCalculations';
import { defineAiTool } from '../toolRegistry';
import { auditUser, id, isoDate, requireAccount } from './shared';

export const reconcileAccountTool = defineAiTool({
  description:
    'Propose reconciling an account to an actual balance. Creates an adjustment transaction when needed and records the reconciliation. Requires confirmation.',
  inputSchema: z
    .object({
      accountId: id,
      actualBalance: z.number().min(-1_000_000_000).max(1_000_000_000),
      date: isoDate,
      note: z.string().trim().max(240).nullable().optional(),
      budgetCycleId: id.nullable().optional(),
    })
    .strict(),
  risk: 'write',
  confirmation: (input) => `Reconcile account to ${input.actualBalance}`,
  async execute({ accountId, actualBalance, date, note, budgetCycleId }, context) {
    const [account, transactions, ledgerLines] = await Promise.all([
      requireAccount(context.householdId, accountId),
      ledgerLib.getTransactions(context.householdId),
      ledgerLib.getLedgerLines(context.householdId) as Promise<LedgerLine[]>,
    ]);
    const calculatedBalance = calculateAccountBalances([account], transactions, ledgerLines)[accountId] ?? 0;
    const difference = Number((actualBalance - calculatedBalance).toFixed(2));
    let adjustmentTransactionId: string | null = null;
    if (Math.abs(difference) > 0.001)
      adjustmentTransactionId = await transactionsLib.createTransaction(
        context.householdId,
        {
          type: 'adjustment',
          date,
          description: `Balance correction: ${note || 'Reconciliation adjustment'}`,
          createdBy: context.userId,
          budgetCycleId: budgetCycleId ?? null,
        },
        [{ accountId, signedAmount: difference, currency: account.currency }],
        undefined,
        auditUser(context),
      );
    const reconId = crypto.randomUUID();
    await ledgerLib.createReconciliation(
      context.householdId,
      reconId,
      {
        id: reconId,
        householdId: context.householdId,
        accountId,
        date,
        calculatedBalance,
        actualBalance,
        difference,
        currency: account.currency,
        createdBy: context.userId,
        createdAt: new Date().toISOString(),
        adjustmentTransactionId,
        note: note ?? null,
      },
      auditUser(context),
    );
    return { reconciliationId: reconId, calculatedBalance, actualBalance, difference, adjustmentTransactionId };
  },
});
