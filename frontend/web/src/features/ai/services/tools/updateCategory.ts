import { z } from 'zod';
import { ledgerLib } from '@/libs/ledger';
import { dedupeMerchantKeywords } from '@/libs/merchantSuggestions';
import { defineAiTool } from '../toolRegistry';
import { auditUser, id, name, requireCategory } from './shared';

export const updateCategoryTool = defineAiTool({
  description:
    'Propose renaming a category, activating or deactivating it, or replacing the merchant keywords that auto-suggest it for imported messages. merchantKeywords replaces the full keyword list. Requires user confirmation.',
  inputSchema: z
    .object({
      categoryId: id,
      name: name.optional(),
      isActive: z.boolean().optional(),
      merchantKeywords: z.array(z.string().trim().min(2).max(40)).max(60).optional(),
    })
    .strict()
    .refine(
      (value) => value.name !== undefined || value.isActive !== undefined || value.merchantKeywords !== undefined,
      { message: 'At least one category change is required.' },
    ),
  risk: 'write',
  confirmation: () => 'Update this category',
  async execute({ categoryId, merchantKeywords, ...updates }, context) {
    await requireCategory(context.householdId, categoryId);
    await ledgerLib.updateCategory(
      context.householdId,
      categoryId,
      {
        ...updates,
        ...(merchantKeywords !== undefined ? { merchantKeywords: dedupeMerchantKeywords(merchantKeywords) } : {}),
      },
      auditUser(context),
    );
    return { categoryId };
  },
});
