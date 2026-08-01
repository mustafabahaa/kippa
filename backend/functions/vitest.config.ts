import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Only run tests from src/, not the compiled dist/ output.
    include: ['src/**/*.test.ts'],
  },
});
