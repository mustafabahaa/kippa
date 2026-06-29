import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Only run tests from src/, not the compiled lib/ output.
    include: ['src/**/*.test.ts'],
  },
});
