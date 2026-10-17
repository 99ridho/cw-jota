/// <reference types="vitest/config" />
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  appType: 'spa',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Morse Mini-Game · JOTA',
        short_name: 'Morse JOTA',
        description: 'Hear Morse code, pick a level, and decode mystery words. JOTA station mini-game.',
        id: '/',
        start_url: '/',
        scope: '/',
        lang: 'en',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f8eace',
        theme_color: '#f8eace',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
    {
      // `vite preview` serves deep links like /learn/2 the way nginx does.
      name: 'spa-fallback-preview',
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.method === 'GET' && req.url && !req.url.includes('.') && req.headers.accept?.includes('text/html')) {
            req.url = '/'
          }
          next()
        })
      },
    },
  ],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
