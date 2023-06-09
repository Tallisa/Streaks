import {
  defineConfig
} from 'vite'
import {
  svelte
} from '@sveltejs/vite-plugin-svelte'
import {
  VitePWA
} from 'vite-plugin-pwa'


export default ({
  mode
}) => {
  const isDev = mode === 'development';

  return defineConfig({
    plugins: [
      svelte(),
      // VitePWA({
      //   strategies: 'injectManifest',
      //   srcDir: 'src',
      //   filename: 'firebase-messaging-sw.js',
      //   workbox: {
      //     globPatterns: [],
      //     globIgnores: ['*'],
      //   }

      // }),
      VitePWA({
        strategies: 'injectManifest',
        injectRegister: null,
        registerType: 'autoUpdate',
        workbox: {
          sourcemap: true
        },
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html',
        },
        manifest: {
          short_name: 'Streaks',
          name: 'Streaks',
          description: "Stop Procrastinating and get shit done",
          start_url: '/',
          scope: '/',
          display: 'standalone',
          theme_color: "#ffffff",
          background_color: "#ffffff",
          icons: [{
            "src": "icons/maskable_icon_x48.png",
            "sizes": "48x48",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "icons/maskable_icon_x72.png",
            "sizes": "72x72",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "icons/maskable_icon_x96.png",
            "sizes": "96x96",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "icons/maskable_icon_x128.png",
            "sizes": "128x128",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "icons/maskable_icon_x192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "icons/maskable_icon_x384.png",
            "sizes": "384x384",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "icons/maskable_icon_x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
          }
          ]
        }
      })
    ],
    server: {
      host: true
    }
  })
}