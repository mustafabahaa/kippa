import { z } from 'zod';
import { defineAiTool } from '../toolRegistry';
import { id } from './shared';

export const decideHouseholdJoinRequestTool = defineAiTool({
  description:
    'Propose approving or rejecting a household join request. Owner authorization is enforced by the application service. Requires confirmation.',
  inputSchema: z.object({ requesterUid: id, decision: z.enum(['approve', 'reject']) }).strict(),
  risk: 'sensitive',
  confirmation: (input) => `${input.decision === 'approve' ? 'Approve' : 'Reject'} this join request`,
  execute: ({ requesterUid, decision }, context) => {
    if (!context.appActions) throw new Error('Household actions are unavailable.');
    return context.appActions.decideJoinRequest(context.householdId, requesterUid, decision);
  },
});
