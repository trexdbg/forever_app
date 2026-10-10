/* ForEveroth Rare — Classic data, clearly distinguished from Forever sightings */
(()=>{"use strict";
const en=document.documentElement.lang==="en",T=(fr,x)=>en?x:fr,$=id=>document.getElementById(id);
const root=$("rare-app");if(!root)return;
const m=(tag,txt,cls)=>{const e=document.createElement(tag);if(txt!=null)e.textContent=txt;if(cls)e.className=cls;return e};
const norm=x=>String(x??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const fmt=x=>Number(x).toLocaleString(en?"en-US":"fr-FR",{maximumFractionDigits:1});
const canvas=$("rare-canvas"),ctx=canvas.getContext("2d"),W=1002,H=668;
const local=new Set(["azshara","blasted-lands","burning-steppes","epl","searing-gorge","silithus","swamp-of-sorrows","ungoro","winterspring","wpl"]);
let db,rows=[],filtered=[],selected=null,zoneId="",img=null,token=0,zoom=1,center=[50,50],pins=[],hover=null,drag=null;
const search=$("rare-search"),zone=$("rare-zone"),type=$("rare-rank"),level=$("rare-level"),loot=$("rare-loot"),tame=$("rare-tame"),mapped=$("rare-mapped");
const zname=id=>db?.zones?.[id]?.[en?"en":"fr"]||id;
const colors=new Map();
function buildColors(){colors.clear();const zones=[...new Set(rows.map(r=>r.zone))];for(const z of zones){const list=rows.filter(r=>r.zone===z).sort((a,b)=>a.name.en.localeCompare(b.name.en));list.forEach((r,i)=>{const hue=Math.round((198+i*137.508)%360);colors.set(r.id,`hsl(${hue} 76% 67%)`)})}}
const markerColor=r=>colors.get(r.id)||"#e0be7e";
function paintLegend(){const box=$("rare-map-legend");if(!box)return;box.replaceChildren();const groups=filtered.filter(r=>r.zone===zoneId&&r.points.length);for(const r of groups){const b=button(r.name[en?"en":"fr"],"rare-legend-entry"+(r.id===selected?.id?" active":""));const dot=m("i",null,"rare-color-dot");dot.style.backgroundColor=markerColor(r);b.prepend(dot);b.addEventListener("click",()=>choose(r));box.append(b)}if(!groups.length)box.append(m("span",T("Aucun repère pour les filtres choisis","No pins for these filters"),"rare-muted"));}

const time=n=>n==null?"?":n<1?fmt(n*60)+" min":fmt(n)+" h";
const respawn=r=>r.respawn_min_hours==null?T("Inconnu","Unknown"):time(r.respawn_min_hours)+(r.respawn_min_hours===r.respawn_max_hours?"":" – "+time(r.respawn_max_hours));
const chip=(label,kind="")=>m("span",label,"rare-chip "+kind);
const button=(label,cls)=>{const n=m("button",label,cls);n.type="button";return n};
function results(){
const q=norm(search.value.trim());
return rows.filter(r=>(zone.value==="all"||r.zone===zone.value)&&(type.value==="all"||r.classification===type.value)&&
(level.value==="all"||(level.value==="low"?r.level<=30:r.level>30))&&(!loot.checked||r.loot.length)&&(!tame.checked||r.tameable)&&(!mapped.checked||r.points.length)&&
(!q||norm([r.name.fr,r.name.en,zname(r.zone),...r.loot.map(i=>i.name.fr),...r.loot.map(i=>i.name.en)].join(" ")).includes(q)))
.sort((a,b)=>Number(!!b.loot.length)-Number(!!a.loot.length)||a.level-b.level||a.name.en.localeCompare(b.name.en));
}
function showList(){
const box=$("rare-results"),lastScroll=box.scrollTop;box.replaceChildren();$("rare-count").textContent=filtered.length+" / "+rows.length;
if(!filtered.length)box.append(m("p",T("Aucun résultat.","No results."),"rare-empty"));
for(const r of filtered){
 const b=button(null,"rare-row"+(selected?.id===r.id?" active":""));b.setAttribute("role","option");b.setAttribute("aria-selected",String(r.id===selected?.id));
 const a=m("div",null,"rare-row-name");const dot=m("i",null,"rare-color-dot");dot.style.backgroundColor=markerColor(r);dot.title=T("Couleur de ce monstre sur la carte","Creature color on the map");a.append(dot);a.append(m("strong",r.name[en?"en":"fr"]));a.append(m("b",r.level,"rare-lvl"));b.append(a);
 b.append(m("span",zname(r.zone),"rare-zone-name"));
 const meta=m("span",null,"rare-row-meta");meta.append(m("span",respawn(r)));
 if(r.loot.length)meta.append(chip(r.loot.length+" "+T("butin(s)","loot"),"purple"));
 if(r.tameable)meta.append(chip(T("Apprivoisable","Tameable"),"green"));if(!r.points.length&&!db.zones[r.zone]?.instance)meta.append(chip(T("Position à documenter","No position yet"),"rare-pending"));b.append(meta);
 b.addEventListener("click",()=>choose(r));box.append(b);
}
box.scrollTop=lastScroll;paintLegend();
}
function detail(){
const out=$("rare-detail");out.replaceChildren();if(!selected){out.append(m("p",T("Aucun rare sélectionné","No rare selected")));return}
const r=selected,top=m("div",null,"rare-detail-top");const dot=m("i",null,"rare-color-dot rare-color-large");dot.style.backgroundColor=markerColor(r);top.append(dot);top.append(m("h3",r.name[en?"en":"fr"]));
top.append(chip(r.classification==="rare_elite"?T("Rare élite","Rare elite"):T("Rare","Rare"),"purple"));out.append(top);
const tags=m("div",null,"rare-tags");tags.append(chip(zname(r.zone)));tags.append(chip(T("Niveau ","Level ")+r.level));
tags.append(chip(T("Repop : ","Respawn: ")+respawn(r),"gold"));if(r.tameable)tags.append(chip(T("Apprivoisable","Tameable"),"green"));
tags.append(chip(r.seen_forever?T("Signalé sur Forever","Seen on Forever"):T("Classic · non confirmé Forever","Classic · unverified on Forever"),r.seen_forever?"green":"gold"));out.append(tags);
const spot=m("div",null,"rare-spots");spot.append(m("strong",T("Points d’apparition possibles","Possible spawn points"),"rare-caption"));
const coords=m("div",null,"rare-coords");
if(!r.points.length)coords.append(m("span",db.zones[r.zone]?.instance?T("Rare d’instance · pas de coordonnées de zone","Instance rare · no outdoor coordinates"):T("Coordonnées non encore documentées · aucun repère inventé","Coordinates not yet documented · no fabricated marker"),"rare-muted"));
for(const p of r.points){const b=button(fmt(p[0])+" / "+fmt(p[1]),"rare-coord");b.title=T("Centrer la carte","Center map");b.addEventListener("click",()=>{zoom=Math.max(zoom,1.8);center=[p[0],p[1]];clampCenter();draw()});coords.append(b)}spot.append(coords);out.append(spot);
out.append(m("h4",T("Butins notables · Classic","Notable loot · Classic"),"rare-loot-title"));
const loots=m("div",null,"rare-loots");
if(!r.loot.length)loots.append(m("p",T("Aucun butin rare propre à ce monstre documenté ici (butins mondiaux possibles).","No unique uncommon-or-better loot recorded here (world drops remain possible)."),"rare-empty"));
for(const item of r.loot){
 const a=m(item.item_id?"a":"div",null,"rare-loot");
 if(item.item_id){a.href="https://foreverdb.net/item/"+item.item_id;a.target="_blank";a.rel="noopener noreferrer"}
 const icon=m("img");icon.src="https://wow.zamimg.com/images/wow/icons/medium/"+encodeURIComponent(item.icon||"inv_misc_questionmark")+".jpg";icon.alt="";icon.width=38;icon.height=38;icon.loading="lazy";icon.onerror=()=>{icon.onerror=null;icon.src="/assets/icons/inv_scroll_07.jpg"};a.append(icon);
 const txt=m("span",null,"rare-loot-text");txt.append(m("strong",item.name[en?"en":"fr"]));
 txt.append(m("small",item.chance_classic_percent==null?T("Taux inconnu","Chance unknown"):T("Classic : ","Classic: ")+fmt(item.chance_classic_percent)+" %"));a.append(txt);
 if(item.item_id&&window.ForeverItemTooltip)window.ForeverItemTooltip.bind(a,{id:item.item_id,name:item.name[en?"en":"fr"],source:"Classic"});loots.append(a)
}out.append(loots);
if(r.notes?.[en?"en":"fr"])out.append(m("p",r.notes[en?"en":"fr"],"rare-note"));
const foot=m("div",null,"rare-detail-foot"),a=m("a",T("Voir la source ↗","View source ↗"));a.href=r.source||db.sources.timers_and_loot;a.target="_blank";a.rel="noopener noreferrer";foot.append(a);
if(r.points.length){const b=button(T("Copier /way","Copy /way"),"rare-copy");b.addEventListener("click",async()=>{const p=r.points[0],str="/way "+p[0]+" "+p[1];try{await navigator.clipboard.writeText(str);b.textContent=T("Copié ✓","Copied ✓")}catch{b.textContent=str}});foot.append(b)}
out.append(foot);
}
function choose(r){selected=r;const change=r.zone!==zoneId;zoneId=r.zone;$("rare-map-title").textContent=zname(zoneId);if(change){zoom=1;center=[50,50];image()}showList();detail();draw()}
function update(){filtered=results();if(!filtered.includes(selected))selected=filtered[0]||null;if(selected){const change=zoneId!==selected.zone;zoneId=selected.zone;$("rare-map-title").textContent=zname(zoneId);if(change){zoom=1;center=[50,50];image()}}showList();detail();draw()}
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function clampCenter(){const h=50/zoom;center=[clamp(center[0],h,100-h),clamp(center[1],h,100-h)]}
const pos=p=>[W/2+(p[0]-center[0])*W*zoom/100,H/2+(p[1]-center[1])*H*zoom/100];
const unpos=p=>[center[0]+(p[0]/W-.5)*100/zoom,center[1]+(p[1]/H-.5)*100/zoom];
const mouse=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height]};
function image(){
if(!db)return;const my=++token,meta=db.zones[zoneId];img=null;draw();if(!meta?.uiMapID||meta.instance){$("rare-map-source").textContent=T("Instance · pas de carte extérieure","Instance · no outdoor map");return}
const sources=[db.map_image_base+meta.uiMapID+".webp"];if(local.has(zoneId))sources.push("/assets/maps/"+zoneId+".jpg");
let i=0;const load=()=>{if(my!==token)return;if(i===sources.length){$("rare-map-source").textContent=T("Grille X/Y (carte indisponible)","X/Y grid (map unavailable)");draw();return}
const image=new Image(),j=i++;image.onload=()=>{if(my!==token)return;img=image;$("rare-map-source").textContent=j===0?T("Carte du client Forever","Forever client map"):T("Carte locale","Local map");draw()};image.onerror=load;image.src=sources[j]};load()
}
function background(){
ctx.clearRect(0,0,W,H);ctx.fillStyle="#18261e";ctx.fillRect(0,0,W,H);
if(img){const span=100/zoom,l=center[0]-span/2,t=center[1]-span/2;ctx.drawImage(img,l/100*img.width,t/100*img.height,span/100*img.width,span/100*img.height,0,0,W,H)}
else{const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,"#2c4031");g.addColorStop(1,"#101a16");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
ctx.textAlign="center";ctx.font="30px Georgia";ctx.fillStyle="#e6cd9b";ctx.fillText(zname(zoneId),W/2,H/2);ctx.font="16px sans-serif";ctx.fillStyle="#bbc7b5";ctx.fillText(T("Carte indisponible · grille de coordonnées","Map unavailable · coordinate grid"),W/2,H/2+32)}
ctx.lineWidth=1;ctx.font="13px sans-serif";ctx.textAlign="left";
for(let n=0;n<=100;n+=10){const x=pos([n,50])[0],y=pos([50,n])[1];ctx.strokeStyle="#ffeaad2b";ctx.fillStyle="#fff4ccad";
if(x>=0&&x<=W){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();ctx.fillText(""+n,x+3,16)}
if(y>=0&&y<=H){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();ctx.fillText(""+n,5,Math.max(30,y-5))}}
}
function draw(){
if(!db)return;background();pins=[];
for(const r of filtered.filter(r=>r.zone===zoneId))for(const p of r.points){const [x,y]=pos(p);if(x<-20||x>W+20||y<-20||y>H+20)continue;
const active=r.id===selected?.id;ctx.beginPath();ctx.arc(x,y,active?13:10,0,2*Math.PI);
ctx.fillStyle=markerColor(r);ctx.fill();ctx.strokeStyle=active?"#fff4d6":"#0b1a14";ctx.lineWidth=active?5:2.5;ctx.stroke();
ctx.beginPath();ctx.arc(x,y,3,0,2*Math.PI);ctx.fillStyle="#1a291d";ctx.fill();pins.push({r,p,x,y})}
const focus=hover||(selected?.points?.length&&selected.zone===zoneId?{r:selected,p:selected.points[0],x:pos(selected.points[0])[0],y:pos(selected.points[0])[1]}:null);
if(focus){const title=focus.r.name[en?"en":"fr"];ctx.font="bold 19px sans-serif";const w=ctx.measureText(title).width+22,x=clamp(focus.x-w/2,5,W-w-5),y=focus.y<45?focus.y+30:focus.y-28;
ctx.fillStyle="#0f1b14ed";ctx.fillRect(x,y-21,w,29);ctx.strokeStyle="#c9af77";ctx.lineWidth=1;ctx.strokeRect(x,y-21,w,29);ctx.fillStyle="#fff0d0";ctx.fillText(title,x+11,y)}
$("rare-zoom-reset").textContent=Math.round(zoom*100)+" %";
$("rare-map-count").textContent=filtered.filter(r=>r.zone===zoneId).reduce((n,r)=>n+r.points.length,0)+" "+T("repères","pins");
const p=hover?.p||selected?.points?.[0];$("rare-map-hover").textContent=p?(hover?.r.name[en?"en":"fr"]||selected?.name[en?"en":"fr"])+" · "+fmt(p[0])+" / "+fmt(p[1]):""
}
function zoomTo(value,p=[W/2,H/2]){const before=unpos(p);zoom=clamp(value,1,5);center=[before[0]-(p[0]/W-.5)*100/zoom,before[1]-(p[1]/H-.5)*100/zoom];clampCenter();draw()}
$("rare-zoom-in").addEventListener("click",()=>zoomTo(zoom*1.25));$("rare-zoom-out").addEventListener("click",()=>zoomTo(zoom/1.25));$("rare-zoom-reset").addEventListener("click",()=>{zoom=1;center=[50,50];draw()});
canvas.addEventListener("wheel",e=>{e.preventDefault();zoomTo(zoom*(e.deltaY<0?1.22:1/1.22),mouse(e))},{passive:false});
canvas.addEventListener("pointerdown",e=>{if(e.button!==0)return;canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,c:[...center],moved:false}});
canvas.addEventListener("pointermove",e=>{if(drag){const r=canvas.getBoundingClientRect(),dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)drag.moved=true;center=[drag.c[0]-dx/r.width*100/zoom,drag.c[1]-dy/r.height*100/zoom];clampCenter();draw();return}
const p=mouse(e),hit=pins.map(x=>({...x,d:Math.hypot(x.x-p[0],x.y-p[1])})).filter(x=>x.d<23).sort((a,b)=>a.d-b.d)[0];
if(hit?.r.id!==hover?.r.id||hit?.p!==hover?.p){hover=hit||null;canvas.style.cursor=hover?"pointer":"grab";draw()}});
canvas.addEventListener("pointerup",e=>{const moved=drag?.moved;drag=null;if(moved)return;const p=mouse(e),hit=pins.map(x=>({...x,d:Math.hypot(x.x-p[0],x.y-p[1])})).filter(x=>x.d<25).sort((a,b)=>a.d-b.d)[0];if(hit)choose(hit.r)});
canvas.addEventListener("pointercancel",()=>drag=null);canvas.addEventListener("pointerleave",()=>{hover=null;draw()});
canvas.addEventListener("keydown",e=>{if(e.key==="+"||e.key==="="){e.preventDefault();zoomTo(zoom*1.25)}else if(e.key==="-"){e.preventDefault();zoomTo(zoom/1.25)}else if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault();center[0]+=(e.key==="ArrowLeft"?-8:e.key==="ArrowRight"?8:0)/zoom;center[1]+=(e.key==="ArrowUp"?-8:e.key==="ArrowDown"?8:0)/zoom;clampCenter();draw()}});
for(const e of [search,zone,type,level,loot,tame,mapped])e.addEventListener(e===search?"input":"change",update);
fetch("/data/rares.json?v=20261010",{cache:"no-cache"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(data=>{
if(!Array.isArray(data.rares)||!data.zones)throw Error("Invalid JSON");db=data;rows=data.rares.filter(r=>r.zone&&db.zones[r.zone]&&Array.isArray(r.points)&&Array.isArray(r.loot));
for(const key of [...new Set(rows.map(r=>r.zone))].sort((a,b)=>zname(a).localeCompare(zname(b),en?"en":"fr"))){const opt=m("option",zname(key));opt.value=key;zone.append(opt)}
const qs=new URLSearchParams(location.search);if(db.zones[qs.get("zone")])zone.value=qs.get("zone");if(qs.get("q"))search.value=qs.get("q");
filtered=results();buildColors();selected=filtered.find(r=>r.id==="2779")||filtered[0]||null;zoneId=selected?.zone||"";
$("rare-status").textContent=rows.length+" "+T("rares référencés","referenced rares");
$("rare-map-title").textContent=zname(zoneId);$("rare-disclaimer").textContent=db.disclaimer[en?"en":"fr"];
showList();detail();image()
}).catch(()=>{$("rare-status").textContent=T("Données indisponibles","Data unavailable");$("rare-results").textContent=T("Erreur de chargement.","Failed to load.")});
})();