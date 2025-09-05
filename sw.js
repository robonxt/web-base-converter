const CACHE = 'site-cache';
const ASSETS = [
  '.',
  './index.html',
  './styles.css',
  './app.js',
  './base-converter.js',
  './manifest.json',
  './sw.js',
  './assets/icon/sample-android-chrome-192.png',
  './assets/icon/sample-android-chrome-512.png',
  './assets/icon/sample-apple-touch-icon.png',
  './assets/icon/sample-favicon.ico',
  './assets/icon/sample-favicon.svg',
  './assets/icon/sample-mstile.png',
  './assets/icon/icon-menu.svg',
  './assets/icon/icon-info.svg',
  './assets/icon/icon-settings.svg',
  './assets/icon/icon-refresh.svg',
  './assets/icon/icon-close.svg',
  './assets/icon/icon-sun.svg',
  './assets/icon/icon-moon.svg'
];

// Install: precache assets (ignore individual failures)
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(ASSETS.map(a => c.add(new Request(a)).catch(() => undefined)))
    )
  );
});

// Activate: drop old caches and take control
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(names => Promise.all(names.map(n => (n !== CACHE ? caches.delete(n) : undefined))))
      .then(() => clients.claim())
  );
});

// Fetch: navigations -> index.html (offline); others -> cache-first with background update
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || !['http:', 'https:'].includes(url.protocol)) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(cached => fetch(e.request).catch(() => cached || caches.match('index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      const networked = fetch(e.request, { cache: 'no-store' })
        .then(r => {
          if (r && r.status === 200) {
            const rClone = r.clone();
            caches.open(CACHE).then(c => c.put(e.request, rClone));
          }
          return r;
        })
        .catch(() => cached);
      return cached || networked;
    })
  );
});