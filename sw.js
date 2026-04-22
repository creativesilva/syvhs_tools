// SYVHS Tools — Service Worker
// Provides: offline caching + notification delivery support
const CACHE = 'syvhs-v8';
const PRECACHE = [
  './index.html',
  './countdown.html',
  './extension_search.html',
  './calendar.html',
  './SY_AppIcon.png',
  './assets/SYVHS_Logo_Only.svg',
  './assets/SYVHS_Logo.svg',
  './manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Network-first for HTML pages so updates appear immediately
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache-first for static assets (images, manifest)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => cached);
    })
  );
});

// Receive notification requests from the page
self.addEventListener('message', e => {
  if (e.data?.type === 'SYVHS_NOTIFY') {
    const { title, body, tag } = e.data;
    e.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon:  './SY_AppIcon.png',
        badge: './SY_AppIcon.png',
        tag:   tag || 'syvhs',
        renotify:            true,
        requireInteraction:  false,
        vibrate: [180, 80, 180]
      })
    );
  }
});
