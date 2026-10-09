/* Interactive Forever beta zone maps for the NPC directory. No external JS or map library. */
(()=>{"use strict";
const ROOT="/forever_app/",en=document.documentElement.lang==="en",T=(fr,eng)=>en?eng:fr;
const canvas=document.getElementById("npc-map-canvas");if(!canvas)return;
const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
const $=id=>document.getElementById(id);
const el=(tag,label,klass)=>{const o=document.createElement(tag);if(label!=null)o.textContent=label;if(klass)o.className=klass;return o};
const fmt=n=>Number(n).toFixed(1).replace(".",en?".":",");
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const LOCAL_MAPS=new Set(["azshara","blasted-lands","burning-steppes","epl","searing-gorge","silithus","swamp-of-sorrows","ungoro","winterspring","wpl"]);
const state={data:null,zone:null,selected:null,onSelect:null,visible:[],mode:"merchant",zoom:1,center:{x:50,y:50},image:null,loaded:false,source:"none",token:0,hover:null,drag:null};
function points(){return (state.data?.npcs||[]).filter(n=>n.role===state.mode&&n.zone.id===state.zone&&Number.isFinite(n.coordinates?.x)&&Number.isFinite(n.coordinates?.y))}
function keepInBounds(){const half=50/state.zoom;state.center.x=clamp(state.center.x,half,100-half);state.center.y=clamp(state.center.y,half,100-half)}
function toScreen(p){return {x:W/2+(p.x-state.center.x)*W*state.zoom/100,y:H/2+(p.y-state.center.y)*H*state.zoom/100}}
function toMap(px,py){return {x:state.center.x+(px/W-.5)*100/state.zoom,y:state.center.y+(py/H-.5)*100/state.zoom}}
function pointAt(e){const rect=canvas.getBoundingClientRect();return {x:(e.clientX-rect.left)*W/rect.width,y:(e.clientY-rect.top)*H/rect.height}}
function bg(){
 ctx.clearRect(0,0,W,H);ctx.fillStyle="#142017";ctx.fillRect(0,0,W,H);
 const span=100/state.zoom,l=state.center.x-span/2,t=state.center.y-span/2;
 if(state.loaded&&state.image){
  ctx.drawImage(state.image,l/100*state.image.width,t/100*state.image.height,span/100*state.image.width,span/100*state.image.height,0,0,W,H);
 } else{
  const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,"#263a29");g.addColorStop(1,"#121c17");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.font="30px Georgia,serif";ctx.textAlign="center";ctx.fillStyle="#e2c18c";ctx.fillText(state.selected?.zone[en?"en":"fr"]||"",W/2,H/2-8);
  ctx.font="18px sans-serif";ctx.fillStyle="#c2cdbb";ctx.fillText(T("Fond de carte indisponible · grille de coordonnées","Map unavailable · coordinate grid"),W/2,H/2+30);
 }
 // Coordinate grid is useful even when a zone-map image fails.
 ctx.lineWidth=1;ctx.font="14px sans-serif";ctx.textAlign="left";
 for(let n=0;n<=100;n+=10){
  const x=toScreen({x:n,y:50}).x,y=toScreen({x:50,y:n}).y;
  if(x>=0&&x<=W){ctx.strokeStyle="#fff5d326";ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();ctx.fillStyle="#fffbdab9";ctx.fillText(String(n),x+5,19)}
  if(y>=0&&y<=H){ctx.strokeStyle="#fff5d326";ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();ctx.fillStyle="#fffbdab9";ctx.fillText(String(n),8,Math.max(32,y-6))}
 }
}
function draw(){
 bg();const nodes=points();const visible=[];
 for(const n of nodes){
  const p=toScreen(n.coordinates),selected=n.name===state.selected?.name;
  if(p.x<0||p.x>W||p.y<0||p.y>H)continue;
  visible.push({npc:n,x:p.x,y:p.y});
  ctx.beginPath();ctx.arc(p.x,p.y,selected?17:12,0,Math.PI*2);
  ctx.fillStyle=selected?"#f5d59d":n.role==="trainer"?"#7cb9c5":"#b8d69e";ctx.fill();
  ctx.strokeStyle=selected?"#20180d":"#112319";ctx.lineWidth=selected?5:3;ctx.stroke();
  ctx.beginPath();ctx.arc(p.x,p.y,selected?5:3,0,Math.PI*2);
  ctx.fillStyle="#142116";ctx.fill();
  if(selected){ctx.font="bold 19px sans-serif";const txt=n.name,tw=ctx.measureText(txt).width;let lx=clamp(p.x-tw/2-11,7,W-tw-29),ly=p.y<49?p.y+27:p.y-25;
   ctx.fillStyle="#121c15ef";ctx.fillRect(lx,ly-20,tw+22,29);ctx.strokeStyle="#d6b678";ctx.lineWidth=1;ctx.strokeRect(lx,ly-20,tw+22,29);
   ctx.fillStyle="#fff0d4";ctx.fillText(txt,lx+11,ly); }
 }
 state.visible=visible;
 $("npc-map-zoom-reset").textContent=Math.round(state.zoom*100)+" %";
 const label=state.hover?state.hover.name+" · "+fmt(state.hover.coordinates.x)+" / "+fmt(state.hover.coordinates.y):
    state.selected?state.selected.name+" · "+fmt(state.selected.coordinates.x)+" / "+fmt(state.selected.coordinates.y):"";
 $("npc-map-hover").textContent=label;
}
function loadImage(){
 const token=++state.token,reg=state.data?.zone_maps?.[state.zone],id=reg?.uiMapID;
 state.loaded=false;state.image=null;state.source="none";draw();
 if(!id){sourceLabel();return}
 const sources=[(state.data.zone_map_base||"https://wowforever-media.fly.storage.tigris.dev/maps/1.60.1.69893/zones/")+id+".webp"];
 if(LOCAL_MAPS.has(state.zone))sources.push(ROOT+"assets/maps/"+state.zone+".jpg");
 let index=0;
 function attempt(){
  if(index>=sources.length){state.image=null;state.loaded=false;state.source="none";sourceLabel();draw();return}
  const current=sources[index++],img=new Image();
  img.onload=()=>{if(token!==state.token)return;state.image=img;state.loaded=true;state.source=index===1?"forever":"classic";sourceLabel();draw()};
  img.onerror=()=>{if(token===state.token)attempt()};
  img.src=current;
 }
 attempt();
}
function sourceLabel(){
 const label=$("npc-map-source");label.replaceChildren();
 const s=state.source==="forever"?T("Carte du client Forever bêta","Forever beta client map"):state.source==="classic"?T("Carte Classic de secours","Classic fallback map"):T("Grille de secours","Fallback coordinate grid");
 label.append(document.createTextNode(s+" · "));
 const a=el("a",T("source ↗","source ↗"));a.href="https://warcraftforever.games/maps";a.target="_blank";a.rel="noopener noreferrer";label.append(a);
}
function nearby(){
 const out=$("npc-map-nearby");out.replaceChildren();const ns=points().sort((a,b)=>{const sa=a.name===state.selected?.name?-1000:Math.hypot(a.coordinates.x-state.selected.coordinates.x,a.coordinates.y-state.selected.coordinates.y),sb=b.name===state.selected?.name?-1000:Math.hypot(b.coordinates.x-state.selected.coordinates.x,b.coordinates.y-state.selected.coordinates.y);return sa-sb});
 $("npc-map-count").textContent=ns.length+" "+(state.mode==="trainer"?T("maîtres dans cette zone","trainers in this zone"):T("marchands dans cette zone","vendors in this zone"));
 for(const n of ns.slice(0,12)){const btn=el("button",n.name+" · "+fmt(n.coordinates.x)+"/"+fmt(n.coordinates.y),"npc-map-neighbor");
 btn.type="button";btn.setAttribute("aria-pressed",String(n.name===state.selected?.name));
 btn.title=n.role==="trainer"?T("Maître de métier","Trainer"):T("Marchand","Vendor");
 btn.addEventListener("click",()=>state.onSelect?.(n.name));out.append(btn)}
 if(ns.length>12)out.append(el("span","+"+(ns.length-12),"npc-map-neighbor-more"));
}
function zoomTo(next,pivot){
 next=clamp(next,1,4.5);
 const p=pivot||{x:W/2,y:H/2},before=toMap(p.x,p.y);
 state.zoom=next;state.center.x=before.x-(p.x/W-.5)*100/next;state.center.y=before.y-(p.y/H-.5)*100/next;keepInBounds();draw()
}
$("npc-map-zoom-in").addEventListener("click",()=>zoomTo(state.zoom*1.25));
$("npc-map-zoom-out").addEventListener("click",()=>zoomTo(state.zoom/1.25));
$("npc-map-zoom-reset").addEventListener("click",()=>{state.zoom=1;state.center={x:50,y:50};draw()});
canvas.addEventListener("wheel",e=>{e.preventDefault();const p=pointAt(e);zoomTo(state.zoom*(e.deltaY<0?1.22:1/1.22),p)},{passive:false});
canvas.addEventListener("pointerdown",e=>{if(e.button!==0)return;canvas.setPointerCapture(e.pointerId);state.drag={x:e.clientX,y:e.clientY,cx:state.center.x,cy:state.center.y,moved:false}});
canvas.addEventListener("pointermove",e=>{
 const p=pointAt(e);if(state.drag){
  const dx=e.clientX-state.drag.x,dy=e.clientY-state.drag.y,rect=canvas.getBoundingClientRect();
  if(Math.hypot(dx,dy)>5)state.drag.moved=true;
  state.center.x=state.drag.cx-dx/rect.width*100/state.zoom;
  state.center.y=state.drag.cy-dy/rect.height*100/state.zoom;keepInBounds();draw();return;
 }
 const closest=state.visible.filter(n=>Math.hypot(n.x-p.x,n.y-p.y)<23).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
 if(closest?.npc!==state.hover){state.hover=closest?.npc||null;canvas.style.cursor=state.hover?"pointer":"grab";draw()}
});
canvas.addEventListener("pointerup",e=>{
 const moved=state.drag?.moved;state.drag=null;if(moved)return;
 const p=pointAt(e);const found=state.visible.filter(n=>Math.hypot(n.x-p.x,n.y-p.y)<25).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
 if(found)state.onSelect?.(found.npc.name);
});
canvas.addEventListener("pointercancel",()=>{state.drag=null});
canvas.addEventListener("pointerleave",()=>{state.hover=null;canvas.style.cursor="grab";draw()});
canvas.addEventListener("dblclick",()=>{state.zoom=1;state.center={x:50,y:50};draw()});
canvas.addEventListener("keydown",e=>{if(e.key==="+"||e.key==="="){e.preventDefault();zoomTo(state.zoom*1.25)}else if(e.key==="-"){e.preventDefault();zoomTo(state.zoom/1.25)}else if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault();const step=9/state.zoom;state.center.x+=e.key==="ArrowLeft"?-step:e.key==="ArrowRight"?step:0;state.center.y+=e.key==="ArrowUp"?-step:e.key==="ArrowDown"?step:0;keepInBounds();draw()}});
window.ForeverNpcMap={show(n,data,onSelect){
 if(!n||!data)return;
 const isNewZone=n.zone.id!==state.zone;
 state.data=data;state.zone=n.zone.id;state.mode=n.role;state.selected=n;state.onSelect=onSelect;state.hover=null;
 $("npc-map-title").textContent=n.zone[en?"en":"fr"];
 if(isNewZone){state.zoom=1;state.center={x:50,y:50};loadImage()}
 else {const p=toScreen(n.coordinates);if(p.x<45||p.x>W-45||p.y<45||p.y>H-45){state.center={x:n.coordinates.x,y:n.coordinates.y};keepInBounds()}draw()}
 nearby();sourceLabel();
}};
})();
