import { defineAiTool } from '../toolRegistry';
import { chartSchema } from './shared';

export const renderChartTool = defineAiTool({
  description:
    'Render a bar, line, or pie chart inside the conversation. Only use values returned by financial data tools in this turn; never invent chart data. Prefer bar for comparisons, line for time trends, and pie only for a small part-to-whole breakdown.',
  inputSchema: chartSchema,
  risk: 'read',
  execute: async (input) => input,
});
