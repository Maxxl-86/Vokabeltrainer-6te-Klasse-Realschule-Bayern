
// Service Worker – einfache Cache-Strategie für GitHub Pages
const CACHE_VERSION = 'v4';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  './', './index.html', './style.css', './app-inline.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './vocab/vocab.json', './vocab/hints.json'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys
      .filter(k=> k.startsWith('static-') && k!==STATIC_CACHE)
      .map(k=> caches.delete(k))
    ))
  );
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  const req = event.request; const url = new URL(req.url);
  // JSON immer versuchen zu aktualisieren, fallback Cache
  if(url.pathname.endsWith('/vocab.json') || url.pathname.endsWith('.json')){
    event.respondWith(
      fetch(req).then(res=>{ const copy=res.clone(); caches.open(STATIC_CACHE).then(cache=> cache.put(req, copy)).catch(()=>{}); return res; })
      .catch(()=> caches.match(req))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(cached=> cached || fetch(req).then(res=>{ const copy=res.clone(); caches.open(STATIC_CACHE).then(cache=> cache.put(req, copy)).catch(()=>{}); return res; }))
  );
});


self.addEventListener('activate', () => {
  self.clients.matchAll({type: 'window'}).then(clients => {
    clients.forEach(client => client.navigate(client.url));
  });
});
