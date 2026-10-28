import { authLib } from '@/libs/auth';
import { defineAiTool } from '../toolRegistry';
import { emptyInput } from './shared';

export const listHouseholdMembersTool = defineAiTool({
  description:
    'List members of the active household. Owner authorization is enforced by the existing application service.',
  inputSchema: emptyInput,
  risk: 'read',
  execute: (...[, context]) => authLib.listHouseholdMembers(context.householdId),
});
