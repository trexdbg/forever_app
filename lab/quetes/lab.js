/* Simpler Classic route guide. Deliberately no quest-journal / automatic player state. */
(() => {
"use strict";
const $=id=>document.getElementById(id);
const Engine=window.ForeverCuratedGuide;
if(!Engine)return;
const RACES={
 alliance:[["human","human","Humain","Human"],["dwarf","gnorf","Nain","Dwarf"],["gnome","gnorf","Gnome","Gnome"],["nelf","nelf","Elfe de la nuit","Night elf"]],
 horde:[["orc","trorc","Orc","Orc"],["troll","trorc","Troll","Troll"],["undead","undead","Mort-vivant","Undead"],["tauren","tauren","Tauren","Tauren"]]
};
const EN_ZONES={morogh:"Dun Morogh",elwynn:"Elwynn Forest",loch:"Loch Modan",darkshore:"Darkshore",barrens:"The Barrens",needles:"Thousand Needles",duskwood:"Duskwood",westfall:"Westfall",stormwind:"Stormwind City",ironforge:"Ironforge",teldrassil:"Teldrassil",tirisfal:"Tirisfal Glades",undercity:"Undercity",redridge:"Redridge Mountains",wetlands:"Wetlands",hillsbrad:"Hillsbrad Foothills",stonetalon:"Stonetalon Mountains",durotar:"Durotar",mulgore:"Mulgore",silverpine:"Silverpine Forest",ashenvale:"Ashenvale",arathi:"Arathi Highlands",alterac:"Alterac Mountains",stv:"Stranglethorn Vale",swamp:"Swamp of Sorrows",dustwallow:"Dustwallow Marsh",badlands:"Badlands",searing:"Searing Gorge",blasted:"Blasted Lands",steppes:"Burning Steppes",tanaris:"Tanaris",desolace:"Desolace",feralas:"Feralas",hinterlands:"The Hinterlands",felwood:"Felwood",ungoro:"Un'Goro Crater",azshara:"Azshara",silithus:"Silithus",winterspring:"Winterspring",wpl:"Western Plaguelands",epl:"Eastern Plaguelands",deadwind:"Deadwind Pass",darnassus:"Darnassus",orgrimmar:"Orgrimmar",thunderbluff:"Thunder Bluff",moonglade:"Moonglade"};
const DICT={
 fr:{
 brand:"Guide optimisé",eyebrow:"ITINÉRAIRES CLASSIC · LABORATOIRE",headline:"Un chemin <em>plus logique.</em>",
 intro:"Les quêtes au bon niveau, les objectifs voisins regroupés, les achats préparés à l'avance.",
 scope:"Guide communautaire Classic à partir d'environ niveau 5. Les prérequis et l'accessibilité restent à confirmer en jeu. Aucun parcours Forever n'est encore activé.",
 faction:"Faction",race:"Race",level:"Ton niveau",version:"Version du guide",solo:"Sans donjons",soloSub:"Parcours extérieur",essentials:"Donjons utiles",essentialsSub:"Quelques instances choisies",
 rule:"Une quête de niveau supérieur au tien n'est pas proposée, même si l'ancien itinéraire l'indiquait plus tôt.",
 timelineKicker:"TON PARCOURS",timelineTitle:"Étapes par secteur",timelineDescription:"Choisis un secteur puis suis les objectifs de la carte.",
 stageKicker:"ÉTAPE ACTUELLE",stageTitle:"Carte du secteur",stageSubtitle:"Sélectionne une étape dans la colonne de gauche.",
 mapHeading:"CARTE DE ZONE",mapCredits:"Carte Classic communautaire",legendAccept:"Prendre",legendObjectives:"Objectifs",legendTurnin:"Rendre",
 mapTip:"Molette : zoom · glisser : déplacer · cliquer sur un repère : détails",
 actionsKicker:"FAIRE DANS CET ORDRE",actionsTitle:"Dans ce secteur",
 prepKicker:"ANTICIPATION",prepTitle:"À prévoir bientôt",prepFootnote:"Un achat anticipé n'implique pas d'accepter une quête de plus haut niveau.",
 dungeonKicker:"OPTION FACULTATIVE",dungeonTitle:"Donjons intéressants",dungeonFootnote:"Seuls certains donjons Classic méritant une visite groupée sont retenus, aux niveaux conseillés.",
 empty:"Aucune étape exploitable à ce niveau. Essaie le niveau précédent ou le suivant.",
 nonePrep:"Pas d'achat important identifié pour ce palier dans nos données validées.",noneDungeons:"Cette version n'inclut aucun donjon.",noneDungeonsNow:"Aucun donjon prioritaire pour ce palier.",
 noImage:"Fond de carte indisponible — les positions X/Y restent visibles.",
 starts:"Accepter",objectives:"Faire",ends:"Rendre",completed:"Prendre et rendre",
 sector:"Secteur",objectiveGroup:"À faire ensemble",groupDescription:"Objectifs proches : profiter d'un seul passage pour les réunir.",notes:"Notes du parcours",
 purchaseQuest:"Objet de quête vérifié",purchaseGuide:"Note du guide à vérifier",purchaseGather:"À conserver",purchaseRoute:"Option de déplacement",source:"Source",levelFor:"À prévoir vers le niveau",stage:"étape",steps:"arrêts",
 hidden:"quêtes au-dessus de ton niveau écartées de ces étapes.",unknown:"Niveau non répertorié",questLevel:"Niveau",mapUnavailable:"Carte indisponible",loading:"Chargement des données Classic…",loaded:"Guide Classic chargé",error:"Impossible de charger les données Classic.",
 dungeonMore:"Voir les quêtes Classic",footer:"ForEveroth Quest Lab · Itinéraires communautaires Classic (VanillaQuesting). Parcours expérimental, distinct du guide public.",
 next:"Étape suivante",previous:"Étape précédente",mapFocus:"Voir le repère",
 xpToNext:"XP nécessaires pour le prochain niveau",xpKnown:"XP des rendus documentés",xpMissing:"XP d’autres quêtes non renseignées",xpNotMeasured:"XP des monstres et progression réelle non incluses",xpQuest:"XP à la validation",xpLater:"Récompense si rendue"
 },
 en:{
 brand:"Optimized guide",eyebrow:"CLASSIC ROUTES · LABORATORY",headline:"A <em>smarter route.</em>",
 intro:"Quests at your level, nearby objectives grouped together, required purchases planned ahead.",
 scope:"Classic community guide starting around level 5. Prerequisites and availability still need in-game verification. No Forever routes are enabled.",
 faction:"Faction",race:"Race",level:"Your level",version:"Guide variant",solo:"No dungeons",soloSub:"Open-world route",essentials:"Worthwhile dungeons",essentialsSub:"A few selected instances",
 rule:"Quests above your current level are not recommended, even if the original guide placed them earlier.",
 timelineKicker:"YOUR ROUTE",timelineTitle:"Area-based steps",timelineDescription:"Choose a zone segment and follow the markers on the map.",
 stageKicker:"CURRENT STEP",stageTitle:"Area map",stageSubtitle:"Select a step in the left sidebar.",
 mapHeading:"ZONE MAP",mapCredits:"Classic community map",legendAccept:"Accept",legendObjectives:"Objectives",legendTurnin:"Turn in",
 mapTip:"Scroll: zoom · drag: pan · click a marker: details",
 actionsKicker:"DO IN THIS ORDER",actionsTitle:"In this area",
 prepKicker:"PREPARE AHEAD",prepTitle:"Useful purchases",prepFootnote:"Preparing an item doesn't mean accepting a quest above your level.",
 dungeonKicker:"OPTIONAL",dungeonTitle:"Worthwhile dungeons",dungeonFootnote:"Only selected Classic dungeons with worthwhile quest batching are included, at suggested levels.",
 empty:"No route steps for this level. Try the level before or after.",
 nonePrep:"No important purchase verified for this level range.",noneDungeons:"This version has no dungeons.",noneDungeonsNow:"No priority dungeon in this bracket.",
 noImage:"Map background unavailable — X/Y positions still work.",
 starts:"Accept",objectives:"Do",ends:"Turn in",completed:"Accept & turn in",
 sector:"Area",objectiveGroup:"Combine objectives",groupDescription:"Nearby objectives: handle them in one visit.",notes:"Route notes",
 purchaseQuest:"Verified quest item",purchaseGuide:"Source guide suggestion",purchaseGather:"Keep for later",purchaseRoute:"Optional travel tip",source:"Source",levelFor:"Prepare around level",stage:"step",steps:"stops",
 hidden:"above-level quests filtered out of these steps.",unknown:"Unknown quest level",questLevel:"Level",mapUnavailable:"Map unavailable",loading:"Loading Classic data…",loaded:"Classic guide loaded",error:"Failed to load Classic data.",
 dungeonMore:"See Classic quests",footer:"ForEveroth Quest Lab · Community Classic routes (VanillaQuesting). Experimental guide, separate from the public version.",
 next:"Next step",previous:"Previous step",mapFocus:"Show marker",
 xpToNext:"XP needed to reach next level",xpKnown:"Documented turn-in XP",xpMissing:"Other quest XP not documented",xpNotMeasured:"Kill XP and actual character progress not included",xpQuest:"XP on turn-in",xpLater:"Reward when turned in"
 }
};
const T=k=>DICT[view.lang]?.[k]||k;
const dom=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined&&text!==null)e.textContent=String(text);return e};
const safeUrl=url=>/^https:\/\/(www\.wowhead\.com|warcraft\.wiki\.gg|github\.com)\//.test(String(url||""))?url:null;
const external=(url,label)=>{const a=dom("a",null,label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;};
const params=new URLSearchParams(location.search);
const view={
 lang:params.get("lang")==="en"?"en":"fr",
 faction:params.get("faction")==="horde"?"horde":"alliance",
 race:params.get("race")||"nelf",
 level:Math.min(60,Math.max(5,Number(params.get("level"))||8)),
 mode:params.get("variant")==="essentials"?"essentials":"solo",
 stageIndex:Number(params.get("stage"))||null,
 focusPoint:0,zoom:1,cx:50,cy:50
};
let source=null,guide=null,stage=null,mapImage=null,currentImageZone=null,pointer=null,hasImage=false;
const canvas=$("route-map"),ctx=canvas.getContext("2d");
const profile=()=>RACES[view.faction].find(r=>r[0]===view.race)?.[1]||RACES[view.faction][0][1];
const zoneName=z=>view.lang==="en"?(EN_ZONES[z]||z):(guide?.zones?.[z]||z);
const questName=q=>view.lang==="en"?q.en:q.fr;
const prettyName=name=>String(name||"").replace(/(^|\s)([a-z])/g,(_,space,c)=>space+c.toUpperCase());
const waypointName=point=>view.lang==="fr"&&window.ForeverQuestLocale?.header?window.ForeverQuestLocale.header(point.header)||prettyName(point.header):prettyName(point.header);
const textOfNote=note=>view.lang==="fr"&&window.ForeverQuestLocale?.note?window.ForeverQuestLocale.note(note):String(note);
function setText(id,key){$(id).textContent=T(key);}
function translate(){
 document.documentElement.lang=view.lang;
 document.title=view.lang==="fr"?"Guide Classic optimisé · Bêta | ForEveroth":"Optimized Classic Quest Guide · Beta | ForEveroth";
 const ids={
 "brand-description":"brand","eyebrow":"eyebrow","intro-text":"intro","scope":"scope",
 "label-faction":"faction","label-race":"race","label-level":"level","label-version":"version",
 "mode-solo-title":"solo","mode-solo-sub":"soloSub","mode-essentials-title":"essentials","mode-essentials-sub":"essentialsSub",
 "guide-rule":"rule","timeline-kicker":"timelineKicker","timeline-title":"timelineTitle","timeline-description":"timelineDescription",
 "stage-kicker":"stageKicker","map-heading":"mapHeading","map-credits":"mapCredits",
 "legend-accept":"legendAccept","legend-objectives":"legendObjectives","legend-turnin":"legendTurnin",
 "map-tip":"mapTip","actions-kicker":"actionsKicker","actions-title":"actionsTitle",
 "prep-kicker":"prepKicker","prep-title":"prepTitle","prep-footnote":"prepFootnote",
 "dungeon-kicker":"dungeonKicker","dungeon-title":"dungeonTitle","dungeon-footnote":"dungeonFootnote"
 };
 for(const [id,key] of Object.entries(ids))setText(id,key);
 $("headline").innerHTML=T("headline");
 $("lang").textContent=view.lang==="fr"?"EN":"FR";
 $("prev").title=T("previous");$("next").title=T("next");
 $("footer").querySelector("p").firstChild.textContent=T("footer")+" ";
 $("level").value=view.level;
 $("faction").value=view.faction;
 const selector=$("race");selector.replaceChildren();
 for(const [id,_profile,fr,en] of RACES[view.faction]){
  const o=dom("option",null,view.lang==="en"?en:fr);o.value=id;selector.append(o);
 }
 selector.value=view.race;
 for(const button of document.querySelectorAll("[data-mode]")){
  const selected=button.dataset.mode===view.mode;button.classList.toggle("selected",selected);button.setAttribute("aria-pressed",String(selected));
 }
}
function urlSync(){
 const url=new URL(location.href);
 url.searchParams.set("faction",view.faction);
 url.searchParams.set("race",view.race);
 url.searchParams.set("level",String(view.level));
 url.searchParams.set("variant",view.mode);
 if(view.stageIndex!==null)url.searchParams.set("stage",String(view.stageIndex));else url.searchParams.delete("stage");
 url.searchParams.set("lang",view.lang);
 history.replaceState(null,"",url.pathname+url.search);
}
function build(){
 if(!source)return;
 const data=source[view.faction];
 guide=Engine.build({data,manifest:source.manifest,levels:source.levels.levels,curation:source.curation,xpData:source.xpData,profile:profile(),level:view.level,mode:view.mode});
 if(!guide.stages.some(s=>s.index===view.stageIndex))view.stageIndex=guide.stages.at(0)?.index??null;
 stage=guide.stages.find(s=>s.index===view.stageIndex)||null;
 view.focusPoint=0;
 view.zoom=1;view.cx=50;view.cy=50;
 translate();
 render();loadMap();urlSync();
}
function selectStage(index){
 if(!guide)return;
 const found=guide.stages.find(s=>s.index===index);
 if(!found)return;
 const zoneChanged=stage?.zone!==found.zone;
 stage=found;view.stageIndex=index;view.focusPoint=0;
 if(zoneChanged){view.zoom=1;view.cx=50;view.cy=50;loadMap();}
 else drawMap();
 render();urlSync();
}
function render(){
 if(!guide)return;
 renderTimeline();renderHeading();renderStops();renderPreps();renderDungeons();drawMap();
}
function renderTimeline(){
 const list=$("stage-list");list.replaceChildren();
 $("empty-stage").hidden=guide.stages.length>0;
 $("empty-stage").textContent=T("empty");
 guide.stages.forEach((step,i)=>{
  const b=dom("button","stage-choice"+(step.index===view.stageIndex?" active":""));
  b.type="button";b.setAttribute("aria-current",step.index===view.stageIndex?"step":"false");
  const n=dom("span","stage-number",String(i+1).padStart(2,"0"));
  const title=dom("span","stage-description");
  title.append(dom("strong",null,step.name?step.name[view.lang]:zoneName(step.zone)),dom("small",null,Math.floor(step.expected)+" · "+step.points.length+" "+T("steps")));
  b.append(n,title);b.addEventListener("click",()=>selectStage(step.index));list.append(b);
 });
}
function renderHeading(){
 $("stage-title").textContent=stage?(stage.name?stage.name[view.lang]:zoneName(stage.zone)):T("stageTitle");
 $("stage-subtitle").textContent=stage?
  (T("stage")+" "+Math.floor(stage.expected)+" · "+stage.points.length+" "+T("steps")+" · "+(view.mode==="solo"?T("solo"):T("essentials"))):
  T("stageSubtitle");
 $("stage-counter").textContent=stage?(guide.stages.indexOf(stage)+1)+" / "+guide.stages.length:"—";
 const i=guide.stages.indexOf(stage);
 $("prev").disabled=i<=0;$("next").disabled=i<0||i>=guide.stages.length-1;
 $("map-name").textContent=stage?zoneName(stage.zone):"—";
 $("actions-counter").textContent=stage?stage.points.length+" "+T("steps"):"—";
 $("level-notice").textContent=guide.excludedOverLevel+" "+T("hidden");
 const xpItems=[];
 if(guide.xpToNext!==null)xpItems.push(T("xpToNext")+": "+guide.xpToNext.toLocaleString(view.lang==="fr"?"fr-FR":"en-US")+" XP");
 if(stage?.rewardXpKnownCount)xpItems.push(T("xpKnown")+": "+stage.rewardXpKnown.toLocaleString(view.lang==="fr"?"fr-FR":"en-US")+" XP ("+stage.rewardXpKnownCount+")");
 if(stage?.rewardXpUnknownCount)xpItems.push(T("xpMissing")+": "+stage.rewardXpUnknownCount);
 if(xpItems.length)xpItems.push(T("xpNotMeasured"));
 $("xp-summary").textContent=xpItems.join(" · ");
}
function renderStops(){
 const target=$("stops");target.replaceChildren();
 if(!stage){target.append(dom("div","empty",T("empty")));return;}
 const meta={accept:"starts",objective:"objectives",turnin:"ends",instant:"completed"};
 stage.points.forEach((point,index)=>{
  const selected=view.focusPoint===index;
  const item=dom("article","stop"+(selected?" selected":""));
  const marker=dom("button","stop-num",String(index+1));marker.type="button";marker.title=T("mapFocus");
  marker.addEventListener("click",()=>{view.focusPoint=index;drawMap();renderStops();$("route-map").scrollIntoView({behavior:"smooth",block:"center"});});
  const content=dom("div","stop-content");
  const top=dom("div","stop-top");
  top.append(dom("h3",null,point.clustered?T("objectiveGroup"):waypointName(point)));
  const coords=point.members.map(m=>m.x.toFixed(1)+", "+m.y.toFixed(1));
  top.append(dom("span","coordinate",coords.length>2?coords.slice(0,2).join(" · ")+"…":coords.join(" · ")));
  content.append(top);
  if(point.clustered)content.append(dom("p","cluster-note",T("groupDescription")));
  if(point.clustered&&point.members.length>1)content.append(dom("p","locations",point.members.map(m=>prettyName(m.header)).join(" · ")));
  if(point.actions.length){
   const acts=dom("div","actions");
   for(const a of point.actions){
    const arow=dom("div","quest-action "+a.kind);
    const label=dom("span","quest-kind",T(meta[a.kind]));
    const qcontent=dom("span","quest-data");
    qcontent.append(dom("strong",null,questName(a)));
    qcontent.append(dom("small",null,a.level===null?T("unknown"):T("questLevel")+" "+a.level));
    if(a.rewardXp!==null&&a.rewardXp!==undefined)qcontent.append(dom("small","quest-xp",
      (a.kind==="turnin"||a.kind==="instant"?T("xpQuest"):T("xpLater"))+": "+a.rewardXp.toLocaleString(view.lang==="fr"?"fr-FR":"en-US")+" XP"));
    arow.append(label,qcontent);
    if(a.id)arow.append(external("https://www.wowhead.com/classic/quest="+a.id,"↗"));
    acts.append(arow);
   }
   content.append(acts);
  }
  if(point.notes.length){
   const notes=dom("p","note",T("notes")+" : "+point.notes.map(textOfNote).join(" · "));
   content.append(notes);
  }
  item.append(marker,content);target.append(item);
 });
 if(stage.hints.length){
  const hints=dom("div","sector-hints");
  for(const hint of stage.hints)hints.append(dom("p",null,"✦ "+hint.note[view.lang]));
  target.prepend(hints);
 }
}
function renderPreps(){
 const el=$("preparation-list");el.replaceChildren();
 const preps=guide.preparations;
 if(!preps.length){el.append(dom("p","empty-small",T("nonePrep")));return;}
 preps.forEach(p=>{
  const item=dom("div","prep-item");
  const caption=dom("span","prep-tag "+p.kind,T(p.kind==="quest"?"purchaseQuest":p.kind==="route"?"purchaseRoute":p.kind==="gather"?"purchaseGather":"purchaseGuide"));
  const title=dom("strong","prep-name",p.fromGuideAuto?textOfNote(p.rawNote):String(p.quantity)+" × "+p.name[view.lang]);
  const req=dom("p","prep-info",p.reason[view.lang]);
  const level=dom("span","prep-level",T("levelFor")+" "+p.level);
  item.append(caption,title,level,req);
  if(safeUrl(p.source))item.append(external(p.source,T("source")+" ↗"));
  el.append(item);
 });
}
function renderDungeons(){
 const el=$("dungeon-list");el.replaceChildren();
 if(view.mode==="solo"){el.append(dom("p","empty-small",T("noneDungeons")));return;}
 if(!guide.dungeons.length){el.append(dom("p","empty-small",T("noneDungeonsNow")));return;}
 guide.dungeons.forEach(d=>{
  const item=dom("div","dungeon-item");
  item.append(dom("span","prep-tag dungeon-tag",T("questLevel")+" "+d.level+"+"));
  item.append(dom("strong","prep-name",d.name[view.lang]));
  item.append(dom("p","prep-info",d.reason[view.lang]));
  if(d.checklist?.[view.lang])item.append(dom("p","prep-checklist",d.checklist[view.lang]));
  if(safeUrl(d.source))item.append(external(d.source,T("dungeonMore")+" ↗"));
  el.append(item);
 });
}
function imageUrl(){return stage?guide.mapBase+encodeURIComponent(stage.zone)+".jpg":"";}
function loadMap(){
 const zone=stage?.zone||"";
 if(!zone){currentImageZone=null;mapImage=null;hasImage=false;drawMap();return;}
 if(currentImageZone===zone)return;
 currentImageZone=zone;hasImage=false;mapImage=null;
 const img=new Image();
 const uri=imageUrl();
 $("map-credits").textContent=T("loading");
 img.onload=()=>{if(currentImageZone!==zone)return;mapImage=img;hasImage=true;$("map-credits").textContent=T("mapCredits");drawMap();};
 img.onerror=()=>{if(currentImageZone!==zone)return;mapImage=null;hasImage=false;$("map-credits").textContent=T("noImage");drawMap();};
 img.src=uri;drawMap();
}
function projected(x,y){
 return {x:(.5+(x-view.cx)*view.zoom/100)*canvas.width,y:(.5+(y-view.cy)*view.zoom/100)*canvas.height};
}
function unproject(x,y){
 return {x:view.cx+(x/canvas.width-.5)*100/view.zoom,y:view.cy+(y/canvas.height-.5)*100/view.zoom};
}
function canvasPoint(ev){
 const r=canvas.getBoundingClientRect();return{x:(ev.clientX-r.left)/r.width*canvas.width,y:(ev.clientY-r.top)/r.height*canvas.height};
}
function pointColor(point){
 if(point.clustered)return "#89ddd0";
 if(point.actions.some(a=>a.kind==="turnin"))return "#acdab8";
 if(point.actions.some(a=>a.kind==="objective"))return "#77c6da";
 return "#edc986";
}
function drawMap(){
 if(!ctx)return;
 const W=canvas.width,H=canvas.height;
 ctx.clearRect(0,0,W,H);
 const gradient=ctx.createLinearGradient(0,0,W,H);gradient.addColorStop(0,"#28483e");gradient.addColorStop(1,"#1b2c4e");
 ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
 if(!stage)return;
 ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
 if(mapImage&&hasImage){
  const a=projected(0,0),b=projected(100,100);
  ctx.drawImage(mapImage,a.x,a.y,b.x-a.x,b.y-a.y);
 }
 ctx.strokeStyle="rgba(240,247,245,.20)";ctx.lineWidth=1;ctx.font="13px system-ui";
 for(let i=0;i<=100;i+=10){
  const px=projected(i,0).x,py=projected(0,i).y;
  ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px,H);ctx.moveTo(0,py);ctx.lineTo(W,py);ctx.stroke();
  ctx.fillStyle="#f2f3e7";ctx.fillText(String(i),px+3,18);ctx.fillText(String(i),5,py-3);
 }
 if(stage.points.length>1){
  ctx.beginPath();
  stage.points.forEach((p,i)=>{const pos=projected(p.x,p.y);if(i===0)ctx.moveTo(pos.x,pos.y);else ctx.lineTo(pos.x,pos.y);});
  ctx.strokeStyle="#10232abf";ctx.lineWidth=7;ctx.stroke();
  ctx.strokeStyle="#f4daa0";ctx.lineWidth=2.4;ctx.setLineDash([9,7]);ctx.stroke();ctx.setLineDash([]);
 }
 stage.points.forEach((p,i)=>{
  const active=view.focusPoint===i;
  const pos=projected(p.x,p.y);
  if(pos.x< -30||pos.y< -30||pos.x>W+30||pos.y>H+30)return;
  if(active){
   ctx.beginPath();ctx.arc(pos.x,pos.y,24,0,Math.PI*2);ctx.fillStyle="#f5e3b466";ctx.fill();
  }
  ctx.beginPath();ctx.arc(pos.x,pos.y,active?18:15,0,Math.PI*2);
  ctx.fillStyle=pointColor(p);ctx.fill();ctx.lineWidth=active?4:2.3;ctx.strokeStyle=active?"#fffbee":"#14323c";ctx.stroke();
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#0f2630";ctx.font="bold 14px system-ui";ctx.fillText(String(i+1),pos.x,pos.y+1);
  // Preserve the exact individual coordinates of nearby objectives in a combined stop.
  if(p.members.length>1)for(const member of p.members){
   const dot=projected(member.x,member.y);
   ctx.beginPath();ctx.arc(dot.x,dot.y,3,0,Math.PI*2);ctx.fillStyle="#fffdf4";ctx.fill();
  }
 });
 ctx.restore();
}
function navigate(offset){
 if(!guide)return;
 const index=guide.stages.indexOf(stage);
 const next=guide.stages[index+offset];if(next)selectStage(next.index);
}
function bind(){
 $("lang").addEventListener("click",()=>{
  view.lang=view.lang==="fr"?"en":"fr";translate();if(guide)render();urlSync();
 });
 $("faction").addEventListener("change",()=>{
  view.faction=$("faction").value;view.race=RACES[view.faction][0][0];view.stageIndex=null;build();
 });
 $("race").addEventListener("change",()=>{view.race=$("race").value;view.stageIndex=null;build();});
 for(const button of document.querySelectorAll("[data-mode]"))button.addEventListener("click",()=>{
  view.mode=button.dataset.mode;build();
 });
 $("level").addEventListener("change",()=>{
  const raw=Number($("level").value);
  view.level=Math.min(60,Math.max(5,Number.isFinite(raw)?Math.floor(raw):view.level));
  view.stageIndex=null;build();
 });
 for(const [id,change] of [["level-minus",-1],["level-plus",1]])$(id).addEventListener("click",()=>{
  view.level=Math.min(60,Math.max(5,view.level+change));
  view.stageIndex=null;build();
 });
 $("prev").addEventListener("click",()=>navigate(-1));
 $("next").addEventListener("click",()=>navigate(1));
 $("map-reset").addEventListener("click",()=>{view.zoom=1;view.cx=50;view.cy=50;drawMap();});
 canvas.addEventListener("wheel",ev=>{
  ev.preventDefault();if(!stage)return;
  const p=canvasPoint(ev),real=unproject(p.x,p.y);
  view.zoom=Math.min(5,Math.max(1,view.zoom*(ev.deltaY<0?1.16:1/1.16)));
  view.cx=real.x-(p.x/canvas.width-.5)*100/view.zoom;
  view.cy=real.y-(p.y/canvas.height-.5)*100/view.zoom;
  drawMap();
 },{passive:false});
 canvas.addEventListener("pointerdown",ev=>{
  if(ev.button!==0||!stage)return;
  const p=canvasPoint(ev);pointer={id:ev.pointerId,start:p,last:p,moved:false};
  try{canvas.setPointerCapture(ev.pointerId);}catch(_){}
 });
 canvas.addEventListener("pointermove",ev=>{
  if(!pointer||pointer.id!==ev.pointerId)return;
  const p=canvasPoint(ev),dx=p.x-pointer.last.x,dy=p.y-pointer.last.y;
  if(Math.hypot(p.x-pointer.start.x,p.y-pointer.start.y)>7)pointer.moved=true;
  if(pointer.moved){
   view.cx-=dx/canvas.width*100/view.zoom;
   view.cy-=dy/canvas.height*100/view.zoom;drawMap();
  }
  pointer.last=p;
 });
 canvas.addEventListener("pointerup",ev=>{
  if(!pointer||pointer.id!==ev.pointerId)return;
  const p=canvasPoint(ev),moved=pointer.moved;pointer=null;
  if(moved||!stage)return;
  const near=stage.points.map((item,index)=>({index,distance:Math.hypot(projected(item.x,item.y).x-p.x,projected(item.x,item.y).y-p.y)})).sort((a,b)=>a.distance-b.distance)[0];
  if(near?.distance<=28){view.focusPoint=near.index;drawMap();renderStops();document.querySelector(".stop.selected")?.scrollIntoView({behavior:"smooth",block:"nearest"});}
 });
 canvas.addEventListener("pointercancel",()=>pointer=null);
}
async function boot(){
 translate();$("status").textContent=T("loading");bind();
 try{
  const files=["/data/quests/manifest.json","/data/quests/alliance.json","/data/quests/horde.json","/data/quests/levels.json","./curation.json","./xp-classic.json"];
  const responses=await Promise.all(files.map(file=>fetch(file)));
  if(responses.some(r=>!r.ok))throw Error("route data unavailable");
  const [manifest,alliance,horde,levels,curation,xpData]=await Promise.all(responses.map(r=>r.json()));
  source={manifest,alliance,horde,levels,curation,xpData};
  if(!RACES[view.faction].some(r=>r[0]===view.race))view.race=RACES[view.faction][0][0];
  build();$("main").setAttribute("aria-busy","false");$("status").textContent=T("loaded");
 }catch(error){
  $("main").setAttribute("aria-busy","false");$("status").textContent=T("error");
  $("stage-subtitle").textContent=String(error?.message||error);
 }
}
boot();
})();