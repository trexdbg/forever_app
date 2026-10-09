/* ForEveroth home discovery: rotating live catalog entries, not a fixed slideshow.
   Sources remain the same local snapshots used by each module. */
(()=>{
"use strict";
const root=document.querySelector("[data-atlas-home]");
if(!root)return;
const en=document.documentElement.lang==="en",prefix=en?"/en/":"/";
const T=(fr,eng)=>en?eng:fr;
const $=s=>root.querySelector(s);
const stage=$(".atlas-live-stage"),copy=$(".atlas-live-copy"),eyebrow=$(".atlas-live-eyebrow");
const title=$("[data-atlas-name]"),count=$("[data-atlas-count]"),disclaimer=$(".atlas-live-disclaimer");
const cta=$("[data-atlas-open]"),related=$(".atlas-live-related");
const map=$("[data-atlas-map]"),image=$("[data-atlas-image]"),markers=$("[data-atlas-markers]");
const mapLabel=$(".atlas-live-map-label"),number=$("[data-atlas-index]");
const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)");
const feature=document.createElement("span");
feature.className="atlas-feature-visual";
feature.hidden=true;
feature.innerHTML='<span class="atlas-feature-orbit" aria-hidden="true"></span><span class="atlas-feature-icon"></span><span class="atlas-feature-meta"><strong></strong><small></small></span>';
map.append(feature);
const placeholder=document.createElement("span");
placeholder.className="atlas-live-map-error";
placeholder.hidden=true;
map.append(placeholder);
const namesEN={
 winterspring:"Winterspring",azshara:"Azshara",epl:"Eastern Plaguelands",
 ungoro:"Un'Goro Crater","burning-steppes":"Burning Steppes",
 "searing-gorge":"Searing Gorge",silithus:"Silithus",wpl:"Western Plaguelands",
 "blasted-lands":"Blasted Lands","swamp-of-sorrows":"Swamp of Sorrows"
};
const clsEN={guerrier:"Warrior",paladin:"Paladin",chasseur:"Hunter",voleur:"Rogue",pretre:"Priest",chaman:"Shaman",mage:"Mage",demoniste:"Warlock",druide:"Druid"};
const clsIcons={guerrier:"warrior",paladin:"paladin",chasseur:"hunter",voleur:"rogue",pretre:"priest",chaman:"shaman",mage:"mage",demoniste:"warlock",druide:"druid"};
const profIcons={
 alchemy:"spell_holy_sealofsacrifice",blacksmithing:"inv_hammer_04",
 enchanting:"spell_holy_greaterheal",engineering:"inv_misc_orb_03",
 herbalism:"inv_misc_herb_15",leatherworking:"inv_misc_armorkit_09",
 mining:"mining-rich",skinning:"inv_misc_pelt_bear_03",
 tailoring:"inv_scroll_07",cooking:"inv_misc_root_02",
 fishing:"inv_misc_root_02","first-aid":"spell_holy_flashheal"
};
const localMaps=new Set(["winterspring","azshara","epl","ungoro","burning-steppes","searing-gorge","silithus","wpl","blasted-lands","swamp-of-sorrows"]);
const imagePreloads=new Map();
const seed=[
 {key:"mining:winterspring",kind:"mining",title:T("Berceau-de-l’Hiver","Winterspring"),count:T("Carte des filons","Ore node map"),zone:"winterspring",href:prefix+"minage/?zone=winterspring",image:"/assets/maps/winterspring.jpg",coords:[]},
 {key:"quests:alliance",kind:"quest",title:T("Itinéraires Alliance","Alliance quest routes"),href:prefix+"quetes/?faction=alliance",icon:"inv_scroll_07",count:T("Guides de progression","Leveling routes")},
 {key:"talent:voleur",kind:"talent",title:T("Talents du Voleur","Rogue talents"),href:prefix+"talents/voleur/",icon:"class_rogue",count:T("Arbres de talents","Talent trees")},
 {key:"profession:engineering",kind:"profession",title:T("Ingénierie","Engineering"),href:prefix+"metiers/",icon:"inv_hammer_04",count:T("Métiers de WoW Forever","WoW Forever professions")},
 {key:"npc:merchants",kind:"merchant",title:T("Marchands","Vendors"),href:prefix+"marchands/",icon:"inv_scroll_07",count:T("Objets et emplacements","Items and locations")},
 {key:"bis:guerrier",kind:"bis",title:T("Équipement du Guerrier","Warrior gear"),href:prefix+"bis/?classe=guerrier",icon:"class_warrior",count:T("Profils d'équipement","Gear profiles")}
];
let slides=seed,index=0,previousKey="",timer=null,visible=true,nonce=0;
function txt(link,label){
 const arrow=link.querySelector("span");
 if(link.firstChild?.nodeType===Node.TEXT_NODE)link.firstChild.nodeValue=label+" ";
 else link.prepend(document.createTextNode(label+" "));
 if(arrow)arrow.setAttribute("aria-hidden","true");
}
function dataHref(path,params){
 const u=new URL(prefix+path,location.origin);
 for(const [k,v] of Object.entries(params||{}))u.searchParams.set(k,String(v));
 return u.pathname+u.search;
}
function npcMap(db,zone){
 const id=db.zone_maps?.[zone]?.uiMapID;
 if(!id)return localMaps.has(zone)?"/assets/maps/"+zone+".jpg":null;
 return (db.zone_map_base||"https://wowforever-media.fly.storage.tigris.dev/maps/1.60.1.69893/zones/")+id+".webp";
}
function valid(p){return Number.isFinite(p?.[0])&&Number.isFinite(p?.[1])&&p[0]>=0&&p[0]<=100&&p[1]>=0&&p[1]<=100;}
function assemble(results){
 const pools={mining:[],merchant:[],trainer:[],quest:[],talent:[],profession:[],bis:[],item:[],npc:[],population:[]};
 const mining=results.mining,npc=results.npc,prof=results.prof,bis=results.bis,quests=results.quests;
 if(mining?.coordinate_system==="wow_ui_map_normalized_percent"&&Array.isArray(mining.zones)){
  for(const z of mining.zones){
   pools.mining.push({key:"mining:"+z.id,kind:"mining",zone:z.id,
    title:en?(namesEN[z.id]||z.label):z.label,
    count:T(z.points.length+" positions de filons",z.points.length+" ore references"),
    href:dataHref("minage/",{zone:z.id}),image:"/assets/maps/"+z.id+".jpg",
    coords:z.points.filter(valid),disclaimer:T("Positions communautaires · Apparitions non garanties","Community reference points · Spawns not guaranteed")});
  }
 }
 if(npc?.schema_version===1&&Array.isArray(npc.npcs)){
  const zones=new Map();
  for(const [i,n] of npc.npcs.entries()){
   if(!["merchant","trainer"].includes(n.role)||!n.zone?.id)continue;
   const role=n.role,zone=n.zone.id,group=role+":"+zone;
   if(!zones.has(group))zones.set(group,[]);
   zones.get(group).push(n);
   const href=dataHref(role==="merchant"?"marchands/":"metiers/",{zone,q:n.name})+(role==="trainer"?"#prof-trainers":"");
   const p=[n.coordinates?.x,n.coordinates?.y];
   pools.npc.push({key:"npc:"+i+":"+role+":"+zone,kind:role,title:n.name,
    count:(n.profession||T("PNJ référencé","Referenced NPC"))+" · "+(n.zone[en?"en":"fr"]||zone),
    href,zone,image:npcMap(npc,zone),coords:valid(p)?[p]:[],
    icon:role==="merchant"?"inv_scroll_07":"inv_hammer_04",
    disclaimer:valid(p)?T("Coordonnées Classic · Non vérifiées sur Forever","Classic coordinates · Unverified on Forever"):
      T("Position inconnue · Aucun point inventé","Location unknown · No fabricated marker")});
  }
  for(const [key,group] of zones){
   const role=group[0].role,zone=group[0].zone.id;
   const coords=group.map(n=>[n.coordinates?.x,n.coordinates?.y]).filter(valid);
   pools[role].push({key:"zone:"+key,kind:role,title:group[0].zone[en?"en":"fr"]||zone,
    count:group.length+" "+(role==="merchant"?T("marchands","vendors"):T("maîtres référencés","referenced trainers")),
    href:dataHref(role==="merchant"?"marchands/":"metiers/",{zone})+(role==="trainer"?"#prof-trainers":""),
    zone,image:npcMap(npc,zone),coords,icon:role==="merchant"?"inv_scroll_07":"inv_hammer_04",
    disclaimer:T("PNJ Classic · Positions non vérifiées sur Forever","Classic NPCs · Locations unverified on Forever")});
  }
 }
 if(prof?.schema_version===1&&Array.isArray(prof.professions)){
  for(const p of prof.professions){
   pools.profession.push({key:"profession:"+p.slug,kind:"profession",title:p.name[en?"en":"fr"],
    count:T(p.added+" entrées ajoutées dans la bêta",p.added+" beta entries added"),
    href:prefix+"metiers/#prof-overview",icon:profIcons[p.slug]||"inv_hammer_04",
    overline:T("MÉTIERS / BÊTA FOREVER","PROFESSIONS / FOREVER BETA"),
    note:p.description?.[en?"en":"fr"]||T("Recettes et composants","Recipes and materials"),
    disclaimer:T("Données du client bêta · Sous réserve de modifications","Beta client data · Subject to change")});
  }
 }
 if(bis?.schema_version===1&&Array.isArray(bis.classes)){
  for(const c of bis.classes){
   const className=en?clsEN[c.id]||c.label:c.label,icon="class_"+(clsIcons[c.id]||"warrior");
   pools.talent.push({key:"talent:"+c.id,kind:"talent",title:className,
    count:T("Arbres de talents et builds","Talent trees and builds"),href:prefix+"talents/"+c.id+"/",
    icon,overline:T("PERSONNAGE / TALENTS","CHARACTER / TALENTS"),
    disclaimer:T("Talents issus de la bêta Forever","Forever beta talent references")});
   for(const spec of c.specs||[]){
    pools.bis.push({key:"bis:"+c.id+":"+spec.id,kind:"bis",title:className+" · "+spec.label,
     count:T("Sélection d’équipement pré-raid","Pre-raid gear selection"),
     href:dataHref("bis/",{classe:c.id,spe:spec.id}),icon,
     overline:T("ÉQUIPEMENT / PROFILS","GEAR / PROFILES"),
     disclaimer:T("Référence Classic · BiS Forever non confirmé","Classic reference · Not confirmed Forever BiS")});
   }
  }
  for(const item of bis.items||[]){
   if(!item?.name)continue;
   pools.item.push({key:"item:"+item.id,kind:"item",title:item.name,
    count:item.origin||T("Catalogue d’objets","Gear catalog"),
    href:prefix+"equipements/?v=20261009-catalogue",icon:item.icon||"inv_helmet_22",
    overline:T("ÉQUIPEMENT / OBJETS","GEAR / ITEMS"),
    disclaimer:T("Objet Classic · Disponibilité Forever à vérifier","Classic item · Forever availability unverified")});
  }
 }
 if(quests?.schema_version===1&&quests.profiles){
  for(const [faction,profiles] of Object.entries(quests.profiles)){
   if(!["alliance","horde"].includes(faction)||!Array.isArray(profiles))continue;
   for(const p of profiles){
    const label=en?({human:"Human",gnorf:"Dwarf / Gnome",nelf:"Night Elf",trorc:"Orc / Troll",undead:"Undead",tauren:"Tauren"}[p.id]||p.label):p.label;
    pools.quest.push({key:"quest:"+faction+":"+p.id,kind:"quest",
     title:(faction==="alliance"?"Alliance":"Horde")+" · "+label,
     count:T("Parcours de quêtes du niveau 1 à 60","Quest leveling routes"),
     href:dataHref("quetes/",{faction,race:p.id}),icon:faction==="alliance"?"alliance":"horde",
     overline:T("EXPLORATION / QUÊTES","EXPLORATION / QUESTS"),
     disclaimer:T("Parcours communautaires Classic · Variations possibles sur Forever","Classic community routes · May vary on Forever")});
   }
  }
 }
 // Real verified population data is unavailable: show the module without invented numbers.
 pools.population.push({key:"population:status",kind:"population",title:T("Population des royaumes","Realm population"),
  count:T("Données vérifiées en attente","Awaiting verified data"),href:prefix+"population/",
  icon:"alliance",overline:T("ROYAUMES / POPULATION","REALMS / POPULATION"),
  disclaimer:T("Aucun chiffre inventé · Suivi en préparation","No invented numbers · Tracking in development")});
 // Round-robin across all modules. No slide count ceiling: every catalog record is eligible.
 const order=["mining","merchant","quest","talent","profession","trainer","bis","item","npc","population"];
 const ordered=[];
 let hasMore=true;
 while(hasMore){hasMore=false;for(const k of order)if(pools[k].length){hasMore=true;ordered.push(pools[k].shift());}}
 return ordered.length?ordered:seed;
}
function labelOf(s){
 return s.overline||({
 mining:T("CARTES INTERACTIVES / MINAGE","INTERACTIVE MAPS / MINING"),
 merchant:T("ATLAS PNJ / MARCHANDS","NPC ATLAS / VENDORS"),
 trainer:T("ATLAS PNJ / MAÎTRES","NPC ATLAS / TRAINERS"),
 quest:T("EXPLORATION / QUÊTES","EXPLORATION / QUESTS"),
 talent:T("PERSONNAGE / TALENTS","CHARACTER / TALENTS"),
 profession:T("MÉTIERS / FOREVER","PROFESSIONS / FOREVER"),
 bis:T("ÉQUIPEMENT / PRÉ-BIS","GEAR / PRE-BIS"),
 item:T("ÉQUIPEMENT / OBJETS","GEAR / ITEMS"),
 population:T("ROYAUMES / POPULATION","REALMS / POPULATION")
 })[s.kind];
}
function iconSource(name){
 if(name==="alliance"||name==="horde")return "/assets/quest-factions/"+name+".svg";
 if(name==="mining-rich")return "/assets/icons/mining-rich.svg";
 return "/assets/icons/"+encodeURIComponent(name)+".jpg";
}
function featureVisual(s){
 const icon=feature.querySelector(".atlas-feature-icon");
 icon.replaceChildren();
 const img=document.createElement("img");
 img.src=iconSource(s.icon||(s.kind==="mining"?"mining-rich":s.kind==="trainer"?"inv_hammer_04":"inv_scroll_07"));
 img.alt="";img.decoding="async";
 img.onerror=()=>{img.onerror=null;img.src="/assets/icons/inv_scroll_07.jpg";};
 icon.append(img);
 feature.querySelector("strong").textContent=s.title;
 feature.querySelector("small").textContent=s.note||s.count||"";
 feature.dataset.kind=s.kind;
}
function renderPoints(s){
 markers.replaceChildren();markers.dataset.atlasKind=s.kind;
 const pts=(s.coords||[]).filter(valid),display=[];
 // Display density is limited for legibility, not the number of slides.
 const step=Math.max(1,Math.floor(pts.length/50));
 for(let i=0;i<pts.length;i+=step){
  const p=pts[i];if(display.length>=18)break;
  if(display.every(q=>Math.hypot(p[0]-q[0],p[1]-q[1])>(s.kind==="mining"?8:2.5)))display.push(p);
 }
 for(const p of display){
  const dot=document.createElement("span");dot.className="atlas-live-marker";
  dot.style.left=p[0]+"%";dot.style.top=p[1]+"%";markers.append(dot);
 }
}
function setImage(s,token){
 // Never expose a blank loading panel during the fast 2-second rotation.
 featureVisual(s);feature.hidden=false;
 markers.hidden=true;image.hidden=true;placeholder.hidden=true;
 const urls=[s.image];
 if(s.zone&&localMaps.has(s.zone)&&s.kind!=="mining")urls.push("/assets/maps/"+s.zone+".jpg");
 let attempt=0;
 const tryLoad=()=>{
  if(token!==nonce)return;
  if(attempt>=urls.length){
   feature.querySelector("small").textContent=T("Carte indisponible · Explorer la fiche","Map unavailable · Open details");
   return;
  }
  const src=urls[attempt++];
  const img=new Image();
  img.onload=()=>{
   if(token!==nonce)return;
   image.src=src;image.hidden=false;markers.hidden=false;placeholder.hidden=true;feature.hidden=true;
   const legacy=src.endsWith(".jpg")&&img.naturalWidth/img.naturalHeight<1.42;
   image.style.width=legacy?(100*1024/1002)+"%":"100%";
   image.style.height=legacy?(100*768/668)+"%":"100%";
  };
  img.onerror=()=>{if(token===nonce)tryLoad();};
  img.src=src;
 };
 tryLoad();
}
function nextPreload(){
 for(const j of [1,2]){
  const s=slides[(index+j)%slides.length];if(!s?.image)continue;
  const src=s.image;
  if(imagePreloads.has(src))continue;
  const preload=new Image();preload.src=src;imagePreloads.set(src,preload);
  if(imagePreloads.size>6)imagePreloads.delete(imagePreloads.keys().next().value);
 }
}
function show(next,manual=false){
 if(!slides.length)return;
 index=(next+slides.length)%slides.length;
 const s=slides[index],token=++nonce;
 if(s.key!==previousKey&&!reduced?.matches){
  copy.classList.remove("atlas-reveal");void copy.offsetWidth;copy.classList.add("atlas-reveal");
 }
 previousKey=s.key;
 root.dataset.atlasKind=s.kind;
 eyebrow.textContent=labelOf(s);
 title.textContent=s.title;
 count.textContent=s.count||"";
 disclaimer.textContent=s.disclaimer||T("Découvrez les outils de ForEveroth","Explore ForEveroth tools");
 const href=s.href||prefix;
 cta.href=href;map.href=href;map.setAttribute("aria-label",T("Explorer : ","Explore: ")+s.title);
 txt(cta,s.kind==="mining"?T("Explorer cette carte","Explore this map"):
   s.kind==="merchant"?T("Voir les marchands","Find vendors"):
   s.kind==="trainer"?T("Voir les maîtres","Find trainers"):
   T("Découvrir","Explore"));
 related.href=s.kind==="mining"?prefix+"marchands/":s.kind==="quest"?prefix+"talents/":
   s.kind==="profession"?prefix+"metiers/#prof-trainers":s.kind==="talent"?prefix+"bis/":
   s.kind==="bis"||s.kind==="item"?prefix+"talents/":prefix+"quetes/";
 txt(related,s.kind==="profession"?T("Trouver un maître","Find trainers"):
   s.kind==="talent"?T("Équipement","Gear"):s.kind==="bis"||s.kind==="item"?T("Talents","Talents"):
   s.kind==="quest"?T("Talents","Talents"):s.kind==="mining"?T("Marchands","Vendors"):
   T("Guides de quêtes","Quest guides"));
 mapLabel.lastChild.nodeValue=" "+(s.image?T("CARTE DE ZONE / X·Y","ZONE MAP / X·Y"):labelOf(s));
 number.textContent=String(index+1).padStart(2,"0")+" / "+String(slides.length).padStart(2,"0");
 renderPoints(s);
 if(s.image)setImage(s,token);
 else{
  image.hidden=true;markers.hidden=true;placeholder.hidden=true;feature.hidden=false;
  featureVisual(s);
 }
 nextPreload();
 if(manual)resetTimer();
}
function resetTimer(){
 if(timer!==null)clearInterval(timer);
 timer=null;
 // Respect the visitor's system reduced-motion setting; arrows always work.
 if(reduced?.matches)return;
 timer=setInterval(()=>{if(!document.hidden&&visible)show(index+1);},2000);
}
$("[data-atlas-prev]").addEventListener("click",()=>show(index-1,true));
$("[data-atlas-next]").addEventListener("click",()=>show(index+1,true));
if("IntersectionObserver" in window){
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting},{threshold:0.05});
 observer.observe(root);
}
reduced?.addEventListener?.("change",resetTimer);
async function loadCatalog(path){
 try{const r=await fetch("/data/"+path,{cache:"default"});if(!r.ok)throw Error(r.status);return await r.json();}
 catch(e){console.warn("Home atlas catalog unavailable:",path,e);return null;}
}
Promise.all([
 loadCatalog("mining-points.json"),loadCatalog("npcs.json"),loadCatalog("professions.json"),
 loadCatalog("bis.json"),loadCatalog("quests/manifest.json")
]).then(([mining,npc,prof,bis,quests])=>{
 const current=slides[index]?.key;
 slides=assemble({mining,npc,prof,bis,quests});
 const retained=slides.findIndex(s=>s.key===current);
 index=retained>=0?retained:0;
 show(index);
});
show(0);
resetTimer();
})();