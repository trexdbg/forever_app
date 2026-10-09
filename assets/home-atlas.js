/* Home banner — real map assets + community reference coordinates, never claimed as live spawns. */
(()=>{
 "use strict";
 const root=document.querySelector("[data-atlas-home]");
 if(!root)return;
 const en=document.documentElement.lang==="en";
 const prefix=en?"/en/":"/";
 const zones=[
   {id:"winterspring",name:en?"Winterspring":"Berceau-de-l’Hiver"},
   {id:"silithus",name:"Silithus"},
   {id:"azshara",name:"Azshara"}
 ];
 const title=root.querySelector("[data-atlas-name]");
 const count=root.querySelector("[data-atlas-count]");
 const image=root.querySelector("[data-atlas-image]");
 // Match the same crop used by the full mining map for older 1024×768 textures.
 // Those files include unused right/bottom padding beyond the 1002×668 map frame.
 image.addEventListener("load",()=>{
   const legacy=image.naturalWidth>0&&image.naturalHeight>0&&image.naturalWidth/image.naturalHeight<1.42;
   image.style.width=legacy?(100*1024/1002)+"%":"100%";
   image.style.height=legacy?(100*768/668)+"%":"100%";
 });
 const markers=root.querySelector("[data-atlas-markers]");
 const map=root.querySelector("[data-atlas-map]");
 const cta=root.querySelector("[data-atlas-open]");
 const number=root.querySelector("[data-atlas-index]");
 const tabs=Array.from(root.querySelectorAll("[data-atlas-tab]"));
 const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)");
 let index=0,data=null,timer=null,visible=true;
 function renderPoints(zone){
   markers.replaceChildren();
   if(!data||!zone)return;
   const points=zone.points.filter(p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[0]>=0&&p[0]<=100&&p[1]>=0&&p[1]<=100);
   const selected=[];
   // Limit visual density, spread sampled community coordinates without inventing locations.
   const step=Math.max(1,Math.floor(points.length/40));
   for(let i=0;i<points.length&&selected.length<14;i+=step){
     const p=points[i];
     if(selected.every(q=>Math.hypot(q[0]-p[0],q[1]-p[1])>9))selected.push(p);
   }
   for(const point of selected){
     const dot=document.createElement("span");
     dot.className="atlas-live-marker";
     dot.style.left=point[0]+"%";
     dot.style.top=point[1]+"%";
     markers.append(dot);
   }
 }
 function show(next,manual=false){
   index=(next+zones.length)%zones.length;
   const z=zones[index];
   const href=prefix+"minage/?zone="+encodeURIComponent(z.id);
   title.textContent=z.name;
   image.src="/assets/maps/"+z.id+".jpg";
   cta.href=href;
   map.href=href;
   map.setAttribute("aria-label",(en?"Open the mining map of ":"Ouvrir la carte de minage de ")+z.name);
   number.textContent=String(index+1).padStart(2,"0")+" / "+String(zones.length).padStart(2,"0");
   const record=data?.zones?.find(x=>x.id===z.id);
   count.textContent=record?(en?record.points.length+" mapped reference points":record.points.length+" positions référencées"):(en?"Zone map":"Carte de zone");
   renderPoints(record);
   tabs.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.atlasTab===z.id)));
   if(manual)resetTimer();
 }
 function resetTimer(){
   if(timer!==null)window.clearInterval(timer);
   timer=null;
   if(reduced?.matches)return;
   timer=window.setInterval(()=>{
     if(!document.hidden&&visible&&!root.matches(":hover")&&!root.contains(document.activeElement))show(index+1);
   },9500);
 }
 tabs.forEach((b,i)=>b.addEventListener("click",()=>show(i,true)));
 root.querySelector("[data-atlas-prev]").addEventListener("click",()=>show(index-1,true));
 root.querySelector("[data-atlas-next]").addEventListener("click",()=>show(index+1,true));
 if("IntersectionObserver" in window){
   const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting},{threshold:.1});
   observer.observe(root);
 }
 if(reduced?.addEventListener)reduced.addEventListener("change",resetTimer);
 fetch("/data/mining-points.json",{cache:"default"})
  .then(r=>{if(!r.ok)throw new Error("Map references unavailable");return r.json()})
  .then(j=>{if(j.coordinate_system!=="wow_ui_map_normalized_percent"||!Array.isArray(j.zones))return;data=j;show(index)})
  .catch(()=>{/* Static map and zone navigation remain fully usable offline. */});
 show(0);
 resetTimer();
})();
