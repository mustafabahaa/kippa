import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/icon.svg',
        'icons/icon-dark.svg',
        'icons/apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/maskable-192.png',
        'icons/maskable-512.png',
        'icons/maskable.svg'
      ],
      manifest: false,
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
        importScripts: ['/firebase-messaging-sw.js']
      }
    }),
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('postprocessing')) {
              return 'three-vendor';
            }
            if (id.includes('gsap')) {
              return 'gsap-vendor';
            }
            if (id.includes('@mui/x-charts')) {
              return 'mui-x-charts-vendor';
            }
            if (id.includes('@mui/x-date-pickers')) {
              return 'mui-x-date-vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
          }
        }
      }
    }
  }
});


