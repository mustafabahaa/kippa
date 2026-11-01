import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Stub the vite-plugin-pwa virtual module for tests; the real module
      // only exists during vite dev/build.
      'virtual:pwa-register': path.resolve(__dirname, './src/test-stubs/virtual-pwa-register.ts'),
    },
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
