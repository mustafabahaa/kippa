import { z } from 'zod';
import { defineAiTool } from '../toolRegistry';
import { id } from './shared';

export const switchHouseholdTool = defineAiTool({
  description: 'Propose switching the app to another household the user already belongs to. Requires confirmation.',
  inputSchema: z.object({ householdId: id }).strict(),
  risk: 'sensitive',
  confirmation: () => 'Switch the active household',
  execute: ({ householdId }, context) => {
    if (!context.appActions) throw new Error('Household actions are unavailable.');
    return context.appActions.switchHousehold(householdId);
  },
});
