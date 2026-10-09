(()=>{
"use strict";
const ROOT="/";
const QT=(fr,en)=>document.documentElement.lang==="en"?en:fr;
const Q=window.ForeverQuestLocale||{header:s=>s||"",note:s=>String(Array.isArray(s)?s[0]:s||""),questName:s=>s,race:s=>s};
const $=id=>document.getElementById(id),canvas=$("quest-canvas");
if(!canvas)return;
const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
const cache={},s={meta:null,data:null,questLevels:null,faction:"alliance",profile:"human",race:"human",steps:[],index:0,selected:0,zoom:1,center:{x:50,y:50},image:null,mapUrl:"",mapLoaded:false};
const RACES={
 alliance:[{id:"human",profile:"human",label:"Humain"},{id:"dwarf",profile:"gnorf",label:"Nain"},{id:"gnome",profile:"gnorf",label:"Gnome"},{id:"nelf",profile:"nelf",label:"Elfe de la nuit"}],
 horde:[{id:"orc",profile:"trorc",label:"Orc"},{id:"troll",profile:"trorc",label:"Troll"},{id:"undead",profile:"undead",label:"Mort-vivant"},{id:"tauren",profile:"tauren",label:"Tauren"}]
};
let pending=0,pointer=null,scrubTimer=null;
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
const detailsOf=ref=>{
 const name=Array.isArray(ref)?ref[0]:ref;
 const target=s.data.quest_ids[name];
 let id=target;
 if(Array.isArray(target)){const suffix=Array.isArray(ref)?String(ref[1]||""):"";const n=suffix.match(/(?:p|^)(\d+)/);id=target[n?clamp(Number(n[1])-1,0,target.length-1):0];}
 const french=(id!==undefined&&id!==null)?s.data.translations[String(id)]:null;
 const questId=Number.isInteger(Number(id))&&Number(id)>0?Number(id):null;
 const level=questId===null?null:s.questLevels?.[String(questId)];
 return {name:document.documentElement.lang==="en"?Q.questName(name):(french||Q.questName(name)),original:name,french:french||"",id:questId,level:Number.isInteger(level)&&level>=1&&level<=65?level:null};
};
const waypointTitle=w=>Q.header(w.header);
const syncUrl=()=>{const u=new URL(location.href);u.searchParams.set("faction",s.faction);u.searchParams.set("race",s.profile);u.searchParams.set("peuple",s.race);u.searchParams.set("step",String(s.index+1));history.replaceState(null,"",u.pathname+u.search+u.hash)};
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
 if(pts.length>1){ctx.beginPath();pts.forEach((w,i)=>{const p=project(w.coords.x,w.coords.y);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)});ctx.strokeStyle="#11182ce6";ctx.lineWidth=6;ctx.stroke();ctx.strokeStyle="#f8e3ad";ctx.lineWidth=2.5;ctx.setLineDash([8,6]);ctx.stroke();ctx.setLineDash([]);}
 pts.forEach((w,i)=>{const p=project(w.coords.x,w.coords.y);if(p.x < -24||p.x>W+24||p.y < -24||p.y>H+24)return;
 const active=s.selected===i;ctx.beginPath();ctx.arc(p.x,p.y,active?17:14,0,Math.PI*2);ctx.fillStyle=classes[w.type]||"#ddb575";ctx.fill();ctx.lineWidth=active?4:2;ctx.strokeStyle=active?"#ffffff":"#122235";ctx.stroke();ctx.fillStyle="#071627";ctx.font="bold 13px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(i+1),p.x,p.y+1);ctx.textAlign="start";ctx.textBaseline="alphabetic";});
 ctx.restore();
}
function renderSelection(){
 const box=$("quest-selected"),w=s.steps[s.index].waypoints[s.selected];box.replaceChildren();
 if(!w){box.append(element("p",QT("Sélectionnez un point sur la carte.","Select a waypoint on the map.")));return}
 box.append(element("strong",(s.selected+1)+". "+waypointTitle(w)),element("p","X : "+format(w.coords.x)+" % · Y : "+format(w.coords.y)+" %"));
 const cmd="/way "+tomtom(w.coords.x)+" "+tomtom(w.coords.y);
 box.append(element("code",cmd));
 const copy=element("button",QT("Copier /way","Copy /way"));copy.type="button";
 copy.addEventListener("click",()=>{if(navigator.clipboard?.writeText){navigator.clipboard.writeText(cmd).then(()=>{copy.textContent=QT("Copié !","Copied!")},()=>{copy.textContent=QT("Sélectionnez la commande ci-dessus","Select and copy the command above")})}else{copy.textContent=QT("Sélectionnez la commande ci-dessus","Select and copy the command above")}});
 box.append(copy);
 const links=[];for(const type of ["starts","objectives","ends","completed"])for(const q of w[type]||[]){const d=detailsOf(q);if(d.id&&d.id>0&&!links.includes(d.id))links.push(d.id)}
 if(links.length){const a=element("a",QT("Détails de quête Classic ↗","Classic quest details ↗"));a.href="https://www.wowhead.com/classic/quest="+links[0];a.target="_blank";a.rel="noopener noreferrer";a.style.cssText="display:inline-block;margin-left:13px;color:#f1c988;font-size:12px;text-decoration:underline";box.append(a)}
 const note=element("p",QT("Commande utilisable dans la zone ","Command usable in ")+stepName(s.steps[s.index])+QT(". Certaines quêtes peuvent varier sur Forever.",". Some quests may differ in Forever."));note.style.color="#a9b7c7";box.append(note);
}
function selectWaypoint(i,focus=false){
 const step=s.steps[s.index];if(!step||i<0||i>=step.waypoints.length)return;
 s.selected=i;renderSelection();renderWaypoints();draw();
 if(focus&&typeof window!=="undefined"&&window.innerWidth<=900)$("quest-map-title").scrollIntoView({behavior:"smooth",block:"start"});
}
function renderWaypoints(){
 const list=$("quest-waypoints");list.replaceChildren();
 const pts=s.steps[s.index].waypoints;
 const typeIcons={starts:"＋",objectives:"◆",ends:"↩",completed:"✓",travel:"➜",prepare:"◈",combat:"⚔",interact:"●",tip:"✦"};
 pts.forEach((w,i)=>{
  const b=element("button",undefined,"quest-waypoint"+(s.selected===i?" selected":""));
  b.type="button";b.setAttribute("aria-pressed",String(s.selected===i));
  const title=element("div",undefined,"quest-waypoint-heading");
  title.append(element("b",String(i+1)),element("strong",waypointTitle(w)),element("small",format(w.coords.x)+" / "+format(w.coords.y)));
  b.append(title);
  const actions=element("div",undefined,"quest-actions");
  const groups=[];
  // Never conflate a quest's state with a guide author's instructions.
  for(const type of ["starts","objectives","ends","completed"]){
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
     level.title=QT("Niveau de la quête Classic","Classic quest level");
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
function renderFactionChoices(){
 for(const button of $("quest-factions").querySelectorAll("button[data-faction]")){
  const active=button.dataset.faction===s.faction;
  button.classList.toggle("selected",active);button.setAttribute("aria-pressed",String(active));
 }
}
function renderRaceChoices(){
 const panel=$("quest-races");panel.replaceChildren();
 for(const race of RACES[s.faction]){
  const active=race.id===s.race;
  const b=element("button",undefined,"quest-race-choice"+(active?" selected":""));
  b.type="button";b.dataset.race=race.id;b.setAttribute("aria-pressed",String(active));
  b.setAttribute("aria-label",QT("Choisir ","Choose ")+Q.race(race.label));
  const picture=element("img");picture.alt="";picture.width=48;picture.height=48;picture.loading="lazy";
  picture.src="https://raw.githubusercontent.com/lexicongaming/vanilla-questing-old/d1d53fd8834bd76297f748570080056d896fda6c/src/interface/images/icons/"+race.id+".png";
  picture.addEventListener("error",()=>{picture.replaceWith(element("span",race.label.slice(0,2).toUpperCase(),"quest-race-fallback"))},{once:true});
  b.append(picture,element("span",Q.race(race.label),"quest-race-label"),element("span","✓","quest-race-check"));
  b.addEventListener("click",()=>selectRace(race.id));panel.append(b);
 }
 $("quest-race-hint").textContent=s.faction==="alliance"?
 QT("Nains et Gnomes partagent le même guide de départ, mais gardent chacun leur portrait.","Dwarves and Gnomes share the starting route, but each keeps its own portrait."):
 QT("Orcs et Trolls partagent le même guide de départ, mais gardent chacun leur portrait.","Orcs and Trolls share the starting route, but each keeps its own portrait.");
}
function selectRace(id){
 const race=RACES[s.faction].find(r=>r.id===id);
 if(!race||!s.data||s.race===id)return;
 const changedRoute=s.profile!==race.profile;
 s.race=id;s.profile=race.profile;renderRaceChoices();
 if(changedRoute){
  s.steps=[...s.data.routes[s.profile],...s.data.routes.shared];s.index=0;s.selected=0;
  s.zoom=1;s.center={x:50,y:50};s.mapUrl="";renderMilestones();
 }
 render();search();
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
 const levels=[0,20,25,30,32,35,40,42,45,47,50,51,53,55,56,57,58,59,Infinity];
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
 $("quest-map-title").textContent=stepName(st);
 $("quest-map-source").textContent=QT("Molette : zoom · X/Y : 0 à 100","Scroll to zoom · X/Y: 0–100");
 const first=s.index===0,last=s.index===s.steps.length-1;
 $("quest-prev").disabled=first;$("quest-next").disabled=last;
 updateMilestones();renderWaypoints();renderSelection();setImage(st.zone);draw();syncUrl();
}
function go(n){if(scrubTimer!==null){clearTimeout(scrubTimer);scrubTimer=null}if(!s.steps.length)return;s.index=clamp(n,0,s.steps.length-1);s.selected=0;s.center={x:50,y:50};s.zoom=1;$("quest-zoom-reset").textContent="100 %";render();}
async function loadFaction(faction,fromUrl=false){
 const token=++pending,params=new URLSearchParams(location.search);
 if(!RACES[faction])return;
 s.faction=faction;
 let initial=RACES[faction][0];
 if(fromUrl&&params.get("faction")===faction){
  initial=RACES[faction].find(r=>r.id===params.get("peuple"))||
   RACES[faction].find(r=>r.profile===params.get("race"))||initial;
 }
 s.race=initial.id;s.profile=initial.profile;
 renderFactionChoices();renderRaceChoices();
 $("quest-data-status").classList.remove("is-ready");
 $("quest-data-status").textContent=QT("Chargement…","Loading…");
 try{
  if(!cache[faction]){
   const response=await fetch(ROOT+"data/quests/"+faction+".json");
   if(!response.ok)throw Error("HTTP "+response.status);
   cache[faction]=await response.json();
  }
  if(token!==pending)return;
  s.data=cache[faction];
  if(s.data.source_commit!==s.meta.source_commit||s.data.schema_version!==1)throw Error("Versions de données incompatibles");
  s.steps=[...s.data.routes[s.profile],...s.data.routes.shared];
  const number=fromUrl&&params.get("faction")===faction&&params.get("race")===s.profile?Number(params.get("step"))-1:NaN;
  s.index=Number.isInteger(number)?clamp(number,0,s.steps.length-1):0;
  s.selected=0;s.zoom=1;s.center={x:50,y:50};s.mapUrl="";
  $("quest-data-status").textContent=s.steps.length+QT(" étapes disponibles"," steps available");
  $("quest-data-status").classList.add("is-ready");
  $("quest-app").setAttribute("aria-busy","false");
  renderMilestones();render();search();
 }catch(err){
  if(token!==pending)return;
  $("quest-data-status").textContent=QT("Données indisponibles","Data unavailable");
  $("quest-map-title").textContent=QT("Erreur de chargement","Loading error");
  $("quest-map-source").textContent=err.message;
  $("quest-app").setAttribute("aria-busy","false");
 }
}
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
 wps.forEach((w,i)=>{const v=project(w.coords.x,w.coords.y),d=Math.hypot(v.x-p.x,v.y-p.y);if(d<min){min=d;best=i}});if(best>=0)selectWaypoint(best)});
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
for(const button of $("quest-factions").querySelectorAll("button[data-faction]")){
 button.addEventListener("click",()=>{if(button.dataset.faction!==s.faction)loadFaction(button.dataset.faction)});
}
$("quest-search").addEventListener("input",search);
$("quest-zoom-reset").addEventListener("click",()=>{s.center={x:50,y:50};setZoom(1)});
(async()=>{
 try{
 const resp=await fetch(ROOT+"data/quests/manifest.json");
 if(!resp.ok)throw Error("HTTP "+resp.status);
 s.meta=await resp.json();
 if(s.meta.coordinate_system!=="zone_percent_0_100")throw Error("Coordonnées incompatibles");
 // Supplementary Classic quest levels: the guide still works if this file is unavailable.
 try{
  const levelResponse=await fetch(ROOT+"data/quests/levels.json");
  if(levelResponse.ok){
   const levels=await levelResponse.json();
   if(levels.schema_version===1&&levels.levels&&typeof levels.levels==="object")s.questLevels=levels.levels;
  }
 }catch(_err){s.questLevels=null}

 const params=new URLSearchParams(location.search);const faction=params.get("faction")==="horde"?"horde":"alliance";await loadFaction(faction,true);
 }catch(err){$("quest-map-title").textContent=QT("Impossible de charger les données","Unable to load quest data");$("quest-map-source").textContent=err.message;$("quest-data-status").textContent=QT("Indisponible","Unavailable");$("quest-app").setAttribute("aria-busy","false")}
})();
})();