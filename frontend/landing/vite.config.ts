import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/kippa/',
  plugins: [react()],
  build: {
    sourcemap: true,
  },
});
