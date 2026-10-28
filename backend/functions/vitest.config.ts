import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Run source and MCP endpoint tests, but never compiled dist/ output.
    include: ['src/**/*.test.ts', 'mcp/**/*.test.ts'],
  },
});
