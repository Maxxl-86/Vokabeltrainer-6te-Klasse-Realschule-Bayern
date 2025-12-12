\
// SW v0.7.4 – Pages-kompatibel (dynamischer Basis-Pfad)
const CACHE_VERSION = '0.7.4';
const CACHE_NAME = `vt-cache-${CACHE_VERSION}`;

function basePath(){
  try{
    const scope = self.registration?.scope || self.location.href; const u=new URL(scope); let p=u.pathname; if(!p.endsWith('/')) p+='/'; return p;
  }catch{ return '/'; }
}
const BASE = basePath();
const PRECACHE = ['', 'index.html', 'style.css', 'app-inline.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'import.html', 'importer.js'].map(f=>BASE+f);

self.addEventListener('install', evt=>{ self.skipWaiting(); evt.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(PRECACHE))); });
self.addEventListener('activate', evt=>{ evt.waitUntil((async()=>{ const ks=await caches.keys(); await Promise.all(ks.map(k=>k!==CACHE_NAME?caches.delete(k):Promise.resolve())); await self.clients.claim(); const cls=await self.clients.matchAll({includeUncontrolled:true}); for(const c of cls) c.postMessage({type:'SW_ACTIVATED', version:CACHE_VERSION}); })()); });
self.addEventListener('fetch', evt=>{ const req=evt.request; evt.respondWith((async()=>{ const cache=await caches.open(CACHE_NAME); const cached=await cache.match(req); const net=fetch(req).then(res=>{ if(req.method==='GET'&&res&&res.status===200){ cache.put(req, res.clone()); } return res; }).catch(()=>cached); return cached||net; })()); });
