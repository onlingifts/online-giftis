/* Customer PWA: cache ONLY a generic offline screen. No user data, API or checkout caching. */
const OFFLINE_CACHE="onlinegiftis-offline-v1";
const OFFLINE_PAGE="/offline.html";
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(OFFLINE_CACHE).then(async cache=>{await cache.add(OFFLINE_PAGE);await cache.add("/assets/favicon-ar-192.png").catch(()=>{});}).catch(()=>{}).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(Promise.all([
   caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("onlinegiftis-offline-")&&k!==OFFLINE_CACHE).map(k=>caches.delete(k)))),
   self.clients.claim()
 ]));
});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.mode!=="navigate"||request.method!=="GET")return;
 if(new URL(request.url).origin!==self.location.origin)return;
 event.respondWith(fetch(request).catch(async()=>{
   const cached=await caches.match(OFFLINE_PAGE);
   return cached||new Response("Offline",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
 }));
});
