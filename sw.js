const V="peta-sirah-v2",FILES=["./","index.html","manifest.webmanifest","icon.svg","fonts/fonts.css"];
self.addEventListener("install",e=>{e.waitUntil((async()=>{
  const c=await caches.open(V);await c.addAll(FILES);
  const css=await (await fetch("fonts/fonts.css")).text();
  await c.addAll([...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map(m=>"fonts/"+m[1]));
  await self.skipWaiting();
})());});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r;}).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
