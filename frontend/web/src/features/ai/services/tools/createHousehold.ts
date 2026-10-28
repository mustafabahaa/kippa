import { z } from 'zod';
import { defineAiTool } from '../toolRegistry';
import { name } from './shared';

export const createHouseholdTool = defineAiTool({
  description: 'Propose creating a new household. Requires confirmation.',
  inputSchema: z.object({ name }).strict(),
  risk: 'sensitive',
  confirmation: (input) => `Create household ${input.name}`,
  execute: ({ name: householdName }, context) => {
    if (!context.appActions) throw new Error('Household actions are unavailable.');
    return context.appActions.createHousehold(householdName);
  },
});
