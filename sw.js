// Service Worker – English Coach Cache Strategy

const CACHE_VERSION = 'v15';
const STATIC_CACHE = `static-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app-inline.js?v=15',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './vocab/vocab.json',
  './vocab/hints.json',
  './vocab/sentences.json',
  './vocab/sentence_builder.json',
  './vocab/achievements.json',
  './vocab/cards.json'
];

self.addEventListener('install', (event) => {

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );

  self.skipWaiting();

});

self.addEventListener('activate', (event) => {

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) =>
              key.startsWith('static-') &&
              key !== STATIC_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
  );

  self.clients.claim();

});

self.addEventListener('fetch', (event) => {

  const req = event.request;
  const url = new URL(req.url);

  if(req.mode === 'navigate'){

    event.respondWith(
      fetch(req)
        .then((res) => {

          const copy = res.clone();

          caches
            .open(STATIC_CACHE)
            .then((cache) =>
              cache.put('./index.html', copy)
            )
            .catch(() => {});

          return res;

        })
        .catch(() =>
          caches.match('./index.html')
        )
    );

    return;

  }

  const isJson =
    url.pathname.endsWith('/vocab.json') ||
    url.pathname.endsWith('/hints.json') ||
    url.pathname.endsWith('/sentences.json') ||
    url.pathname.endsWith('/sentence_builder.json') ||
    url.pathname.endsWith('/achievements.json') ||
    url.pathname.endsWith('/cards.json');

  if(isJson){

    event.respondWith(
      fetch(req)
        .then((res) => {

          const copy = res.clone();

          caches
            .open(STATIC_CACHE)
            .then((cache) =>
              cache.put(req, copy)
            )
            .catch(() => {});

          return res;

        })
        .catch(() =>
          caches.match(req)
        )
    );

    return;

  }

  event.respondWith(
    caches
      .match(req)
      .then((cached) =>
        cached || fetch(req)
      )
  );

});

self.addEventListener('message', (event) => {

  if(
    event.data &&
    event.data.type === 'SKIP_WAITING'
  ){
    self.skipWaiting();
  }

});
