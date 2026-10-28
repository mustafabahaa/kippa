import { z } from 'zod';
import { ledgerLib } from '@/libs/ledger';
import { defineAiTool } from '../toolRegistry';
import { auditUser, currency, id, name, requireAccount } from './shared';

export const updateAccountTool = defineAiTool({
  description: 'Propose changing an existing account. Requires user confirmation.',
  inputSchema: z
    .object({
      accountId: id,
      name: name.optional(),
      type: z.enum(['running', 'savings', 'cash', 'wallet', 'credit', 'adjustment']).optional(),
      currency: currency.optional(),
      isActive: z.boolean().optional(),
      sortOrder: z.number().int().min(0).max(10_000).optional(),
    })
    .strict()
    .refine((value) => Object.keys(value).some((key) => key !== 'accountId'), {
      message: 'At least one account change is required.',
    }),
  risk: 'write',
  confirmation: () => 'Update this account',
  async execute({ accountId, ...updates }, context) {
    const account = await requireAccount(context.householdId, accountId);
    await ledgerLib.updateAccount(context.householdId, accountId, { ...account, ...updates }, auditUser(context));
    return { accountId };
  },
});
