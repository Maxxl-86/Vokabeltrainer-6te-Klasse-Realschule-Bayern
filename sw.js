/* Service Worker v0.9.1 */
const CACHE = 'vokabeltrainer-precache-v0.9.1';
const PRECACHE_URLS = [
  'index.html',
  'style.css',
  'config.js',
  'app.js',
  'db.js',
  'sm2.js',
  'utils.js',
  'import.html',
  'import.js',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'vocab/vocab.json',
  'vocab/hints.json'
];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE_URLS)));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  const {request} = event;
  event.respondWith(
    caches.match(request).then(resp => resp || fetch(request).then(networkResp => {
      const copy = networkResp.clone();
      if(request.url.includes('/vocab/')){
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return networkResp;
    }).catch(()=>caches.match('index.html')))
  );
});
