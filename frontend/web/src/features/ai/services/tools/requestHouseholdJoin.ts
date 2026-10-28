import { z } from 'zod';
import { defineAiTool } from '../toolRegistry';
import { id } from './shared';

export const requestHouseholdJoinTool = defineAiTool({
  description: 'Propose requesting access to another household by ID. Requires confirmation.',
  inputSchema: z.object({ householdId: id }).strict(),
  risk: 'sensitive',
  confirmation: () => 'Request access to this household',
  execute: ({ householdId }, context) => {
    if (!context.appActions) throw new Error('Household actions are unavailable.');
    return context.appActions.requestToJoinHousehold(householdId);
  },
});
