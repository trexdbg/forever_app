/* Level-bracket equipment explorer. Recommendations are provisional, never asserted as Forever BiS. */
(()=>{"use strict";
const en=document.documentElement.lang==="en",$=id=>document.getElementById(id),host=$("level-bis");
if(!host)return;
const T=en?{
 classes:"Classes",level:"Level",required:"Requires level",itemLevel:"Item level",from:"Source",forever:"Forever beta",classic:"Classic",all:"All references",none:"No level-verified candidate for this slot.",unverified:"Provisional candidates · not confirmed BiS",other:"Other candidates",hide:"Hide candidates",more:"Show other candidates",detail:"Item details",levelCap:"Beta level cap: 30. Higher brackets are preparatory references only.",empty:"No suitable candidate with a documented required level. We do not guess.",total:"eligible references",slots:"covered slots",missing:"Not documented",notice:"Suggestions are ranked using item level and available stats, not game testing. Item acquisition, optimization and drop sources have not been verified in Forever.",loading:"Loading item references…",error:"Unable to load equipment references.",source:"Source filter",sourceforever:"Forever beta",sourceclassic:"Classic",classLabel:"Choose class",specLabel:"Role / build",bandLabel:"Level bracket",tooltip:"View details",compare:"Explore the catalogue",confirmed:"Required level documented",tip:"Click or hover an item to inspect its properties.",reference:"Reference",notverified:"Availability unverified",name:"Name"}:{
 classes:"Classes",level:"Niveau",required:"Niveau requis",itemLevel:"Niveau d’objet",from:"Origine",forever:"Forever bêta",classic:"Classic",all:"Toutes les références",none:"Aucun candidat avec niveau requis vérifié pour cet emplacement.",unverified:"Candidats provisoires · BiS non confirmés",other:"Autres candidats",hide:"Masquer les candidats",more:"Voir les autres candidats",detail:"Fiche de l’objet",levelCap:"Bêta limitée au niveau 30. Les tranches supérieures sont des repères préparatoires.",empty:"Aucun candidat adapté avec niveau requis documenté. Aucun BiS inventé.",total:"références éligibles",slots:"emplacements couverts",missing:"Non documenté",notice:"Classement indicatif par niveau d’objet et caractéristiques connues, sans tests en jeu. Obtention, optimisation et butins ne sont pas vérifiés sur Forever.",loading:"Chargement des références…",error:"Impossible de charger les références.",source:"Filtre de provenance",sourceforever:"Forever bêta",sourceclassic:"Classic",classLabel:"Choisir une classe",specLabel:"Rôle / profil",bandLabel:"Tranche de niveau",tooltip:"Voir les détails",compare:"Explorer le catalogue",confirmed:"Niveau requis documenté",tip:"Survolez ou cliquez pour afficher les propriétés.",reference:"Référence",notverified:"Disponibilité non vérifiée",name:"Nom"};
const classesEN={guerrier:"Warrior",paladin:"Paladin",chasseur:"Hunter",voleur:"Rogue",pretre:"Priest",chaman:"Shaman",mage:"Mage",demoniste:"Warlock",druide:"Druid"};
const specsEN={"Fury":"Fury","Tank":"Tank","Soins":"Healer","DPS distance":"Ranged DPS","DPS magique":"Spell DPS","Combat épées":"Combat swords","Combat dagues":"Combat daggers","Ombre":"Shadow","Amélioration":"Enhancement","Farouche":"Feral"};
const slotsEN={head:"Head",neck:"Neck",shoulders:"Shoulders",back:"Back",chest:"Chest",wrist:"Wrist",hands:"Hands",waist:"Waist",legs:"Legs",feet:"Feet",finger1:"Ring 1",finger2:"Ring 2",trinket1:"Trinket 1",trinket2:"Trinket 2",mainhand:"Main hand",offhand:"Off hand",ranged:"Ranged / relic"};
const levels=[[1,9],[10,19],[20,29],[30,39],[40,49],[50,59],[60,60]];
const params=new URLSearchParams(location.search);
let db=null,all=[],classId="guerrier",specId="fury",band=2,origin="all";
const mk=(tag,klass,value)=>{const node=document.createElement(tag);if(klass)node.className=klass;if(value!==undefined)node.textContent=value;return node};
const labelC=c=>en?(classesEN[c.id]||c.label):c.label;
const labelS=s=>en?(specsEN[s.label]||s.label):s.label;
const labelSlot=s=>en?(slotsEN[s.id]||s.label):s.label;
const cls=()=>db.classes.find(c=>c.id===classId);
const spec=()=>cls().specs.find(s=>s.id===specId);
const isForever=i=>String(i.source_status||"").startsWith("forever_beta_");
const normSlot=i=>window.ForeverGearData?.LABELS[i.slot]||i.slot;
const required=i=>{
 if(Number.isInteger(i.requiredLevel)&&i.requiredLevel>=1)return i.requiredLevel;
 const line=Array.isArray(i.tooltip)?i.tooltip.find(t=>/^(?:Requires Level \d+|Niveau \d+ requis)$/.test(t)):null;
 return line?Number(line.match(/\d+/)[0]):null;
};
/* Validate Classic weapon proficiencies, including French API type names. */
const typeCode=i=>{
 const raw=[i.type,i.type_name,...(Array.isArray(i.tooltip)?i.tooltip.slice(0,9):[])].filter(v=>typeof v==="string").join(" ").toLowerCase();
 if(/\b(wand|baguette)\b/.test(raw))return "wand";
 if(/\b(crossbow|arbal[eè]te)\b/.test(raw))return "crossbow";
 if(/\b(thrown|thrown weapon|arme de jet|armes de jet)\b/.test(raw))return "thrown";
 if(/\b(bow|arc)\b/.test(raw))return "bow";
 if(/\b(gun|fusil)\b/.test(raw))return "gun";
 if(/\b(idol|idole)\b/.test(raw))return "idol";
 if(/\b(libram|librame)\b/.test(raw))return "libram";
 if(/\b(totem)\b/.test(raw))return "totem";
 if(/\b(shield|bouclier)\b/.test(raw))return "shield";
 if(/\b(held in off.hand|tenu en main gauche|objet tenu en main gauche)\b/.test(raw))return "held";
 if(/\b(dagger|dague|dagues)\b/.test(raw))return "dagger";
 if(/\b(polearm|arme d.hast|armes d.hast)\b/.test(raw))return "polearm";
 if(/\b(staff|staves|b[aâ]ton)\b/.test(raw))return "staff";
 if(/\b(sword|sabre|[eé]p[eé]e)\b/.test(raw))return "sword";
 if(/\b(axe|hache)\b/.test(raw))return "axe";
 if(/\b(mace|marteau|masse)\b/.test(raw))return "mace";
 if(/\b(fist weapon|arme de pugilat)\b/.test(raw))return "fist";
 return null;
};
const twoHand=i=>{
 const text=[i.slot_name,...(i.tooltip||[]).slice(0,8)].filter(v=>typeof v==="string").join(" ").toLowerCase();
 return /\b(two.hand|two handed|deux mains)\b/.test(text);
};
const dualWield=()=>["voleur","guerrier","chasseur"].includes(classId)&&levels[band][1]>=((classId==="voleur")?10:20);
const oneHand=i=>{
 const text=[i.slot_name,...(i.tooltip||[]).slice(0,8)].filter(v=>typeof v==="string").join(" ").toLowerCase();
 return !twoHand(i)&&/\b(one.hand|one handed|[aà] une main)\b/.test(text);
};
function weaponAllowed(i){
 const slot=normSlot(i);
 if(!["mainhand","offhand","ranged"].includes(slot))return true;
 const code=typeCode(i),max=levels[band][1];
 // Type-less weapon references cannot be attributed to a class reliably.
 if(!code)return false;
 const allowed={
  guerrier:["sword","axe","mace","dagger","fist","polearm","staff","shield","bow","gun","crossbow","thrown"],
  paladin:["sword","axe","mace","polearm","shield","held","libram"],
  chasseur:["sword","axe","dagger","fist","polearm","staff","bow","gun","crossbow"],
  voleur:["sword","mace","dagger","fist","bow","gun","crossbow","thrown"],
  pretre:["dagger","mace","staff","wand","held"],
  chaman:["axe","mace","dagger","fist","staff","shield","held","totem"],
  mage:["sword","dagger","staff","wand","held"],
  demoniste:["sword","dagger","staff","wand","held"],
  druide:["mace","dagger","fist","staff","held","idol"]
 };
 if(!allowed[classId]?.includes(code))return false;
 if(classId==="voleur"){
  if(twoHand(i))return false;
  if(specId==="daggers"&&code!=="dagger"&&slot!=="ranged")return false;
  if(specId==="swords"&&code==="dagger")return false;
 }
 if(code==="polearm"&&max<20)return false;
 if(classId==="chaman"&&twoHand(i)&&["axe","mace"].includes(code)&&!(specId==="enhance"&&max>=30))return false;
 if(slot==="ranged")return ["bow","gun","crossbow","thrown","wand","idol","libram","totem"].includes(code);
 if(slot==="offhand"){
  if(["shield","held"].includes(code)){
   if(code==="shield"&&classId==="guerrier"&&specId==="fury")return false;
   if(code==="held"&&["tank","enhance","feral"].includes(specId))return false;
   return true;
  }
  return dualWield()&&oneHand(i);
 }
 if(code==="shield"||code==="held"||["bow","gun","crossbow","thrown","wand","idol","libram","totem"].includes(code))return false;
 return true;
}
function eligible(i){
 const req=required(i),max=levels[band][1],rules=window.ForeverEquipmentRules;
 if(!Number.isInteger(i.id)||!i.name||req===null||req>max||req<1)return false;
 if(Number.isFinite(i.itemLevel)&&i.itemLevel>max+(max===60?18:11))return false;
 if(origin==="forever"&&!isForever(i)||origin==="classic"&&isForever(i))return false;
 if(!rules?.canEquip(i,classId)||!weaponAllowed(i))return false;
 const armor=rules.armorType(i),slot=normSlot(i);
 if(["head","shoulders","chest","wrist","hands","waist","legs","feet"].includes(slot)){
  if(armor==="plate"&&max<40)return false;
  if(armor==="mail"&&max<40&&["chasseur","chaman"].includes(classId))return false;
 }
 return true;
}
function roleBonus(i){
 const text=(Array.isArray(i.tooltip)?i.tooltip:[]).join(" ").toLowerCase();
 const flags={
  strength:/\bstrength\b|\battack power\b|\bmelee\b/,agility:/\bagility\b|\battack power\b|\branged attack\b/,
  stamina:/\bstamina\b|\barmor\b|\bdefense\b|\bdodge\b|\bparry\b/,
  intellect:/\bintellect\b|\bspell damage\b|\bspell power\b|\bspell hit\b|\bspell critical\b/,
  heal:/\bhealing\b|\bspirit\b|\bintellect\b|\bmana per 5\b/,feral:/\bagility\b|\battack power\b|\bstrength\b/
 };
 const role=spec().role,focus=role==="heal"?"heal":role==="caster"?"intellect":role==="hunter"?"agility":role==="feral"?"feral":role.includes("tank")?"stamina":role.includes("rogue")?"agility":"strength";
 let value=flags[focus].test(text)?6:0;
 if(role==="heal"&&/healing/.test(text))value+=4;
 if(role==="caster"&&/spell damage|spell power/.test(text))value+=4;
 if(role.includes("tank")&&/defense|block/.test(text))value+=4;
 if(role==="hunter"&&/ranged attack/.test(text))value+=3;
 const arm=window.ForeverEquipmentRules?.armorType(i);
 if(arm){
  if(["mage","pretre","demoniste"].includes(classId))value+=arm==="cloth"?2:0;
  if(["voleur","druide"].includes(classId))value+=arm==="leather"?2:0;
  if(classId==="chasseur"||classId==="chaman")value+=arm===(levels[band][1]>=40?"mail":"leather")?2:0;
  if(["guerrier","paladin"].includes(classId))value+=arm===(levels[band][1]>=40?"plate":"mail")?2:0;
 }
 return value;
}
const score=i=>(i.itemLevel||required(i)||0)*3+Math.min(required(i)||0,levels[band][1])*0.8+roleBonus(i)+({poor:-5,common:0,uncommon:3,rare:5,epic:7,legendary:8}[i.quality]||0)+(isForever(i)?1:0);
function icon(i,fallback){
 const shell=mk("span","level-bis-icon"),value=i?.icon||fallback;
 if(typeof value==="string"&&(/^([a-z0-9_-]{2,70})$/.test(value)||value.startsWith("https://wowdb.assemblee-defias.fr/database-icons/"))){
  const img=document.createElement("img");img.loading="lazy";img.alt="";img.src=value.startsWith("https:")?value:"/assets/icons/"+value+".jpg";
  img.onerror=()=>{if(img.dataset.fallback||value.startsWith("https:")){img.remove();shell.textContent="✦"}else{img.dataset.fallback="1";img.src="https://wow.zamimg.com/images/wow/icons/large/"+value+".jpg"}};
  shell.append(img);
 }else shell.textContent="✦";
 return shell;
}
function selectionLink(){
 const url=new URL(location.href);
 url.searchParams.set("classe",classId);url.searchParams.set("spe",specId);url.searchParams.set("niveau",String(band));url.searchParams.set("origine",origin);
 history.replaceState(null,"",url);
 for(const a of document.querySelectorAll(".lang-switch a")){
  const u=new URL(a.href,location.origin);
  u.search=url.search;
  a.href=u.pathname+u.search;
 }
}
function renderFilters(){
 const cBox=$("level-classes"),sBox=$("level-specs"),lBox=$("level-bands"),oBox=$("level-source");
 cBox.replaceChildren();sBox.replaceChildren();lBox.replaceChildren();oBox.replaceChildren();
 for(const c of db.classes){const b=mk("button","level-bis-class"+(classId===c.id?" active":""),labelC(c));b.type="button";b.setAttribute("aria-pressed",String(classId===c.id));b.prepend(icon(c,c.icon));b.onclick=()=>{classId=c.id;specId=c.specs[0].id;renderAll()};cBox.append(b)}
 for(const s of cls().specs){const b=mk("button","level-bis-chip"+(specId===s.id?" active":""),labelS(s));b.type="button";b.setAttribute("aria-pressed",String(specId===s.id));b.onclick=()=>{specId=s.id;renderAll()};sBox.append(b)}
 levels.forEach(([min,max],index)=>{const b=mk("button","level-bis-chip level-bis-band"+(band===index?" active":""),min===max?String(min):min+"–"+max);b.type="button";b.setAttribute("aria-pressed",String(band===index));b.onclick=()=>{band=index;renderAll()};lBox.append(b)});
 for(const [id,title] of [["all",T.all],["forever",T.sourceforever],["classic",T.sourceclassic]]){const b=mk("button","level-bis-chip"+(origin===id?" active":""),title);b.type="button";b.setAttribute("aria-pressed",String(origin===id));b.onclick=()=>{origin=id;renderAll()};oBox.append(b)}
}
function itemRow(i,secondary=false){
 const row=mk("div","level-bis-item"+(secondary?" secondary":""));
 row.dataset.quality=i.quality||"common";
 row.append(icon(i,"inv_misc_questionmark"));
 const info=mk("div","level-bis-item-main");
 const title=mk("strong","",i.name);info.append(title);
 const meta=mk("span","",T.required+" "+required(i)+(Number.isFinite(i.itemLevel)?" · "+T.itemLevel+" "+i.itemLevel:""));
 info.append(meta);if(i.origin)info.append(mk("span","level-bis-source",i.origin));row.append(info);
 const badge=mk("span","level-bis-provenance"+(isForever(i)?" is-forever":""),isForever(i)?T.forever:T.classic);row.append(badge);
 const detail=mk("button","level-bis-detail","ⓘ");detail.type="button";detail.title=T.detail;detail.setAttribute("aria-label",T.detail+" "+i.name);detail.onclick=()=>window.ForeverItemTooltip?.pin(i);row.append(detail);if(typeof i.url==="string"){try{const u=new URL(i.url);if(u.protocol==="https:"&&["www.60.tools","www.wowhead.com","wowdb.assemblee-defias.fr"].includes(u.hostname)){const a=mk("a","level-bis-outbound","↗");a.href=u.href;a.target="_blank";a.rel="noopener noreferrer";a.setAttribute("aria-label",T.from+" "+i.name);row.append(a)}}catch{}}
 window.ForeverItemTooltip?.bind(row,i);
 return row;
}
function renderSlots(){
 const target=$("level-slots");target.replaceChildren();
 const covered=[];let pool=all.filter(eligible),used=new Set(),seenPerSlot=0;
 const status=$("level-count");
 const grouped=new Map();
 for(const slot of db.slots){
  const list=pool.filter(i=>window.ForeverGearData.compatible(normSlot(i),slot.id)).sort((a,b)=>score(b)-score(a)||a.id-b.id);
  grouped.set(slot.id,list);
 }
 for(const slot of db.slots){
  const items=grouped.get(slot.id);
  const best=items.find(i=>!used.has(i.id))||null;
  const card=mk("section","level-bis-slot");
  const header=mk("div","level-bis-slot-head");header.append(icon({icon:slot.icon}),mk("h3","",labelSlot(slot)));
  if(items.length){covered.push(slot.id);header.append(mk("span","level-bis-num",items.length+" "+(en?"options":"options")))}
  card.append(header);
  if(!best){card.append(mk("p","level-bis-empty",T.missing));target.append(card);continue}
  used.add(best.id);
  card.append(itemRow(best));
  const options=items.filter(i=>i.id!==best.id).slice(0,4);
  if(options.length){const details=mk("details","level-bis-alternatives");const summary=mk("summary","",T.more+" ("+options.length+(items.length>5?"+":"")+")");details.append(summary);for(const it of options)details.append(itemRow(it,true));card.append(details)}
  target.append(card);
 }
 status.textContent=covered.length+" / "+db.slots.length+" "+T.slots+" · "+pool.length+" "+T.total;
 $("level-current").textContent=labelC(cls())+" · "+labelS(spec())+" · "+(levels[band][0]===levels[band][1]?String(levels[band][1]):levels[band].join("–"));
 $("level-empty").hidden=pool.length>0;
 $("level-cap").textContent=T.levelCap;$("level-cap").hidden=levels[band][1]<=30;
}
function renderAll(){renderFilters();renderSlots();selectionLink()}
(async()=>{
 try{
  const [core,forever,local]=await Promise.all([
   fetch("/data/bis.json").then(r=>{if(!r.ok)throw Error("bis");return r.json()}),
   window.ForeverGearData.loadForever(),
   fetch("/data/items.json").then(r=>{if(!r.ok)throw Error("catalogue");return r.json()}).catch(()=>({items:[]}))
  ]);
  if(!Array.isArray(core.classes)||!Array.isArray(core.slots))throw Error("schema");
  db=core;
  const byId=new Map();
  for(const item of [...core.items,...(Array.isArray(local.items)?local.items:[]),...forever]){
   if(!Number.isInteger(item.id))continue;
   const normalized={...item,slot:normSlot(item)};
   const existing=byId.get(item.id);
   // Prefer sources with a known required level and rich tooltips; preserve provenances.
   if(!existing||(required(normalized)!==null&&required(existing)===null)||isForever(normalized)&&!isForever(existing))byId.set(item.id,normalized);
  }
  all=[...byId.values()];
  if(db.classes.some(c=>c.id===params.get("classe")))classId=params.get("classe");
  const s=params.get("spe");if(cls().specs.some(x=>x.id===s))specId=s;else specId=cls().specs[0].id;
  const p=Number(params.get("niveau"));if(params.has("niveau")&&Number.isInteger(p)&&p>=0&&p<levels.length)band=p;
  if(["forever","classic","all"].includes(params.get("origine")))origin=params.get("origine");
  renderAll();
 }catch(err){$("level-current").textContent=T.error;$("level-count").textContent="";$("level-slots").replaceChildren(mk("p","level-bis-empty",T.error))}
})();
})();