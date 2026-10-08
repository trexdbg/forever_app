(()=>{
"use strict";
const ROOT="/forever_app/";
const $=id=>document.getElementById(id),canvas=$("quest-canvas");
if(!canvas)return;
const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
const cache={},s={meta:null,data:null,faction:"alliance",profile:"human",steps:[],index:0,done:new Set(),selected:0,zoom:1,center:{x:50,y:50},image:null,mapUrl:"",mapLoaded:false};
let pending=0,pointer=null;
const labels={starts:"À prendre",objectives:"À faire",ends:"À rendre",completed:"À terminer",special:"Conseil"};
const classes={quest:"#e4bd7c",hub:"#efc772",objective:"#7bc9cb",flightpath:"#9daff0",travel:"#b2adcf"};
const element=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const stepName=st=>s.meta?.zones?.[st.zone]||st.zone;
const cleanStr=v=>String(v||"").trim();
const normal=v=>cleanStr(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const detailsOf=ref=>{
 const name=Array.isArray(ref)?ref[0]:ref;
 const target=s.data.quest_ids[name];
 let id=target;
 if(Array.isArray(target)){const suffix=Array.isArray(ref)?String(ref[1]||""):"";const n=suffix.match(/(?:p|^)(\d+)/);id=target[n?clamp(Number(n[1])-1,0,target.length-1):0];}
 const french=(id!==undefined&&id!==null)?s.data.translations[String(id)]:null;
 return {name:french||name,original:name,id:Number.isInteger(Number(id))?Number(id):null};
};
const waypointTitle=w=>w.header==="placeholder"?"Zone d'objectif":cleanStr(w.header)||"Point de passage";
const stepLabel=i=>{const st=s.steps[i];return stepName(st)+" · niv. ≈ "+Math.floor(Number(st.experience)||0)};
const storageKey=()=> "forever.quests.done.v1."+s.faction+"."+s.profile;
const loadDone=()=>{try{const raw=JSON.parse(localStorage.getItem(storageKey())||"[]");s.done=new Set(Array.isArray(raw)?raw.filter(v=>Number.isInteger(v)&&v>=0&&v<s.steps.length):[])}catch{s.done=new Set()}};
const saveDone=()=>{try{localStorage.setItem(storageKey(),JSON.stringify([...s.done].sort((a,b)=>a-b)))}catch{}};
const syncUrl=()=>{const u=new URL(location.href);u.searchParams.set("faction",s.faction);u.searchParams.set("race",s.profile);u.searchParams.set("step",String(s.index+1));history.replaceState(null,"",u.pathname+u.search+u.hash)};
const project=(x,y)=>({x:(50+(x-s.center.x)*s.zoom)*W/100,y:(50+(y-s.center.y)*s.zoom)*H/100});
const clientPoint=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}};
const format=n=>Number(n).toFixed(1).replace(".",",");
const tomtom=n=>Number(n).toFixed(2);
function setImage(zone){
 const url=s.meta.map_base+encodeURIComponent(zone)+".jpg";
 if(s.mapUrl===url)return;
 s.mapUrl=url;s.image=null;s.mapLoaded=false;$("quest-map-overlay").textContent="Carte Classic · source communautaire";
 const img=new Image();
 img.onload=()=>{if(s.mapUrl!==url)return;s.image=img;s.mapLoaded=true;$("quest-map-overlay").textContent="Carte Classic © Blizzard · Vanilla Questing";draw()};
 img.onerror=()=>{if(s.mapUrl!==url)return;$("quest-map-overlay").textContent="Grille X/Y · fond indisponible";draw()};
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
 if(!w){box.append(element("p","Sélectionnez un point sur la carte."));return}
 box.append(element("strong",(s.selected+1)+". "+waypointTitle(w)),element("p","X : "+format(w.coords.x)+" % · Y : "+format(w.coords.y)+" %"));
 const cmd="/way "+tomtom(w.coords.x)+" "+tomtom(w.coords.y);
 box.append(element("code",cmd));
 const copy=element("button","Copier /way");copy.type="button";
 copy.addEventListener("click",()=>{if(navigator.clipboard?.writeText){navigator.clipboard.writeText(cmd).then(()=>{copy.textContent="Copié !"},()=>{copy.textContent="Sélectionnez la commande ci-dessus"})}else{copy.textContent="Sélectionnez la commande ci-dessus"}});
 box.append(copy);
 const links=[];for(const type of ["starts","objectives","ends","completed"])for(const q of w[type]||[]){const d=detailsOf(q);if(d.id&&d.id>0&&!links.includes(d.id))links.push(d.id)}
 if(links.length){const a=element("a","Détails de quête Classic ↗");a.href="https://www.wowhead.com/classic/quest="+links[0];a.target="_blank";a.rel="noopener noreferrer";a.style.cssText="display:inline-block;margin-left:13px;color:#f1c988;font-size:12px;text-decoration:underline";box.append(a)}
 const note=element("p","Commande à utiliser dans la zone "+stepName(s.steps[s.index])+". Référence Classic non garantie sur Forever.");note.style.color="#a9b7c7";box.append(note);
}
function selectWaypoint(i,focus=false){
 const step=s.steps[s.index];if(!step||i<0||i>=step.waypoints.length)return;
 s.selected=i;renderSelection();renderWaypoints();draw();
 if(focus)$("quest-selected").scrollIntoView({behavior:"smooth",block:"nearest"});
}
function renderWaypoints(){
 const list=$("quest-waypoints");list.replaceChildren();const pts=s.steps[s.index].waypoints;
 pts.forEach((w,i)=>{
  const b=element("button",undefined,"quest-waypoint"+(s.selected===i?" selected":""));b.type="button";b.setAttribute("aria-pressed",String(s.selected===i));
  const title=element("div",undefined,"quest-waypoint-heading");title.append(element("b",String(i+1)),element("strong",waypointTitle(w)),element("small",format(w.coords.x)+" / "+format(w.coords.y)));b.append(title);
  const actions=element("div",undefined,"quest-actions");let found=false;
  for(const type of ["starts","objectives","ends","completed","special"]){
   for(const entry of w[type]||[]){found=true;const action=element("span",undefined,"quest-action");
    action.append(element("span",labels[type],"quest-action-tag "+type));
    const txt=type==="special"?cleanStr(entry):detailsOf(entry).name;action.append(element("span",txt));actions.append(action)}
  }
  if(!found)actions.append(element("span","Rejoindre ce point de passage.","quest-action"));
  b.append(actions);b.addEventListener("click",()=>selectWaypoint(i,true));list.append(b);
 });
}
function renderStepper(){
 const list=$("quest-steps");list.replaceChildren();const n=s.steps.length;
 const indices=[];for(let i=0;i<n;i++)if(i===0||i===n-1||Math.abs(i-s.index)<=6)indices.push(i);
 let previous=-1;for(const i of indices){if(i-previous>1)list.append(element("span","· · ·","quest-step-ellipsis"));previous=i;const step=s.steps[i];
 const b=element("button",undefined,"quest-step-button"+(i===s.index?" active":"")+(s.done.has(i)?" done":""));b.type="button";b.setAttribute("aria-current",String(i===s.index?"step":"false"));
 b.append(element("span",s.done.has(i)?"✓":String(i+1),"step-n"));
 const d=element("span",undefined,"step-description");d.append(element("strong",stepName(step)),element("small","≈ niv. "+Math.floor(Number(step.experience)||0)+" · "+step.waypoints.length+" points"));b.append(d);
 b.addEventListener("click",()=>go(i));list.append(b);}
}
function renderProgress(){
 const total=s.steps.length,done=s.done.size,percent=total?Math.round(100*done/total):0;
 $("quest-path-label").textContent=(s.faction==="alliance"?"Alliance":"Horde")+" · "+$("quest-profile").selectedOptions[0]?.textContent;
 $("quest-progress-info").textContent=done+" / "+total+" étapes terminées ("+percent+" %)";
 $("quest-progress-fill").style.width=percent+"%";
 $("quest-progress-track").setAttribute("aria-valuenow",String(percent));
}
function render(){
 const st=s.steps[s.index];if(!st)return;
 $("quest-range").max=String(s.steps.length);$("quest-range").value=String(s.index+1);$("quest-range-output").textContent=(s.index+1)+" / "+s.steps.length;
 $("quest-step-count").textContent="ÉTAPE "+(s.index+1)+" / "+s.steps.length;
 $("quest-zone-title").textContent=stepName(st);
 $("quest-level").textContent="Niveau approximatif : "+Number(st.experience||0).toFixed(1).replace(".",",")+" · "+st.waypoints.length+" points à visiter";
 $("quest-map-title").textContent=stepName(st)+" · itinéraire dans la zone";
 $("quest-map-source").textContent="Coordonnées de zone X/Y · 0 à 100";
 const first=s.index===0,last=s.index===s.steps.length-1;
 $("quest-prev").disabled=$("quest-prev-bottom").disabled=first;$("quest-next").disabled=$("quest-next-bottom").disabled=last;
 const complete=$("quest-complete"),done=s.done.has(s.index);complete.textContent=done?"✓ Étape terminée · annuler":"Marquer l'étape terminée ✓";complete.setAttribute("aria-pressed",String(done));
 renderProgress();renderStepper();renderWaypoints();renderSelection();setImage(st.zone);draw();syncUrl();
}
function go(n){if(!s.steps.length)return;s.index=clamp(n,0,s.steps.length-1);s.selected=0;s.center={x:50,y:50};s.zoom=1;$("quest-zoom-reset").textContent="100 %";render();}
async function loadProfile(){
 const token=++pending,savedParams=new URLSearchParams(location.search);
 const faction=$("quest-faction").value;s.faction=faction;
 const profileOptions=s.meta.profiles[faction];const profileSelect=$("quest-profile"),requested=profileSelect.value;
 profileSelect.replaceChildren();for(const p of profileOptions){const option=element("option",p.label+" · "+p.subtitle);option.value=p.id;profileSelect.append(option)}
 s.profile=profileOptions.some(x=>x.id===requested)?requested:profileOptions[0].id;
 if(savedParams.get("faction")===faction&&profileOptions.some(x=>x.id===savedParams.get("race"))&&!("loaded" in profileSelect.dataset)){s.profile=savedParams.get("race")}
 profileSelect.value=s.profile;profileSelect.dataset.loaded="yes";
 $("quest-data-status").textContent="Chargement…";
 try{
  if(!cache[faction]){const res=await fetch(ROOT+"data/quests/"+faction+".json");if(!res.ok)throw Error("HTTP "+res.status);cache[faction]=await res.json()}
  if(token!==pending)return;
  s.data=cache[faction];if(s.data.source_commit!==s.meta.source_commit||s.data.schema_version!==1)throw Error("Versions de données incompatibles");
  s.steps=[...s.data.routes[s.profile],...s.data.routes.shared];loadDone();
  const restored=savedParams.get("faction")===faction&&savedParams.get("race")===s.profile?Number(savedParams.get("step"))-1:NaN;
  s.index=Number.isInteger(restored)?clamp(restored,0,s.steps.length-1):0;
  s.selected=0;s.zoom=1;s.center={x:50,y:50};s.mapUrl="";$("quest-data-status").textContent=s.steps.length+" étapes · Classic";
  $("quest-app").setAttribute("aria-busy","false");render();search();
 }catch(err){$("quest-data-status").textContent="Données indisponibles";$("quest-zone-title").textContent="Erreur de chargement";$("quest-level").textContent=err.message;$("quest-app").setAttribute("aria-busy","false")}
}
function setProfile(){
 const profile=$("quest-profile").value;
 if(!s.data?.routes?.[profile])return;
 s.profile=profile;s.steps=[...s.data.routes[profile],...s.data.routes.shared];loadDone();s.index=0;s.selected=0;s.zoom=1;s.center={x:50,y:50};s.mapUrl="";
 $("quest-data-status").textContent=s.steps.length+" étapes · Classic";render();search();
}
function search(){
 const text=normal($("quest-search").value),res=$("quest-search-results");res.replaceChildren();res.hidden=!text;
 if(!text||!s.data)return;let results=0,all=0;
 for(let i=0;i<s.steps.length;i++){const st=s.steps[i];
  const matches=normal(stepName(st)).includes(text)||st.waypoints.some(w=>normal(waypointTitle(w)).includes(text)||["starts","ends","objectives","completed"].some(k=>(w[k]||[]).some(q=>{const a=detailsOf(q);return normal(a.name).includes(text)||normal(a.original).includes(text)||String(a.id||"")===text})));
  if(!matches)continue;all++;if(results>=35)continue;results++;
  const b=element("button",undefined,"quest-search-result");b.type="button";b.append(element("strong","Étape "+(i+1)),element("span",stepName(st)),element("small","niv. ≈ "+Math.floor(st.experience)));b.addEventListener("click",()=>{go(i);$("quest-search").value="";res.hidden=true;res.replaceChildren();$("quest-zone-title").scrollIntoView({behavior:"smooth",block:"nearest"})});res.append(b);}
 if(!all)res.append(element("p","Aucune étape correspondante dans ce parcours."));
 if(all>35)res.append(element("p",all+" correspondances · 35 premiers résultats affichés."));
}
function setZoom(z){s.zoom=clamp(z,1,4);s.center.x=clamp(s.center.x,50/s.zoom,100-50/s.zoom);s.center.y=clamp(s.center.y,50/s.zoom,100-50/s.zoom);$("quest-zoom-reset").textContent=Math.round(s.zoom*100)+" %";draw()}
canvas.addEventListener("pointerdown",e=>{const p=clientPoint(e);pointer={id:e.pointerId,start:p,prev:p,drag:false};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener("pointermove",e=>{if(!pointer||e.pointerId!==pointer.id)return;const p=clientPoint(e);if(Math.hypot(p.x-pointer.start.x,p.y-pointer.start.y)>6)pointer.drag=true;
 if(pointer.drag){s.center.x=clamp(s.center.x-(p.x-pointer.prev.x)/W*100/s.zoom,50/s.zoom,100-50/s.zoom);s.center.y=clamp(s.center.y-(p.y-pointer.prev.y)/H*100/s.zoom,50/s.zoom,100-50/s.zoom);draw()}pointer.prev=p});
canvas.addEventListener("pointerup",e=>{if(!pointer||e.pointerId!==pointer.id)return;const dragged=pointer.drag;pointer=null;if(dragged)return;const p=clientPoint(e),wps=s.steps[s.index]?.waypoints||[];let best=-1,min=24;
 wps.forEach((w,i)=>{const v=project(w.coords.x,w.coords.y),d=Math.hypot(v.x-p.x,v.y-p.y);if(d<min){min=d;best=i}});if(best>=0)selectWaypoint(best)});
canvas.addEventListener("pointercancel",()=>pointer=null);
canvas.addEventListener("wheel",e=>{if(!e.ctrlKey)return;e.preventDefault();setZoom(s.zoom+(e.deltaY<0?.25:-.25))},{passive:false});
canvas.addEventListener("keydown",e=>{if(e.key==="ArrowRight"){e.preventDefault();selectWaypoint((s.selected+1)%s.steps[s.index].waypoints.length)}if(e.key==="ArrowLeft"){e.preventDefault();selectWaypoint((s.selected+s.steps[s.index].waypoints.length-1)%s.steps[s.index].waypoints.length)}});
$("quest-prev").addEventListener("click",()=>go(s.index-1));$("quest-next").addEventListener("click",()=>go(s.index+1));
$("quest-prev-bottom").addEventListener("click",()=>go(s.index-1));$("quest-next-bottom").addEventListener("click",()=>go(s.index+1));
$("quest-range").addEventListener("input",e=>go(Number(e.target.value)-1));
$("quest-faction").addEventListener("change",loadProfile);
$("quest-profile").addEventListener("change",setProfile);
$("quest-search").addEventListener("input",search);
$("quest-zoom-out").addEventListener("click",()=>setZoom(s.zoom-.5));
$("quest-zoom-in").addEventListener("click",()=>setZoom(s.zoom+.5));
$("quest-zoom-reset").addEventListener("click",()=>{s.center={x:50,y:50};setZoom(1)});
$("quest-complete").addEventListener("click",()=>{if(s.done.has(s.index))s.done.delete(s.index);else s.done.add(s.index);saveDone();render()});
$("quest-reset").addEventListener("click",()=>{if(!confirm("Effacer la progression du parcours "+s.profile+" ?"))return;s.done.clear();saveDone();render()});
(async()=>{
 try{const resp=await fetch(ROOT+"data/quests/manifest.json");if(!resp.ok)throw Error("HTTP "+resp.status);s.meta=await resp.json();if(s.meta.coordinate_system!=="zone_percent_0_100")throw Error("Coordonnées incompatibles");
 const params=new URLSearchParams(location.search);const faction=params.get("faction")==="horde"?"horde":"alliance";$("quest-faction").value=faction;await loadProfile();
 }catch(err){$("quest-zone-title").textContent="Impossible de charger les données";$("quest-level").textContent=err.message;$("quest-data-status").textContent="Indisponible";$("quest-app").setAttribute("aria-busy","false")}
})();
})();