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
/* Level 30 is the ACTUAL beta endpoint, not a 30–39 range. */
const levels=[[1,9],[10,19],[20,24],[25,29],[30,30],[31,39],[40,49],[50,59],[60,60]];
const betaBand=levels.findIndex(([min,max])=>min===30&&max===30);
const params=new URLSearchParams(location.search);
let db=null,all=[],classId="guerrier",specId="fury",band=betaBand,origin="all",sourceKind="all";
let farmingSources=[];
const remoteByLevel=new Map();
const mk=(tag,klass,value)=>{const node=document.createElement(tag);if(klass)node.className=klass;if(value!==undefined)node.textContent=value;return node};
const labelC=c=>en?(classesEN[c.id]||c.label):c.label;
const labelS=s=>en?(specsEN[s.label]||s.label):s.label;
const labelSlot=s=>en?(slotsEN[s.id]||s.label):s.label;
const cls=()=>db.classes.find(c=>c.id===classId);
const spec=()=>cls().specs.find(s=>s.id===specId);
const isForever=i=>String(i.source_status||"").startsWith("forever_beta_");

const isObserved=i=>i.source_status==="forever_beta_observed";
const kindLabel=en?{all:"All acquisition sources",dungeon:"Dungeons",quest:"Quests",crafted:"Crafting",vendor:"Vendors",world:"World / Other"}:{all:"Toutes les sources",dungeon:"Donjons",quest:"Quêtes",crafted:"Métiers",vendor:"Marchands",world:"Monde / Divers"};
function getKind(i){
 const kind=i.acquisition?.kind||i.source_kind;
 if(["dungeon","quest","crafted","vendor","world"].includes(kind))return kind;
 const origin=(i.origin||"")+" "+(i.origin_fr||"")+" "+(i.origin_en||"");
 if(/dungeon|donjon|chasm|deadmines|wailing|keep|deeps|h[âa]che.tripes|gne|dalaran|stockade|monastery|citadel|lordaeron|than(e|es)|[eé]xcavat|blackrock|maraudon|gnomeregan|razorfen/i.test(origin))return "dungeon";
 if(/quest|qu[eê]te|class quest|mission/i.test(origin))return "quest";
 if(/craft|tailor|leatherwork|enchant|forge|cui(r|s)|m[eé]tier|engineering|alchemy|blacksmith|artisan|couture|ing[eé]nierie/i.test(origin))return "crafted";
 if(/vendor|marchand|merchant|vendeur|boutique/i.test(origin))return "vendor";
 return "world";
}
const sourceDetails=en?{drop:"Observed beta drop",observed:"Seen in beta",client:"Beta client reference · unverified acquisition",classic:"Classic reference · availability unverified",obtained:"How to obtain",boss:"Boss",level30:"Level 30 · beta cap"}:{drop:"Butin observé en bêta",observed:"Vu en bêta",client:"Référence du client bêta · obtention à confirmer",classic:"Référence Classic · disponibilité non vérifiée",obtained:"Où l’obtenir",boss:"Boss",level30:"Niveau 30 · plafond bêta"};


/* Localization is source-aware: the Classic API publishes French names only.
   Never replace a sourced English item name with a French API value on EN pages. */
const zoneFR={"City of Dalaran":"Cité de Dalaran","Excavation Site: Wetlands":"Excavations des Paluns","Hall of Thanes":"Hall of Thanes","Ruins of Lordaeron":"Ruines de Lordaeron","The Stockade":"La Prison","Ragefire Chasm":"Gouffre de Ragefeu","The Deadmines":"Mortemines","Wailing Caverns":"Cavernes des Lamentations","Shadowfang Keep":"Donjon d’Ombrecroc","Blackfathom Deeps":"Profondeurs de Brassenoire","Razorfen Kraul":"Kraal de Tranchebauge","Razorfen Downs":"Souilles de Tranchebauge","Scarlet Monastery":"Monastère écarlate","Blackrock Depths":"Profondeurs de Rochenoire","Blackrock Spire":"Pic Rochenoire","Dire Maul":"Hache-tripes","The Temple of Atal'Hakkar":"Temple d’Atal’Hakkar","Elwynn Forest":"Forêt d’Elwynn","Tirisfal Glades":"Clairières de Tirisfal","Westfall":"Marche de l’Ouest","World drop":"Butin mondial","Crafting":"Fabrication","Enchanting":"Enchantement","Leatherworking":"Travail du cuir","Vendor":"Marchand","Zone drop":"Butin de zone","Rare drop":"Butin rare"};
const knownFR={5191:"Barbelure cruelle",10399:"Armure défias noircie",16712:"Gants Sombreruse"};
const localizedName=i=>en?(i.name_en||i.name):(i.name_fr||window.ForeverItemLocale?.name(i)||knownFR[i.id]||i.name);
function localizedOrigin(i){
 let value=en?(i.origin_en||i.origin):(i.origin_fr||i.origin);
 if(typeof value!=="string")return "";
 if(!en)for(const [a,b] of Object.entries(zoneFR))value=value.replaceAll(a,b);
 return value;
}
const fmtItem=i=>({...i,name:localizedName(i),origin:localizedOrigin(i)});

