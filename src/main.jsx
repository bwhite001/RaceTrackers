import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use dev-dist/sw.js in development, /sw.js in production
    const swPath = import.meta.env.DEV ? '/dev-dist/sw.js' : '/sw.js';
    
    navigator.serviceWorker
      .register(swPath)
      .then(registration => {
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Check for updates periodically (every hour)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
        
        // Handle service worker updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                console.log('🔄 New content available; please refresh.');
                
                // Show update notification to user
                if (confirm('New version available! Reload to update?')) {
                  installingWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              } else {
                // Content cached for offline use
                console.log('📦 Content cached for offline use.');
              }
            }
          };
        };
      })
      .catch(error => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });

  // Handle service worker controller change
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
