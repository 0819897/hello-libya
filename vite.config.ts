/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg'],
      manifest: {
        name: 'Hello Libya',
        short_name: 'Hello Libya',
        description: 'تعلّم الإنجليزية للصف الرابع بالدروس القصيرة والألعاب',
        lang: 'ar',
        dir: 'rtl',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#fdf8ef',
        theme_color: '#0f766e',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache core app shell and lesson JSONs so SW updates install in <1s on mobile; cache audio on demand.
        globPatterns: ['**/*.{js,css,html,svg,png,json,webp}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /\/content\/audio\/.*\.(?:wav|mp3)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'hello-libya-audio-v1',
              expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  test: { environment: 'jsdom', globals: true, include: ['src/**/*.test.{ts,tsx}'], maxWorkers: 2, setupFiles: ['./src/test-setup.ts'] },
});
