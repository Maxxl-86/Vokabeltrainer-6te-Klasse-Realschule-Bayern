
// Service Worker – vorsichtige Cache-Strategie für GitHub Pages
// Version bump, damit neue JSON sicher geladen wird
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// Relative Pfade, da die Seite unter /Vokabeltrainer-6te-Klasse-Realschule-Bayern/ läuft
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app-inline.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
  // JSON wird dynamisch geladen und separat (network-first) behandelt
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k.startsWith('static-') && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // JSON: network-first (damit neue Units unmittelbar ankommen)
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Sonst: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      });
    })
  );
});
