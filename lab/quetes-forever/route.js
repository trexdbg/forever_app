(()=>{
"use strict";
const ROOT="/";
const QT=(fr,en)=>document.documentElement.lang==="en"?en:fr;
const Q=window.ForeverQuestLocale||{header:s=>s||"",note:s=>String(Array.isArray(s)?s[0]:s||""),questName:s=>s,race:s=>s};
const $=id=>document.getElementById(id),canvas=$("quest-canvas");
if(!canvas)return;
const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
const s={meta:null,data:null,questLevels:null,faction:"alliance",profile:"human",race:"human",steps:[],index:0,selected:0,zoom:1,center:{x:50,y:50},image:null,mapUrl:"",mapLoaded:false};
let pointer=null,scrubTimer=null;
const labels={
 starts:QT("Prendre","Accept"),objectives:QT("Objectif","Objective"),
 ends:QT("Rendre","Turn in"),completed:QT("Prendre et finir","Accept & complete"),
 travel:QT("Trajet","Travel"),prepare:QT("Préparation","Preparation"),
 combat:QT("Combat","Combat"),interact:QT("Action","Action"),tip:QT("Conseil","Tip")
};
const classes={quest:"#e4bd7c",hub:"#efc772",objective:"#7bc9cb",flightpath:"#9daff0",travel:"#b2adcf"};
const element=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const stepName=st=>document.documentElement.lang==="en"?(window.ForeverI18n?.zone(st.zone)||st.zone):(s.meta?.zones?.[st.zone]||st.zone);
const cleanStr=v=>String(v||"").trim();
const normal=v=>cleanStr(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const detailsOf=ref=>{const q=guide.catalog[String(ref).replace(/^q/,"")];return {name:QT(q.fr,q.en),original:q.en,french:q.fr,id:q.id,level:q.level};};
let guide,done=[],active=[],variant="direct";
function save(){try{localStorage.setItem("forever-nelf-route-v1",JSON.stringify({done,active,variant}));}catch(_){}}
function rebuild(){
 s.steps=window.ForeverNightelfRoute.build(guide,{done,active,variant});
 if(!s.steps.length)s.steps=[{zone:"teldrassil",experience:10,waypoints:[{coords:{x:55.3,y:56.8},header:["Route complete","Parcours terminé"],type:"hub",special:[["All selected quests are marked done.","Toutes les quêtes sélectionnées sont marquées comme rendues."]]}]}];
 s.index=0;s.selected=0;s.center={x:50,y:50};s.zoom=1;renderMilestones();render();search();
 $("quest-data-status").textContent=done.length+QT(" quêtes rendues"," quests completed");
}
const waypointTitle=w=>Array.isArray(w.header)?QT(w.header[1],w.header[0]):Q.header(w.header);
const syncUrl=()=>{const u=new URL(location.href);u.searchParams.set("faction",s.faction);u.searchParams.set("race",s.profile);u.searchParams.set("peuple",s.race);u.searchParams.set("step",String(s.index+1));u.searchParams.set("variant",variant);history.replaceState(null,"",u.pathname+u.search+u.hash)};
const project=(x,y)=>({x:(50+(x-s.center.x)*s.zoom)*W/100,y:(50+(y-s.center.y)*s.zoom)*H/100});
const clientPoint=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}};
const format=n=>Number(n).toFixed(1).replace(".",document.documentElement.lang==="en"?".":",");
const tomtom=n=>Number(n).toFixed(2);
function setImage(zone){
 const url=s.meta.map_base+encodeURIComponent(zone)+".jpg";
 if(s.mapUrl===url)return;
 s.mapUrl=url;s.image=null;s.mapLoaded=false;$("quest-map-overlay").textContent=QT("Chargement de la carte…","Loading map…");
 const img=new Image();
 img.onload=()=>{if(s.mapUrl!==url)return;s.image=img;s.mapLoaded=true;$("quest-map-overlay").textContent=QT("Carte de zone","Zone map");draw()};
 img.onerror=()=>{if(s.mapUrl!==url)return;$("quest-map-overlay").textContent=QT("Carte indisponible · repères X/Y","Map unavailable · X/Y markers");draw()};
 img.src=url;
}
function draw(){
 const step=s.steps[s.index];if(!step)return;
 ctx.clearRect(0,0,W,H);const grad=ctx.createLinearGradient(0,0,W,H);grad.addColorStop(0,"#214238");grad.addColorStop(1,"#1b2841");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
 ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
 if(s.image&&s.image.naturalWidth){const a=project(0,0),b=project(100,100);ctx.drawImage(s.image,a.x,a.y,b.x-a.x,b.y-a.y);}
 ctx.font="12px system-ui";
 for(let n=0;n<=100;n+=10){const x=project(n,0).x,y=project(0,n).y;ctx.strokeStyle=n===50?"#f7e4aa88":"#f4f7ff44";ctx.lineWidth=1;
 if(x>=0&&x<=W){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();ctx.fillStyle="#07131fdc";ctx.fillRect(x+1,3,23,16);ctx.fillStyle="#fff";ctx.fillText(String(n),x+4,15)}
 if(y>=0&&y<=H){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();ctx.fillStyle="#07131fdc";ctx.fillRect(1,y-17,22,15);ctx.fillStyle="#fff";ctx.fillText(String(n),4,y-5)}}
 const pts=step.waypoints||[];
 if(pts.length>1){ctx.beginPath();pts.forEach((w,i)=>{for(const member of w.members||[]){const p=project(member.coords.x,member.coords.y);ctx.beginPath();ctx.arc(p.x,p.y,s.selected===i?6:4,0,Math.PI*2);ctx.fillStyle="#b7eeee";ctx.fill();ctx.strokeStyle="#152d36";ctx.lineWidth=2;ctx.stroke();}});
 pts.forEach((w,i)=>{const p=project(w.coords.x,w.coords.y);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)});ctx.strokeStyle="#11182ce6";ctx.lineWidth=6;ctx.stroke();ctx.strokeStyle="#f8e3ad";ctx.lineWidth=2.5;ctx.setLineDash([8,6]);ctx.stroke();ctx.setLineDash([]);}
 pts.forEach((w,i)=>{for(const member of w.members||[]){const p=project(member.coords.x,member.coords.y);ctx.beginPath();ctx.arc(p.x,p.y,s.selected===i?6:4,0,Math.PI*2);ctx.fillStyle="#b7eeee";ctx.fill();ctx.strokeStyle="#152d36";ctx.lineWidth=2;ctx.stroke();}});
 pts.forEach((w,i)=>{const p=project(w.coords.x,w.coords.y);if(p.x < -24||p.x>W+24||p.y < -24||p.y>H+24)return;
 const active=s.selected===i;ctx.beginPath();ctx.arc(p.x,p.y,active?17:14,0,Math.PI*2);ctx.fillStyle=classes[w.type]||"#ddb575";ctx.fill();ctx.lineWidth=active?4:2;ctx.strokeStyle=active?"#ffffff":"#122235";ctx.stroke();ctx.fillStyle="#071627";ctx.font="bold 13px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(i+1),p.x,p.y+1);ctx.textAlign="start";ctx.textBaseline="alphabetic";});
 ctx.restore();
}
function renderSelection(){
 const box=$("quest-selected"),w=s.steps[s.index].waypoints[s.selected];box.replaceChildren();
 if(!w){box.append(element("p",QT("Sélectionnez un point sur la carte.","Select a waypoint on the map.")));return}
 box.append(element("strong",(s.selected+1)+". "+waypointTitle(w)),element("p","X : "+format(w.coords.x)+" % · Y : "+format(w.coords.y)+" %"));
 if(w.members){
  const list=element("div",undefined,"quest-sector-points");list.append(element("strong",QT("Points à couvrir dans ce secteur","Points to cover in this area")));
  const seen=new Set();
  for(const member of w.members){const key=member.coords.x+":"+member.coords.y+":"+waypointTitle(member);if(seen.has(key))continue;seen.add(key);
   const line=element("p");line.append(element("span",waypointTitle(member)+" · "),element("code","/way "+tomtom(member.coords.x)+" "+tomtom(member.coords.y)));list.append(line);
  }box.append(list);
 }
 const cmd="/way "+tomtom(w.coords.x)+" "+tomtom(w.coords.y);
 box.append(element("code",cmd));
 const copy=element("button",QT("Copier /way","Copy /way"));copy.type="button";
 copy.addEventListener("click",()=>{if(navigator.clipboard?.writeText){navigator.clipboard.writeText(cmd).then(()=>{copy.textContent=QT("Copié !","Copied!")},()=>{copy.textContent=QT("Sélectionnez la commande ci-dessus","Select and copy the command above")})}else{copy.textContent=QT("Sélectionnez la commande ci-dessus","Select and copy the command above")}});
 box.append(copy);
 const sources=w.sources||[w.source];
 for(const url of sources.filter(Boolean)){const a=element("a",QT("Source ↗","Source ↗"));a.href=url;a.target="_blank";a.rel="noopener noreferrer";box.append(a);}
 const ids=(w.ends||[]).map(ref=>detailsOf(ref).id);
 if(ids.length){const button=element("button",QT("Quête(s) rendue(s) ✓","Quest(s) turned in ✓"));button.type="button";button.addEventListener("click",()=>{done=[...new Set([...done,...ids])];save();rebuild();});box.append(button);}

}
function selectWaypoint(i,focus=false){
 const step=s.steps[s.index];if(!step||i<0||i>=step.waypoints.length)return;
 s.selected=i;renderSelection();
 // Keep the clicked button mounted: preserve keyboard focus and list scroll position.
 for(const [index,button] of $("quest-waypoints").querySelectorAll(".quest-waypoint").entries()){
  const selected=index===i;
  button.classList.toggle("selected",selected);
  button.setAttribute("aria-pressed",String(selected));
 }
 draw();
 if(focus&&typeof window!=="undefined"&&window.innerWidth<=900)$("quest-map-title").scrollIntoView({behavior:"smooth",block:"start"});
}
function renderWaypoints(){
 const list=$("quest-waypoints");list.replaceChildren();
 const pts=s.steps[s.index].waypoints;
 const count=$("quest-waypoint-count");
 if(count)count.textContent=String(pts.length)+" "+QT(pts.length===1?"point":"points",pts.length===1?"point":"stops");
 const typeIcons={starts:"＋",objectives:"◆",ends:"↩",completed:"✓",travel:"➜",prepare:"◈",combat:"⚔",interact:"●",tip:"✦"};
 pts.forEach((w,i)=>{
  const b=element("button",undefined,"quest-waypoint"+(s.selected===i?" selected":""));
  b.type="button";b.setAttribute("aria-pressed",String(s.selected===i));
  b.title=QT("Localiser ce point sur la carte","Locate this waypoint on the map");
  const title=element("div",undefined,"quest-waypoint-heading");
  const pin=element("span","⌖","quest-waypoint-pin");pin.setAttribute("aria-hidden","true");
  title.append(element("b",String(i+1)),element("strong",waypointTitle(w)),pin);
  b.append(title);
  const actions=element("div",undefined,"quest-actions");
  const groups=[];
  // Never conflate a quest's state with a guide author's instructions.
  for(const type of ["ends","starts","objectives","completed"]){
   if((w[type]||[]).length)groups.push({type,entries:w[type],isNote:false});
  }
  // Preserve the author's sequence, even when it alternates between travel and advice.
  for(const entry of w.special||[]){
   const type=Q.noteCategory?Q.noteCategory(entry):"tip";
   const last=groups[groups.length-1];
   if(last&&last.isNote&&last.type===type)last.entries.push(entry);
   else groups.push({type,entries:[entry],isNote:true});
  }
  for(const {type,entries,isNote} of groups){
   const group=element("div",undefined,"quest-action-group "+type);
   const heading=element("div",undefined,"quest-action-group-heading");
   const badge=element("span",undefined,"quest-action-tag "+type);
   badge.append(element("span",typeIcons[type]||"✦","quest-action-symbol"),element("span",labels[type]||labels.tip));
   heading.append(badge,element("span",String(entries.length),"quest-action-count"));
   const items=element("div",undefined,"quest-action-items");
   for(const entry of entries){
    const action=element("span",undefined,"quest-action");
    const quest=isNote?null:detailsOf(entry);
    const name=isNote?Q.note(entry):quest.name;
    action.append(element("span",name,"quest-action-name"));
    if(quest&&quest.level!==null){
     const level=element("small",QT("niv. ","lvl ")+quest.level,"quest-quest-level");
     level.title=QT("Niveau de la quête","Quest level");
     action.append(level);
    }
    items.append(action);
   }
   group.append(heading,items);actions.append(group);
  }
  if(!groups.length)actions.append(element("span",QT("Rejoindre ce point de passage.","Go to this waypoint."),"quest-no-action"));
  b.append(actions);
  b.addEventListener("click",()=>selectWaypoint(i,true));
  list.append(b);
 });
}
function previewStep(index){
 if(!s.steps.length)return;
 const i=clamp(index,0,s.steps.length-1),st=s.steps[i],percent=s.steps.length<=1?0:100*i/(s.steps.length-1);
 $("quest-range").style.setProperty("--quest-range-fill",percent+"%");
 $("quest-range-output").textContent=(i+1)+" / "+s.steps.length;
 $("quest-timeline-preview").textContent=stepName(st)+QT(" · niveau ≈ "," · level ≈ ")+Number(st.experience).toFixed(1).replace(".",document.documentElement.lang==="en"?".":",")+" · "+st.waypoints.length+QT(" points"," waypoints");
 $("quest-range").setAttribute("aria-valuetext",QT("Étape ","Step ")+(i+1)+QT(" sur "," of ")+s.steps.length+", "+stepName(st));
}
function renderMilestones(){
 const wrap=$("quest-milestones");wrap.replaceChildren();
 if(!s.steps.length)return;
 const levels=[0,3,4,5,6,7,8,9,10,Infinity];
 const maxIndex=Math.max(s.steps.length-1,1);
 for(const level of levels){
  // A level marker occupies the exact horizontal position of its first eligible guide step.
  const index=level===0?0:level===Infinity?s.steps.length-1:s.steps.findIndex(st=>Number(st.experience)>=level);
  if(index<0)continue;
  const name=level===0?QT("Départ","Start"):level===Infinity?QT("Fin","End"):QT("Niveau ","Level ")+level;
  const shortName=level===0?QT("Départ","Start"):level===Infinity?QT("Fin","End"):String(level);
  const b=element("button",shortName,"quest-milestone");b.type="button";
  b.dataset.index=String(index);
  b.dataset.level=level===Infinity?"fin":String(level);
  b.style.left=(100*index/maxIndex)+"%";
  b.title=name+" · "+stepName(s.steps[index])+QT(" · étape "," · step ")+(index+1);
  b.setAttribute("aria-label",QT("Accéder à ","Go to ")+name.toLowerCase()+QT(", étape ",", step ")+(index+1)+", "+stepName(s.steps[index]));
  b.addEventListener("click",()=>go(index));wrap.append(b);
 }
 updateMilestones();
}
function updateMilestones(){
 const buttons=$("quest-milestones").querySelectorAll("button.quest-milestone");
 let active=null;
 for(const b of buttons)if(Number(b.dataset.index)<=s.index)active=b;
 for(const b of buttons){
  const selected=b===active;
  b.classList.toggle("active",selected);
  b.setAttribute("aria-current",selected?"step":"false");
 }
}
function render(){
 const st=s.steps[s.index];if(!st)return;
 $("quest-range").max=String(s.steps.length);
 $("quest-range").value=String(s.index+1);
 previewStep(s.index);
 $("quest-current-level").textContent=String(Math.floor(Number(st.experience)||0));
 $("quest-step-count").textContent=QT("Étape ","Step ")+(s.index+1)+" / "+s.steps.length;
 $("quest-map-title").textContent=st.title?QT(st.title[1],st.title[0]):stepName(st);
 $("quest-map-source").textContent=QT("Molette : zoom · X/Y : 0 à 100","Scroll to zoom · X/Y: 0–100");
 const first=s.index===0,last=s.index===s.steps.length-1;
 $("quest-prev").disabled=first;$("quest-next").disabled=last;
 updateMilestones();renderWaypoints();renderSelection();setImage(st.zone);draw();syncUrl();
}
function go(n){if(scrubTimer!==null){clearTimeout(scrubTimer);scrubTimer=null}if(!s.steps.length)return;s.index=clamp(n,0,s.steps.length-1);s.selected=0;s.center={x:50,y:50};s.zoom=1;$("quest-zoom-reset").textContent="100 %";render();}


function search(){
 const text=normal($("quest-search").value),res=$("quest-search-results");res.replaceChildren();res.hidden=!text;
 if(!text||!s.data)return;let results=0,all=0;
 for(let i=0;i<s.steps.length;i++){const st=s.steps[i];
  const matches=(
   normal(stepName(st)).includes(text)||
   normal(s.meta?.zones?.[st.zone]).includes(text)||
   normal(window.ForeverI18n?.zone(st.zone)).includes(text)||
   st.waypoints.some(w=>
    normal(Q.header(w.header,"fr")).includes(text)||
    normal(Q.header(w.header,"en")).includes(text)||
    ["starts","ends","objectives","completed"].some(k=>(w[k]||[]).some(q=>{
     const a=detailsOf(q);
     return normal(a.name).includes(text)||normal(a.original).includes(text)||
      normal(a.french).includes(text)||String(a.id||"")===text;
    }))
   )
  );
  if(!matches)continue;all++;if(results>=35)continue;results++;
  const b=element("button",undefined,"quest-search-result");b.type="button";b.append(element("strong",QT("Étape ","Step ")+(i+1)),element("span",stepName(st)),element("small",QT("niv. ≈ ","lvl ≈ ")+Math.floor(st.experience)));b.addEventListener("click",()=>{go(i);$("quest-search").value="";res.hidden=true;res.replaceChildren();$("quest-map-title").scrollIntoView({behavior:"smooth",block:"nearest"})});res.append(b);}
 if(!all)res.append(element("p",QT("Aucune étape correspondante dans ce parcours.","No matching steps in this route.")));
 if(all>35)res.append(element("p",QT(all+" correspondances · 35 premiers résultats affichés.",all+" matches · showing the first 35 results.")));
}
function setZoom(z,anchor){
 const previous=s.zoom,next=clamp(z,1,4);
 if(anchor&&previous!==next){
  // Preserve the map location beneath the cursor while zooming.
  const dx=100*anchor.x/W-50,dy=100*anchor.y/H-50;
  s.center.x+=dx/previous-dx/next;
  s.center.y+=dy/previous-dy/next;
 }
 s.zoom=next;
 s.center.x=clamp(s.center.x,50/next,100-50/next);
 s.center.y=clamp(s.center.y,50/next,100-50/next);
 $("quest-zoom-reset").textContent=Math.round(next*100)+" %";
 draw();
}
canvas.addEventListener("pointerdown",e=>{const p=clientPoint(e);pointer={id:e.pointerId,start:p,prev:p,drag:false};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener("pointermove",e=>{if(!pointer||e.pointerId!==pointer.id)return;const p=clientPoint(e);if(Math.hypot(p.x-pointer.start.x,p.y-pointer.start.y)>6)pointer.drag=true;
 if(pointer.drag){s.center.x=clamp(s.center.x-(p.x-pointer.prev.x)/W*100/s.zoom,50/s.zoom,100-50/s.zoom);s.center.y=clamp(s.center.y-(p.y-pointer.prev.y)/H*100/s.zoom,50/s.zoom,100-50/s.zoom);draw()}pointer.prev=p});
canvas.addEventListener("pointerup",e=>{if(!pointer||e.pointerId!==pointer.id)return;const dragged=pointer.drag;pointer=null;if(dragged)return;const p=clientPoint(e),wps=s.steps[s.index]?.waypoints||[];let best=-1,min=24;
 wps.forEach((w,i)=>{for(const point of w.members||[w]){const v=project(point.coords.x,point.coords.y),d=Math.hypot(v.x-p.x,v.y-p.y);if(d<min){min=d;best=i}}});if(best>=0)selectWaypoint(best)});
canvas.addEventListener("pointercancel",()=>pointer=null);
canvas.addEventListener("wheel",e=>{
 e.preventDefault();
 if(!e.deltaY)return;
 // Normalize pixel/line/page wheel events (mouse wheels and trackpads).
 const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?120:1);
 const factor=Math.exp(-clamp(delta,-180,180)*.0018);
 setZoom(s.zoom*factor,clientPoint(e));
},{passive:false});
canvas.addEventListener("keydown",e=>{
 if(e.key==="+"||e.key==="="){e.preventDefault();setZoom(s.zoom*1.2);return}
 if(e.key==="-"){e.preventDefault();setZoom(s.zoom/1.2);return}
 const count=s.steps[s.index]?.waypoints.length||0;if(!count)return;
 if(e.key==="ArrowRight"){e.preventDefault();selectWaypoint((s.selected+1)%count)}
 if(e.key==="ArrowLeft"){e.preventDefault();selectWaypoint((s.selected+count-1)%count)}
});
$("quest-prev").addEventListener("click",()=>go(s.index-1));$("quest-next").addEventListener("click",()=>go(s.index+1));
$("quest-range").addEventListener("input",e=>{
 const target=Number(e.target.value)-1;previewStep(target);
 if(scrubTimer!==null)clearTimeout(scrubTimer);
 scrubTimer=setTimeout(()=>go(target),160);
});
$("quest-range").addEventListener("change",e=>go(Number(e.target.value)-1));
$("quest-search").addEventListener("input",search);
$("quest-zoom-reset").addEventListener("click",()=>{s.center={x:50,y:50};setZoom(1)});
(async()=>{
 try{
  const responses=await Promise.all([fetch("/data/quests/manifest.json"),fetch("./nightelf.json?v=20261018-sectors2")]);
  if(responses.some(r=>!r.ok))throw Error("Route unavailable");
  [s.meta,guide]=await Promise.all(responses.map(r=>r.json()));
  try{const saved=JSON.parse(localStorage.getItem("forever-nelf-route-v1")||"{}");done=Array.isArray(saved.done)?saved.done.filter(id=>guide.catalog[id]):[];active=Array.isArray(saved.active)?saved.active.filter(id=>[87288,99046].includes(id)):[];variant=saved.variant==="complete"?"complete":"direct";}catch(_){}
  const params=new URLSearchParams(location.search);
  if(["direct","complete"].includes(params.get("variant")))variant=params.get("variant");
  s.faction="alliance";s.profile="nelf";s.race="nelf";
  s.data={quest_ids:Object.fromEntries(Object.values(guide.catalog).map(q=>["q"+q.id,q.id]))};
  $("route-variant").value=variant;
  for(const id of [87288,99046]){$("active-"+id).checked=active.includes(id);$("active-"+id).addEventListener("change",e=>{active=e.target.checked?[...new Set([...active,id])]:active.filter(q=>q!==id);save();rebuild();});}
  $("route-variant").addEventListener("change",e=>{variant=e.target.value;save();rebuild();});
  $("route-level").addEventListener("change",e=>{const index=s.steps.findIndex(st=>st.experience>=Number(e.target.value));go(index<0?s.steps.length-1:index);});
  $("route-reset").addEventListener("click",()=>{done=[];save();rebuild();});
  rebuild();const step=Number(params.get("step"));if(Number.isInteger(step)&&step>0)go(step-1);
  $("quest-app").setAttribute("aria-busy","false");
 }catch(err){$("quest-map-title").textContent=QT("Chargement impossible","Unable to load route");$("quest-map-source").textContent=err.message;$("quest-app").setAttribute("aria-busy","false");}
})();
})();
