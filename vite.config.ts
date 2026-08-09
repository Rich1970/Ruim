import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Ruim — persoonlijke abundance-app. Volledig statisch, geen backend.
// Alle data blijft op het toestel. Werkt offline als PWA.
// BASE_PATH laat de app zowel op een subpad (GitHub Pages: /spoorwijs/)
// als op de root (Vercel/Netlify: /) draaien.
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Alles is lokaal; geen runtime caching van externe hosts nodig.
        navigateFallback: '/index.html',
      },
      // start_url/scope niet vastzetten: het plugin leidt ze af van `base`,
      // zodat het klopt op zowel root als subpad. Icoonpaden zijn relatief.
      manifest: {
        name: 'Ruim',
        short_name: 'Ruim',
        description: 'Een rustige plek. Eén trede omhoog per keer.',
        lang: 'nl',
        dir: 'ltr',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        categories: ['lifestyle', 'health'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5178,
    allowedHosts: true,
  },
})