function sourceLabel(i){
 if(isObserved(i))return sourceDetails.observed;
 if(isForever(i))return sourceDetails.client;
 return sourceDetails.classic;
}
function safeSourceUrl(i){
 const v=isObserved(i)?i.source_url||i.source_dungeon_url:i.source_url||i.url;
 if(typeof v!=="string")return null;
 try{const a=new URL(v);return a.protocol==="https:"&&["foreverchanges.pro","www.wowhead.com","www.60.tools","wowclassicdatabase.com","wowdb.assemblee-defias.fr"].includes(a.hostname)?a.href:null}catch{return null}
}
function sourceLink(i){
 const url=safeSourceUrl(i);if(!url)return null;
 const a=mk("a","level-bis-source-link",en?"↗ Source details":"↗ Voir la source");
 a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;
}

function localizedTooltip(i){
 const copy=fmtItem(i);
 if(!en&&Array.isArray(copy.tooltip)&&copy.tooltip.length){
  copy.tooltip=copy.tooltip.map(line=>typeof line==="string"?(line===i.name?localizedName(i):line)
   .replace(/^Item Level (\d+)$/,"Niveau d'objet $1")
   .replace(/^Requires Level (\d+)$/,"Niveau $1 requis")
   .replace(/^\+([\d,.]+) Strength$/,"+$1 Force")
   .replace(/^\+([\d,.]+) Agility$/,"+$1 Agilité")
   .replace(/^\+([\d,.]+) Stamina$/,"+$1 Endurance")
   .replace(/^\+([\d,.]+) Intellect$/,"+$1 Intelligence")
   .replace(/^\+([\d,.]+) Spirit$/,"+$1 Esprit")
   .replace(/^One-Hand /,"À une main · ").replace(/^Main Hand /,"Main droite · ")
   .replace(/^Two-Hand /,"Deux mains · ").replace(/^Off Hand /,"Main gauche · ")
   .replace(/^Ranged /,"Distance · ")
   .replace(/ Sword$/," Épée").replace(/ Dagger$/," Dague").replace(/ Staff$/," Bâton")
   .replace(/ Wand$/," Baguette").replace(/ Bow$/," Arc").replace(/ Axe$/," Hache")
   .replace(/ Mace$/," Masse").replace(/ Shield$/," Bouclier")
   .replace(/ Leather$/," Cuir").replace(/ Cloth$/," Tissu").replace(/ Mail$/," Mailles")
   .replace(/ Plate$/," Plaques")
   .replace(/^Equip: /,"Équipé : ")
   :line);
 }
 return copy;
}

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
function weaponAllowed(i,chosenSlot=normSlot(i)){
 const slot=chosenSlot;
 if(!["mainhand","offhand","ranged"].includes(slot))return true;
 const code=typeCode(i),max=levels[band][1];
 if(specId==="tank"&&slot==="mainhand"&&twoHand(i))return false;
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
 if(!Number.isInteger(i.id)||!i.name||i.quality==="poor"||req===null||req>max||req<1)return false;
 if(Number.isFinite(i.itemLevel)&&i.itemLevel>max+(max===60?18:11))return false;
 if(origin==="forever"&&!isForever(i)||origin==="classic"&&isForever(i))return false;
  if(sourceKind!=="all"&&getKind(i)!==sourceKind)return false;
 if(!rules?.canEquip(i,classId)||!weaponAllowed(i))return false;
 const armor=rules.armorType(i),slot=normSlot(i);
 if(["head","shoulders","chest","wrist","hands","waist","legs","feet"].includes(slot)){
  if(armor==="plate"&&max<40)return false;
  if(armor==="mail"&&max<40&&["chasseur","chaman"].includes(classId))return false;
 }
 return true;
}
function roleBonus(i){
 const source=(Array.isArray(i.tooltip)?i.tooltip:[]).join(" ").toLocaleLowerCase();
 const tokens={
  str:/\bstrength\b|\bforce\b|\battack power\b|puissance d.attaque/,
  agi:/\bagility\b|agilit[eé]|ranged attack|attaque [aà] distance/,
  stam:/\bstamina\b|endurance|defen[sc]e|d[eé]fense|dodge|esquive|parry|parade/,
  mana:/\bintellect\b|intelligence|mana|\bspirit\b|esprit/,
  spell:/spell (damage|power|hit)|d[eé]g[aâ]ts des sorts|puissance des sorts|sorts et effets magiques/,
  heal:/healing|soins|soigne|gu[eé]rison/,
  crit:/critical strike|coup critique|coups critiques|touch[eé]/
 };
 const test=key=>tokens[key].test(source);
 const role=spec().role;
 const caster=role==="caster",heal=role==="heal",tank=role.includes("tank"),
       agility=role.includes("rogue")||role==="hunter"||role==="feral",
       hybrid=role==="enhance";
 let bonus=0;
 if(caster||heal){bonus+=test("mana")?10:0;bonus+=test(heal?"heal":"spell")?12:0;bonus+=test("agi")&&!test("mana")?-5:0}
 else if(tank){bonus+=test("stam")?11:0;bonus+=test("str")?5:0;bonus+=test("mana")&&!test("stam")?-4:0}
 else if(agility){bonus+=test("agi")?12:0;bonus+=test("str")?5:0;bonus+=test("mana")&&!test("agi")?-5:0}
 else {bonus+=test("str")?12:0;bonus+=test("agi")?5:0;bonus+=test("mana")&&!test("str")?-4:0}
 if(test("crit"))bonus+=3;
 const arm=window.ForeverEquipmentRules?.armorType(i),level=levels[band][1];
 if(arm){
  if(["mage","pretre","demoniste"].includes(classId)&&arm==="cloth")bonus+=3;
  if(["voleur","druide"].includes(classId)&&arm==="leather")bonus+=3;
  if(["chasseur","chaman"].includes(classId)&&arm===(level>=40?"mail":"leather"))bonus+=3;
  if(["guerrier","paladin"].includes(classId)&&arm===(level>=40?"plate":"mail"))bonus+=3;
 }
 if(heal&&typeCode(i)==="shield")bonus+=3;
 if(tank&&typeCode(i)==="shield")bonus+=9;
 if(role==="hunter"&&normSlot(i)==="ranged"&&["bow","gun","crossbow"].includes(typeCode(i)))bonus+=10;
 if((role.includes("rogue")||role==="warrior_fury")&&normSlot(i)==="mainhand"&&oneHand(i))bonus+=4;
 if((caster||heal)&&twoHand(i)&&test("mana"))bonus+=3;
 return bonus;
}
const score=i=>(i.itemLevel||required(i)||0)*2+Math.min(required(i)||0,levels[band][1])*.7+roleBonus(i)+({poor:-6,common:0,uncommon:2,rare:4,epic:6,legendary:8}[i.quality]||0)+(isObserved(i)?3:isForever(i)?1:0);
function icon(i,fallback){
 const shell=mk("span","level-bis-icon"),value=i?.icon||fallback;
 if(typeof value==="string"&&(/^([a-z0-9_-]{2,70})$/.test(value)||value.startsWith("https://wowdb.assemblee-defias.fr/database-icons/"))){
  const img=document.createElement("img");img.loading="lazy";img.alt="";img.src=value.startsWith("https:")?value:"/assets/icons/"+value+".jpg";
  img.onerror=()=>{if(img.dataset.fallback||value.startsWith("https:")){img.remove();shell.textContent="✦"}else{img.dataset.fallback="1";img.src="https://wow.zamimg.com/images/wow/icons/large/"+value+".jpg"}};
  shell.append(img);
 }else shell.textContent="✦";
 return shell;
}
/* Cache Classic API results per level range. No GitHub Action or daily job needed. */
const remoteGroups=[
 {key:"armor",slots:["head","shoulder","back","chest","wrist","hands","waist","legs","feet"]},
 {key:"accessories",slots:["neck","finger","trinket"]},
 {key:"weapons",slots:["one_hand","main_hand","two_hand","off_hand","held_in_off_hand","ranged","thrown","relic"]}
];
const extra=en?{
 fetch:"Loading additional Classic items…",ready:"additional Classic items indexed",more:"Load more Classic references",error:"Classic API unavailable; verified local records remain visible",local:"Local references (Classic API not requested)",running:"Classic data loading"
}:{
 fetch:"Recherche de nouveaux équipements Classic…",ready:"références Classic supplémentaires indexées",more:"Charger d’autres références Classic",error:"API Classic indisponible : les références locales restent visibles",local:"Références locales",running:"Chargement Classic"
};
function mergeRecords(rows){
 const map=new Map(all.map(i=>[i.id,i]));
 for(const record of rows){
  if(!record||!Number.isInteger(record.id)||record.id<=0||!record.name)continue;
  const item={...record,slot:normSlot(record)};
  const previous=map.get(item.id);
  if(!previous){if(!en)map.set(item.id,item);continue}
  if(isForever(previous))continue; // Never downgrade a Forever beta reference to a Classic entry.
  if(isForever(item)){map.set(item.id,item);continue}
  const oldTooltip=previous.tooltip?.length||0,newTooltip=item.tooltip?.length||0;
  map.set(item.id,{...previous,...item,
   name:en?(previous.name_en||previous.name):item.name,
   name_en:previous.name_en||(en?previous.name:undefined),
   name_fr:en?previous.name_fr:item.name,
   origin:previous.source_status==="classic_curated_leveling"?previous.origin:item.origin,
   url:previous.source_status==="classic_curated_leveling"?previous.url:item.url,
   source_status:previous.source_status==="classic_curated_leveling"?previous.source_status:item.source_status,
   requiredLevel:required(item)??required(previous),
   tooltip:en?previous.tooltip:(newTooltip>oldTooltip?item.tooltip:previous.tooltip),
   icon:item.icon||previous.icon});
 }
 all=[...map.values()];
}
function getRemote(){
 const max=levels[band][1];
 if(!remoteByLevel.has(max))remoteByLevel.set(max,{max,busy:false,started:false,failed:false,loaded:new Set(),groups:remoteGroups.map(g=>({...g,cursor:null,more:true}))});
 return remoteByLevel.get(max);
}
function renderRemoteStatus(){
 const el=$("level-live"),btn=$("level-more");if(!el||!btn)return;
 const state=remoteByLevel.get(levels[band][1]);
 if(en){el.textContent="English Classic references · French-only API data excluded";btn.hidden=true;return}
 if(origin==="forever"){el.textContent=extra.local;btn.hidden=true;return}
 if(!state){el.textContent=extra.local;btn.hidden=true;return}
 const qty=state.loaded.size;
 el.textContent=(state.busy?extra.fetch:state.failed&&qty===0?extra.error:qty+" "+extra.ready)
  +(state.failed&&qty>0?" · "+extra.error:"");
 btn.textContent=extra.more;btn.hidden=state.busy||!state.started||state.groups.every(g=>!g.more);
 btn.disabled=state.busy;
}
async function loadRemote(state,pages=1){
 if(state.busy||en)return;
 state.busy=true;renderRemoteStatus();
 const service=window.ForeverGearData;
 const maxItemLevel=state.max+(state.max===60?18:11);
 await Promise.all(state.groups.filter(g=>g.more).map(async group=>{
  for(let page=0;page<pages&&group.more;page++){
   try{
    const response=await service.loadClassic({
     slot:"all",slotCodes:group.slots,maxLevel:state.max,maxItemLevel,
     qualities:state.max<=19?["common","uncommon","rare","epic"]:["uncommon","rare","epic"],limit:100,cursor:group.cursor
    });
    group.cursor=response.cursor;
    group.more=Boolean(response.hasMore&&response.cursor);
    mergeRecords(response.items);
    for(const item of response.items)state.loaded.add(item.id);
    // Keep the first page useful even when subsequent pages fail.
    renderSlots();
   }catch(err){
    group.more=false;state.failed=true;
    break;
   }
  }
 }));
 state.busy=false;renderRemoteStatus();renderSlots();
}
function ensureRemote(){
 if(en||origin==="forever"){renderRemoteStatus();return}
 const state=getRemote();
 if(!state.started){state.started=true;loadRemote(state,2)}
 else renderRemoteStatus();
}
function selectionLink(){
 const url=new URL(location.href);
 url.searchParams.set("classe",classId);url.searchParams.set("spe",specId);url.searchParams.set("niveau",String(levels[band][1]));url.searchParams.set("origine",origin);url.searchParams.set("source",sourceKind);
 history.replaceState(null,"",url);
 for(const a of document.querySelectorAll(".lang-switch a")){
  const u=new URL(a.href,location.origin);
  u.search=url.search;
  a.href=u.pathname+u.search;
 }
}
function renderFilters(){
 const cBox=$("level-classes"),sBox=$("level-specs"),lBox=$("level-bands"),oBox=$("level-source"),aBox=$("level-acquisition");
 cBox.replaceChildren();sBox.replaceChildren();lBox.replaceChildren();oBox.replaceChildren();
 for(const c of db.classes){const b=mk("button","bis-class level-bis-class"+(classId===c.id?" active":""),labelC(c));b.type="button";b.setAttribute("aria-pressed",String(classId===c.id));b.prepend(icon(c,c.icon));b.onclick=()=>{classId=c.id;specId=c.specs[0].id;clearPickerSearch();renderAll()};cBox.append(b)}
 for(const s of cls().specs){const b=mk("button","bis-spec level-bis-chip"+(specId===s.id?" active":""),labelS(s));b.type="button";b.setAttribute("aria-pressed",String(specId===s.id));b.onclick=()=>{specId=s.id;clearPickerSearch();renderAll()};sBox.append(b)}
 levels.forEach(([min,max],index)=>{const b=mk("button","level-bis-chip level-bis-band"+(band===index?" active":""),min===30&&max===30?(en?"30 · BETA":"30 · BÊTA"):min===max?String(min):min+"–"+max);b.type="button";if(min===30&&max===30)b.dataset.beta="true";b.setAttribute("aria-pressed",String(band===index));b.onclick=()=>{band=index;clearPickerSearch();renderAll()};lBox.append(b)});
 for(const [id,title] of [["all",T.all],["forever",T.sourceforever],["classic",T.sourceclassic]]){const b=mk("button","level-bis-chip"+(origin===id?" active":""),title);b.type="button";b.setAttribute("aria-pressed",String(origin===id));b.onclick=()=>{origin=id;clearPickerSearch();renderAll()};oBox.append(b)}
 if(aBox){aBox.replaceChildren();for(const [kind,label] of Object.entries(kindLabel)){
  const button=mk("button","level-bis-chip level-bis-kind"+(sourceKind===kind?" active":""),label);
  button.type="button";button.setAttribute("aria-pressed",String(sourceKind===kind));
  button.onclick=()=>{sourceKind=kind;clearPickerSearch();renderAll()};aBox.append(button);
 }}
}
function itemRow(i,secondary=false){
 const row=mk("div","level-bis-item"+(secondary?" secondary":""));
 row.dataset.quality=i.quality||"common";
 row.append(icon(i,db.slots.find(slot=>window.ForeverGearData.compatible(normSlot(i),slot.id))?.icon||"inv_misc_questionmark"));
 const info=mk("div","level-bis-item-main");
 const title=mk("strong","",localizedName(i));info.append(title);
 const meta=mk("span","",T.required+" "+required(i)+(Number.isFinite(i.itemLevel)?" · "+T.itemLevel+" "+i.itemLevel:""));
 info.append(meta);if(i.origin)info.append(mk("span","level-bis-source",i.origin));row.append(info);
 const badge=mk("span","level-bis-provenance"+(isForever(i)?" is-forever":""),isForever(i)?T.forever:T.classic);row.append(badge);
 const detail=mk("button","level-bis-detail","ⓘ");detail.type="button";detail.title=T.detail;detail.setAttribute("aria-label",T.detail+" "+i.name);detail.onclick=()=>window.ForeverItemTooltip?.pin(i);row.append(detail);if(typeof i.url==="string"){try{const u=new URL(i.url);if(u.protocol==="https:"&&["www.60.tools","www.wowhead.com","wowdb.assemblee-defias.fr","wowclassicdatabase.com"].includes(u.hostname)){const a=mk("a","level-bis-outbound","↗");a.href=u.href;a.target="_blank";a.rel="noopener noreferrer";a.setAttribute("aria-label",T.from+" "+i.name);row.append(a)}}catch{}}
 window.ForeverItemTooltip?.bind(row,i);
 return row;
}

