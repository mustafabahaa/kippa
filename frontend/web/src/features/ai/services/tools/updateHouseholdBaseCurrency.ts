import { z } from 'zod';
import { ledgerLib } from '@/libs/ledger';
import { defineAiTool } from '../toolRegistry';
import { currency } from './shared';

export const updateHouseholdBaseCurrencyTool = defineAiTool({
  description: 'Propose changing the household base currency. This affects app-wide display and requires confirmation.',
  inputSchema: z.object({ baseCurrency: currency }).strict(),
  risk: 'sensitive',
  confirmation: (input) => `Change household base currency to ${input.baseCurrency}`,
  execute: ({ baseCurrency }, context) => ledgerLib.updateHouseholdBaseCurrency(context.householdId, baseCurrency),
});
