# Epic 5: PWA Deployment & Offline Capabilities

**Epic Owner:** DevOps & Frontend Team Leads  
**Priority:** P0 (Blocker)  
**Estimated Effort:** 1 Sprint (2 weeks)  
**Dependencies:** All previous epics

## Epic Description

Configure Progressive Web App (PWA) infrastructure including service workers, offline caching, installability, and production deployment. This epic ensures the application works reliably without internet connectivity.

---

## User Stories

### Story 5.1: Service Worker Configuration

**As a** user  
**I want** the app to work offline  
**So that** I can track races in areas without internet connectivity

**Story Points:** 8  
**Sprint:** Sprint 7

#### Acceptance Criteria

- [ ] Service worker registers on app load
- [ ] All static assets cached on first visit
- [ ] App shell cached for instant loading
- [ ] Database operations work offline
- [ ] Cache updated on new version deployment
- [ ] Offline fallback page displays when needed
- [ ] Network-first strategy for API calls (if any)
- [ ] Cache-first strategy for static assets

#### Technical Implementation

**File:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      
      manifest: {
        name: 'RaceTracker Pro',
        short_name: 'RaceTracker',
        description: 'Offline-capable race tracking for volunteers and coordinators',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        
        categories: ['sports', 'utilities', 'productivity'],
        
        screenshots: [
          {
            src: 'screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: 'screenshot-narrow.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ]
      },
      
      workbox: {
        // Cache all static resources
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        
        // Runtime caching strategies
        runtimeCaching: [
          {
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
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        
        // Clean up old caches
        cleanupOutdatedCaches: true,
        
        // Skip waiting and claim clients immediately
        skipWaiting: true,
        clientsClaim: true
      },
      
      devOptions: {
        enabled: true, // Enable in development for testing
        type: 'module'
      }
    })
  ],
  
  build: {
    target: 'es2015',
    sourcemap: true,
    
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'database': ['dexie'],
          'utils': ['date-fns', 'zod']
        }
      }
    }
  }
});
```

**File:** `src/serviceWorkerRegistration.ts`

```typescript
// SOLID: Single Responsibility - Only handles SW registration
export function register(config?: {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  console.log('New content available; please refresh.');

                  if (config && config.onUpdate) {
                    config.onUpdate(registration);
                  }
                } else {
                  // Content cached for offline use
                  console.log('Content cached for offline use.');

                  if (config && config.onSuccess) {
                    config.onSuccess(registration);
                  }
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error('Error during service worker registration:', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
```

**File:** `src/main.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('App is cached and ready for offline use');
  },
  onUpdate: (registration) => {
    console.log('New version available!');
    
    // Show update notification to user
    if (confirm('New version available! Reload to update?')) {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    }
  }
});
```

---

### Story 5.2: Installability & App Manifest

**As a** user  
**I want** to install the app on my device  
**So that** I can access it like a native application

**Story Points:** 5  
**Sprint:** Sprint 7

#### Acceptance Criteria

- [ ] App manifest properly configured
- [ ] Install prompt appears on supported browsers
- [ ] App icon displays correctly when installed
- [ ] Splash screen shows on launch
- [ ] App opens in standalone mode (no browser UI)
- [ ] Works on iOS, Android, and desktop
- [ ] Proper theme colors applied
- [ ] Screenshots included in manifest

#### Technical Implementation

**File:** `public/manifest.json` (generated by Vite PWA)

```json
{
  "name": "RaceTracker Pro",
  "short_name": "RaceTracker",
  "description": "Offline-capable race tracking for volunteers and coordinators",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4A90E2",
  "orientation": "portrait-primary",
  
  "icons": [
    {
      "src": "/pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  
  "screenshots": [
    {
      "src": "/screenshots/checkpoint-mode.png",
      "sizes": "1280x720",
      "type": "image/png",
      "platform": "wide",
      "label": "Checkpoint tracking interface"
    },
    {
      "src": "/screenshots/mobile-view.png",
      "sizes": "750x1334",
      "type": "image/png",
      "platform": "narrow",
      "label": "Mobile-optimized runner grid"
    }
  ],
  
  "categories": ["sports", "utilities", "productivity"],
  
  "shortcuts": [
    {
      "name": "New Race",
      "short_name": "New",
      "description": "Create a new race",
      "url": "/create-race",
      "icons": [{ "src": "/icons/new-race.png", "sizes": "96x96" }]
    },
    {
      "name": "Checkpoint Mode",
      "short_name": "Checkpoint",
      "url": "/checkpoint",
      "icons": [{ "src": "/icons/checkpoint.png", "sizes": "96x96" }]
    }
  ]
}
```

**File:** `src/hooks/useInstallPrompt.ts`

```typescript
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// SOLID: Single Responsibility
export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setInstallPrompt(null);
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!installPrompt) {
      return false;
    }

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstallable(false);
      setInstallPrompt(null);
      return true;
    }

    return false;
  };

  return { isInstallable, promptInstall };
}
```

**File:** `src/components/InstallPrompt.tsx`

```typescript
import React from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export const InstallPrompt: React.FC = () => {
  const { isInstallable, promptInstall } = useInstallPrompt();

  if (!isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      console.log('App installed successfully');
    }
  };

  return (
    <div className="install-prompt">
      <div className="install-content">
        <h3>Install RaceTracker Pro</h3>
        <p>Install this app for offline access and a better experience</p>
        <div className="install-actions">
          <button onClick={handleInstall} className="btn btn--primary">
            Install
          </button>
          <button onClick={() => {}} className="btn btn--secondary">
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### Story 5.3: Production Build & Deployment

**As a** DevOps engineer  
**I want** optimized production builds  
**So that** the app loads quickly and performs well

**Story Points:** 5  
**Sprint:** Sprint 7

#### Acceptance Criteria

- [ ] Production build minified and optimized
- [ ] Code splitting implemented for optimal loading
- [ ] Lazy loading for routes and heavy components
- [ ] Bundle size analyzed and optimized (<500KB initial)
- [ ] Source maps generated for debugging
- [ ] Environment variables properly configured
- [ ] HTTPS enforced in production
- [ ] Deployment pipeline documented

#### Technical Implementation

**File:** `package.json` scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:analyze": "tsc && vite build --mode analyze",
    "preview": "vite preview",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\""
  }
}
```

**File:** `.env.example`

```bash
# Application
VITE_APP_NAME=RaceTracker Pro
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=false

