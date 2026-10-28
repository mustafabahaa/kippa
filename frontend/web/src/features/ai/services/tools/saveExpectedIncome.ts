import { z } from 'zod';
import { cyclesLib } from '@/libs/cycles';
import { defineAiTool } from '../toolRegistry';
import { auditUser, currency, id, isoDate, money, name } from './shared';

export const saveExpectedIncomeTool = defineAiTool({
  description: 'Propose adding expected income to a cycle. Requires user confirmation.',
  inputSchema: z
    .object({
      budgetCycleId: id,
      expectedDate: isoDate,
      amount: money,
      currency,
      expectedRateToBaseCurrency: z.number().positive().max(1_000_000),
      label: name,
      status: z.enum(['expected', 'received', 'cancelled']).default('expected'),
      receivedTransactionId: id.nullable().optional(),
    })
    .strict(),
  risk: 'write',
  confirmation: (input) => `Add expected income: ${input.label}`,
  execute: (input, context) => cyclesLib.saveExpectedIncome(context.householdId, input, auditUser(context)),
});
