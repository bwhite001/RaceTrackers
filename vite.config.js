import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'

// Get version from git tag or package.json
const getVersion = () => {
  try {
    // Try to get version from git tag first
    const gitVersion = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim()
    return gitVersion
  } catch (error) {
    // Fallback to package.json version if no git tags
    try {
      const packageJson = JSON.parse(execSync('cat package.json', { encoding: 'utf8' }))
      return `v${packageJson.version}`
    } catch (fallbackError) {
      // Final fallback
      return 'v0.0.0'
    }
  }
}

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION || getVersion()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      
      manifest: {
        name: 'RaceTracker Pro',
        short_name: 'RaceTracker',
        description: 'Professional race timing and checkpoint management system for ultra-marathons, trail races, and endurance events',
        theme_color: '#21808D',
        background_color: '#FCFCF9',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['sports', 'productivity', 'utilities'],
        shortcuts: [
          {
            name: 'Create Race',
            short_name: 'New Race',
            description: 'Start a new race event',
            url: '/setup?action=new',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Checkpoint',
            short_name: 'Checkpoint',
            description: 'Open checkpoint operations',
            url: '/checkpoint',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Base Station',
            short_name: 'Base',
            description: 'Open base station',
            url: '/base-station',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          }
        ],
        share_target: {
          action: '/share',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [
              {
                name: 'raceData',
                accept: ['application/json', '.json']
              }
            ]
          }
        }
      },

      workbox: {
        // Service worker caching strategies
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        
        // Cache all navigation requests
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
        
        // Runtime caching strategies
        runtimeCaching: [
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache Google Fonts static resources
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Cache API responses (if any external APIs used)
            urlPattern: /^https:\/\/api\..*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        
        // Clean up old caches
        cleanupOutdatedCaches: true,
        
        // Skip waiting for service worker activation
        skipWaiting: true,
        clientsClaim: true
      },

      devOptions: {
        enabled: true, // Enable PWA in development
        type: 'module'
      }
    })
  ],
  
  // Optimize build
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'state-vendor': ['zustand'],
          'db-vendor': ['dexie']
        }
      }
    }
  },
  
  server: {
    host: true,
    port: 3000
  }
})
