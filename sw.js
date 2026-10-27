const C='varilla-v7',WIDGET_TAG='varilla-columnas',WIDGET_DATA='./widgets/current.json';
const F=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./widgets/card.json','./widgets/widget-data.json','./widgets/widget-preview.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>{
 e.waitUntil(caches.match(new URL(WIDGET_DATA,self.location.href)).then(data=>{
  if(!data)return;
  return caches.open(C).then(cache=>cache.put(new URL(WIDGET_DATA,self.location.href),data));
 }).then(()=>caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))).then(()=>self.clients.claim()).then(updateInstalledWidget));
});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
self.addEventListener('message',e=>{
 const message=e.data;
 if(!message||message.type!=='update-column-widget'||!message.data)return;
 e.waitUntil((async()=>{
  const cache=await caches.open(C);
  await cache.put(new URL(WIDGET_DATA,self.location.href),new Response(JSON.stringify(message.data),{headers:{'Content-Type':'application/json'}}));
  await updateInstalledWidget();
 })());
});
self.addEventListener('widgetinstall',e=>{
 if(e.widget.definition.tag===WIDGET_TAG)e.waitUntil(renderWidget(e.widget));
});
self.addEventListener('widgetclick',e=>{
 if(e.action==='open-app')e.waitUntil(self.clients.openWindow(new URL('./index.html',self.registration.scope).href));
});

async function updateInstalledWidget(){
 if(!('widgets'in self))return;
 const widget=await self.widgets.getByTag(WIDGET_TAG);
 if(widget)await renderWidget(widget);
}

async function renderWidget(widget){
 const templateUrl=new URL(widget.definition.msAcTemplate,self.location.href);
 const cache=await caches.open(C);
 const templateResponse=await cache.match(templateUrl);
 if(!templateResponse)throw new Error('No se encontró la plantilla del widget de Windows.');
 let dataResponse=await cache.match(new URL(WIDGET_DATA,self.location.href));
 if(!dataResponse)dataResponse=await cache.match(new URL(widget.definition.data,self.location.href));
 if(!dataResponse)throw new Error('No se encontraron los datos iniciales del widget de Windows.');
 await self.widgets.updateByTag(widget.definition.tag,{template:await templateResponse.text(),data:await dataResponse.text()});
}
