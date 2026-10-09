(()=>{"use strict";
const ROOT="/",canvas=document.getElementById("mine-canvas");
const en=document.documentElement.lang==="en",T=(fr,english)=>en?english:fr;
const mineralLabelsEN={rich:"Rich Thorium",small:"Small Thorium",truesilver:"Truesilver",dark:"Dark Iron",starsilver:"Star Silver",hakkari:"Hakkari Thorium"};
const zoneNamesEN={winterspring:"Winterspring",azshara:"Azshara",epl:"Eastern Plaguelands",ungoro:"Un'Goro Crater","burning-steppes":"Burning Steppes","searing-gorge":"Searing Gorge",silithus:"Silithus",wpl:"Western Plaguelands","blasted-lands":"Blasted Lands","swamp-of-sorrows":"Swamp of Sorrows"};
const mineralLabelsFR={rich:"Riche filon de thorium",small:"Petit filon de thorium",truesilver:"Gisement de vrai-argent",dark:"Gisement de sombrefer",starsilver:"Filon d'argent stellaire",hakkari:"Filon de thorium hakkari"};
const zoneLabel=z=>en?(zoneNamesEN[z.id]||z.label):z.label;
const oreLabel=id=>en?(mineralLabelsEN[id]||id):(mineralLabelsFR[id]||db.minerals[id]?.label||id);
if(!canvas)return;
const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
const copy=document.getElementById("mine-copy"),zoomText=document.getElementById("mine-zoom-reset");
let db,zone,sourceImg=null,zoom=1,center={x:50,y:50},shown=[],selected=null,command="",pointer=null;
const enabledMinerals=new Set();
const mineralIcons=Object.create(null);
// Six local SVG files, cached by the browser and loaded only once.
// Classic Cartographer_Mining used INV_Ore_Thorium_02 for both Small and
// Rich Thorium. Hakkari Thorium shares the Rich Thorium world model.
const thoriumTypes=new Set(["rich","small","hakkari"]);
const iconPath=id=>thoriumTypes.has(id)
  ?ROOT+"assets/icons/mining-thorium-wow.png"
  :ROOT+"assets/icons/mining-"+encodeURIComponent(id)+".svg";
function preloadMineralIcons(){
  for(const id of Object.keys(db.minerals)){
    if(mineralIcons[id])continue;
    const img=new Image();
    mineralIcons[id]=img;
    img.onload=()=>{if(zone)draw()};
    img.onerror=()=>{if(zone)draw()};
    img.src=iconPath(id);
  }
}
const el=(tag,text,cls)=>{const x=document.createElement(tag);x.textContent=text;if(cls)x.className=cls;return x};
const fmt=n=>Number(n).toFixed(2).replace(".",document.documentElement.lang==="en"?".":",");
const fmtTom=n=>Number(n).toFixed(2);
const clamp=(a,lo,hi)=>Math.max(lo,Math.min(hi,a));
const mineral=id=>({...db.minerals[id],label:oreLabel(id)});
const project=(x,y)=>({x:(50+(x-center.x)*zoom)*W/100,y:(50+(y-center.y)*zoom)*H/100});
const unproject=(px,py)=>({x:clamp(center.x+(px/W*100-50)/zoom,0,100),y:clamp(center.y+(py/H*100-50)/zoom,0,100)});
function baseMap(){const grad=ctx.createLinearGradient(0,0,W,H);grad.addColorStop(0,"#1a3c42");grad.addColorStop(.55,"#1a3040");grad.addColorStop(1,"#292d3f");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);ctx.strokeStyle="#7b9ca018";for(let i=-1;i<19;i++){ctx.beginPath();ctx.ellipse(W*(i/11),H*(.12+((i*7)%11)/12),W*.26,H*.17,.18,0,Math.PI*2);ctx.stroke()} }
function draw(){ctx.clearRect(0,0,W,H);baseMap();ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();if(sourceImg&&sourceImg.complete&&sourceImg.naturalWidth){const tl=project(0,0),br=project(100,100);// Legacy 4:3 textures include unused 22px/100px padding; crop to the
// 1002x668 in-game coordinate frame. New 3:2 maps are already cropped.
const ratio=sourceImg.naturalWidth/sourceImg.naturalHeight;
if(ratio<1.42){ctx.drawImage(sourceImg,0,0,sourceImg.naturalWidth*1002/1024,sourceImg.naturalHeight*668/768,tl.x,tl.y,br.x-tl.x,br.y-tl.y)}
else{ctx.drawImage(sourceImg,tl.x,tl.y,br.x-tl.x,br.y-tl.y)}}
ctx.font="14px system-ui";ctx.lineWidth=1;for(let i=0;i<=100;i+=10){const a=project(i,0).x,b=project(0,i).y;ctx.strokeStyle=i===50?"#eadbb167":"#d4e8fa38";if(a>=0&&a<=W){ctx.beginPath();ctx.moveTo(a,0);ctx.lineTo(a,H);ctx.stroke();ctx.fillStyle="#e4ebefff";ctx.fillText(String(i),a+4,18)}if(b>=0&&b<=H){ctx.beginPath();ctx.moveTo(0,b);ctx.lineTo(W,b);ctx.stroke();ctx.fillStyle="#e4ebefff";ctx.fillText(String(i),5,b-5)}} 
// Local mining vein illustrations replace the old coloured circles.
for(const p of shown){
  const pos=project(p[0],p[1]);
  const active=selected===p;
  const size=active?Math.min(36,26+2*zoom):Math.min(26,16+2.5*zoom);
  if(pos.x < -size||pos.y < -size||pos.x>W+size||pos.y>H+size)continue;
  const icon=mineralIcons[p[2]];
  if(active){
    ctx.beginPath();
    ctx.arc(pos.x,pos.y,size*.62,0,Math.PI*2);
    ctx.fillStyle="#071522cc";ctx.fill();
    ctx.lineWidth=3.3;ctx.strokeStyle="#ffe4a6";ctx.stroke();
  }
  if(icon&&icon.complete&&icon.naturalWidth>0){
    ctx.globalAlpha=active?1:.96;
    ctx.drawImage(icon,pos.x-size/2,pos.y-size/2,size,size);
    ctx.globalAlpha=1;
  }else{
    // Visible rock-shaped fallback while loading, or if an SVG is unavailable.
    const r=size*.4;
    ctx.beginPath();
    ctx.moveTo(pos.x-r,pos.y+r*.45);
    ctx.lineTo(pos.x-r*.7,pos.y-r*.55);
    ctx.lineTo(pos.x,pos.y-r);
    ctx.lineTo(pos.x+r*.8,pos.y-r*.3);
    ctx.lineTo(pos.x+r,pos.y+r*.55);
    ctx.lineTo(pos.x,pos.y+r);
    ctx.closePath();
    ctx.fillStyle=mineral(p[2]).color;
    ctx.fill();
    ctx.lineWidth=1.8;ctx.strokeStyle="#08131d";ctx.stroke();
  }
}
ctx.restore()}
function filterPoints(){
  shown=zone.points.filter(p=>enabledMinerals.has(p[2]));
  document.getElementById("mine-current-zone").textContent=zoneLabel(zone);
  document.getElementById("mine-current-count").textContent=en?shown.length+" ore nodes shown":shown.length+" filon"+(shown.length>1?"s":"")+" affiché"+(shown.length>1?"s":"");
  document.getElementById("mine-map-id").textContent="UiMapID "+zone.uiMapID;
  document.getElementById("mine-source-status").textContent=en?shown.length+" ore nodes shown":shown.length+" filon"+(shown.length>1?"s":"")+" affiché"+(shown.length>1?"s":"");
  if(selected&&!shown.includes(selected)){selected=null;showSelection()}
  updateMineralControls();
  renderZones();
  draw();
}
function updateMineralControls(){
  const controls=document.getElementById("mine-ore-options");
  for(const label of controls.children){
    const input=label.querySelector("input");
    const enabled=enabledMinerals.has(input.value);
    input.checked=enabled;
    label.classList.toggle("active",enabled);
    const count=zone.points.filter(p=>p[2]===input.value).length;
    label.querySelector(".mine-ore-qty").textContent=count+T(" sur cette carte"," on this map");
  }
  document.getElementById("mine-select-all").disabled=enabledMinerals.size===Object.keys(db.minerals).length;
  document.getElementById("mine-select-none").disabled=enabledMinerals.size===0;
}
function renderMineralControls(){
  const controls=document.getElementById("mine-ore-options");
  controls.replaceChildren();
  for(const [id,info] of Object.entries(db.minerals)){
    const label=el("label","","mine-ore-option");
    const input=document.createElement("input");input.type="checkbox";input.value=id;input.checked=enabledMinerals.has(id);
    const icon=document.createElement("img");
    icon.className="mine-ore-icon";icon.src=iconPath(id);icon.alt="";
    icon.width=26;icon.height=26;icon.loading="lazy";icon.decoding="async";
    label.append(input,icon,el("span",oreLabel(id),"mine-ore-name"),el("small","","mine-ore-qty"));
    input.addEventListener("change",()=>{if(input.checked)enabledMinerals.add(id);else enabledMinerals.delete(id);filterPoints()});
    controls.append(label);
  }
}
function renderZones(){
  const panel=document.getElementById("mine-zone-list");
  panel.replaceChildren();
  for(const candidate of db.zones){
    const n=candidate.points.filter(p=>enabledMinerals.has(p[2])).length;
    const active=candidate===zone;
    const b=el("button","","mine-zone-row"+(active?" active":""));
    b.type="button";
    if(active)b.setAttribute("aria-current","true");
    const mapIcon=el("span","▧","mine-zone-icon");mapIcon.setAttribute("aria-hidden","true");
    const name=el("span","","mine-zone-text");
    name.append(el("strong",zoneLabel(candidate)),el("small",en?n+" ore nodes selected":n+" filon"+(n>1?"s":"")+" sélectionné"+(n>1?"s":"")));
    const arrow=el("span","›","mine-zone-arrow");arrow.setAttribute("aria-hidden","true");
    b.append(mapIcon,name,arrow);
    b.addEventListener("click",()=>{if(candidate!==zone)setZone(candidate)});
    panel.append(b);
  }
}
function showSelection(){const place=document.getElementById("mine-selection");place.replaceChildren();if(!selected){place.append(el("strong",T("Sélectionnez un point sur la carte","Select a point on the map")),el("p",T("Une commande /way apparaîtra ici.","A /way command will appear here.")));copy.disabled=true;command="";draw();return}const p=selected,what=mineral(p[2]);command="/way #"+zone.uiMapID+" "+fmtTom(p[0])+" "+fmtTom(p[1])+" "+what.label;const heading=el("div","","mine-selected-heading");
const icon=document.createElement("img");icon.src=iconPath(p[2]);icon.alt="";icon.width=32;icon.height=32;icon.className="mine-selected-icon";
heading.append(icon,el("strong",what.label));
place.append(heading,el("p","X : "+fmt(p[0])+" % · Y : "+fmt(p[1])+" %"));const c=el("code",command,"mine-way");place.append(c,el("small",T("Position référencée, non garantie en jeu.","Reference location; in-game spawn not guaranteed.")));copy.disabled=false;draw()}
function setZone(z){zone=z;zoom=1;center={x:50,y:50};selected=null;zoomText.textContent="100 %";sourceImg=null;document.getElementById("mine-map-backdrop").textContent=T("Grille de coordonnées WoW","WoW coordinate grid");filterPoints();showSelection();const image=new Image();image.onload=()=>{if(zone!==z)return;sourceImg=image;document.getElementById("mine-map-backdrop").textContent=T("Carte Forever · coordonnées de zone","Forever map · zone coordinates");draw()};image.onerror=()=>{if(zone!==z)return;document.getElementById("mine-map-backdrop").textContent=T("Fond schématique · repères X/Y","Schematic map · X/Y markers");draw()};image.src=ROOT+"assets/maps/"+zone.id+".jpg?v=forever-69893"}
function setZoom(value,anchor){
  const next=clamp(value,1,4);
  if(anchor&&next!==zoom){
    // Keep the in-game map coordinate under the mouse fixed while zooming.
    const point=unproject(anchor.x,anchor.y);
    center.x=clamp(point.x-(anchor.x/W*100-50)/next,50/next,100-50/next);
    center.y=clamp(point.y-(anchor.y/H*100-50)/next,50/next,100-50/next);
  }else if(next!==zoom){
    center.x=clamp(center.x,50/next,100-50/next);
    center.y=clamp(center.y,50/next,100-50/next);
  }
  zoom=next;
  zoomText.textContent=Math.round(zoom*100)+" %";
  draw();
}
function fromClient(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*W/r.width,y:(event.clientY-r.top)*H/r.height}}
const coords=document.getElementById("mine-cursor-coords");
canvas.addEventListener("pointermove",e=>{const p=fromClient(e),pos=unproject(p.x,p.y);coords.textContent=T("Curseur X : ","Cursor X: ")+fmt(pos.x)+" · Y : "+fmt(pos.y)});
canvas.addEventListener("pointerleave",()=>{coords.textContent=T("Curseur : —","Cursor: —")});
canvas.addEventListener("pointerdown",e=>{const p=fromClient(e);pointer={id:e.pointerId,x:p.x,y:p.y,prev:p,dragged:false};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener("pointermove",e=>{if(!pointer||pointer.id!==e.pointerId)return;const p=fromClient(e),dx=p.x-pointer.prev.x,dy=p.y-pointer.prev.y;if(Math.hypot(p.x-pointer.x,p.y-pointer.y)>6)pointer.dragged=true;if(pointer.dragged){center.x=clamp(center.x-dx/W*100/zoom,50/zoom,100-50/zoom);center.y=clamp(center.y-dy/H*100/zoom,50/zoom,100-50/zoom);pointer.prev=p;draw()}});
canvas.addEventListener("pointerup",e=>{if(!pointer||pointer.id!==e.pointerId)return;const moved=pointer.dragged;pointer=null;if(moved)return;const p=fromClient(e);
let best=null,dist=Infinity;for(const row of shown){const pt=project(row[0],row[1]),d=Math.hypot(p.x-pt.x,p.y-pt.y);if(d<dist){dist=d;best=row}}if(best&&dist<22){selected=best;showSelection()}});
canvas.addEventListener("pointercancel",()=>pointer=null);
canvas.addEventListener("wheel",e=>{
  e.preventDefault(); // Wheel zoom works immediately; Ctrl is NOT required.
  const unit=e.deltaMode===1?16:e.deltaMode===2?H:1;
  const factor=Math.exp(-e.deltaY*unit*.0016);
  setZoom(zoom*factor,fromClient(e));
},{passive:false});
document.getElementById("mine-zoom-out").addEventListener("click",()=>setZoom(zoom-.5));
document.getElementById("mine-zoom-in").addEventListener("click",()=>setZoom(zoom+.5));
zoomText.addEventListener("click",()=>{center={x:50,y:50};setZoom(1)});
copy.addEventListener("click",()=>{if(!command)return;const alert=()=>{copy.textContent=T("Copié !","Copied!");setTimeout(()=>copy.textContent=T("Copier la commande /way","Copy /way command"),1400)};if(navigator.clipboard?.writeText)navigator.clipboard.writeText(command).then(alert,()=>{copy.textContent=T("Sélectionnez la commande ci-dessus","Select and copy the command above")});else copy.textContent=T("Sélectionnez la commande ci-dessus","Select and copy the command above")});
document.getElementById("mine-select-all").addEventListener("click",()=>{
  for(const id of Object.keys(db.minerals))enabledMinerals.add(id);
  filterPoints();
});
document.getElementById("mine-select-none").addEventListener("click",()=>{
  enabledMinerals.clear();
  filterPoints();
});
fetch(ROOT+"data/mining-points.json")
  .then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()})
  .then(j=>{
    if(j.coordinate_system!=="wow_ui_map_normalized_percent"||!Array.isArray(j.zones)||!j.zones.length)throw Error(T("Format de coordonnées non compatible","Incompatible coordinate format"));
    db=j;
    preloadMineralIcons();
    for(const z of db.zones){
      if(!Number.isInteger(z.uiMapID)||!Array.isArray(z.points)||z.points.some(p=>p.length<4||p[0]<0||p[0]>100||p[1]<0||p[1]>100))throw Error(T("Coordonnées invalides pour ","Invalid coordinates for ")+zoneLabel(z));
    }
    for(const id of Object.keys(db.minerals))enabledMinerals.add(id);
    renderMineralControls();
    const params=new URLSearchParams(location.search);
    const chosen=db.zones.find(z=>z.id===params.get("zone"))||db.zones[0];
    setZone(chosen);
  })
  .catch(e=>{
    document.getElementById("mine-current-zone").textContent=T("Erreur de chargement : ","Loading error: ")+e.message;
    document.getElementById("mine-source-status").textContent=T("Indisponible","Unavailable");
  });
})();