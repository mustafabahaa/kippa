import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const enablePushNotificationsTool = defineAiTool({
  description:
    'Propose enabling push notifications on this device. The browser may show a permission prompt. Requires confirmation.',
  inputSchema: emptyInput,
  risk: 'sensitive',
  confirmation: () => 'Enable notifications on this device',
  execute: (...[, context]) => {
    if (!context.appActions) throw new Error('Device notification actions are unavailable.');
    return context.appActions.enableNotifications();
  },
});
