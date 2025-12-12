
// Service Worker – einfache Cache-Strategie
const CACHE_VERSION = 'v4';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  './','./index.html','./style.css','./app-inline.js',
  './manifest.webmanifest','./icon-192.png','./icon-512.png','./vocab/vocab.json'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache)=> cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys)=> Promise.all(keys.filter(k=>k.startsWith('static-') && k!==STATIC_CACHE).map(k=> caches.delete(k)) )));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then(cached=> cached || fetch(req).then(res=>{
      const copy=res.clone(); caches.open(STATIC_CACHE).then(c=> c.put(req, copy)); return res; }))
  );
});