const leftSlots=["head","neck","shoulders","back","chest","wrist","hands"],rightSlots=["waist","legs","feet","finger1","finger2","trinket1","trinket2"],weaponSlots=["mainhand","offhand","ranged"];
const qualities={common:["#efeee9","Commun","Common"],uncommon:["#43bf66","Inhabituel","Uncommon"],rare:["#4c9df1","Rare","Rare"],epic:["#b67cff","Épique","Epic"],legendary:["#ffac46","Légendaire","Legendary"]};
const u=en?{missing:"No target",twohand:"Two-handed weapon equipped",chosen:"Your selection",suggestion:"Suggested item",reset:"Use suggestion",details:"Details",more:"Show more",none:"No items match these filters",all:"All qualities",select:"Set as target",candidates:"references"}:{missing:"Aucun objectif",twohand:"Arme à deux mains équipée",chosen:"Votre sélection",suggestion:"Objet suggéré",reset:"Revenir à la suggestion",details:"Détails",more:"Afficher plus",none:"Aucun objet avec ces filtres",all:"Toutes qualités",select:"Définir comme objectif",candidates:"références"};
let activeSlot="head",pickerQuery="",selectedQualities=new Set(),visibleLimit=45,currentPlan=null;
function clearPickerSearch(){pickerQuery="";selectedQualities.clear();visibleLimit=45;const input=$("level-search");if(input)input.value=""}
const savedProfiles=new Map();

