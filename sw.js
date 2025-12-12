\
// Service Worker – Cache Versioning & Precache (v0.7.3)
const CACHE_VERSION = '0.7.3';
const CACHE_NAME = `vt-cache-${CACHE_VERSION}`;

// Bestimme Basis-Pfad dynamisch (GitHub Pages kompatibel)
function getBasePath() {
  try {
    const scope = self.registration?.scope || self.location.href;
    const u = new URL(scope);
    let p = u.pathname;
    if (!p.endsWith('/')) p += '/';
    return p;
  } catch { return '/'; }
}
const BASE_PATH = getBasePath();

const FILES = [
  '',
  'index.html',
  'style.css',
  'app-inline.js',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'import.html',
  'importer.js'
];
const PRECACHE_URLS = FILES.map(f => BASE_PATH + f);

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    for (const c of clients) c.postMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    const networkPromise = fetch(req).then(res => {
      if (req.method === 'GET' && res && res.status === 200) { cache.put(req, res.clone()); }
      return res;
    }).catch(() => cached);
    return cached || networkPromise;
  })());
});
\
