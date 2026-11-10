const CACHE = 'chessdefense-shell-v1';
const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/boot.js',
  '/config/development.js',
  '/config/production.js',
  '/images/manifest/logo-192.png',
  '/images/manifest/logo-512.png',
  '/images/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const fresh = await fetch(request);
      const cache = await caches.open(CACHE);
      cache.put(request, fresh.clone());
      return fresh;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const home = await caches.match('/');
        if (home) return home;
      }
      return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    }
  })());
});
