// Vokabeltrainer PWA – Service Worker v1 (Network-First)
const CACHE_NAME = 'vocab-trainer-v1';
const APP_SHELL = [
  './',
  './index.html',
  './import.html',
  './style.css',
  './app-inline.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.matchAll({includeUncontrolled:true}).then(clients => { clients.forEach(c => c.postMessage('SW_UPDATED')); });
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(
    fetch(req).then(res => { const resClone = res.clone(); caches.open(CACHE_NAME).then(cache => { cache.put(req, resClone); }); return res; })
               .catch(() => caches.match(req))
  );
});
