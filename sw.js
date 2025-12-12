
// Vokabeltrainer PWA – Service Worker v1 (Network-First)
const CACHE_NAME = 'vocab-trainer-v1';
const APP_SHELL = [
  './', './vokabeltrainer.html', './style.css', './trainer.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './data/all_units_v2.json'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
  );
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(
    fetch(req).then(res => { const clone = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, clone)); return res; })
               .catch(() => caches.match(req))
  );
});
