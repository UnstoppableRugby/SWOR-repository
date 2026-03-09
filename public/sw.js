// SWOR Service Worker v5 — 2026-03-08T19:09:00Z
// CHANGED: bumped cache version to v5, network-first for JS, aggressive cache clearing
const CACHE_NAME = 'swor-cache-v5';

const OFFLINE_URL = '/offline.html';

// Essential shell assets to cache
const SHELL_ASSETS = [
  '/',
  '/offline.html',
  '/placeholder.svg'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v5');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching shell assets');
      return cache.addAll(SHELL_ASSETS);
    })
  );
  // Activate immediately — don't wait for old SW to stop
  self.skipWaiting();
});

// Activate event - DELETE ALL old caches aggressively
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v5');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Known static file extensions — these are NOT SPA routes
const STATIC_EXTENSIONS = [
  '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.eot', '.json', '.xml', '.txt',
  '.webp', '.avif', '.mp4', '.webm', '.map'
];

// JS files get special treatment — network first, no stale cache
const JS_EXTENSIONS = ['.js', '.mjs'];

function isStaticAsset(url) {
  const pathname = url.pathname.toLowerCase();
  return STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext));
}

function isJSAsset(url) {
  const pathname = url.pathname.toLowerCase();
  return JS_EXTENSIONS.some(ext => pathname.endsWith(ext));
}

// Fetch event - SPA-aware routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except for CDN assets)
  if (url.origin !== location.origin && !url.hostname.includes('cloudfront.net')) {
    return;
  }

  // ── Navigation requests (HTML pages / SPA routes) ──
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
            return response;
          }

          // Server returned 404 for SPA route — serve cached index.html
          if (response.status === 404 && !isStaticAsset(url) && !isJSAsset(url)) {
            console.log('[SW] 404 for navigation to', url.pathname, '— serving cached index.html');
            return caches.match('/').then((cachedIndex) => {
              return cachedIndex || response;
            });
          }

          return response;
        })
        .catch(() => {
          // Network failure — serve from cache
          return caches.match('/')
            .then((cachedIndex) => {
              if (cachedIndex) return cachedIndex;
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }

  // ── JS files: NETWORK FIRST (never serve stale JS) ──
  if (isJSAsset(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Only use cache as offline fallback for JS
          return caches.match(request).then((cached) => {
            return cached || new Response('', { status: 404 });
          });
        })
    );
    return;
  }

  // ── Other static assets (CSS, images, fonts): stale-while-revalidate ──
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached, update in background
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, response);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }
        // Fetch and cache
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  // ── API requests and other resources — network only ──
  event.respondWith(
    fetch(request)
      .then((response) => response)
      .catch(() => caches.match(request))
  );
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message, activating now');
    self.skipWaiting();
  }
});
