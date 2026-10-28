import { z } from 'zod';
import { ledgerLib } from '@/libs/ledger';
import { defineAiTool } from '../toolRegistry';
import { auditUser, currency, name } from './shared';

export const createAccountTool = defineAiTool({
  description: 'Propose creating a financial account. Requires user confirmation.',
  inputSchema: z
    .object({
      name,
      type: z.enum(['running', 'savings', 'cash', 'wallet', 'credit', 'adjustment']),
      currency,
      sortOrder: z.number().int().min(0).max(10_000).default(0),
    })
    .strict(),
  risk: 'write',
  confirmation: (input) => `Create ${input.name} (${input.currency})`,
  execute: (input, context) =>
    ledgerLib.createAccount(context.householdId, { ...input, isActive: true }, auditUser(context)),
});
