// Project Monitoring Log (PML) - Service Worker
const APP_VERSION = '260416-1030';
const CACHE_NAME = `pml-${APP_VERSION}`;
const CACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './store.js',
  './manifest.json',
  './service-worker.js'
];

// Install event - cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache-first strategy for app shell, network-first for API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;
  
  // For app shell resources, use cache-first
  if (CACHE_URLS.some(cacheUrl => url.pathname.endsWith(cacheUrl.replace('./', '')))) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
    return;
  }
  
  // For everything else, network-first
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses (except data)
        if (response.ok && !url.pathname.includes('/api/')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});

// Message event for version updates
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});