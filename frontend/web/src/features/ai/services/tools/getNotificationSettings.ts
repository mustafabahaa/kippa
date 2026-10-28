import { ledgerLib } from '@/libs/ledger';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const getNotificationSettingsTool = defineAiTool({
  description: 'Get the current user notification preferences.',
  inputSchema: emptyInput,
  risk: 'read',
  execute: (_, context) => ledgerLib.getNotificationSettings(context.householdId, context.userId),
});
