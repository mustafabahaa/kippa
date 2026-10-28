import { BANK_LIST } from '@/features/cards/banks/banks';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const listSupportedBanksTool = defineAiTool({
  description:
    'List bank, card-tier, network, and card-kind options supported by the card UI. Use before proposing card creation.',
  inputSchema: emptyInput,
  risk: 'read',
  execute: async () => BANK_LIST.map((bank) => ({ id: bank.id, name: bank.name, tiers: bank.tiers })),
});
