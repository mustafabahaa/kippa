import { z } from 'zod';
import { ledgerLib } from '@/libs/ledger';
import { transactionsLib } from '@/libs/transactions';
import { defineAiTool } from '../toolRegistry';
import { auditUser, currency, id, isoDate, money, requireAccount, requireCategory } from './shared';

export const updateTransactionTool = defineAiTool({
  description:
    'Propose editing an existing income or expense transaction. Requires user confirmation. Transfers and adjustments cannot be edited.',
  inputSchema: z
    .object({
      transactionId: id,
      type: z.enum(['income', 'expense']),
      date: isoDate,
      description: z.string().trim().max(240).nullable().optional(),
      categoryId: id.nullable().optional(),
      budgetCycleId: id.nullable().optional(),
      accountId: id,
      amount: money,
      currency,
    })
    .strict(),
  risk: 'write',
  confirmation: (input) => `Update transaction: ${input.description || input.date}`,
  async execute({ transactionId, accountId, amount, currency: currencyCode, ...updates }, context) {
    const [transactions, account] = await Promise.all([
      ledgerLib.getTransactions(context.householdId),
      requireAccount(context.householdId, accountId),
    ]);
    const existing = transactions.find((item) => item.id === transactionId);
    if (!existing || existing.status !== 'posted') throw new Error('Posted transaction not found.');
    if (existing.type === 'transfer' || existing.type === 'adjustment')
      throw new Error('Transfers and adjustments cannot be edited.');
    if (account.currency !== currencyCode) throw new Error('Transaction currency must match the account.');
    if (updates.categoryId) await requireCategory(context.householdId, updates.categoryId);
    await transactionsLib.updateTransaction(
      context.householdId,
      transactionId,
      updates,
      { accountId, signedAmount: updates.type === 'expense' ? -amount : amount, currency: currencyCode },
      auditUser(context),
    );
    return { transactionId };
  },
});
