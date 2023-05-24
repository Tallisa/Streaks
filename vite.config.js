import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), VitePWA({
    registerType: 'autoUpdate', manifest: {
      short_name: 'Streaks',
      name: 'Streaks',
      description: "Stop Procrastinating and get shit done",
      start_url: '/',
      scope: '/',
      display: 'standalone',
      theme_color: "#ffffff",
      background_color: "#000000",
      icons: [
        {
          "src": "icons/icon-72x72.png",
          "sizes": "72x72",
          "type": "image/png",
          "purpose": "any"
        },
        {
          "src": "icons/icon-96x96.png",
          "sizes": "96x96",
          "type": "image/png",
          "purpose": "any"
        },
        {
          "src": "icons/icon-128x128.png",
          "sizes": "128x128",
          "type": "image/png",
          "purpose": "any"
        },
        {
          "src": "icons/icon-144x144.png",
          "sizes": "144x144",
          "type": "image/png",
          "purpose": "any"
        },
        {
          "src": "icons/icon-152x152.png",
          "sizes": "152x152",
          "type": "image/png",
          "purpose": "any"
        },
        {
          "src": "icons/icon-192x192.png",
          "sizes": "192x192",
          "type": "image/png",
          "purpose": "any"
        },
        {
          "src": "icons/icon-284x284.png",
          "sizes": "284x284",
          "type": "image/png",
          "purpose": "any"
        },
        {
          "src": "icons/icon-512x512.png",
          "sizes": "512x512",
          "type": "image/png",
          "purpose": "any"
        }
      ],
    },
    devOptions: {
      enabled: true,
      type: 'module',
      navigateFallback: '/',
    }
  })],
  server: {
    host: true
  }
})
