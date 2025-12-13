// Service Worker – einfache Cache-Strategie für GitHub Pages
// WICHTIG: Erhöhen Sie diese Versionsnummer (z.B. auf v11, v12, etc.),
// WENN Sie Dateien wie index.html, style.css oder app-inline.js ändern!
const CACHE_VERSION = 'v10'; // <--- AKTUALISIERT AUF V10
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
  // Wichtig: Sofortige Übernahme des neuen Workers, um Caching-Probleme zu vermeiden
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request; 
  const url = new URL(req.url);

  // JSON-Dateien (Vokabeln) immer versuchen zu aktualisieren, bei Fehler Cache verwenden
  if(url.pathname.endsWith('/vocab.json') || url.pathname.endsWith('/hints.json')){
    event.respondWith(
      fetch(req).then(res=>{ 
        // Antwort cachen und dann zurückgeben
        const copy=res.clone(); 
        caches.open(STATIC_CACHE).then(cache=> cache.put(req, copy)).catch(()=>{}); 
        return res; 
      })
      .catch(()=> caches.match(req))
    );
    return;
  }
  
  // Alle anderen statischen Assets aus dem Cache, mit Fallback auf Netzwerk
  event.respondWith(
    caches.match(req).then(cached=> cached || fetch(req))
  );
});

// ZUSATZ: Logik, um Benutzer über ein Update zu informieren und die Seite neu zu laden
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});