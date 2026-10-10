/* Equipment catalogue: Forever beta entries + paginated WoWDB Classic equipment. */
(()=>{"use strict";
const service=window.ForeverGearData;
const table=document.getElementById("item-results"),search=document.getElementById("item-search"),slot=document.getElementById("item-slot"),armor=document.getElementById("item-armor"),chips=document.getElementById("item-quality-filters"),count=document.getElementById("item-count"),source=document.getElementById("items-source");
if(!service||!table||!search||!slot||!armor||!chips)return;
const en=document.documentElement.lang==="en";
const originLabelsEN={"Forge":"Blacksmithing","Pic Blackrock":"Blackrock Spire","Profondeurs de Blackrock":"Blackrock Depths","Travail du cuir":"Leatherworking","Quête · Maleterres":"Quest · Plaguelands","Hache-tripes":"Dire Maul","Quête · Pic Blackrock":"Quest · Blackrock Spire","Couture · Mage":"Tailoring · Mage","Quête · Un'Goro":"Quest · Un'Goro","Butin mondial":"World drop","Couture · Prêtre":"Tailoring · Priest","Quête · Hache-tripes":"Quest · Dire Maul","Quête légendaire (référence Classic)":"Legendary quest (Classic reference)","Objet légendaire (référence Classic)":"Legendary item (Classic reference)","Forge (référence Classic)":"Blacksmithing (Classic reference)"};
const displayOrigin=s=>en?(originLabelsEN[s]||s):s;
const tr=en?{all:"All",forever:"Forever beta",classic:"Classic 1.12",loading:"Loading Classic items…",load:"Load 100 more Classic items",busy:"Loading…",unavailable:"External Classic search did not respond. The offline catalogue is still available.",browse:"Search more items online (Classic)",showMore:"Show 200 more items",shown:"shown",items:"items displayed",item:"item displayed",noresult:"No items match these filters.",badgeForever:"Forever beta",badgeClassic:"Classic",origin:"Source",quality:"Quality",loaded:"Loaded",tooltip:"Details",beta:"Beta data · in-game availability not guaranteed",classicNote:"Classic references are not confirmed Forever items",name:"Item / ID",level:"Item level",required:"Required",filter:"Database",link:"Other Forever references ↗"}:{all:"Tout",forever:"Forever bêta",classic:"Classic 1.12",loading:"Chargement des objets Classic…",load:"Charger 100 autres objets Classic",busy:"Chargement…",unavailable:"La recherche Classic externe n’a pas répondu. Le catalogue local reste disponible.",browse:"Rechercher d’autres objets en ligne (Classic)",showMore:"Afficher 200 objets supplémentaires",shown:"affichés",items:"objets affichés",item:"objet affiché",noresult:"Aucun résultat avec ces filtres.",badgeForever:"Forever bêta",badgeClassic:"Classic",origin:"Origine",quality:"Qualité",loaded:"Chargés",tooltip:"Détails",beta:"Données bêta · disponibilité en jeu non garantie",classicNote:"Les références Classic ne sont pas confirmées sur Forever",name:"Objet / ID",level:"Niveau d’objet",required:"Requis",filter:"Base",link:"Autres objets Forever ↗"};
const levels=["common","uncommon","rare","epic","legendary"];
const labels=en?["Common","Uncommon","Rare","Epic","Legendary"]:["Commun","Inhabituel","Rare","Épique","Légendaire"];
const colors={poor:"#9d9d9d",common:"#efeee9",uncommon:"#43bf66",rare:"#4c9df1",epic:"#b67cff",legendary:"#ffac46"};
const slotLabels=en?{head:"Head",neck:"Neck",shoulders:"Shoulders",back:"Back",chest:"Chest",wrist:"Wrists",hands:"Hands",waist:"Waist",legs:"Legs",feet:"Feet",finger1:"Rings",trinket1:"Trinkets",mainhand:"Weapons",offhand:"Off hand",ranged:"Ranged / relic"}:{head:"Tête",neck:"Cou",shoulders:"Épaules",back:"Dos",chest:"Torse",wrist:"Poignets",hands:"Mains",waist:"Taille",legs:"Jambes",feet:"Pieds",finger1:"Anneaux",trinket1:"Bijoux",mainhand:"Armes",offhand:"Main gauche",ranged:"Distance / relique"};
let classic=[],local=[],forever=[],selection=new Set(),status="all",key="",cursor=null,more=false,loading=false,error="",total=null,visibleLimit=200,sortKey="itemLevel",sortDirection="desc";
const rowText=(row,value)=>{const cell=document.createElement("td");cell.textContent=String(value??"—");row.append(cell);return cell};
function normalizeLocal(i){const x={...i,slot:service.LABELS[i.slot]||i.slot,source_status:i.source_status||"classic_reference"};return window.ForeverItemLocale?.record(x)||x}
function sourceType(item){return typeof item.source_status==="string"&&item.source_status.startsWith("forever_beta_")?"forever":"classic"}
const validImage=i=>typeof i==="string"&&(/^[a-z0-9_-]{2,70}$/.test(i)||i.startsWith("https://wowdb.assemblee-defias.fr/database-icons/"));
const genericSlotIcons={head:"inv_helmet_06",neck:"inv_jewelry_necklace_07",shoulders:"inv_shoulder_07",back:"inv_misc_cape_10",chest:"inv_chest_cloth_07",wrist:"inv_bracer_07",hands:"inv_gauntlets_04",waist:"inv_belt_10",legs:"inv_pants_07",feet:"inv_boots_07",finger1:"inv_jewelry_ring_03",finger2:"inv_jewelry_ring_15",trinket1:"inv_jewelry_talisman_05",trinket2:"inv_jewelry_talisman_06",mainhand:"inv_sword_04",offhand:"inv_shield_05",ranged:"inv_weapon_bow_07"};
function imageUrl(i){if(i&&typeof i.icon==="string"&&i.icon.startsWith("https://wowdb.assemblee-defias.fr/database-icons/"))return i.icon;
const icon=i&&validImage(i.icon)?i.icon:genericSlotIcons[i?.slot];
return icon?"/assets/icons/"+icon+".jpg":null}

function catalogItems(){
 const byID=new Map();
 for(const i of [...forever,...local,...classic]){
  if(i.quality==="poor")continue;
  if(!byID.has(i.id)||sourceType(i)==="forever")byID.set(i.id,i);
 }
 return [...byID.values()];
}
function matchesBase(item){
 if(item.quality==="poor")return false;
 if(status==="forever"&&sourceType(item)!=="forever"||status==="classic"&&sourceType(item)!=="classic")return false;
 if(slot.value!=="all"&&!service.compatible(item.slot,slot.value))return false;
 if(armor.value!=="all"&&window.ForeverEquipmentRules?.armorType(item)!==armor.value)return false;
 const q=search.value.trim().toLocaleLowerCase();
 return !q||String(item.id)===q||((window.ForeverItemLocale?.aliases(item)||item.name)+" "+(item.origin||"")+" "+displayOrigin(item.origin||"")).toLocaleLowerCase().includes(q);
}
function matches(item){return matchesBase(item)&&(!selection.size||selection.has(item.quality))}
function drawQuality(items){
 chips.replaceChildren();
 const group=items.filter(matchesBase);
 function control(quality,label,amount){
  const active=quality==="all"?!selection.size:selection.has(quality);
  const btn=document.createElement("button");btn.type="button";
  btn.className="bis-v2-quality"+(active?" active":"");
  btn.dataset.quality=quality;
  btn.setAttribute("aria-pressed",String(active));
  if(quality!=="all")btn.style.setProperty("--rarity",colors[quality]);
  const name=document.createElement("span");name.textContent=label;btn.append(name);
  if(quality!=="all"){
   const qty=document.createElement("span");qty.className="item-catalogue-quality-count";qty.textContent=amount.toLocaleString(en?"en":"fr");btn.append(qty);
  }
  btn.addEventListener("click",()=>{
   if(quality==="all")selection.clear();
   else if(selection.has(quality))selection.delete(quality);
   else selection.add(quality);
   queue();render();
   chips.querySelector('[data-quality="'+quality+'"]')?.focus();
  });
  chips.append(btn);
 }
 control("all",tr.all,group.length);
 levels.forEach((quality,n)=>control(quality,labels[n],group.filter(i=>i.quality===quality).length));
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
 const items=catalogItems();
 drawQuality(items);
 const rows=items.filter(matches).sort(compareItems);
 updateSortHeaders();
 table.replaceChildren();
 count.textContent=rows.length+" "+(rows.length===1?tr.item:tr.items)+(total!==null&&status!=="forever"?" · "+total.toLocaleString(en?"en":"fr")+" Classic ("+tr.loaded+" : "+classic.length+")":"");
 if(!rows.length){const line=document.createElement("tr");rowText(line,loading?tr.loading:tr.noresult).colSpan=5;table.append(line)}
 for(const i of rows.slice(0,visibleLimit)){const row=document.createElement("tr"),name=rowText(row,"");name.className="item-v2-name";const imgSrc=imageUrl(i);
 if(imgSrc){const pic=document.createElement("img");pic.className="result-icon item-v2-icon";pic.src=imgSrc;pic.alt="";pic.loading="lazy";if(!i.icon)pic.title=en?"Illustrative slot icon":"Icône illustrative d’emplacement";pic.onerror=()=>{if(!pic.dataset.iconFallback&&/^[a-z0-9_-]{2,70}$/.test(i.icon||"")){pic.dataset.iconFallback="1";pic.src="https://wow.zamimg.com/images/wow/icons/medium/"+i.icon+".jpg"}else pic.remove()};name.append(pic)}
 const display=document.createElement("span");display.className="item-v2-label";display.style.setProperty("--rarity",colors[i.quality]||"#d7d7d7");
 const href=(typeof i.url==="string"&&(i.url.startsWith("https://www.wowhead.com/forever/")||i.url.startsWith("https://wowdb.assemblee-defias.fr/")||i.url.startsWith("https://www.60.tools/items/")))?i.url:null;
 const anchor=document.createElement(href?"a":"span");if(href){anchor.href=href;anchor.target="_blank";anchor.rel="noopener noreferrer"}anchor.textContent=i.name;display.append(anchor);name.append(display);
 const tag=document.createElement("span");tag.className="item-v3-provenance "+(sourceType(i)==="forever"?"forever":"classic");tag.textContent=sourceType(i)==="forever"?tr.badgeForever:tr.badgeClassic;name.append(tag);
 const detail=document.createElement("button");detail.type="button";detail.className="bis-v2-info-button item-v2-info";detail.textContent="ⓘ";detail.setAttribute("aria-label",tr.tooltip+" "+i.name);detail.addEventListener("click",()=>window.ForeverItemTooltip?.pin(i));name.append(detail);
 rowText(row,slotLabels[i.slot]||i.slot);
 rowText(row,numericLevel(i,"itemLevel")??"—").className="item-catalogue-numeric";
 rowText(row,numericLevel(i,"requiredLevel")??"—").className="item-catalogue-numeric";
 rowText(row,displayOrigin(i.origin)|| (sourceType(i)==="forever"?tr.badgeForever:tr.badgeClassic));
 table.append(row);
 window.ForeverItemTooltip?.bind(row,i);
 }
 if(loading)notice.textContent=tr.loading;else if(error)notice.textContent=error;else notice.textContent=(Math.min(rows.length,visibleLimit)+" / "+rows.length+" "+tr.shown+" · ")+(status==="forever"?tr.beta:tr.classicNote);
 localMore.hidden=rows.length<=visibleLimit;localMore.textContent=tr.showMore;
 moreButton.hidden=status==="forever"||loading||(classic.length>0&&!more&&!error);moreButton.disabled=loading;moreButton.textContent=classic.length>0&&more?tr.load:tr.browse;
}
function signature(){return JSON.stringify([status,slot.value,armor.value,search.value.trim().toLowerCase(),[...selection].sort()])}
async function queryClassic(expected,append=false){
 if(status==="forever"||loading)return;
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
const control=document.createElement("label");control.className="item-v3-source-filter";control.textContent=tr.filter+" ";
const select=document.createElement("select");select.id="item-source";select.setAttribute("aria-label",tr.filter);
for(const [value,label] of [["all",tr.all],["forever",tr.forever],["classic",tr.classic]]){const opt=document.createElement("option");opt.value=value;opt.textContent=label;select.append(opt)}
control.append(select);document.querySelector(".item-catalogue-filter-fields")?.append(control);
const notice=document.createElement("p");notice.className="item-v3-live-note";notice.setAttribute("aria-live","polite");
const localMore=document.createElement("button");localMore.className="bis-v2-more item-v3-load";localMore.type="button";localMore.hidden=true;localMore.addEventListener("click",()=>{visibleLimit+=200;render()});
const moreButton=document.createElement("button");moreButton.className="bis-v2-more item-v3-load";moreButton.type="button";moreButton.textContent=tr.load;
const actions=document.createElement("div");actions.className="item-v3-paging";actions.append(localMore,moreButton,notice);
table.closest(".result-table-wrap")?.after(actions);
moreButton.addEventListener("click",()=>{moreButton.disabled=true;queryClassic(key,classic.length>0&&more)});
select.addEventListener("change",()=>{status=select.value;queue();render()});
search.addEventListener("input",()=>{queue();render()});slot.addEventListener("change",()=>{queue();render()});armor.addEventListener("change",()=>{queue();render()});
const options=[...slot.options];slot.replaceChildren(options[0]);
for(const [id,label] of Object.entries(slotLabels)){const o=document.createElement("option");o.value=id;o.textContent=label;slot.append(o)}
(async()=>{
 try{
 const [catalog,archive,seed]=await Promise.all([fetch("/data/items.json",{credentials:"omit"}).then(r=>r.json()),fetch("/data/items-classic-cache.json?v=20261010-1",{credentials:"omit"}).then(r=>r.json()).catch(()=>({items:[]})),service.loadForever()]);
 local=[...(Array.isArray(catalog.items)?catalog.items.filter(i=>i.verified===true&&Number.isInteger(i.id)):[]),...(Array.isArray(archive.items)?archive.items.filter(i=>i.verified===true&&Number.isInteger(i.id)):[])].map(normalizeLocal);
 forever=seed;source.replaceChildren();source.append(document.createTextNode(en?"Sources: ":"Sources : "));
const aForever=document.createElement("a");aForever.href="https://www.wowhead.com/forever/items";aForever.target="_blank";aForever.rel="noopener noreferrer";aForever.textContent="Wowhead Forever";
const aClassic=document.createElement("a");aClassic.href="https://wowdb.assemblee-defias.fr/";aClassic.target="_blank";aClassic.rel="noopener noreferrer";aClassic.textContent="WoWDB des Défias";
source.append(aForever,document.createTextNode(" · "),aClassic,document.createTextNode(" · "+tr.beta));
 }catch(e){error=tr.unavailable}
 queue();render();
})();
})();