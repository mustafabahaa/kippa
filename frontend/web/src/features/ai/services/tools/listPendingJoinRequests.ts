import { dbLib } from '@/libs/db';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const listPendingJoinRequestsTool = defineAiTool({
  description: 'List pending requests to join the active household. Only the household owner can read them.',
  inputSchema: emptyInput,
  risk: 'read',
  async execute(_, context) {
    const requests = await dbLib.getDocs(context.householdId, 'joinRequests', [
      { field: 'status', op: '==', value: 'pending' },
    ]);
    return requests.sort((a, b) => Number(b.requestedAt ?? 0) - Number(a.requestedAt ?? 0));
  },
});
