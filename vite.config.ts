/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { pbkdf2Sync, randomBytes } from 'node:crypto';

// Teacher code: read from the TEACHER_CODE secret at build time; only a salted hash reaches the app.
function teacherHash() {
  const raw = (process.env.TEACHER_CODE ?? '').trim()
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06f0));
  if (!raw) return null;
  const salt = randomBytes(16);
  const iterations = 300_000;
  return { salt: salt.toString('hex'), iterations, hash: pbkdf2Sync(raw, salt, iterations, 32, 'sha256').toString('hex') };
}

const build = new Date(Date.now() + 2 * 3600e3).toISOString().slice(0, 16).replace('T', ' '); // Libya is UTC+2

export default defineConfig({
  base: './',
  define: { __APP_BUILD__: JSON.stringify(build), __TEACHER_HASH__: JSON.stringify(teacherHash()) },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg'],
      manifest: {
        name: 'Hello Libya',
        short_name: 'Hello Libya',
        description: 'تعلّم الإنجليزية للصفين الرابع والخامس بالدروس القصيرة والألعاب',
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
        // Keep the install tiny (app shell + lesson JSON, ~50 files): an update that has to download
        // hundreds of mp3s fails on a phone if one request fails, and the old version then stays forever.
        // Audio is cached on first use, and each lesson's audio is fetched in the background when it opens
        // (prefetchAudio), so a lesson opened once also works offline.
        globPatterns: ['**/*.{js,css,html,svg,png,json,webp}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /\/content\/audio\/.*\.mp3$/i,
            handler: 'CacheFirst',
            options: {
              // Bump the version whenever the voice changes: clip file names depend only on the text.
              cacheName: 'hello-libya-audio-v3',
              expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  test: { environment: 'jsdom', globals: true, include: ['src/**/*.test.{ts,tsx}'], maxWorkers: 2, setupFiles: ['./src/test-setup.ts'] },
});