/* At most one localized Classic sheet lookup per visited item; EN keeps the English label and acquires only the icon. */
const localizedRequests=new Set();
function hydrateSelectedLocale(){
 if(origin==="forever"||!currentPlan)return;
 const candidate=currentPlan.selected.get(activeSlot);
 if(!candidate||isForever(candidate)||candidate.source_status==="classic_api"||localizedRequests.has(candidate.id)||(en&&candidate.icon)||(!en&&candidate.name_fr&&candidate.icon))return;
 localizedRequests.add(candidate.id);
 Promise.resolve().then(()=>window.ForeverGearData.itemById(candidate.id))
 .then(item=>{if(!item||!db)return;mergeRecords([item]);renderSlots()})
 .catch(()=>{}); // Keep local references when the French source is unavailable.
}

const savedKey=()=>["foreveroth","level-bis",classId,specId,"max"+levels[band][1]].join(":");
function choices(){
 const k=savedKey();if(savedProfiles.has(k))return savedProfiles.get(k);
 let value={};try{const v=JSON.parse(localStorage.getItem(k)||"{}");if(v&&typeof v==="object"&&!Array.isArray(v))value=v}catch{}
 savedProfiles.set(k,value);return value;
}
function saveChoice(slot,itemId){
 const c={...choices()};
 if(itemId){for(const id of Object.keys(c))if(id!==slot&&c[id]===itemId)delete c[id];c[slot]=itemId}
 else delete c[slot];
 savedProfiles.set(savedKey(),c);
 try{localStorage.setItem(savedKey(),JSON.stringify(c))}catch{}
 renderSlots();
}
const sheetIcon=(item,fallback)=>{const root=mk("span","bis-v2-icon");root.append(icon(item,fallback));return root};
function slotOptions(id,pool){
 return pool.filter(i=>window.ForeverGearData.compatible(normSlot(i),id)||
  id==="offhand"&&normSlot(i)==="mainhand"&&dualWield()&&oneHand(i)&&weaponAllowed(i,"offhand"))
 .filter(i=>id!=="offhand"||weaponAllowed(i,"offhand"))
 .sort((a,b)=>score(b)-score(a)||a.id-b.id);
}
function plan(){
 const pool=all.filter(eligible),available=new Map(),claims=new Map(),reserved=new Set(),selected=new Map(),manual=new Set(),blocked=new Set();
 for(const s of db.slots)available.set(s.id,slotOptions(s.id,pool));
 const custom=choices();
 for(const s of db.slots){
  const id=Number(custom[s.id]),i=available.get(s.id).find(it=>it.id===id);
  if(i&&!reserved.has(id)){claims.set(s.id,i);reserved.add(id)}
 }
 const used=new Set();
 for(const s of db.slots){
  if(s.id==="offhand"&&selected.get("mainhand")&&twoHand(selected.get("mainhand"))){selected.set(s.id,null);blocked.add(s.id);continue}
  const target=claims.get(s.id),choice=target&&!used.has(target.id)?target:available.get(s.id).find(i=>!used.has(i.id)&&!reserved.has(i.id));
  selected.set(s.id,choice||null);
  if(choice){used.add(choice.id);if(choice===target)manual.add(s.id)}
 }
 return {pool,available,selected,manual,blocked};
}
function sheetButton(id){
 const slot=db.slots.find(s=>s.id===id),i=currentPlan.selected.get(id),manual=currentPlan.manual.has(id),blocked=currentPlan.blocked.has(id);
 const btn=mk("button","bis-v2-slot"+(activeSlot===id?" active":"")+(i?" has-item":" no-item")+(manual?" acquired":""));
 btn.type="button";btn.dataset.quality=i?.quality||"none";
 btn.setAttribute("aria-pressed",String(activeSlot===id));btn.setAttribute("aria-label",labelSlot(slot)+" : "+(i?localizedName(i):(blocked?u.twohand:u.missing)));
 btn.append(sheetIcon(i,slot.icon));
 const info=mk("span","bis-v2-slot-copy");
 info.append(mk("strong","",labelSlot(slot)),mk("small","",i?localizedName(i):(blocked?u.twohand:u.missing)));
 btn.append(info,mk("span","bis-v2-slot-indicator",manual?"✓":""));
 btn.addEventListener("click",()=>{
  window.ForeverItemTooltip?.hide?.();activeSlot=id;clearPickerSearch();
  renderSlots();
  if(window.matchMedia?.("(max-width: 980px)")?.matches)$("level-picker")?.scrollIntoView?.({behavior:"smooth",block:"start"});
 });
 if(i)window.ForeverItemTooltip?.bind(btn,{...localizedTooltip(i),slotLabel:labelSlot(slot)});
 return btn;
}

