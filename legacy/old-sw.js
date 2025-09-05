const CACHE = 'base-converter-cache';
const ASSETS = [
  '.',
  './assets/icons/android-chrome-192.png',
  './assets/icons/android-chrome-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon.ico',
  './assets/icons/favicon.svg',
  './assets/icons/mstile.png',
  './index.html',
  './app.js',
  './manifest.json',
  './pwa-check.html',
  './styles.css',
  './sw.js'
];

// Service Worker Lifecycle Events
// ------------------------------
// 1. install: Caches all static assets for offline use
self.addEventListener('install', e => {
  self.skipWaiting(); // Force activation without waiting
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ASSETS.map(a => c.add(new Request(a))))));
});

// 2. activate: Cleans up old caches and claims clients
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => clients.claim()) // Take control of all clients
  );
});

// 3. fetch: Implements cache-first strategy with network update
self.addEventListener('fetch', e => {
  // Skip non-GET requests and non-HTTP/HTTPS URLs
  if (e.request.method !== 'GET' || !['http:', 'https:'].includes(new URL(e.request.url).protocol)) return;
  
  e.respondWith(
    caches.match(e.request).then(cached => {
      // Try network and update cache in background
      const networked = fetch(e.request, {cache: 'no-store'})
        .then(r => {
          if (r && r.status === 200) {
            // Store fresh version in cache
            const cacheClone = r.clone();
            caches.open(CACHE).then(c => c.put(e.request, cacheClone));

            // Check for content updates and notify clients if needed
            if (cached) {
              const compareClone = r.clone();
              const cachedClone = cached.clone();
              Promise.all([compareClone.text(), cachedClone.text()]).then(([newContent, cachedContent]) => {
                if (newContent !== cachedContent && clients) {
                  clients.matchAll().then(clients => {
                    clients.forEach(client => {
                      if (client.url.includes('pwa-check.html')) {
                        client.postMessage({ 
                          type: 'UPDATE_AVAILABLE',
                          url: e.request.url
                        });
                      }
                    });
                  });
                }
              });
            }
          }
          return r;
        })
        .catch(() => cached); // Fallback to cache on network failure
      return cached || networked; // Return cached response or network promise
    })
  );
});