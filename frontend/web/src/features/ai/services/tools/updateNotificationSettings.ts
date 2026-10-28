import { z } from 'zod';
import type { NotificationSettings } from '@kippa/domain';
import { ledgerLib } from '@/libs/ledger';
import { defineAiTool } from '../toolRegistry';
import { auditUser } from './shared';

export const updateNotificationSettingsTool = defineAiTool({
  description: 'Propose updating the current user notification preferences. Requires user confirmation.',
  inputSchema: z
    .object({
      dailyReminderEnabled: z.boolean(),
      categoryWarningEnabled: z.boolean(),
      cardExpiryWarningEnabled: z.boolean(),
      joinRequestEnabled: z.boolean(),
    })
    .strict(),
  risk: 'write',
  confirmation: () => 'Update notification preferences',
  async execute(input, context) {
    const settings: NotificationSettings = { ...input, householdId: context.householdId, userId: context.userId };
    await ledgerLib.updateNotificationSettings(context.householdId, context.userId, settings, auditUser(context));
    return settings;
  },
});
