import { tool } from 'ai';
import type { AiChartSpec, PendingAiAction } from '../types';
import {
  executeConfirmedTool,
  executeValidatedTool,
  parseToolInput,
  type AiToolContext,
  type AiToolRegistry,
} from './toolRegistry';
import { aiToolDefinitions } from './tools';

export { aiToolDefinitions } from './tools';

export function createAiToolRegistry(): AiToolRegistry {
  return aiToolDefinitions;
}

export function toAiSdkTools(
  registry: AiToolRegistry,
  context: AiToolContext,
  onActionProposed?: (action: PendingAiAction) => void,
  onChart?: (chart: AiChartSpec) => void,
) {
  return Object.fromEntries(
    Object.entries(registry).map(([toolName, definition]) => [
      toolName,
      tool({
        description: definition.description,
        inputSchema: definition.inputSchema,
        execute: async (input) => {
          if (definition.risk === 'read' || definition.risk === 'memory') {
            const result = await executeValidatedTool(definition, input, context);
            if (toolName === 'renderChart') onChart?.(result as AiChartSpec);
            return result;
          }
          const parsed = await parseToolInput(definition, input);
          const action: PendingAiAction = {
            id: crypto.randomUUID(),
            toolName,
            input: parsed,
            summary: definition.confirmation?.(parsed) ?? 'Confirm this change',
            risk: definition.risk,
          };
          onActionProposed?.(action);
          return {
            status: 'confirmation_required',
            actionId: action.id,
            message: 'The user must confirm this action using the confirmation control. Do not claim it was completed.',
          };
        },
      }),
    ]),
  );
}

export async function executePendingAiAction(action: PendingAiAction, context: AiToolContext): Promise<unknown> {
  const definition = createAiToolRegistry()[action.toolName];
  if (!definition || definition.risk === 'read') throw new Error('This action is no longer available.');
  return executeConfirmedTool(definition, action.input, context);
}
