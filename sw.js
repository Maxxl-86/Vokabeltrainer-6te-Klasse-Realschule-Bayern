// SW v1
const CACHE_NAME='vocab-trainer-v1';
const APP_SHELL=['./','./index.html','./import.html','./style.css','./app-inline.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./vocab/vocab.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME&&caches.delete(k)))));self.clients.matchAll({includeUncontrolled:true}).then(cs=>cs.forEach(c=>c.postMessage('SW_UPDATED')))});
self.addEventListener('fetch',e=>{const req=e.request;e.respondWith(fetch(req).then(res=>{const clone=res.clone();caches.open(CACHE_NAME).then(c=>c.put(req,clone));return res;}).catch(()=>caches.match(req)));});
