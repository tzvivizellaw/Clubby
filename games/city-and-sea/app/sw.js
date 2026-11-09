const CACHE='ir-veyam-v4';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  const ok=url.origin===location.origin||url.hostname.endsWith('fonts.googleapis.com')||url.hostname.endsWith('fonts.gstatic.com');
  if(!ok)return;
  e.respondWith(caches.open(CACHE).then(c=>c.match(e.request).then(hit=>{
    const net=fetch(e.request).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(e.request,res.clone());return res;}).catch(()=>hit);
    return hit||net;
  })));
});
