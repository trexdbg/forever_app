/* Quest Lab: standalone Classic beta UI. No in-game sync; user declarations drive planning. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const Planner = window.ForeverQuestPlanner;
if (!Planner) return;
const STORAGE = "foreveroth.quest-lab.classic.v1";
const RACES = {
 alliance:[["human","human","Humain","Human"],["dwarf","gnorf","Nain","Dwarf"],["gnome","gnorf","Gnome","Gnome"],["nelf","nelf","Elfe de la nuit","Night elf"]],
 horde:[["orc","trorc","Orc","Orc"],["troll","trorc","Troll","Troll"],["undead","undead","Mort-vivant","Undead"],["tauren","tauren","Tauren","Tauren"]]
};
const L = {
 fr:{
 heading:"Laboratoire de quêtes", headline:"Votre itinéraire, <em>recalculé.</em>", description:"Vous indiquez l’état réel de vos quêtes. Le parcours évolue immédiatement, sans modifier le guide public.",
 warning:"Classic uniquement : guide communautaire à partir du niveau ~5. Niveaux conseillés ≠ prérequis vérifiés. Aucun accès automatique au journal du jeu.",
 character:"Personnage",faction:"Faction",race:"Race",level:"Niveau actuel",zone:"Zone actuelle",x:"Position X (%)",y:"Position Y (%)",
 positionTip:"Cliquez sur la carte pour placer votre position. Les coordonnées sont saisies manuellement.",
 journal:"Journal de quêtes",searchLabel:"Ajouter ou modifier une quête",searchPlaceholder:"Nom ou ID de quête…",
 progressFilter:"En cours",allFilter:"Toutes",doneFilter:"Terminées",
 journalHint:"Sélectionnez « Acceptée », « Objectifs faits » ou « Rendue » selon votre journal en jeu.",
 tools:"Session de test",export:"Exporter JSON",import:"Importer JSON",reset:"Réinitialiser cette session",
 saveHint:"État conservé localement dans ce navigateur. Aucun compte ni synchronisation avec WoW.",
 kicker:"ITINÉRAIRE ADAPTATIF",next:"Vos prochains déplacements",
 activeLabel:"acceptées",readyLabel:"à rendre",doneLabel:"rendues",
 mapKicker:"LOCALISATION",mapTitle:"Carte de la zone",legendPlayer:"Position saisie",legendRoute:"Étapes proposées",
 mapTip:"Molette : zoom · Glisser : déplacer · Cliquer : définir X/Y",
 routeKicker:"PARCOURS EN DIRECT",routeTitle:"Étapes proposées",
 algorithm:"Ordre indicatif basé sur les positions, les niveaux et l’état déclaré. Les prérequis non documentés restent à vérifier en jeu.",
 loading:"Chargement des données Classic…",loaded:"Données Classic chargées",failed:"Données indisponibles",
 emptySearch:"Aucune quête trouvée. Le catalogue couvre les itinéraires communautaires, pas toutes les quêtes de Classic.",
 emptyLog:"Aucune quête en cours. Recherchez une quête ou suivez une proposition ci-contre.",
 allCount:"quêtes référencées",activeCount:"en cours",
 stepCount:"étapes",blankRoute:"Aucune étape éligible dans cette fenêtre de progression. Changez de zone, indiquez des quêtes acceptées ou vérifiez votre niveau.",
 summary:"Propositions recalculées depuis votre journal et la position indiquée.",
 labelAccept:"À accepter",labelObjective:"Objectif à accomplir",labelTurnin:"À rendre",labelInstant:"Prendre et terminer",
 btnAccept:"J’ai accepté",btnObjective:"Objectifs faits",btnTurnin:"J’ai rendu",btnInstant:"Quête terminée",
 focusMap:"Voir sur la carte",questLevel:"niv.",recommendation:"Niveau de quête Classic (non minimum garanti)",
 statusAvailable:"Disponible / inconnue",statusActive:"Acceptée",statusReady:"Objectifs faits",statusDone:"Rendue",statusSkipped:"Ignorée",
 notes:"Conseil du guide",mapLoading:"Chargement de la carte…",mapUnavailable:"Fond de carte indisponible · coordonnées utilisables",
 mapAttribution:"Carte Classic communautaire · source du guide",moveTip:"Position mise à jour manuellement",
 confirmReset:"Réinitialiser les quêtes et coordonnées de ce profil de test ?",importError:"Impossible d’importer ce fichier : format de session incompatible.",
 importSuccess:"Session importée. Itinéraire recalculé.",saved:"Modifications sauvegardées en local",
 levelLimit:"Le guide commence vers le niveau 5. Les quêtes de niveaux 1–4 ne sont pas couvertes.",
 unknown:"Non vérifié",backToTop:"Retour à la carte",jsonError:"Le stockage du navigateur est indisponible : la session reste utilisable, sans sauvegarde."
 },
 en:{
 heading:"Quest laboratory",headline:"Your route, <em>recalculated.</em>",description:"Enter your actual quest status. Your route adapts immediately without changing the public guide.",
 warning:"Classic only: community guide starting at approximately level 5. Quest levels are not verified prerequisites. No automatic access to in-game quests.",
 character:"Character",faction:"Faction",race:"Race",level:"Current level",zone:"Current zone",x:"Position X (%)",y:"Position Y (%)",
 positionTip:"Click the map to set your position. Coordinates are entered manually.",
 journal:"Quest log",searchLabel:"Add or update a quest",searchPlaceholder:"Quest name or ID…",
 progressFilter:"In progress",allFilter:"All",doneFilter:"Completed",
 journalHint:"Select Accepted, Objectives done, or Turned in according to your in-game quest log.",
 tools:"Test session",export:"Export JSON",import:"Import JSON",reset:"Reset this session",
 saveHint:"State is stored only in this browser. No account or sync with WoW.",
 kicker:"ADAPTIVE ITINERARY",next:"Your next stops",
 activeLabel:"accepted",readyLabel:"to turn in",doneLabel:"turned in",
 mapKicker:"LOCATION",mapTitle:"Zone map",legendPlayer:"Entered position",legendRoute:"Suggested stops",
 mapTip:"Scroll: zoom · Drag: pan · Click: set X/Y",
 routeKicker:"LIVE ROUTE",routeTitle:"Suggested stops",
 algorithm:"Suggested order based on positions, levels, and declared quest states. Undocumented prerequisites must be verified in game.",
 loading:"Loading Classic data…",loaded:"Classic data loaded",failed:"Data unavailable",
 emptySearch:"No quest found. The catalog covers community routes, not every Classic quest.",
 emptyLog:"No quests in progress. Search for a quest or follow a suggested stop.",
 allCount:"listed quests",activeCount:"in progress",
 stepCount:"stops",blankRoute:"No eligible steps in this progression window. Change zone, mark accepted quests, or verify your level.",
 summary:"Suggestions recalculated from your quest log and entered position.",
 labelAccept:"Accept",labelObjective:"Complete objective",labelTurnin:"Turn in",labelInstant:"Accept and complete",
 btnAccept:"I've accepted",btnObjective:"Objectives done",btnTurnin:"I've turned it in",btnInstant:"Quest completed",
 focusMap:"Show on map",questLevel:"lvl",recommendation:"Classic quest level (not a verified minimum)",
 statusAvailable:"Available / unknown",statusActive:"Accepted",statusReady:"Objectives done",statusDone:"Turned in",statusSkipped:"Skipped",
 notes:"Guide tip",mapLoading:"Loading zone map…",mapUnavailable:"Map image unavailable · coordinates still work",
 mapAttribution:"Classic community map · guide source",moveTip:"Position updated manually",
 confirmReset:"Reset quests and coordinates for this test profile?",importError:"Could not import this file: incompatible session format.",
 importSuccess:"Session imported. Route recalculated.",saved:"Changes saved locally",
 levelLimit:"The guide starts around level 5. Levels 1–4 are not covered.",
 unknown:"Unverified",backToTop:"Back to map",jsonError:"Browser storage is unavailable: you can still use the session, without saving."
 }};
const text = key => L[session.lang || "fr"][key] || key;
const escapeHtml = text => String(text).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const normalize = str => String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const initialSession=()=>({schema_version:1,edition:"classic",faction:"alliance",race:"human",lang:"fr",profiles:{}});
let session=initialSession();
try{
 const saved=JSON.parse(localStorage.getItem(STORAGE)||"null");
 if(saved?.schema_version===1&&saved.edition==="classic"&&saved.profiles&&typeof saved.profiles==="object") session={...initialSession(),...saved};
}catch(_){}
if(!["fr","en"].includes(session.lang)) session.lang="fr";
let source=null,catalog=null,state=null,route=null,mapZone="",mapImage=null,imageZone="",imageOkay=false;
let logFilter="progress",selectedStop="",mapView={x:50,y:50,zoom:1},pointer=null,warningTimeout=0;
const canvas=$("map-canvas"),ctx=canvas.getContext("2d");
const profileId=()=> (RACES[session.faction]||RACES.alliance).find(r=>r[0]===session.race)?.[1]||"human";
const profileKey=()=> session.faction+":"+profileId();
const questTitle=q=>session.lang==="en"?q.en:q.fr||q.en;
const zoneName=zone=>session.lang==="en"?(zone.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase())):(catalog?.zones?.[zone]||zone);
const waypointName=p=>{
 const Q=window.ForeverQuestLocale;
 return session.lang==="fr" && Q?.header ? Q.header(p.header)||p.header : (p.header||zoneName(p.zone)).replace(/(^|\s)([a-z])/g,(_,space,c)=>space+c.toUpperCase());
};
const $make=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;};
const setLabel=(id,key)=>{const el=$(id);if(el)el.textContent=text(key);};
function status(message,warning=false){
 $("data-status").textContent=message;
 $("data-status").style.color=warning?"#f1b7ae":"";
}
function save(){
 session.profiles[profileKey()]=state;
 try{localStorage.setItem(STORAGE,JSON.stringify(session));}catch(_){status(text("jsonError"),true);}
}
function initProfile(){
 const data=source[session.faction];
 catalog=Planner.buildCatalog({manifest:source.manifest,data,levels:source.levels.levels,profile:profileId()});
 state=Planner.normalizeState(session.profiles[profileKey()]||{level:5},catalog);
 mapZone=state.zone;
 mapView={x:50,y:50,zoom:1};
 selectedStop="";
 renderControls();
 save();
 renderAll();
 loadMap();
}
function renderLabels(){
 document.documentElement.lang=session.lang;
 document.title=session.lang==="fr"?"Laboratoire de quêtes · Classic Beta | ForEveroth":"Quest Lab · Classic Beta | ForEveroth";
 const names={
 "lab-heading":"heading","description":"description","source-warning":"warning","character-title":"character",
 "faction-title":"faction","race-title":"race","level-title":"level","zone-title":"zone",
 "x-title":"x","y-title":"y","position-tip":"positionTip","journal-title":"journal",
 "search-label":"searchLabel","journal-hint":"journalHint","tool-title":"tools",
 "export-session":"export","import-label":"import","reset-session":"reset","save-hint":"saveHint",
 "summary-kicker":"kicker","next-title":"next","active-label":"activeLabel",
 "ready-label":"readyLabel","done-label":"doneLabel","map-kicker":"mapKicker",
 "map-title":"mapTitle","map-legend-player":"legendPlayer","map-legend-route":"legendRoute",
 "map-tip":"mapTip","route-kicker":"routeKicker","route-title":"routeTitle",
 "algorithm-note":"algorithm"
 };
 for(const [id,key] of Object.entries(names))setLabel(id,key);
 $("headline").innerHTML=text("headline");
 $("quest-search").placeholder=text("searchPlaceholder");
 $("language").textContent=session.lang==="fr"?"EN":"FR";
 $("language").setAttribute("aria-label",session.lang==="fr"?"Switch to English":"Passer en français");
 document.querySelector('[data-filter="progress"]').textContent=text("progressFilter");
 document.querySelector('[data-filter="all"]').textContent=text("allFilter");
 document.querySelector('[data-filter="done"]').textContent=text("doneFilter");
 $("map-attribution").textContent=text("mapAttribution");
}
function renderControls(){
 renderLabels();
 $("faction").value=session.faction;
 const races=$("race");races.replaceChildren();
 for(const [id,_profile,fr,en] of RACES[session.faction]){
  const option=document.createElement("option");option.value=id;option.textContent=session.lang==="fr"?fr:en;races.append(option);
 }
 races.value=session.race;
 $("level").value=state.level;
 const options=Object.keys(catalog.zones).sort((a,b)=>zoneName(a).localeCompare(zoneName(b),session.lang));
 for(const id of ["zone","map-zone"]){
  const select=$(id);select.replaceChildren();
  options.forEach(z=>{const opt=document.createElement("option");opt.value=z;opt.textContent=zoneName(z);select.append(opt);});
 }
 $("zone").value=state.zone;$("map-zone").value=mapZone;
 $("pos-x").value=state.x===null?"":state.x;
 $("pos-y").value=state.y===null?"":state.y;
}
function updateState(next){
 state=Planner.normalizeState(next,catalog);
 save();
 $("zone").value=state.zone;$("level").value=state.level;
 $("pos-x").value=state.x===null?"":state.x;
 $("pos-y").value=state.y===null?"":state.y;
 renderAll();
}
function changeQuest(key,statusValue,stage=null){
 const next=Planner.setStatus(state,key,statusValue,catalog);
 if(stage!==null && statusValue!=="skipped"&&statusValue!=="available")
  next.cursor=Math.max(state.cursor===null?0:state.cursor,stage);
 updateState(next);
}
function renderAll(){
 if(!catalog)return;
 route=Planner.calculate(catalog,state,{maxStops:8,levelMargin:1});
 $("stat-active").textContent=route.counts.active;
 $("stat-ready").textContent=route.counts.ready;
 $("stat-done").textContent=route.counts.done;
 $("journal-count").textContent=(route.counts.active+route.counts.ready)+" "+text("activeCount");
 $("summary-line").textContent=text("summary")+(state.level<5?" "+text("levelLimit"):"");
 $("route-count").textContent=route.itinerary.length+" "+text("stepCount");
 renderLog();renderRoute();drawMap();
}
function renderLog(){
 const search=normalize($("quest-search").value.trim());
 const list=$("quest-browser");list.replaceChildren();
 const data=Object.values(catalog.quests).filter(q=>!q.removed);
 const filtered=data.filter(q=>{
  const status=Planner.getStatus(state,q.key);
  if(search)return normalize(q.fr+" "+q.en+" "+(q.id||"")).includes(search);
  return logFilter==="all" || (logFilter==="progress"&&(status==="active"||status==="ready")) || (logFilter==="done"&&status==="done");
 });
 const order={ready:0,active:1,available:2,done:3,skipped:4};
 filtered.sort((a,b)=>(order[Planner.getStatus(state,a.key)]-order[Planner.getStatus(state,b.key)])||questTitle(a).localeCompare(questTitle(b),session.lang));
 const shown=filtered.slice(0,search?40:logFilter==="all"?45:60);
 if(!shown.length){list.append($make("p","quest-empty",search?text("emptySearch"):text("emptyLog")));return;}
 for(const q of shown){
  const row=$make("div","quest-row");
  const info=$make("div"),name=$make("strong",null,questTitle(q));
  const metadata=$make("small",null,(q.id?"#"+q.id+" · ":"")+(q.level?text("questLevel")+" "+q.level:"")+" · "+(q.prerequisitesKnown?"✓":"?"));
  metadata.title=q.prerequisitesKnown?("Prerequisites: "+q.requires.join(", ")):text("unknown");
  info.append(name,metadata);
  const select=$make("select");select.setAttribute("aria-label",questTitle(q));
  for(const [value,label] of [["available","statusAvailable"],["active","statusActive"],["ready","statusReady"],["done","statusDone"],["skipped","statusSkipped"]]){
   const option=$make("option",null,text(label));option.value=value;select.append(option);
  }
  select.value=Planner.getStatus(state,q.key);
  select.addEventListener("change",()=>changeQuest(q.key,select.value));
  row.append(info,select);list.append(row);
 }
 if(filtered.length>shown.length)list.append($make("p","quest-empty","+"+(filtered.length-shown.length)+" · "+text("searchLabel")));
}
function renderRoute(){
 const target=$("route-list");target.replaceChildren();
 $("empty-hint").hidden=route.itinerary.length!==0;
 $("empty-hint").textContent=text("blankRoute");
 const labels={accept:"labelAccept",objective:"labelObjective",turnin:"labelTurnin",instant:"labelInstant"};
 const buttons={accept:"btnAccept",objective:"btnObjective",turnin:"btnTurnin",instant:"btnInstant"};
 const resulting={accept:"active",objective:"ready",turnin:"done",instant:"done"};
 route.itinerary.forEach((point,i)=>{
  const selected=selectedStop===point.id;
  const block=$make("article","route-stop"+(selected?" selected":""));
  const number=$make("span","stop-order",String(i+1));
  const content=$make("div","stop-content");
  const top=$make("div","stop-top");top.append($make("h3",null,waypointName(point)), $make("small",null,point.x.toFixed(1)+" / "+point.y.toFixed(1)));
  const where=$make("div","stop-where",zoneName(point.zone)+" · "+text("questLevel")+" "+Math.floor(point.experience)+" ~");
  const actions=$make("div","stop-actions");
  point.actions.forEach(action=>{
   const q=catalog.quests[action.questKey];
   const row=$make("div","stop-action "+action.kind);
   const info=$make("div","stop-action-details");
   info.append($make("span","tag",text(labels[action.kind])), $make("strong","quest-name",questTitle(q)));
   if(q.level!==null)info.append($make("small",null,text("questLevel")+" "+q.level));
   const btn=$make("button",null,text(buttons[action.kind]));btn.type="button";
   btn.setAttribute("aria-label",text(buttons[action.kind])+" : "+questTitle(q));
   btn.addEventListener("click",()=>changeQuest(q.key,resulting[action.kind],point.stage));
   row.append(info,btn);actions.append(row);
  });
  const focus=$make("button","focus-map",text("focusMap"));focus.type="button";
  focus.addEventListener("click",()=>{selectedStop=point.id;setMapZone(point.zone);renderRoute();$("map-canvas").scrollIntoView({behavior:"smooth",block:"center"});});
  content.append(top,where,actions);
  if(point.notes.length){
   const Q=window.ForeverQuestLocale;
   const hint=point.notes.slice(0,2).map(s=>session.lang==="fr"&&Q?.note?Q.note(s):Array.isArray(s)?s[0]:s).join(" · ");
   content.append($make("p","notes",text("notes")+": "+hint));
  }
  content.append(focus);
  block.append(number,content);target.append(block);
 });
}
function setMapZone(zone){
 if(!catalog.zones[zone])return;
 mapZone=zone;$("map-zone").value=zone;
 mapView={x:50,y:50,zoom:1};imageZone="";loadMap();
}
function loadMap(){
 if(!catalog||imageZone===mapZone)return;
 imageZone=mapZone;mapImage=null;imageOkay=false;
 const zone=imageZone;const img=new Image();
 $("map-attribution").textContent=text("mapLoading");
 img.onload=()=>{if(zone!==mapZone)return;mapImage=img;imageOkay=true;$("map-attribution").textContent=text("mapAttribution");drawMap();};
 img.onerror=()=>{if(zone!==mapZone)return;mapImage=null;imageOkay=false;$("map-attribution").textContent=text("mapUnavailable");drawMap();};
 img.src=catalog.mapBase+encodeURIComponent(zone)+".jpg";
 drawMap();
}
function project(x,y){
 return {x:(.5+(x-mapView.x)*mapView.zoom/100)*canvas.width,y:(.5+(y-mapView.y)*mapView.zoom/100)*canvas.height};
}
function unproject(x,y){
 return {x:Math.max(0,Math.min(100,mapView.x+(x/canvas.width-.5)*100/mapView.zoom)),y:Math.max(0,Math.min(100,mapView.y+(y/canvas.height-.5)*100/mapView.zoom))};
}
function canvasPoint(event){
 const rect=canvas.getBoundingClientRect();
 return {x:(event.clientX-rect.left)*canvas.width/rect.width,y:(event.clientY-rect.top)*canvas.height/rect.height};
}
function drawMap(){
 if(!ctx||!catalog)return;
 const w=canvas.width,h=canvas.height;
 const gradient=ctx.createLinearGradient(0,0,w,h);gradient.addColorStop(0,"#183c3a");gradient.addColorStop(1,"#192a48");
 ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
 ctx.save();ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();
 if(mapImage&&imageOkay){const a=project(0,0),b=project(100,100);ctx.drawImage(mapImage,a.x,a.y,b.x-a.x,b.y-a.y);}
 ctx.lineWidth=1;ctx.font="13px system-ui";
 for(let n=0;n<=100;n+=10){
  const a=project(n,0),b=project(0,n);ctx.strokeStyle="rgba(245,240,220,.20)";
  ctx.beginPath();ctx.moveTo(a.x,0);ctx.lineTo(a.x,h);ctx.moveTo(0,b.y);ctx.lineTo(w,b.y);ctx.stroke();
  ctx.fillStyle="#e2ece6";ctx.fillText(String(n),a.x+3,20);ctx.fillText(String(n),6,b.y-4);
 }
 const visible=(route?.itinerary||[]).map((p,i)=>({...p,index:i})).filter(p=>p.zone===mapZone);
 if(visible.length>1){
  ctx.beginPath();visible.forEach((p,i)=>{const pos=project(p.x,p.y);if(i===0)ctx.moveTo(pos.x,pos.y);else ctx.lineTo(pos.x,pos.y)});
  ctx.strokeStyle="rgba(8,19,23,.86)";ctx.lineWidth=8;ctx.stroke();
  ctx.strokeStyle="#edc783";ctx.lineWidth=3;ctx.setLineDash([9,7]);ctx.stroke();ctx.setLineDash([]);
 }
 for(const p of visible){
  const pos=project(p.x,p.y);if(pos.x < -40||pos.x>w+40||pos.y< -40||pos.y>h+40)continue;
  const current=selectedStop===p.id;
  ctx.beginPath();ctx.arc(pos.x,pos.y,current?20:15,0,Math.PI*2);
  ctx.fillStyle=current?"#a5e6c9":"#f1c786";ctx.fill();ctx.lineWidth=3;ctx.strokeStyle="#193239";ctx.stroke();
  ctx.fillStyle="#10222a";ctx.font="bold 14px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(p.index+1),pos.x,pos.y+1);
  ctx.textAlign="left";ctx.textBaseline="alphabetic";
 }
 if(state.zone===mapZone&&state.x!==null&&state.y!==null){
  const p=project(state.x,state.y);ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();ctx.lineWidth=5;ctx.strokeStyle="#43a6a6";ctx.stroke();
  ctx.beginPath();ctx.arc(p.x,p.y,23,0,Math.PI*2);ctx.strokeStyle="#fff9";ctx.lineWidth=2;ctx.stroke();
 }
 ctx.restore();
}
function bind(){
 $("language").addEventListener("click",()=>{
  session.lang=session.lang==="fr"?"en":"fr";renderControls();renderAll();save();status(text("loaded"));
 });
 $("faction").addEventListener("change",()=>{session.faction=$("faction").value;session.race=RACES[session.faction][0][0];initProfile();});
 $("race").addEventListener("change",()=>{session.race=$("race").value;initProfile();});
 $("level").addEventListener("input",()=>{const v=$("level").value;if(v!==""&&Number.isFinite(Number(v))) updateState({...state,level:Number(v)});});
 $("zone").addEventListener("change",()=>{updateState({...state,zone:$("zone").value,x:null,y:null});setMapZone(state.zone);});
 for(const [id,field] of [["pos-x","x"],["pos-y","y"]]) $(id).addEventListener("change",()=>{
  const raw=$(id).value;updateState({...state,[field]:raw===""?null:Number(raw)});
 });
 $("map-zone").addEventListener("change",()=>setMapZone($("map-zone").value));
 $("map-reset").addEventListener("click",()=>{mapView={x:50,y:50,zoom:1};drawMap();});
 $("quest-search").addEventListener("input",renderLog);
 document.querySelectorAll("[data-filter]").forEach(button=>button.addEventListener("click",()=>{
  logFilter=button.dataset.filter;document.querySelectorAll("[data-filter]").forEach(b=>{const active=b===button;b.classList.toggle("selected",active);b.setAttribute("aria-pressed",active?"true":"false");});renderLog();
 }));
 $("export-session").addEventListener("click",()=>{
  save();const blob=new Blob([JSON.stringify(session,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="foreveroth-classic-quest-lab.json";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),4000);
 });
 $("import-session").addEventListener("change",async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
   if(file.size>2000000)throw Error("oversize");
   const imported=JSON.parse(await file.text());
   if(imported.schema_version!==1||imported.edition!=="classic"||typeof imported.profiles!=="object"||!imported.profiles)throw Error("format");
   if(!["alliance","horde"].includes(imported.faction))throw Error("faction");
   session={...initialSession(),...imported};if(!["fr","en"].includes(session.lang))session.lang="fr";
   if(!RACES[session.faction].some(r=>r[0]===session.race))session.race=RACES[session.faction][0][0];
   initProfile();status(text("importSuccess"));
  }catch(_){status(text("importError"),true);}
  finally{event.target.value="";}
 });
 $("reset-session").addEventListener("click",()=>{
  if(!confirm(text("confirmReset")))return;
  session.profiles[profileKey()]={level:5};initProfile();status(text("saved"));
 });
 canvas.addEventListener("wheel",event=>{
  event.preventDefault();
  const p=canvasPoint(event),old=unproject(p.x,p.y);
  mapView.zoom=Math.min(5,Math.max(1,mapView.zoom*(event.deltaY<0?1.17:.85)));
  mapView.x=old.x-(p.x/canvas.width-.5)*100/mapView.zoom;
  mapView.y=old.y-(p.y/canvas.height-.5)*100/mapView.zoom;
  drawMap();
 },{passive:false});
 canvas.addEventListener("pointerdown",event=>{
  if(event.button!==0)return;
  const p=canvasPoint(event);pointer={id:event.pointerId,start:p,last:p,moved:false};
  try{canvas.setPointerCapture(event.pointerId);}catch(_){}
 });
 canvas.addEventListener("pointermove",event=>{
  if(!pointer||event.pointerId!==pointer.id)return;
  const p=canvasPoint(event),dx=p.x-pointer.last.x,dy=p.y-pointer.last.y;
  if(Math.hypot(p.x-pointer.start.x,p.y-pointer.start.y)>7)pointer.moved=true;
  if(pointer.moved){mapView.x-=dx/canvas.width*100/mapView.zoom;mapView.y-=dy/canvas.height*100/mapView.zoom;drawMap();}
  pointer.last=p;
 });
 canvas.addEventListener("pointerup",event=>{
  if(!pointer||event.pointerId!==pointer.id)return;
  const p=canvasPoint(event);const moved=pointer.moved;pointer=null;
  if(!moved){const pos=unproject(p.x,p.y);updateState({...state,zone:mapZone,x:Math.round(pos.x*10)/10,y:Math.round(pos.y*10)/10});}
 });
 canvas.addEventListener("pointercancel",()=>pointer=null);
}
async function boot(){
 renderLabels();status(text("loading"));bind();
 try{
  const files=["/data/quests/manifest.json","/data/quests/alliance.json","/data/quests/horde.json","/data/quests/levels.json"];
  const responses=await Promise.all(files.map(path=>fetch(path,{cache:"default"})));
  if(responses.some(r=>!r.ok))throw Error("Classic data fetch failed");
  const [manifest,alliance,horde,levels]=await Promise.all(responses.map(r=>r.json()));
  source={manifest,alliance,horde,levels};
  if(!["alliance","horde"].includes(session.faction))session.faction="alliance";
  if(!RACES[session.faction].some(r=>r[0]===session.race))session.race=RACES[session.faction][0][0];
  initProfile();loadMap();$("lab-main").setAttribute("aria-busy","false");status(text("loaded"));
 }catch(error){
  status(text("failed"),true);$("summary-line").textContent=String(error?.message||error);
  $("lab-main").setAttribute("aria-busy","false");
 }
}
boot();
})();