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
      includeAssets: ['favicon.ico', 'favicon_io/apple-touch-icon.png', 'favicon_io/favicon-16x16.png', 'favicon_io/favicon-32x32.png'],
      manifest: {
        name: 'RaceTracker Pro',
        short_name: 'RaceTracker',
        description: 'Offline race tracking app for checkpoints and base stations',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1f2937',
        orientation: 'portrait-primary',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['sports', 'utilities', 'productivity'],
        lang: 'en',
        dir: 'ltr',
        prefer_related_applications: false,
        shortcuts: [
          {
            name: 'Checkpoint Mode',
            short_name: 'Checkpoint',
            description: 'Track runners at checkpoints',
            url: '/?mode=checkpoint',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192'
              }
            ]
          },
          {
            name: 'Base Station Mode',
            short_name: 'Base Station',
            description: 'Manage race data at base station',
            url: '/?mode=base-station',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192'
              }
            ]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 3000
  }
})