function renderSets(){
 const el=$("level-set-guide");if(!el)return;
 el.replaceChildren();
 const counts=new Map();
 for(const item of currentPlan.selected.values()){
  if(!item?.itemSet||!Array.isArray(item.setBonus))continue;
  const prev=counts.get(item.itemSet);
  counts.set(item.itemSet,{count:(prev?.count||0)+1,item});
 }
 el.hidden=!counts.size;
 for(const [name,{count,item}] of counts){
  const box=mk("details","level-bis-set");
  const summary=mk("summary","",name
    +" · "+count+" / "+(item.itemSetCount||5)+" "+(en?"pieces":"pièces"));
  box.append(summary);
  for(const [index,bonus] of item.setBonus.entries()){
   const threshold=index+2;
   const line=mk("div","level-bis-set-effect"+(count>=threshold?" active":""),
     (en?bonus.replace(/^[(]\d+[)]\s*/,""):bonus.replace(/^[(]\d+[)]\s*/,"")
       .replace(/Shadow Resistance/g,"Résistance à l’Ombre")
       .replace(/Intellect/g,"Intelligence")
       .replace(/Restore mana when mana falls below 15% \(5 min cooldown\)/g,"Restaure du mana sous 15 % de mana (5 min de recharge)")
       .replace(/Healing spells can trigger additional healing/g,"Les sorts de soins peuvent déclencher des soins supplémentaires")));
   line.prepend(mk("span","level-bis-set-tier",threshold+"p"));
   box.append(line);
  }
  el.append(box);
 }
}
function renderSheet(){
 const paper=$("level-paperdoll");paper.replaceChildren();
 const stage=mk("div","bis-v2-stage"),left=mk("div","bis-v2-rail left"),right=mk("div","bis-v2-rail right");
 for(const id of leftSlots)left.append(sheetButton(id));
 for(const id of rightSlots)right.append(sheetButton(id));
 const middle=mk("div","bis-v2-avatar"),medal=mk("div","bis-v2-avatar-medallion");
 medal.append(sheetIcon(cls(),cls().icon));
 middle.append(mk("span","bis-v2-avatar-top","FOREVEROTH"),medal,mk("strong","",labelC(cls())),mk("span","",labelS(spec())));
 stage.append(left,middle,right);
 const weapons=mk("div","bis-v2-weapons");for(const id of weaponSlots)weapons.append(sheetButton(id));
 paper.append(stage,weapons);renderSets();
}
function renderPicker(){
 const slot=db.slots.find(s=>s.id===activeSlot),id=slot.id,i=currentPlan.selected.get(id);
 const blocked=currentPlan.blocked.has(id),manual=currentPlan.manual.has(id);
 $("level-picker-slot").textContent=labelSlot(slot);
 $("level-picker-hint").textContent=blocked?u.twohand:T.required+" ≤ "+levels[band][1]+" · "+(en?"Unconfirmed gear references":"Références provisoires");
 const selected=$("level-picked");selected.replaceChildren(mk("span","bis-v2-eyebrow",manual?u.chosen:u.suggestion));
 if(!i)selected.append(mk("p","bis-v2-blank",blocked?u.twohand:u.missing));
 else{
  const item=mk("div","bis-v2-selected");item.dataset.quality=i.quality||"common";
  const detail=mk("div","bis-v2-selected-info");
  detail.append(mk("strong","",localizedName(i)),
   mk("small","",T.required+" "+required(i)+(Number.isFinite(i.itemLevel)?" · "+T.itemLevel+" "+i.itemLevel:"")),
   mk("span","level-bis-source-proof"+(isForever(i)?"":" is-classic")+(isObserved(i)?"":" is-client"),sourceLabel(i)));
  if(localizedOrigin(i))detail.append(mk("small","level-bis-acquisition-inline",localizedOrigin(i)));
  item.append(sheetIcon(i,slot.icon),detail);selected.append(item);
  window.ForeverItemTooltip?.bind(item,{...localizedTooltip(i),slotLabel:labelSlot(slot)});
  const actions=mk("div","bis-v2-actions"),button=mk("button","", "ⓘ "+u.details);
  button.type="button";button.addEventListener("click",()=>window.ForeverItemTooltip?.pin({...localizedTooltip(i),slotLabel:labelSlot(slot)}));actions.append(button);
  if(manual){const reset=mk("button","bis-v2-clear",u.reset);reset.type="button";reset.addEventListener("click",()=>saveChoice(id,0));actions.append(reset)}
  const reference=sourceLink(i);if(reference)actions.append(reference);
  selected.append(actions);
 }
 const list=currentPlan.available.get(id)||[],root=$("level-quality");root.replaceChildren();
 function quality(q,label,n){
  const isAll=q==="all",on=isAll?!selectedQualities.size:selectedQualities.has(q);
  const button=mk("button","bis-v2-quality"+(on?" active":""),label+(isAll?"":" "+n));
  button.type="button";button.setAttribute("aria-pressed",String(on));
  if(!isAll){button.style.setProperty("--rarity",qualities[q][0]);button.disabled=!n&&!on}
  button.addEventListener("click",()=>{if(isAll)selectedQualities.clear();else if(on)selectedQualities.delete(q);else selectedQualities.add(q);visibleLimit=45;renderPicker()});
  root.append(button);
 }
 quality("all",u.all,list.length);
 for(const [q,meta] of Object.entries(qualities)){const n=list.filter(i=>i.quality===q).length;if(n||selectedQualities.has(q))quality(q,meta[en?2:1],n)}
 const term=pickerQuery.toLocaleLowerCase();
 const matches=(blocked?[]:list).filter(it=>(!selectedQualities.size||selectedQualities.has(it.quality))&&(!term||((window.ForeverItemLocale?.aliases(it)||localizedName(it))+" "+localizedOrigin(it)+" "+it.id).toLocaleLowerCase().includes(term)));
 $("level-picker-count").textContent=matches.length+" "+u.candidates;
 const results=$("level-candidates");results.replaceChildren();
 if(!matches.length){results.append(mk("p","bis-v2-empty",blocked?u.twohand:u.none));return}
 for(const candidate of matches.slice(0,visibleLimit)){
  const wrap=mk("div","bis-v2-candidate-wrap"),b=mk("button","bis-v2-candidate"+(i?.id===candidate.id?" selected":""));
  b.type="button";b.dataset.quality=candidate.quality||"common";
  b.setAttribute("aria-pressed",String(i?.id===candidate.id));b.setAttribute("aria-label",u.select+" : "+localizedName(candidate));
  const info=mk("span","bis-v2-candidate-info");
  info.append(mk("strong","",localizedName(candidate)),mk("small","",T.required+" "+required(candidate)+(Number.isFinite(candidate.itemLevel)?" · "+T.itemLevel+" "+candidate.itemLevel:"")),
   mk("small","",(isObserved(candidate)?sourceDetails.drop:isForever(candidate)?T.forever:T.classic)+" · "+(localizedOrigin(candidate)||T.from)));
  b.append(sheetIcon(candidate,slot.icon),info);b.addEventListener("click",()=>saveChoice(id,candidate.id));
  window.ForeverItemTooltip?.bind(b,{...localizedTooltip(candidate),slotLabel:labelSlot(slot)});
  const detail=mk("button","bis-v2-info-button","ⓘ");detail.type="button";
  detail.setAttribute("aria-label",u.details+" : "+localizedName(candidate));
  detail.addEventListener("click",()=>window.ForeverItemTooltip?.pin({...localizedTooltip(candidate),slotLabel:labelSlot(slot)}));
  wrap.append(b,detail);results.append(wrap);
 }
 if(matches.length>visibleLimit){const more=mk("button","bis-v2-more",u.more+" ("+(matches.length-visibleLimit)+")");more.type="button";more.addEventListener("click",()=>{visibleLimit+=45;renderPicker()});results.append(more)}
}
function renderSlots(){
 if(!db)return;
 currentPlan=plan();
 const filled=[...currentPlan.selected.values()].filter(Boolean).length;
 $("level-count").textContent=filled+" / "+db.slots.length+" "+T.slots+" · "+currentPlan.pool.length+" "+T.total
  +(levels[band][1]===30?" · "+currentPlan.pool.filter(isObserved).length+" "+(en?"beta-observed drops":"butins observés en bêta"):"");
 $("level-current").textContent=labelC(cls())+" · "+labelS(spec())+" · "+(levels[band][0]===levels[band][1]?String(levels[band][1]):levels[band].join("–"));
 $("level-empty").hidden=currentPlan.pool.length>0;
 $("level-cap").textContent=T.levelCap;$("level-cap").hidden=levels[band][1]<=30;
 renderSheet();renderPicker();hydrateSelectedLocale();
}

