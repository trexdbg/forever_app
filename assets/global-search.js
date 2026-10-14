/* ForEveroth global homepage search — indexes published local datasets on demand. */
(()=>{
"use strict";
const host=document.getElementById("global-search");
if(!host)return;
const input=document.getElementById("global-search-input");
const panel=document.getElementById("global-search-panel");
const status=document.getElementById("global-search-status");
const results=document.getElementById("global-search-results");
const filters=document.getElementById("global-search-filters");
const more=document.getElementById("global-search-more");
const en=document.documentElement.lang==="en";
const base=en?"/en/":"/";
const T=(fr,eng)=>en?eng:fr;
const clean=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[’']/g," ").replace(/[-_]/g," ").replace(/\s+/g," ").trim();
const label=v=>typeof v==="string"?v:(v?.[en?"en":"fr"]||v?.en||v?.fr||"");
const pair=v=>typeof v==="string"?[v]:(v&&typeof v==="object"?[v.fr,v.en]:[]);
const url=(path,params)=>{
 const u=new URL(base+path,location.origin);
 for(const [k,v] of Object.entries(params||{}))if(v!==undefined&&v!==null&&v!=="")u.searchParams.set(k,String(v));
 return u.pathname+u.search;
};
const classes={Warrior:["guerrier","Guerrier"],Paladin:["paladin","Paladin"],Hunter:["chasseur","Chasseur"],Rogue:["voleur","Voleur"],Priest:["pretre","Prêtre"],Shaman:["chaman","Chaman"],Mage:["mage","Mage"],Warlock:["demoniste","Démoniste"],Druid:["druide","Druide"]};
const treeFR={Arms:"Armes",Fury:"Fureur",Protection:"Protection",Holy:"Sacré",Retribution:"Vindicte","Beast Mastery":"Maîtrise des bêtes",Marksmanship:"Précision",Survival:"Survie",Assassination:"Assassinat",Combat:"Combat",Subtlety:"Finesse",Discipline:"Discipline",Shadow:"Ombre",Elemental:"Élémentaire",Enhancement:"Amélioration",Restoration:"Restauration",Arcane:"Arcanes",Fire:"Feu",Frost:"Givre",Affliction:"Affliction",Demonology:"Démonologie",Destruction:"Destruction",Balance:"Équilibre","Feral Combat":"Combat farouche"};
const categories={
 all:T("Tout","All"),items:T("Objets & butins","Items & loot"),quests:T("Quêtes","Quests"),
 npcs:T("PNJ & marchands","NPCs & vendors"),rares:T("Rares","Rares"),
 dungeons:T("Donjons & boss","Dungeons & bosses"),mining:T("Minage","Mining"),
 talents:T("Talents & BiS","Talents & BiS"),professions:T("Métiers","Professions")
};
let entries=[],known=new Set(),loaded=0,failed=0,started=false,complete=false,active="all",limit=12,shown=[];
function add(kind,name,detail,href,aliases=[],boost=0){
 const title=String(name??"").trim();
 if(!title||!href)return;
 const k=kind+"|"+href+"|"+clean(title);
 if(known.has(k))return;
 known.add(k);
 const all=[title,...aliases.flat(Infinity).filter(x=>typeof x==="string")];
 entries.push({kind,title,detail:String(detail||""),href,boost,exact:clean(title),terms:clean(all.join(" "))});
}
function itemLabels(i){
 const original=typeof i.name==="string"?i.name:(i.name?.en||i.name?.fr||"");
 const normalized={...i,name:original,name_fr:i.name_fr||i.name?.fr,name_en:i.name_en||i.name?.en};
 const local=window.ForeverItemLocale?.resolved?.(normalized);
 const fr=local?.fr||normalized.name_fr||original;
 const english=local?.en||normalized.name_en||original;
 return {display:en?english:fr,names:[fr,english,original,normalized.name_fr||"",String(i.id||"")]};
}
function itemRows(db){
 for(const i of db?.items||[]){
  if(!i?.id||!i?.name)continue;
  const n=itemLabels(i);
  const source=String(i.source_status||"");
  const origin=i.origin_fr||i.origin_en||i.origin||"";
  const type=source.includes("forever")?T("Forever bêta","Forever beta"):T("Référence Classic","Classic reference");
  add("items",n.display,type+(origin?" · "+origin:""),url("equipements/",{q:i.id}),[...n.names,origin,i.slot,i.armorType,i.tooltip||[]],8);
 }
}
function npcRows(db){
 if(!Array.isArray(db?.npcs))return;
 const vendorFor=new Map();
 for(const n of db.npcs){
  if(!n.name)continue;
  const module=n.role==="trainer"?"metiers/":"marchands/";
  const kind=n.role==="trainer"?"professions":"npcs";
  const area=label(n.zone);
  add(kind,n.name,(n.role==="trainer"?T("Maître","Trainer"):T("Marchand","Vendor"))+" · "+(n.profession||"")+(area?" · "+area:""),
   url(module,{zone:n.zone?.id,q:n.name}),[n.profession,...pair(n.zone),n.faction,n.weapon_skills||[],n.note,n.note_en],8);
  if(n.role==="merchant")for(const id of n.offers||[]){
   const key=String(id);
   if(!vendorFor.has(key))vendorFor.set(key,[]);
   vendorFor.get(key).push(n.name);
  }
 }
 for(const [id,item] of Object.entries(db.items||{})){
  const vendors=vendorFor.get(String(id))||[];
  if(!vendors.length)continue;
  const names=pair(item.name),title=label(item.name);
  add("npcs",title,T("Vendu par ","Sold by ")+vendors.slice(0,3).join(", "),
   url("marchands/",{q:title}),[...names,id,item.profession,...vendors],6);
 }
}
function dungeonRows(db){
 for(const d of db?.dungeons||[]){
  const zone=label(d.zone),dName=label(d.name);
  const href=url("donjons/",{donjon:d.id});
  add("dungeons",dName,T("Donjon","Dungeon")+(zone?" · "+zone:""),href,[...pair(d.name),...pair(d.zone),d.id],11);
  (d.bosses||[]).forEach((b,i)=>{
   const bhref=url("donjons/",{donjon:d.id,boss:i+1});
   add("dungeons",label(b.name),T("Boss de ","Boss in ")+dName,bhref,[...pair(b.name),...pair(d.name)],9);
   for(const loot of b.loot||[])if(label(loot)||loot.id){
    // The dossier and every search result must agree on the same ID-based
    // client name; retain community French aliases for finding a result.
    const resolved=loot.id?itemLabels({id:loot.id,name:loot.en||loot.fr||"",name_en:loot.en,name_fr:loot.fr,source_status:loot.source_status==="classic_loot_reference"?"classic_reference":loot.source_status||"forever_beta_community"}):null;
    add("items",resolved?.display||label(loot),T("Butin · ","Loot · ")+dName+" · "+label(b.name),bhref,
     [...(resolved?.names||[]),...pair(loot),String(loot.id||""),...pair(b.name),...pair(d.name)],7);
   }
  });
  for(const q of d.questLoot||[])if(label(q))
   add("items",label(q),T("Objet de quête · ","Quest item · ")+dName,href,[...pair(q),...pair(d.name)],5);
 }
}
function rareRows(db){
 for(const r of db?.rares||[]){
  const zone=pair(db.zones?.[r.zone]);
  const href=url("rare/",{zone:r.zone,q:label(r.name),level:"all"});
  add("rares",label(r.name),T("Monstre rare","Rare creature")+" · "+(en?zone[1]||zone[0]:zone[0]||zone[1]||r.zone),href,
   [...pair(r.name),...zone,r.id],9);
  for(const item of r.loot||[]){
   if(!item.name)continue;
   const n=itemLabels({id:item.item_id||item.id||0,name:item.name,source_status:item.source_version==="forever_beta"?"forever_beta_community":"classic_reference"});
   add("items",n.display,T("Butin rare · ","Rare drop · ")+label(r.name),href,[...n.names,...pair(r.name),...zone],6);
  }
 }
}
function miningRows(db){
 const minerals=db?.minerals||{};
 for(const z of db?.zones||[]){
  const href=url("minage/",{zone:z.id});
  const types=[...new Set((z.points||[]).map(p=>p[2]))];
  const names=types.flatMap(k=>{
   const m=minerals[k];return [m?.fr,m?.en,m?.label,m?.name,k].filter(Boolean);
  });
  add("mining",en?(z.en||z.label):z.label,T("Carte des filons","Ore locations")+" · "+(z.points?.length||0),href,
    [z.id,z.label,z.en,...names],7);
  for(const k of types){
   const m=minerals[k]||{};
   const title=en?(m.en||m.label||m.name||k):(m.fr||m.label||m.name||k);
   add("mining",title,T("Filon · ","Ore node · ")+(z.label||z.id),href,
    [m.fr,m.en,m.label,m.name,k,z.label,z.en],4);
  }
 }
}
function professionsRows(db){
 for(const p of db?.professions||[]){
  const href=url("metiers/",{q:label(p.name)});
  const text=[...pair(p.name),...pair(p.description),p.slug,p.id,
    ...(p.highlights||[]).flatMap(pair),...(p.camp||[]).flatMap(pair)].filter(Boolean);
  add("professions",label(p.name),T("Métier Forever","Forever profession"),href,text,8);
  for(const n of p.trainers||[]){
   const who=typeof n==="string"?n:(n?.name||"");
   if(who)add("professions",who,T("Maître · ","Trainer · ")+label(p.name),url("metiers/",{q:who}),
     [label(p.name),n.zone,n.faction],5);
  }
 }
}
function craftingRows(db){
 // Research-only opt-in preview: do not index anything without its explicit exposure contract.
 const preview=db?.scope?.preview;
 if(db?.scope?.status!=="research_only_not_published"||preview?.status!=="opt_in_documentary_preview"||
  !Array.isArray(preview.recipe_item_ids)||preview.recipe_item_ids.length!==8||
  !Array.isArray(db.recipes)||db.recipes.length!==8)return;
 for(const r of db.recipes){
  const i=db.items?.[String(r?.output_item_id)];
  if(!preview.recipe_item_ids.includes(r?.output_item_id)||!i?.name?.fr||!i?.name?.en||!r?.spell_id)continue;
  add("professions",label(i.name),
   T("Fabrication documentée · bêta (non confirmée en jeu)","Documented crafting · beta (not confirmed in game)"),
   url("metiers/",{craft:r.output_item_id}),
   [...pair(i.name),String(r.output_item_id),String(r.spell_id)],10);
 }
}
function talentRows(db){
 for(const [cls,data] of Object.entries(db?.classes||{})){
  const meta=classes[cls];if(!meta)continue;
  const [slug,fr]=meta;
  const name=en?cls:fr;
  const href=url("talents/"+slug+"/");
  add("talents",name,T("Arbres de talents","Talent trees"),href,[cls,fr,slug],9);
  for(const tree of data.trees||[]){
   const tn=en?tree.name:(treeFR[tree.name]||tree.name);
   add("talents",tn,T("Arbre · ","Tree · ")+name,href,[tree.name,treeFR[tree.name],name,cls],5);
   for(const talent of tree.talents||[]){
    const frName=window.ForeverTalentNamesFR?.[cls]?.[talent.name]||talent.name;
    add("talents",en?talent.name:frName,T("Talent · ","Talent · ")+name+" / "+tn,href,
      [frName,talent.name,tn,tree.name,name,cls],4);
   }
  }
 }
}
function bisRows(db){
 for(const cls of db?.classes||[]){
  const fr=cls.label||classes[Object.keys(classes).find(c=>classes[c][0]===cls.id)]?.[1]||cls.id;
  const name=en?(Object.keys(classes).find(k=>classes[k][0]===cls.id)||fr):fr;
  add("talents",T("BiS ","BiS ")+name,T("Équipements par classe","Class gear profiles"),url("bis/",{classe:cls.id}),
   [fr,name,cls.id,...(cls.specs||[]).flatMap(s=>[s.label,s.name,s.id].filter(Boolean))],6);
  add("talents",T("BiS par niveau · ","BiS by level · ")+name,T("Équipements par palier","Level-bracket gear"),url("bis-niveaux/",{classe:cls.id,niveau:30}),
   [fr,name,cls.id],5);
 }
}
function questRows(db){
 const faction=db?.faction;
 if(faction!=="alliance"&&faction!=="horde")return;
 const routes=db.routes||{};
 const common=faction==="alliance"?"human":"trorc";
 const profiles=Object.keys(routes).filter(x=>x!=="shared");
 const translated=q=>{
  const english=Array.isArray(q)?String(q[0]||""):String(q||"");
  const ids=db.quest_ids?.[english.toLowerCase()];
  const id=Array.isArray(ids)?ids[0]:ids;
  return {en:english,fr:db.translations?.[id]||english};
 };
 const routeKeys=["starts","objectives","ends","completed"];
 for(const profile of profiles){
  const route=[...(routes[profile]||[]),...(routes.shared||[])];
  const present=new Set();
  route.forEach((s,index)=>{
   const loc=s.zone||"",step=index+1,href=url("quetes/",{faction,race:profile,step});
   for(const w of s.waypoints||[]){
    const place=window.ForeverQuestLocale?.header?.(w.header)||w.header;
    if(place&&typeof place==="string"){
     const id="npc:"+clean(place);
     if(!present.has(id)){
      present.add(id);
      add("quests",place,T("Lieu d'étape · ","Quest waypoint · ")+loc+" · "+faction,href,[w.header,loc,profile],3);
     }
    }
    for(const key of routeKeys)for(const q of w[key]||[]){
     const names=translated(q);
     const id="quest:"+clean(names.en);
     if(present.has(id))continue;
     present.add(id);
     add("quests",en?names.en:names.fr,T("Quête · ","Quest · ")+faction+" · "+loc,href,
       [names.en,names.fr,loc,profile,place],8);
    }
   }
  });
 }
}
const shortcuts=[
 ["quests",T("Quêtes","Quests"),"quetes/"],["dungeons",T("Donjons","Dungeons"),"donjons/"],
 ["rares",T("Monstres rares","Rare creatures"),"rare/"],["npcs",T("Marchands","Vendors"),"marchands/"],
 ["professions",T("Métiers & maîtres","Professions & trainers"),"metiers/"],
 ["mining",T("Minage","Mining"),"minage/"],["items",T("Catalogue d'objets","Item catalogue"),"equipements/"],
 ["talents",T("Talents","Talents"),"talents/"],["talents",T("BiS par niveau","BiS by level"),"bis-niveaux/"],
 ["talents",T("BiS par classe","Class BiS"),"bis/"],["npcs",T("Population","Population"),"population/"]
];
for(const [k,title,path]of shortcuts)add(k,title,T("Ouvrir le module","Open section"),url(path),[path],2);
const jobs=[
 ["data/npcs.json",npcRows],["data/dungeons-forever.json",dungeonRows],
 ["data/rares.json",rareRows],["data/items.json",itemRows],["data/items-forever.json",itemRows],
 ["data/items-classic-cache.json",itemRows],["data/items-forever-cache.json",itemRows],
 ["data/bis-niveaux-forever-observed.json",itemRows],["data/bis-niveaux-classic.json",itemRows],
 ["data/professions.json",professionsRows],["data/crafting-chains-beta.json",craftingRows],["data/talents.json",talentRows],
 ["data/bis.json",db=>{bisRows(db);itemRows(db);}],
 ["data/mining-points.json",miningRows],
 ["data/quests/alliance.json",questRows],["data/quests/horde.json",questRows]
];
async function load(){
 if(started)return;
 started=true;
 let next=0;
 async function worker(){
  while(next<jobs.length){
   const [path,indexer]=jobs[next++];
   try{
    const response=await fetch("/"+path,{cache:"default"});
    if(!response.ok)throw Error(String(response.status));
    indexer(await response.json());
   }catch(error){failed++;console.warn("ForEveroth search: source unavailable",path,error);}
   loaded++;if(input.value.trim())render();
  }
 }
 await Promise.all([worker(),worker(),worker(),worker()]);
 complete=true;
 render();
}
function score(entry,q,tokens){
 if(entry.exact===q)return 120+entry.boost;
 if(entry.exact.startsWith(q))return 85+entry.boost;
 if(entry.exact.includes(q))return 65+entry.boost;
 if(!tokens.every(x=>entry.terms.includes(x)))return -1;
 return (entry.terms.includes(q)?39:19)+entry.boost;
}
function matches(){
 const q=clean(input.value);
 if(!q)return [];
 const parts=q.split(" ").filter(Boolean);
 return entries.map(e=>({entry:e,rank:score(e,q,parts)}))
  .filter(x=>x.rank>=0&&(active==="all"||x.entry.kind===active))
  .sort((a,b)=>b.rank-a.rank||a.entry.title.localeCompare(b.entry.title,en?"en":"fr"))
  .map(x=>x.entry);
}
function make(tag,cls,text){
 const e=document.createElement(tag);if(cls)e.className=cls;
 if(text!==undefined)e.textContent=text;
 return e;
}
function render(){
 const q=input.value.trim();
 more.hidden=true;shown=[];
 if(!q){
  panel.hidden=true;
  input.setAttribute("aria-expanded","false");
  results.replaceChildren();
  return;
 }
 panel.hidden=false;input.setAttribute("aria-expanded","true");
 const found=matches(),visible=found.slice(0,limit);
 const loadText=!complete?T(" · indexation en cours…"," · indexing…"):"";
 status.textContent=found.length+" "+T("résultats","results")+loadText+(failed&&complete?T(" · certaines sources indisponibles"," · some sources unavailable"):"");
 results.replaceChildren();
 for(const e of visible){
  const a=make("a","global-search-result");
  a.href=e.href;
  a.dataset.kind=e.kind;
  const group=make("span","global-search-result-type",categories[e.kind]||"");
  const copy=make("span","global-search-result-copy");
  copy.append(make("strong","",e.title),make("small","",e.detail));
  a.append(group,copy,make("span","global-search-result-arrow","↗"));
  results.append(a);shown.push(a);
 }
 if(!found.length){
  results.append(make("p","global-search-empty",complete?
   T("Aucun résultat dans les données disponibles.","No result in the available data."):
   T("Recherche dans les bases de données…","Searching the datasets…")));
 }
 more.hidden=found.length<=limit;
 more.textContent=T("Afficher plus de résultats","Show more results")+" ("+Math.min(12,found.length-limit)+")";
}
for(const [key,title]of Object.entries(categories)){
 const b=make("button","global-search-filter"+(key==="all"?" is-active":""),title);
 b.type="button";b.dataset.kind=key;b.setAttribute("aria-pressed",key==="all"?"true":"false");
 b.addEventListener("click",()=>{
  active=key;limit=12;
  for(const c of filters.children){const on=c.dataset.kind===key;c.classList.toggle("is-active",on);c.setAttribute("aria-pressed",String(on));}
  render();
 });
 filters.append(b);
}
input.addEventListener("focus",()=>{void load();if(input.value.trim())render()});
input.addEventListener("input",()=>{limit=12;void load();render()});
input.addEventListener("keydown",e=>{
 if(e.key==="Escape"){panel.hidden=true;input.setAttribute("aria-expanded","false");return;}
 if(e.key==="ArrowDown"&&shown.length){e.preventDefault();shown[0].focus();return;}
 if(e.key==="Enter"&&shown.length){e.preventDefault();location.assign(shown[0].href);}
});
results.addEventListener("keydown",e=>{
 if(e.key==="Escape"){e.preventDefault();input.focus();panel.hidden=true;input.setAttribute("aria-expanded","false");}
 if(e.key!=="ArrowDown"&&e.key!=="ArrowUp")return;
 e.preventDefault();
 const ix=shown.indexOf(document.activeElement),move=e.key==="ArrowDown"?ix+1:ix-1;
 if(move<0)input.focus();else shown[Math.min(move,shown.length-1)]?.focus();
});
more.addEventListener("click",()=>{limit+=12;render()});
document.addEventListener("pointerdown",e=>{
 if(!host.contains(e.target)){panel.hidden=true;input.setAttribute("aria-expanded","false");}
});
})();
