import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const getPushNotificationStatusTool = defineAiTool({
  description: 'Get whether this browser supports notifications and its current permission state.',
  inputSchema: emptyInput,
  risk: 'read',
  execute: async () => ({
    supported: typeof Notification !== 'undefined',
    permission: typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  }),
});
