import { z } from 'zod';
import { ledgerLib } from '@/libs/ledger';
import { defineAiTool } from '../toolRegistry';
import { auditUser, id, name } from './shared';

export const createCategoryTool = defineAiTool({
  description: 'Propose creating an income or expense category. Requires user confirmation.',
  inputSchema: z
    .object({ name, type: z.enum(['income', 'expense']), parentCategoryId: id.nullable().optional() })
    .strict(),
  risk: 'write',
  confirmation: (input) => `Create ${input.name} category`,
  execute: (input, context) =>
    ledgerLib.createCategory(context.householdId, { ...input, isActive: true }, auditUser(context)),
});
