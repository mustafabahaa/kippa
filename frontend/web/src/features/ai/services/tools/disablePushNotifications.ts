import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const disablePushNotificationsTool = defineAiTool({
  description: 'Propose unregistering push notifications on this device. Requires confirmation.',
  inputSchema: emptyInput,
  risk: 'sensitive',
  confirmation: () => 'Disable notifications on this device',
  execute: (...[, context]) => {
    if (!context.appActions) throw new Error('Device notification actions are unavailable.');
    return context.appActions.disableNotifications();
  },
});
