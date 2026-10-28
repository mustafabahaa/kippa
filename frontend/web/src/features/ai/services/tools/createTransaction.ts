import { z } from 'zod';
import { ledgerLib } from '@/libs/ledger';
import { transactionsLib } from '@/libs/transactions';
import { defineAiTool } from '../toolRegistry';
import { auditUser, currency, id, isoDate, requireCategory, signedMoney } from './shared';

export const createTransactionTool = defineAiTool({
  description:
    'Propose logging an income, expense, transfer, or adjustment with balanced ledger lines. Requires user confirmation.',
  inputSchema: z
    .object({
      type: z.enum(['income', 'expense', 'transfer', 'adjustment']),
      date: isoDate,
      description: z.string().trim().max(240).optional(),
      categoryId: id.nullable().optional(),
      budgetCycleId: id.nullable().optional(),
      lines: z
        .array(z.object({ accountId: id, signedAmount: signedMoney, currency }).strict())
        .min(1)
        .max(2),
    })
    .strict()
    .superRefine((value, ctx) => {
      const byCurrency = new Map<string, number>();
      value.lines.forEach((line) =>
        byCurrency.set(line.currency, (byCurrency.get(line.currency) ?? 0) + line.signedAmount),
      );
      if (value.type === 'transfer') {
        if (value.lines.length !== 2)
          ctx.addIssue({ code: 'custom', message: 'Transfers require exactly two ledger lines.' });
        if (new Set(value.lines.map((line) => line.accountId)).size !== value.lines.length)
          ctx.addIssue({ code: 'custom', message: 'Transfer accounts must be different.' });
        if (!value.lines.some((line) => line.signedAmount < 0) || !value.lines.some((line) => line.signedAmount > 0))
          ctx.addIssue({ code: 'custom', message: 'Transfers require one outgoing and one incoming line.' });
        if (byCurrency.size === 1 && [...byCurrency.values()].some((total) => Math.abs(total) > 0.005))
          ctx.addIssue({ code: 'custom', message: 'Same-currency transfer lines must balance to zero.' });
      }
    }),
  risk: 'write',
  confirmation: (input) => `Log ${input.type}: ${input.description || input.date}`,
  async execute(input, context) {
    const accounts = await ledgerLib.getAccounts(context.householdId);
    for (const line of input.lines) {
      const account = accounts.find((item) => item.id === line.accountId);
      if (!account) throw new Error('A selected account does not exist.');
      if (account.currency !== line.currency) throw new Error('Ledger currency must match its account.');
    }
    if (input.categoryId) await requireCategory(context.householdId, input.categoryId);
    const outgoing = input.lines.find((line) => line.signedAmount < 0);
    const incoming = input.lines.find((line) => line.signedAmount > 0);
    const conversionDetails =
      input.type === 'transfer' && outgoing && incoming && outgoing.currency !== incoming.currency
        ? {
            fromCurrency: outgoing.currency,
            toCurrency: incoming.currency,
            fromAmount: Math.abs(outgoing.signedAmount),
            toAmount: incoming.signedAmount,
            effectiveRate: incoming.signedAmount / Math.abs(outgoing.signedAmount),
            rateSource: 'manual' as const,
          }
        : undefined;
    return transactionsLib.createTransaction(
      context.householdId,
      {
        type: input.type,
        date: input.date,
        description: input.description ?? null,
        categoryId: input.categoryId ?? null,
        budgetCycleId: input.budgetCycleId ?? null,
        createdBy: context.userId,
      },
      input.lines,
      conversionDetails,
      auditUser(context),
    );
  },
});