function renderFarm(){
 const node=$("level-farm-list");if(!node)return;
 node.replaceChildren();
 const [min,max]=levels[band];
 const candidates=farmingSources.filter(s=>s.min<=max&&s.max>=Math.max(1,min-2))
   .sort((a,b)=>Number(b.kind==="forever")-Number(a.kind==="forever")||b.min-a.min)
   .slice(0,9);
 if(!candidates.length){node.append(mk("p","level-bis-farm-empty",en?"No dungeon recommendations yet for this bracket.":"Pas de donjon recommandé pour cette tranche."));return}
 for(const d of candidates){
  const a=mk("a","level-bis-farm-item"+(d.kind==="forever"?" is-forever":""));
  a.href=d.url;a.target="_blank";a.rel="noopener noreferrer";
  a.append(mk("strong","",(en?d.name_en:d.name_fr)+" ↗"),
   mk("span","level-bis-farm-meta",d.min+"–"+d.max+" · "+(en?d.zone_en:d.zone_fr)+" · "+(d.kind==="forever"?(en?"Forever beta":"Forever bêta"):"Classic")),
   mk("span","level-bis-farm-detail",en?d.note_en:d.note_fr));
  node.append(a);
 }
}
function renderAll(){renderFilters();renderSlots();renderFarm();renderRemoteStatus();selectionLink();ensureRemote()}
(async()=>{
 try{
  const [core,forever,local,curated,observed,sources]=await Promise.all([
   fetch("/data/bis.json").then(r=>{if(!r.ok)throw Error("bis");return r.json()}),
   window.ForeverGearData.loadForever(),
   fetch("/data/items.json").then(r=>{if(!r.ok)throw Error("catalogue");return r.json()}).catch(()=>({items:[]})),
   fetch("/data/bis-niveaux-classic.json").then(r=>{if(!r.ok)throw Error("curated");return r.json()}).catch(()=>({items:[]})),
   fetch("/data/bis-niveaux-forever-observed.json").then(r=>{if(!r.ok)throw Error("observed");return r.json()}).catch(()=>({items:[]})),
   fetch("/data/bis-niveaux-sources.json").then(r=>{if(!r.ok)throw Error("sources");return r.json()}).catch(()=>({sources:[]}))
  ]);
  if(!Array.isArray(core.classes)||!Array.isArray(core.slots))throw Error("schema");
  db=core;farmingSources=Array.isArray(sources.sources)?sources.sources:[];
  const byId=new Map();
  for(const item of [...core.items,...(Array.isArray(local.items)?local.items:[]),...(Array.isArray(curated.items)?curated.items:[]),...forever,...(Array.isArray(observed.items)?observed.items:[])]){
   if(!Number.isInteger(item.id))continue;
   const normalized=window.ForeverItemLocale?.record({...item,slot:normSlot(item)})||{...item,slot:normSlot(item)};
   const existing=byId.get(item.id);
   // Prefer sources with a known required level and rich tooltips; preserve provenances.
   if(!existing||isObserved(normalized)||(required(normalized)!==null&&required(existing)===null)||isForever(normalized)&&!isForever(existing))byId.set(item.id,normalized);
  }
  all=[...byId.values()];
  if(db.classes.some(c=>c.id===params.get("classe")))classId=params.get("classe");
  const s=params.get("spe");if(cls().specs.some(x=>x.id===s))specId=s;else specId=cls().specs[0].id;
  const p=Number(params.get("niveau"));
   if(params.has("niveau")&&Number.isInteger(p)){
    const precise=levels.findIndex(([,max])=>max===p);
    if(precise>=0)band=precise;
    else if(p>=0&&p<=6)band=[0,1,3,5,6,7,8][p]; // Backwards-compatible 2026 links using the old bracket index.
   }
  if(["forever","classic","all"].includes(params.get("origine")))origin=params.get("origine");
   if(["all","dungeon","quest","crafted","vendor","world"].includes(params.get("source")))sourceKind=params.get("source");
  $("level-more")?.addEventListener("click",()=>loadRemote(getRemote(),1));
  $("level-search")?.addEventListener("input",e=>{pickerQuery=e.target.value.trim().toLocaleLowerCase();visibleLimit=45;renderPicker()});
  renderAll();
 }catch(err){$("level-current").textContent=T.error;$("level-count").textContent="";$("level-slots").replaceChildren(mk("p","level-bis-empty",T.error))}
})();
})();