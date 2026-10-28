import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const leaveHouseholdTool = defineAiTool({
  description: 'Propose leaving the active household. This may remove access and requires confirmation.',
  inputSchema: emptyInput,
  risk: 'sensitive',
  confirmation: () => 'Leave the active household',
  execute: (_, context) => {
    if (!context.appActions) throw new Error('Household actions are unavailable.');
    return context.appActions.leaveHousehold(context.householdId);
  },
});
