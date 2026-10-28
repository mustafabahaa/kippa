import { ledgerLib } from '@/libs/ledger';
import { authLib } from '@/libs/auth';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const listMyHouseholdsTool = defineAiTool({
  description: 'List households the current user belongs to and identify the active household.',
  inputSchema: emptyInput,
  risk: 'read',
  async execute(_, context) {
    const profile = await authLib.getUserProfile(context.userId);
    const householdIds = profile?.householdIds ?? [];
    const households = await Promise.all(householdIds.map((householdId) => ledgerLib.getHouseholdInfo(householdId)));
    return { activeHouseholdId: profile?.householdId ?? null, households: households.filter(Boolean) };
  },
});
