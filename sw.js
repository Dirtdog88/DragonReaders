// Offline support: every file is cached on install, served from the cache, and
// refreshed in the background when the network is there. Bump VERSION to drop
// old caches after a big change.

const VERSION = 'v1';
const CACHE = `reading-arcade-${VERSION}`;
const ASSETS = [
  './', './index.html', './dragon.html', './halloween.html', './kirby.html', './math.html',
  './manifest.webmanifest',
  './css/games.css', './css/arcade.css', './css/style.css', './css/halloween.css', './css/kirby.css', './css/math.css',
  './js/arcade.js', './js/art.js', './js/audio.js', './js/book.js', './js/capture.js', './js/dragons.js', './js/dressup.js',
  './js/fx.js', './js/halloween.js', './js/input.js', './js/kirby.js', './js/letters.js', './js/main.js', './js/maps.js',
  './js/math.js', './js/music.js', './js/offline.js', './js/platform.js', './js/screen.js', './js/sfx.js', './js/speech.js',
  './js/spidey.js', './js/sprites.js', './js/storage.js',
  './fonts/andika-400.woff2', './fonts/andika-700.woff2',
  './icons/favicon-32.png', './icons/icon-192.png', './icons/icon-512.png',
  './audio/letters/manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // One missing file must not stop the rest from caching.
    await Promise.all(ASSETS.map((a) => cache.add(a).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const refresh = fetch(e.request).then((res) => {
      if (res && res.ok) cache.put(e.request, res.clone());
      return res;
    }).catch(() => null);
    if (cached) {
      e.waitUntil(refresh);
      return cached;
    }
    const fresh = await refresh;
    if (fresh) return fresh;
    if (e.request.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
    return Response.error();
  })());
});
