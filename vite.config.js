import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/bangalore-metro-timings/' : '/', // Use base path only for production
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'services': [
            './src/js/services/route-finder.js',
            './src/js/services/next-train-finder.js',
            './src/js/services/schedule-service.js'
          ],
          'components': [
            './src/js/components/journey-planner.js',
            './src/js/components/next-train.js',
            './src/js/components/schedule-viewer.js'
          ]
        }
      }
    }
  },
  server: {
    port: 8000,
    open: true
  },
  preview: {
    port: 8080,
    open: true
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'icons/*.png', 'data/*.json'],
      manifest: {
        name: 'Bangalore Metro Timings',
        short_name: 'Metro Timings',
        description: 'Journey planner and schedules for Bangalore Namma Metro',
        theme_color: '#9B59B6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: command === 'build' ? '/bangalore-metro-timings/' : '/',
        scope: command === 'build' ? '/bangalore-metro-timings/' : '/',
        icons: [
          {
            src: '/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icons/icon-maskable-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Next Train',
            short_name: 'Next Train',
            description: 'Find upcoming trains',
            url: (command === 'build' ? '/bangalore-metro-timings/' : '/') + '#next-train',
            icons: [{ src: '/icons/icon-192.svg', sizes: '192x192' }]
          },
          {
            name: 'Journey Planner',
            short_name: 'Journey',
            description: 'Plan your metro journey',
            url: (command === 'build' ? '/bangalore-metro-timings/' : '/') + '#journey-planner',
            icons: [{ src: '/icons/icon-192.svg', sizes: '192x192' }]
          }
        ],
        categories: ['travel', 'navigation', 'utilities']
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tailwind-css',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'metro-data',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: false // Enable if you want PWA in dev mode
      }
    })
  ]
}));