# Database
VITE_DB_NAME=RaceTrackerDB
VITE_DB_VERSION=1
```

**File:** `netlify.toml` (example deployment)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**File:** `README-DEPLOYMENT.md`

```markdown
# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- npm 9+ installed

## Local Development

bash
npm install
npm run dev


Access at: http://localhost:5173

## Production Build

bash
npm run build
npm run preview


## Deployment Options

### Option 1: Netlify

1. Connect GitHub repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Deploy

### Option 2: Vercel

bash
npm install -g vercel
vercel --prod


### Option 3: Static Hosting

bash
npm run build
# Upload dist/ folder to any static host


## Environment Variables

Create `.env` file for local development:

bash
cp .env.example .env


For production, set variables in hosting platform.

## HTTPS Requirement

PWA features require HTTPS. All production deployments must use HTTPS.

## Testing Production Build

bash
npm run build
npm run preview


## Bundle Size Monitoring

bash
npm run build:analyze


Keep initial bundle < 500KB for optimal performance.
```

---

## Testing Strategy

**File:** `src/__tests__/pwa.integration.test.ts`

```typescript
import { describe, test, expect, beforeEach } from 'vitest';

describe('PWA Integration', () => {
  beforeEach(() => {
    // Mock service worker
    global.navigator.serviceWorker = {
      register: vi.fn().mockResolvedValue({
        onupdatefound: null,
        installing: null
      }),
      ready: Promise.resolve({
        unregister: vi.fn()
      })
    } as any;
  });

  test('service worker registers on load', async () => {
    const { register } = await import('../serviceWorkerRegistration');
    
    await register();
    
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
  });

  test('install prompt is available', () => {
    const event = new Event('beforeinstallprompt');
    window.dispatchEvent(event);
    
    // Test that event is captured
    expect(event.defaultPrevented).toBe(false);
  });

  test('app works offline', async () => {
    // Mock offline status
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    expect(navigator.onLine).toBe(false);
    
    // App should still function with IndexedDB
    const { db } = await import('../database/schema');
    expect(db).toBeDefined();
  });
});
```

---

## Sprint Planning

### Sprint 7: PWA & Deployment (Weeks 13-14)

**Goal:** Production-ready PWA deployment

**Stories:**
- Story 5.1: Service Worker Configuration (8 points)
- Story 5.2: Installability & App Manifest (5 points)
- Story 5.3: Production Build & Deployment (5 points)

**Total Story Points:** 18

**Definition of Done:**
- [ ] App works completely offline
- [ ] Installable on all major platforms
- [ ] Production build optimized (<500KB)
- [ ] Deployed to production URL
- [ ] HTTPS enforced
- [ ] Service worker caching verified
- [ ] Performance metrics acceptable (Lighthouse >90)
- [ ] Cross-browser testing complete

---

## SOLID & DRY Applications

### Single Responsibility
- Service worker registration separate from app logic
- Install prompt isolated in custom hook
- Build configuration focused on PWA features

### Open/Closed
- Workbox strategies configurable without code changes
- Cache policies extensible

### DRY
- Service worker config centralized in vite.config
- Deployment steps documented once
- Environment variables templated

---

**This completes the core epic implementation guides. Additional epics would cover UI/UX polish, advanced features, and maintenance tasks.**
