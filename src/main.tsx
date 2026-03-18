import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// These are injected by vite.config.ts at build time — changing them forces a new bundle hash
declare const __BUILD_TIMESTAMP__: string;
declare const __BUILD_VERSION__: string;

const BUILD_VERSION = __BUILD_VERSION__;
const BUILD_TIMESTAMP = __BUILD_TIMESTAMP__;

console.log(`[SWOR] === APP LOADED v3.0 === ${BUILD_TIMESTAMP}`);
console.log(`[SWOR] main.tsx loaded — build ${BUILD_VERSION} — ${BUILD_TIMESTAMP}`);

// Register service worker with aggressive update strategy
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Register with cache-busting query param to ensure fresh SW file
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none' // Never use HTTP cache for SW file
      });
      console.log('[SW] Service worker registered:', registration.scope);

      // When a new SW is found, force it to activate immediately
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          console.log('[SW] New service worker found, waiting for install...');
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New SW installed, sending SKIP_WAITING');
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });

      // Force update check
      registration.update();
    } catch (error) {
      console.error('[SW] Service worker registration failed:', error);
    }
  });

  // When the controlling SW changes, reload to get fresh assets
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      console.log('[SW] Controller changed, reloading for fresh assets...');
      refreshing = true;
      window.location.reload();
    }
  });
}

// Remove dark mode class addition
createRoot(document.getElementById("root")!).render(<App />);
