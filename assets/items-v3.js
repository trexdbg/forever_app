/* Equipment catalogue: Forever beta entries + paginated WoWDB Classic equipment. */
(()=>{"use strict";
const service=window.ForeverGearData;
const table=document.getElementById("item-results"),search=document.getElementById("item-search"),slot=document.getElementById("item-slot"),armor=document.getElementById("item-armor"),chips=document.getElementById("item-quality-filters"),count=document.getElementById("item-count"),source=document.getElementById("items-source");
if(!service||!table||!search||!slot||!armor||!chips)return;
// Deep links from the homepage global search open the requested item ID directly.
const linkedQuery=new URLSearchParams(location.search).get("q");
if(linkedQuery)search.value=linkedQuery.slice(0,120);
const en=document.documentElement.lang==="en";
const originLabelsEN={"Forge":"Blacksmithing","Pic Blackrock":"Blackrock Spire","Profondeurs de Blackrock":"Blackrock Depths","Travail du cuir":"Leatherworking","Quête · Maleterres":"Quest · Plaguelands","Hache-tripes":"Dire Maul","Quête · Pic Blackrock":"Quest · Blackrock Spire","Couture · Mage":"Tailoring · Mage","Quête · Un'Goro":"Quest · Un'Goro","Butin mondial":"World drop","Couture · Prêtre":"Tailoring · Priest","Quête · Hache-tripes":"Quest · Dire Maul","Quête légendaire (référence Classic)":"Legendary quest (Classic reference)","Objet légendaire (référence Classic)":"Legendary item (Classic reference)","Forge (référence Classic)":"Blacksmithing (Classic reference)"};
const displayOrigin=s=>en?(originLabelsEN[s]||s):s;
const tr=en?{all:"All",forever:"Forever beta",classic:"Classic 1.12",loading:"Loading Classic items…",load:"Load 100 more Classic items",busy:"Loading…",unavailable:"External Classic search did not respond. The offline catalogue is still available.",browse:"Search more items online (Classic)",showMore:"Show 200 more items",shown:"shown",items:"items displayed",item:"item displayed",noresult:"No items match these filters.",badgeForever:"Forever beta",badgeClassic:"Classic",origin:"Source",quality:"Quality",loaded:"Loaded",tooltip:"Details",beta:"Beta data · in-game availability not guaranteed",classicNote:"Classic references are not confirmed Forever items",name:"Item / ID",level:"Item level",required:"Required",filter:"Database",link:"Other Forever references ↗"}:{all:"Tout",forever:"Forever bêta",classic:"Classic 1.12",loading:"Chargement des objets Classic…",load:"Charger 100 autres objets Classic",busy:"Chargement…",unavailable:"La recherche Classic externe n’a pas répondu. Le catalogue local reste disponible.",browse:"Rechercher d’autres objets en ligne (Classic)",showMore:"Afficher 200 objets supplémentaires",shown:"affichés",items:"objets affichés",item:"objet affiché",noresult:"Aucun résultat avec ces filtres.",badgeForever:"Forever bêta",badgeClassic:"Classic",origin:"Origine",quality:"Qualité",loaded:"Chargés",tooltip:"Détails",beta:"Données bêta · disponibilité en jeu non garantie",classicNote:"Les références Classic ne sont pas confirmées sur Forever",name:"Objet / ID",level:"Niveau d’objet",required:"Requis",filter:"Base",link:"Autres objets Forever ↗"};
const levels=["common","uncommon","rare","epic","legendary"];
const labels=en?["Common","Uncommon","Rare","Epic","Legendary"]:["Commun","Inhabituel","Rare","Épique","Légendaire"];
const colors={poor:"#9d9d9d",common:"#efeee9",uncommon:"#43bf66",rare:"#4c9df1",epic:"#b67cff",legendary:"#ffac46"};
const slotLabels=en?{head:"Head",neck:"Neck",shoulders:"Shoulders",back:"Back",chest:"Chest",wrist:"Wrists",hands:"Hands",waist:"Waist",legs:"Legs",feet:"Feet",finger1:"Rings",trinket1:"Trinkets",mainhand:"Weapons",offhand:"Off hand",ranged:"Ranged / relic"}:{head:"Tête",neck:"Cou",shoulders:"Épaules",back:"Dos",chest:"Torse",wrist:"Poignets",hands:"Mains",waist:"Taille",legs:"Jambes",feet:"Pieds",finger1:"Anneaux",trinket1:"Bijoux",mainhand:"Armes",offhand:"Main gauche",ranged:"Distance / relique"};
let classic=[],local=[],forever=[],observed=[],selection=new Set(),status="beta30",key="",cursor=null,more=false,loading=false,error="",total=null,visibleLimit=200,sortKey="itemLevel",sortDirection="desc";
const rowText=(row,value)=>{const cell=document.createElement("td");cell.textContent=String(value??"—");row.append(cell);return cell};

/* On-demand item acquisition links: documentary Forever first, Classic fallback.
   An indexed relation is not proof of in-game sale, drop, or craft. */
let sourcePromise=null,sourceIndex=null,expandedRow=null,expandedButton=null;
let renderedItems=new Map();
const acquisitionLabels=en?{
 button:"Where to find",loading:"Loading acquisition references…",
 empty:"No indexed seller, boss, rare or recipe for this item. ",
 failure:"Acquisition references unavailable.",warning:"Catalogue cross-references only; Forever beta drops/sales and Classic leads are not independently verified here.",
 reference:"Reference ↗",close:"Hide sources",kind:{merchant:"Vendor",rare:"Rare",boss:"Boss",recipe:"Recipe"},
 levels:{documented_forever:"Forever · documented",datamined:"Forever · client",confirmed_in_game:"Forever · in-game",classic_reference:"Classic · indicative",unverified:"Unverified"}
}:{
 button:"Où l'obtenir",loading:"Chargement des références d’obtention…",
 empty:"Aucun marchand, boss, rare ou recette indexé pour cet objet. ",
 failure:"Références d’obtention indisponibles.",warning:"Liens issus des catalogues : les ventes et butins bêta Forever ou les pistes Classic ne sont pas vérifiés indépendamment ici.",
 reference:"Référence ↗",close:"Masquer les sources",kind:{merchant:"Marchand",rare:"Rare",boss:"Boss",recipe:"Recette"},
 levels:{documented_forever:"Forever · documenté",datamined:"Forever · client",confirmed_in_game:"Forever · en jeu",classic_reference:"Classic · indicatif",unverified:"Non vérifié"}
};
function loadAcquisitionIndex(){
 if(!sourcePromise)sourcePromise=fetch("/data/item-acquisition-index.json?v=20261014-1",{credentials:"omit"})
  .then(r=>{if(!r.ok)throw Error("Acquisition HTTP "+r.status);return r.json()})
  .then(db=>{
   if(db.schema_version!==1||!Array.isArray(db.items))throw Error("Invalid acquisition index");
   sourceIndex=new Map(db.items.map(x=>[x.id,Array.isArray(x.sources)?x.sources:[]]));
   return sourceIndex;
  }).catch(e=>{sourcePromise=null;throw e});
 return sourcePromise;
}
// An item page / Classic loot table is not proof of its Forever drop rate.
const sourceTypeName=en?{boss:"Boss",rare:"Rare patrol",event:"Event",chest:"Chest",quest:"Quest",craft:"Craft",world_drop:"World drop",legendary:"Legendary"}:{boss:"Boss",rare:"Patrouille rare",event:"Événement",chest:"Coffre",quest:"Quête",craft:"Fabrication",world_drop:"Butin mondial",legendary:"Légendaire"};
const classicRate=source=>Number.isFinite(source.classic_drop_chance_percent)&&source.kind!=="quest"
 ?String(source.classic_drop_chance_percent).replace(".",en?".":",")+" % Classic"+(source.conditional?(en?" · conditional":" · conditionnel"):""):"";
const communityRate=source=>Number.isFinite(source.community_reported_chance_percent)&&source.kind!=="quest"
 ?String(source.community_reported_chance_percent).replace(".",en?".":",")+" % "+(en?"community source":"source tierce indicative"):"";
const sourceRate=source=>classicRate(source)||communityRate(source);
function curatedSources(item){
 return Array.isArray(item.acquisition_sources)?item.acquisition_sources.filter(x=>
  x&&["classic_reference","documented_forever"].includes(x.evidence_level)&&["boss","rare","event","chest","quest","craft","world_drop","legendary"].includes(x.kind)&&
  typeof x.name_en==="string"&&x.name_en.length>0&&
  typeof x.source_url==="string"&&x.source_url.startsWith("https://")
 ):[];
}
const sourceName=s=>en?s.name_en:(s.name_fr||s.name_en);
const sourcePlace=s=>en?s.location_en:(s.location_fr||s.location_en);
function appendCuratedSources(region,records){
 if(!records.length)return;
 const list=document.createElement("ul");list.className="item-acquisition-links";
 for(const rec of records){
  const line=document.createElement("li"),name=document.createElement("span");
  const evidenceType=rec.evidence_level==="documented_forever"?(en?"Forever · client documented":"Forever · client documenté"):"Classic";
  name.textContent=[sourceTypeName[rec.kind]+" · "+sourceName(rec),sourcePlace(rec),rec.faction,sourceRate(rec),evidenceType].filter(Boolean).join(" · ");
  const recipe=en?rec.recipe_source_en:(rec.recipe_source_fr||rec.recipe_source_en);
  const details=en?rec.detail_en:(rec.detail_fr||rec.detail_en);
  if(recipe){const extra=document.createElement("small");extra.className="item-acquisition-extra";extra.textContent=recipe;name.append(extra)}
  if(details){const extra=document.createElement("small");extra.className="item-acquisition-extra";extra.textContent=details;name.append(extra)}
  const link=document.createElement("a");link.className="item-acquisition-reference";link.href=rec.source_url;
  link.target="_blank";link.rel="noopener noreferrer";link.textContent=acquisitionLabels.reference;
  line.append(name,link);list.append(line);
 }
 region.append(list);
 const note=document.createElement("p");note.className="source-note item-acquisition-footnote";
 note.textContent=en
  ?"Classic rates are historical references. Community estimates are not validated Forever drop probabilities. Crafting recipes do not guarantee live availability."
  :"Les taux Classic sont historiques ; les estimations de sources tierces ne sont pas des probabilités de butin Forever vérifiées. Les recettes du client ne garantissent pas leur disponibilité en jeu.";
 region.append(note);
}

// The common source index covers curated, archived and beta items by numeric ID.
// It supplies navigation and evidence status only; it never supplies drop odds.
const evidenceRank={confirmed_in_game:0,documented_forever:1,datamined:2,classic_reference:3};
const sourceRank={boss:0,rare:1,recipe:2,merchant:3};
function indexedSources(item){
 if(item.suppress_indexed_source)return [];
 return (sourceIndex?.get(item.id)||[]).filter(source=>
  source&&Object.hasOwn(evidenceRank,source.evidence_level)&&
  Object.hasOwn(sourceRank,source.kind)&&
  typeof source.name_en==="string"&&source.name_en.trim()&&
  typeof source.href==="string"&&/^\/(marchands|rare|donjons|metiers)\/\?/.test(source.href)
 ).sort((a,b)=>evidenceRank[a.evidence_level]-evidenceRank[b.evidence_level]
  ||sourceRank[a.kind]-sourceRank[b.kind]);
}
function firstSource(item){
 const curated=curatedSources(item);
 if(curated.length)return {record:curated[0],more:curated.length-1,indexed:false};
 const indexed=indexedSources(item);
 return indexed.length?{record:indexed[0],more:indexed.length-1,indexed:true}:null;
}
function sourceHintText(item){
 const choice=firstSource(item);
 if(!choice)return "";
 const s=choice.record;
 if(!choice.indexed)
  return [sourceTypeName[s.kind]+" · "+sourceName(s),sourceRate(s),
   s.evidence_level==="documented_forever"?(en?"Forever · client":"Forever · client"):"Classic",
   choice.more>0?"+"+choice.more:null].filter(Boolean).join(" · ");
 const status=s.evidence_level==="classic_reference"?"Classic"
  :s.evidence_level==="confirmed_in_game"?(en?"Forever · in-game":"Forever · en jeu")
  :s.evidence_level==="documented_forever"?(en?"Forever · documented":"Forever · documenté")
  :(en?"Forever · client":"Forever · client");
 return [(acquisitionLabels.kind[s.kind]||s.kind)+" · "+(en?s.name_en:(s.name_fr||s.name_en)),
  status,choice.more>0?"+"+choice.more:null].filter(Boolean).join(" · ");
}
function updateOriginHint(cell,item){
 cell.querySelector(".item-acquisition-inline")?.remove();
 const text=sourceHintText(item);
 if(!text)return;
 const hint=document.createElement("span");hint.className="item-acquisition-inline";hint.textContent=text;
 cell.append(hint);
}
function refreshOriginHints(){
 for(const [id,entry] of renderedItems){
  if(entry.cell.isConnected)updateOriginHint(entry.cell,entry.item);
 }
}

function clearAcquisitionRow(){
 if(expandedRow){expandedRow.remove();expandedRow=null}
 if(expandedButton){expandedButton.setAttribute("aria-expanded","false");expandedButton=null}
}
async function toggleAcquisition(item,row,button){
 if(expandedButton===button){clearAcquisitionRow();button.focus();return}
 clearAcquisitionRow();
 const detailRow=document.createElement("tr");detailRow.className="item-acquisition-row";
 detailRow.id="item-acquisition-"+item.id;
 const cell=document.createElement("td");cell.colSpan=5;detailRow.append(cell);
 const region=document.createElement("div");region.className="item-acquisition-panel";cell.append(region);
 const localSources=curatedSources(item);appendCuratedSources(region,localSources);
 // An item may be documented in the beta client without a proven means of
 // obtaining it. The evidence link verifies its tooltip, NOT a drop source.
 const unknownAcquisition=item.acquisition_status==="unknown"
  ?(en?item.acquisition_note_en:item.acquisition_note_fr):null;
 if(typeof unknownAcquisition==="string"&&unknownAcquisition.trim()){
  const notice=document.createElement("p");notice.className="source-note item-acquisition-footnote";
  notice.textContent=unknownAcquisition;region.append(notice);
  if(typeof item.evidence_url==="string"&&/^https:\/\/[^\s/]+\//.test(item.evidence_url)){
   const evidence=document.createElement("a");evidence.className="item-acquisition-reference";
   evidence.href=item.evidence_url;evidence.target="_blank";evidence.rel="noopener noreferrer";
   evidence.textContent=en?"Beta item data ↗":"Fiche de l’objet bêta ↗";region.append(evidence);
  }
 }
 const disputedRate=item.rate_conflict&&(en?item.rate_conflict.note_en:item.rate_conflict.note_fr);
 const disputedSource=en?item.source_discrepancy_en:item.source_discrepancy_fr;
 const disputedPatrol=en?item.acquisition_conflict_note_en:item.acquisition_conflict_note_fr;
 if(disputedRate||disputedSource||disputedPatrol){
  const warning=document.createElement("p");warning.className="source-note item-acquisition-footnote";
  warning.textContent=disputedRate||disputedSource||disputedPatrol;region.append(warning);
 }
 const statusNode=document.createElement("p");statusNode.textContent=acquisitionLabels.loading;statusNode.setAttribute("role","status");region.append(statusNode);
 row.after(detailRow);expandedRow=detailRow;expandedButton=button;
 button.setAttribute("aria-expanded","true");
 button.setAttribute("aria-controls",detailRow.id);
 try{
  const lookup=await loadAcquisitionIndex();
  if(!detailRow.isConnected||expandedRow!==detailRow)return;
  const matches=item.suppress_indexed_source?[]:(lookup.get(item.id)||[]).filter(s=>s.evidence_level!=="unverified");
  statusNode.remove();
  if(!matches.length){
   if(!localSources.length&&!unknownAcquisition){const empty=document.createElement("p");empty.textContent=acquisitionLabels.empty;region.append(empty)}
   return;
  }
  const list=document.createElement("ul");list.className="item-acquisition-links";
  for(const s of matches){
   if(!/^\/(marchands|rare|donjons|metiers)\//.test(s.href||""))continue;
   const entry=document.createElement("li"),primary=document.createElement("a");
   primary.href=s.href;primary.textContent=(acquisitionLabels.kind[s.kind]||s.kind)+" · "+(en?s.name_en:s.name_fr||s.name_en)+(s.context_en?" · "+(en?s.context_en:s.context_fr||s.context_en):"");
   entry.append(primary);
   const status=document.createElement("span");status.className="item-acquisition-status";status.dataset.evidence=s.evidence_level;
   status.textContent=s.evidence_level==="classic_reference"?"Classic":"Forever";entry.append(status);
   if(typeof s.reference_url==="string"&&/^https:\/\/[^\s/]+\//.test(s.reference_url)){
    const ref=document.createElement("a");ref.className="item-acquisition-reference";ref.href=s.reference_url;
    ref.target="_blank";ref.rel="noopener noreferrer";ref.textContent=acquisitionLabels.reference;entry.append(ref);
   }
   list.append(entry);
  }
  region.append(list);
 }catch{
  if(detailRow.isConnected&&expandedRow===detailRow){
   if(localSources.length||unknownAcquisition)statusNode.remove();
   else statusNode.textContent=acquisitionLabels.failure;
  }
 }
}

function normalizeLocal(i){const x={...i,slot:service.LABELS[i.slot]||i.slot,source_status:i.source_status||"classic_reference"};return window.ForeverItemLocale?.record(x)||x}
function sourceType(item){return typeof item.source_status==="string"&&item.source_status.startsWith("forever_beta_")?"forever":"classic"}
const scopeLabels=en?{
 scope:"Catalogue",beta30:"Levels 1–30",betaOther:"Other beta records",classicOnly:"Classic references",allSources:"All sources",
 betaNote:"Beta-client data is not proof an item is obtainable. Filtered by required level; unknown requirements appear under Other beta records.",
 beyondNote:"Beta records beyond level 30 or with unknown required level. In-game availability is unconfirmed.",
 classicNote:"Classic-only references: presence on Forever unverified. Missing beta data does not mean removed.",
 allNote:"Beta records and unverified Classic references are mixed here. Check the source of each item.",
 betaBadge:"Beta · client",observedBadge:"Beta · reported loot",questBadge:"Beta · reported quest reward",classicBadge:"Classic · unverified"
}:{
 scope:"Catalogue",beta30:"Niveaux 1–30",betaOther:"Autres données bêta",classicOnly:"Références Classic",allSources:"Toutes les sources",
 betaNote:"Présent dans les données bêta ≠ obtenable en jeu. Filtre sur le niveau requis ; les niveaux inconnus figurent dans « Autres données bêta ».",
 beyondNote:"Données bêta au-delà du niveau 30 ou niveau requis inconnu. Disponibilité en jeu non confirmée.",
 classicNote:"Références Classic non vérifiées sur Forever. Absence des données bêta ≠ objet supprimé.",
 allNote:"Les données bêta et les références Classic non vérifiées sont réunies ici. Vérifiez la provenance de chaque objet.",
 betaBadge:"Bêta · client",observedBadge:"Bêta · butin signalé",questBadge:"Bêta · récompense de quête signalée",classicBadge:"Classic · non vérifié"
};
function provenanceBadge(item){return sourceType(item)==="forever"?"Forever":"Classic";}
function betaLevel30(item){
 const n=item.requiredLevel??item.required_level;
 if(n===0||n==="0")return true;
 const value=Number(n);
 return n!==null&&n!==undefined&&n!==""&&Number.isFinite(value)&&value>0&&value<=30;
}
function precedence(item){
 if(item.source_status==="forever_beta_observed")return 5;
 if(item.source_status==="forever_beta_client_present"||item.source_status==="forever_beta_client_new"||item.source_status==="forever_beta_client")return 4;
 if(item.source_status==="forever_beta_60tools"||item.source_status==="forever_beta_wowhead")return 3;
 if(sourceType(item)==="forever")return 2;
 return 0;
}
const validImage=i=>typeof i==="string"&&(/^[a-z0-9_-]{2,70}$/.test(i)||i.startsWith("https://wowdb.assemblee-defias.fr/database-icons/"));
const genericSlotIcons={head:"inv_helmet_06",neck:"inv_jewelry_necklace_07",shoulders:"inv_shoulder_07",back:"inv_misc_cape_10",chest:"inv_chest_cloth_07",wrist:"inv_bracer_07",hands:"inv_gauntlets_04",waist:"inv_belt_10",legs:"inv_pants_07",feet:"inv_boots_07",finger1:"inv_jewelry_ring_03",finger2:"inv_jewelry_ring_15",trinket1:"inv_jewelry_talisman_05",trinket2:"inv_jewelry_talisman_06",mainhand:"inv_sword_04",offhand:"inv_shield_05",ranged:"inv_weapon_bow_07"};
function imageUrl(i){if(i&&typeof i.icon==="string"&&i.icon.startsWith("https://wowdb.assemblee-defias.fr/database-icons/"))return i.icon;
const icon=i&&validImage(i.icon)?i.icon:genericSlotIcons[i?.slot];
return icon?"/assets/icons/"+icon+".jpg":null}

function catalogItems(){
 const byID=new Map();
 for(const i of [...classic,...local,...forever,...observed]){
  if(i.quality==="poor"||!Number.isInteger(i.id))continue;
  const prev=byID.get(i.id);
  if(!prev||precedence(i)>precedence(prev)){
   // Preserve an icon or armor classification from an earlier Forever source;
   // a reported boss drop often has richer acquisition data but no icon field.
   const known=Object.fromEntries(Object.entries(i).filter(([,value])=>value!==null&&value!==undefined&&value!==""&&(!Array.isArray(value)||value.length)));
   byID.set(i.id,{...prev,...known,icon:i.icon||prev?.icon,armorType:i.armorType??prev?.armorType});
  }
 }
 return [...byID.values()];
}
function matchesBase(item){
 if(item.quality==="poor")return false;
 const kind=sourceType(item);
 if(status==="beta30"&&!betaLevel30(item))return false;
 if(status==="betaOther"&&(kind!=="forever"||betaLevel30(item)))return false;
 if(status==="classic"&&kind!=="classic")return false;
 if(slot.value!=="all"&&!service.compatible(item.slot,slot.value))return false;
 if(armor.value!=="all"&&window.ForeverEquipmentRules?.armorType(item)!==armor.value)return false;
 const q=search.value.trim().toLocaleLowerCase();
 const references=curatedSources(item).map(x=>[x.name_en,x.name_fr,x.location_en,x.location_fr,x.recipe_source_en,x.recipe_source_fr].filter(Boolean).join(" ")).join(" ")
  +" "+indexedSources(item).map(x=>[x.name_en,x.name_fr,x.context_en,x.context_fr].filter(Boolean).join(" ")).join(" ");
 return !q||String(item.id)===q||((window.ForeverItemLocale?.aliases(item)||item.name)+" "+(item.origin||"")+" "+displayOrigin(item.origin||"")+" "+references).toLocaleLowerCase().includes(q);
}
function matches(item){return matchesBase(item)&&(!selection.size||selection.has(item.quality))}
function drawQuality(){
 chips.replaceChildren();
 function control(quality,label){
  const active=quality==="all"?!selection.size:selection.has(quality);
  const btn=document.createElement("button");btn.type="button";
  btn.className="bis-v2-quality"+(active?" active":"");
  btn.dataset.quality=quality;
  btn.setAttribute("aria-pressed",String(active));
  if(quality!=="all")btn.style.setProperty("--rarity",colors[quality]);
  const name=document.createElement("span");name.textContent=label;btn.append(name);
  btn.addEventListener("click",()=>{
   if(quality==="all")selection.clear();
   else if(selection.has(quality))selection.delete(quality);
   else selection.add(quality);
   queue();render();
   chips.querySelector('[data-quality="'+quality+'"]')?.focus();
  });
  chips.append(btn);
 }
 control("all",tr.all);
 levels.forEach((quality,n)=>control(quality,labels[n]));
}
function numericLevel(item,field){
 const raw=field==="itemLevel"?(item.itemLevel??item.level):(item.requiredLevel??item.required_level);
 const value=Number(raw);
 return raw!==null&&raw!==undefined&&raw!==""&&Number.isFinite(value)&&value>0?value:null;
}
function compareItems(a,b){
 const av=numericLevel(a,sortKey),bv=numericLevel(b,sortKey);
 if(av===null&&bv!==null)return 1;
 if(av!==null&&bv===null)return -1;
 if(av!==null&&bv!==null&&av!==bv)return sortDirection==="desc"?bv-av:av-bv;
 return Number(sourceType(b)==="forever")-Number(sourceType(a)==="forever")||a.name.localeCompare(b.name);
}
function updateSortHeaders(){
 document.querySelectorAll(".item-catalogue-sort").forEach(button=>{
  const active=button.dataset.sort===sortKey;
  button.closest("th")?.setAttribute("aria-sort",active?(sortDirection==="desc"?"descending":"ascending"):"none");
  const icon=button.querySelector(".item-catalogue-sort-indicator");
  if(icon)icon.textContent=active?(sortDirection==="desc"?"↓":"↑"):"↕";
  button.title=active
   ?(en?"Reverse sort order":"Inverser le sens du tri")
   :(en?"Sort by this level":"Trier selon ce niveau");
 });
}
function render(){
 clearAcquisitionRow();
 const items=catalogItems();
 drawQuality();
 const rows=items.filter(matches).sort(compareItems);
 updateSortHeaders();
 table.replaceChildren();renderedItems=new Map();
 count.textContent=rows.length+" "+(rows.length===1?tr.item:tr.items)+(total!==null&&(status==="all"||status==="classic")?" · "+total.toLocaleString(en?"en":"fr")+" Classic ("+tr.loaded+" : "+classic.length+")":"");
 if(!rows.length){const line=document.createElement("tr");rowText(line,loading?tr.loading:tr.noresult).colSpan=5;table.append(line)}
 for(const i of rows.slice(0,visibleLimit)){const row=document.createElement("tr"),name=rowText(row,"");name.className="item-v2-name";const imgSrc=imageUrl(i);
 if(imgSrc){const pic=document.createElement("img");pic.className="result-icon item-v2-icon";pic.src=imgSrc;pic.alt="";pic.loading="lazy";if(!i.icon)pic.title=en?"Illustrative slot icon":"Icône illustrative d’emplacement";pic.onerror=()=>{if(!pic.dataset.iconFallback&&/^[a-z0-9_-]{2,70}$/.test(i.icon||"")){pic.dataset.iconFallback="1";pic.src="https://wow.zamimg.com/images/wow/icons/medium/"+i.icon+".jpg"}else pic.remove()};name.append(pic)}
 const display=document.createElement("span");display.className="item-v2-label";display.style.setProperty("--rarity",colors[i.quality]||"#d7d7d7");
 const href=(typeof i.url==="string"&&(i.url.startsWith("https://www.wowhead.com/forever/")||i.url.startsWith("https://wowdb.assemblee-defias.fr/")||i.url.startsWith("https://www.60.tools/items/")))?i.url:null;
 const anchor=document.createElement(href?"a":"span");if(href){anchor.href=href;anchor.target="_blank";anchor.rel="noopener noreferrer"}anchor.textContent=i.name;display.append(anchor);name.append(display);
 const tag=document.createElement("span");tag.className="item-v3-provenance "+(sourceType(i)==="forever"?"forever":"classic");tag.textContent=provenanceBadge(i);name.append(tag);
 const detail=document.createElement("button");detail.type="button";detail.className="bis-v2-info-button item-v2-info";detail.textContent="ⓘ";detail.setAttribute("aria-label",tr.tooltip+" "+i.name);detail.addEventListener("click",()=>window.ForeverItemTooltip?.pin(i));name.append(detail);
 const acquire=document.createElement("button");acquire.type="button";acquire.className="item-acquisition-toggle";
 acquire.textContent=acquisitionLabels.button;
 acquire.setAttribute("aria-label",acquisitionLabels.button+" : "+i.name);
 acquire.setAttribute("aria-expanded","false");
 acquire.addEventListener("click",()=>toggleAcquisition(i,row,acquire));name.append(acquire);
 rowText(row,slotLabels[i.slot]||i.slot);
 rowText(row,numericLevel(i,"itemLevel")??"—").className="item-catalogue-numeric";
 rowText(row,numericLevel(i,"requiredLevel")??"—").className="item-catalogue-numeric";
 const originCell=rowText(row,(en&&i.origin_en?i.origin_en:displayOrigin(i.origin))|| (sourceType(i)==="forever"?tr.badgeForever:tr.badgeClassic));
 originCell.className="item-catalogue-origin";
 updateOriginHint(originCell,i);
 renderedItems.set(i.id,{item:i,cell:originCell});
 table.append(row);
 window.ForeverItemTooltip?.bind(row,i);
 }
 if(loading)notice.textContent=tr.loading;else if(error)notice.textContent=error;else notice.textContent=(Math.min(rows.length,visibleLimit)+" / "+rows.length+" "+tr.shown);
 localMore.hidden=rows.length<=visibleLimit;localMore.textContent=tr.showMore;
 moreButton.hidden=!(status==="classic"||status==="all")||loading||(classic.length>0&&!more&&!error);moreButton.disabled=loading;moreButton.textContent=classic.length>0&&more?tr.load:tr.browse;
}
function signature(){return JSON.stringify([status,slot.value,armor.value,search.value.trim().toLowerCase(),[...selection].sort()])}
async function queryClassic(expected,append=false){
 if(!(status==="classic"||status==="all")||loading)return;
 loading=true;render();
 try{
  const q=search.value.trim(),numeric=/^\d{1,8}$/.test(q)?Number(q):null;
  let result;
  if(numeric){const direct=await service.itemById(numeric);result={items:direct?[direct]:[],hasMore:false,cursor:null,count:null}}
  else result=await service.loadClassic({slot:slot.value,query:q,qualities:selection.size?[...selection]:levels,types:armor.value==="all"?[]:[armor.value],cursor:append?cursor:null});
  if(expected!==key)return;
  classic=append?[...classic,...result.items.filter(i=>!classic.some(old=>old.id===i.id))]:result.items;
  more=result.hasMore;cursor=result.cursor;total=result.count;error="";
 }catch(e){if(expected!==key)return;error=tr.unavailable;more=false}
 finally{loading=false;if(expected===key)render()}
}
function queue(){
 const current=signature();if(current===key)return;
 key=current;classic=[];more=false;cursor=null;total=null;error="";loading=false;visibleLimit=200;
}

document.querySelectorAll(".item-catalogue-sort").forEach(button=>button.addEventListener("click",()=>{
 const field=button.dataset.sort;
 if(field!== "itemLevel"&&field!== "requiredLevel")return;
 if(sortKey===field)sortDirection=sortDirection==="desc"?"asc":"desc";
 else{sortKey=field;sortDirection="desc"}
 render();
}));
const control=document.createElement("label");control.className="item-v3-source-filter";control.textContent=scopeLabels.scope+" ";
const select=document.createElement("select");select.id="item-source";select.setAttribute("aria-label",scopeLabels.scope);
for(const [value,label] of [["beta30",scopeLabels.beta30],["betaOther",scopeLabels.betaOther],["classic",scopeLabels.classicOnly],["all",scopeLabels.allSources]]){const opt=document.createElement("option");opt.value=value;opt.textContent=label;select.append(opt)}
if(linkedQuery){status="all";select.value="all";}
control.append(select);document.querySelector(".item-catalogue-filter-fields")?.append(control);
const notice=document.createElement("p");notice.className="item-v3-live-note";notice.setAttribute("aria-live","polite");
const localMore=document.createElement("button");localMore.className="bis-v2-more item-v3-load";localMore.type="button";localMore.hidden=true;localMore.addEventListener("click",()=>{visibleLimit+=200;render()});
const moreButton=document.createElement("button");moreButton.className="bis-v2-more item-v3-load";moreButton.type="button";moreButton.textContent=tr.load;
const actions=document.createElement("div");actions.className="item-v3-paging";actions.append(localMore,moreButton,notice);
table.closest(".result-table-wrap")?.after(actions);
moreButton.addEventListener("click",()=>{moreButton.disabled=true;queryClassic(key,classic.length>0&&more)});
select.addEventListener("change",()=>{status=select.value;queue();render()});
search.addEventListener("input",()=>{queue();render()});slot.addEventListener("change",()=>{queue();render()});armor.addEventListener("change",()=>{queue();render()});

// T0 set bonuses are deliberately separate from Classic item tooltips:
// the level-60 tab shows the Forever client data without replacing item stats.
const t0Root=document.createElement("details");t0Root.className="item-t0-sets";
const t0Summary=document.createElement("summary");
t0Summary.textContent=en?"T0 sets · Level 60 · Forever bonuses":"Ensembles T0 · Niveau 60 · Bonus Forever";
const t0Body=document.createElement("div");t0Body.className="item-t0-sets__body";
t0Root.append(t0Summary,t0Body);
document.querySelector(".tool-head")?.after(t0Root);
let t0Loaded=false,t0Loading=false;
const t0Node=(tag,cls,value)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined)node.textContent=String(value);return node;};
t0Root.addEventListener("toggle",async()=>{
 if(!t0Root.open||t0Loaded||t0Loading)return;
 t0Loading=true;
 t0Body.replaceChildren(t0Node("p","source-note",en?"Loading set bonuses…":"Chargement des bonus…"));
 try{
  const response=await fetch("/data/t0-set-bonuses-forever.json?v=20261018-piece-links",{credentials:"omit"});
  if(!response.ok)throw Error("T0 HTTP "+response.status);
  const data=await response.json();
  if(!Array.isArray(data.sets)||data.sets.length!==9)throw Error("Invalid T0 data");
  const group=t0Node("div","item-t0-sets__grid");
  for(const set of data.sets){
   if(!Number.isInteger(set.id)||!Array.isArray(set.bonuses)||!set.bonuses.length)continue;
   const card=document.createElement("details");card.className="item-t0-sets__card";
   const header=document.createElement("summary");
   header.append(t0Node("strong","",set.name_en),t0Node("span","item-t0-sets__class",en?set.class_en:set.class_fr));
   card.append(header);
   const bonuses=t0Node("ul","item-t0-sets__bonuses");
   for(const bonus of set.bonuses){
    if(!Number.isInteger(bonus.pieces)||bonus.pieces<2||bonus.pieces>8)continue;
    const entry=document.createElement("li");
    entry.append(t0Node("b","",String(bonus.pieces)),t0Node("span","",en?bonus.en:bonus.fr));
    bonuses.append(entry);
   }
   card.append(bonuses);
   if(Array.isArray(set.pieces_en)&&set.pieces_en.length===8){
    const pieces=t0Node("p","item-t0-sets__pieces");
    pieces.append(t0Node("b","",en?"8 pieces: ":"8 pièces : "));
    set.pieces_en.forEach((name,i)=>{
     if(i)pieces.append(document.createTextNode(" · "));
     const record=Array.isArray(set.pieces)?set.pieces[i]:null;
     if(record&&Number.isSafeInteger(record.id)&&record.name_en===name&&record.url==="https://foreverdb.net/item/"+record.id){
      const link=t0Node("a","item-t0-sets__piece-link",name);
      link.href=record.url;link.target="_blank";link.rel="noopener noreferrer";
      pieces.append(link);
     }else pieces.append(document.createTextNode(name));
    });
    card.append(pieces);
   }
   const link=t0Node("a","item-t0-sets__source",en?"ForeverDB source ↗":"Source ForeverDB ↗");
   link.href="https://foreverdb.net/set/"+set.id;link.target="_blank";link.rel="noopener noreferrer";
   card.append(link);group.append(card);
  }
  t0Body.replaceChildren(t0Node("p","item-t0-sets__intro",en?"Set bonuses extracted from the Forever beta client.":"Bonus issus des données du client bêta Forever."),group);
  t0Loaded=true;
 }catch(error){t0Body.replaceChildren(t0Node("p","source-note",en?"Set bonuses currently unavailable. Close and reopen to retry.":"Bonus momentanément indisponibles. Refermez et réouvrez pour réessayer."));}
 finally{t0Loading=false;}
});

const options=[...slot.options];slot.replaceChildren(options[0]);
for(const [id,label] of Object.entries(slotLabels)){const o=document.createElement("option");o.value=id;o.textContent=label;slot.append(o)}
(async()=>{
 try{
 const [catalog,archive,observations,seed,leveling,dungeonAudit]=await Promise.all([
 fetch("/data/items.json",{credentials:"omit"}).then(r=>r.ok?r.json():{items:[]}).catch(()=>({items:[]})),
 fetch("/data/items-classic-cache.json?v=20261010-1",{credentials:"omit"}).then(r=>r.ok?r.json():{items:[]}).catch(()=>({items:[]})),
 fetch("/data/bis-niveaux-forever-observed.json?v=20261010-1",{credentials:"omit"}).then(r=>r.ok?r.json():{items:[]}).catch(()=>({items:[]})),
 service.loadForever(),
 fetch("/data/bis-niveaux-classic.json?v=20261019-source-index",{credentials:"omit"}).then(r=>r.ok?r.json():{items:[]}).catch(()=>({items:[]})),
 fetch("/data/dungeon-gear-audit-20261019.json?v=20261019-all82",{credentials:"omit"}).then(r=>r.ok?r.json():{items:[]}).catch(()=>({items:[]}))
 ]);
 local=[...(Array.isArray(catalog.items)?catalog.items.filter(i=>i.verified===true&&Number.isInteger(i.id)):[]),
  ...(Array.isArray(leveling.items)?leveling.items.filter(i=>Number.isInteger(i.id)&&i.id>0&&i.source_status==="classic_curated_leveling"):[]),
  ...(Array.isArray(archive.items)?archive.items.filter(i=>i.verified===true&&Number.isInteger(i.id)):[])].map(normalizeLocal);
 // The dungeon audit explicitly quarantines records missing independently reviewed
 // Forever beta-server metadata: do not infer qualities, stats or drop percentages.
 const dungeonVetted=Array.isArray(dungeonAudit.items)?dungeonAudit.items.filter(i=>
  i.audit_status==="ready_for_catalogue"&&
  ((i.source_status==="forever_beta_server_reported"&&i.observed_build==="70058")
   ||(i.source_status==="forever_beta_community_item_page"&&/^1[.]60[.]1[.]70[0-9]+$/.test(i.observed_build||"")))&&
  i.evidence_level==="documented_forever"&&Number.isSafeInteger(i.id)&&i.id>0&&
  typeof i.name==="string"&&["common","uncommon","rare"].includes(i.quality)&&
  Number.isSafeInteger(i.itemLevel)&&i.itemLevel>0&&
  Number.isSafeInteger(i.requiredLevel)&&i.requiredLevel>0
 ): [];
 forever=[...seed,...dungeonVetted.map(normalizeLocal)];
 observed=(Array.isArray(observations.items)?observations.items:[]).filter(i=>Number.isInteger(i.id)&&i.id>0&&typeof i.name==="string"&&i.source_status==="forever_beta_observed").map(normalizeLocal);
 source.replaceChildren();source.append(document.createTextNode(en?"Sources: ":"Sources : "));
const aForever=document.createElement("a");aForever.href="https://www.wowhead.com/forever/items";aForever.target="_blank";aForever.rel="noopener noreferrer";aForever.textContent="Wowhead Forever";
const aClassic=document.createElement("a");aClassic.href="https://wowdb.assemblee-defias.fr/";aClassic.target="_blank";aClassic.rel="noopener noreferrer";aClassic.textContent="WoWDB des Défias";
const aObserved=document.createElement("a");aObserved.href="https://foreverchanges.pro/dungeons";aObserved.target="_blank";aObserved.rel="noopener noreferrer";aObserved.textContent="ForeverChanges";
source.append(aForever,document.createTextNode(" · "),aObserved,document.createTextNode(" · "),aClassic);
 }catch(e){error=tr.unavailable}
 queue();render();
 // Load once for direct boss / rare / merchant clues in archive rows.
 // Preserve any open source panel when the asynchronous lookup completes.
 loadAcquisitionIndex().then(()=>{
  if(search.value.trim()&&!expandedRow)render();
  else refreshOriginHints();
 }).catch(()=>{}); // unavailable index must never blank the equipment catalogue
})();
})();
