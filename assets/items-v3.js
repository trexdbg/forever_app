/* Equipment catalogue: Forever beta entries + paginated WoWDB Classic equipment. */
(()=>{"use strict";
const service=window.ForeverGearData;
const table=document.getElementById("item-results"),search=document.getElementById("item-search"),slot=document.getElementById("item-slot"),chips=document.getElementById("item-quality-filters"),count=document.getElementById("item-count"),source=document.getElementById("items-source");
if(!service||!table||!search||!slot||!chips)return;
const en=document.documentElement.lang==="en";
const originLabelsEN={"Forge":"Blacksmithing","Pic Blackrock":"Blackrock Spire","Profondeurs de Blackrock":"Blackrock Depths","Travail du cuir":"Leatherworking","Quête · Maleterres":"Quest · Plaguelands","Hache-tripes":"Dire Maul","Quête · Pic Blackrock":"Quest · Blackrock Spire","Couture · Mage":"Tailoring · Mage","Quête · Un'Goro":"Quest · Un'Goro","Butin mondial":"World drop","Couture · Prêtre":"Tailoring · Priest","Quête · Hache-tripes":"Quest · Dire Maul","Quête légendaire (référence Classic)":"Legendary quest (Classic reference)","Objet légendaire (référence Classic)":"Legendary item (Classic reference)","Forge (référence Classic)":"Blacksmithing (Classic reference)"};
const displayOrigin=s=>en?(originLabelsEN[s]||s):s;
const tr=en?{all:"All",forever:"Forever beta",classic:"Classic 1.12",loading:"Loading Classic items…",load:"Load 100 more Classic items",busy:"Loading…",unavailable:"Classic API unavailable. Local entries remain available.",items:"items displayed",item:"item displayed",noresult:"No items match these filters.",badgeForever:"Forever beta",badgeClassic:"Classic",origin:"Source",quality:"Quality",loaded:"Loaded",tooltip:"Details",beta:"Beta data · in-game availability not guaranteed",classicNote:"Classic references are not confirmed Forever items",name:"Item / ID",level:"Item level",required:"Required",filter:"Database",link:"Other Forever references ↗"}:{all:"Tout",forever:"Forever bêta",classic:"Classic 1.12",loading:"Chargement des objets Classic…",load:"Charger 100 autres objets Classic",busy:"Chargement…",unavailable:"API Classic indisponible. Les références locales restent accessibles.",items:"objets affichés",item:"objet affiché",noresult:"Aucun résultat avec ces filtres.",badgeForever:"Forever bêta",badgeClassic:"Classic",origin:"Origine",quality:"Qualité",loaded:"Chargés",tooltip:"Détails",beta:"Données bêta · disponibilité en jeu non garantie",classicNote:"Les références Classic ne sont pas confirmées sur Forever",name:"Objet / ID",level:"Niveau d’objet",required:"Requis",filter:"Base",link:"Autres objets Forever ↗"};
const levels=["poor","common","uncommon","rare","epic","legendary"];
const labels=en?["Poor","Common","Uncommon","Rare","Epic","Legendary"]:["Médiocre","Commun","Inhabituel","Rare","Épique","Légendaire"];
const colors={poor:"#9d9d9d",common:"#efeee9",uncommon:"#43bf66",rare:"#4c9df1",epic:"#b67cff",legendary:"#ffac46"};
const slotLabels=en?{head:"Head",neck:"Neck",shoulders:"Shoulders",back:"Back",chest:"Chest",wrist:"Wrists",hands:"Hands",waist:"Waist",legs:"Legs",feet:"Feet",finger1:"Rings",trinket1:"Trinkets",mainhand:"Weapons",offhand:"Off hand",ranged:"Ranged / relic"}:{head:"Tête",neck:"Cou",shoulders:"Épaules",back:"Dos",chest:"Torse",wrist:"Poignets",hands:"Mains",waist:"Taille",legs:"Jambes",feet:"Pieds",finger1:"Anneaux",trinket1:"Bijoux",mainhand:"Armes",offhand:"Main gauche",ranged:"Distance / relique"};
let classic=[],local=[],forever=[],selection=new Set(),status="all",key="",cursor=null,more=false,loading=false,error="",total=null,debounce=0;
const rowText=(row,value)=>{const cell=document.createElement("td");cell.textContent=String(value??"—");row.append(cell);return cell};
function normalizeLocal(i){return {...i,slot:service.LABELS[i.slot]||i.slot,source_status:i.source_status||"classic_reference"}}
function sourceType(item){return typeof item.source_status==="string"&&item.source_status.startsWith("forever_beta_")?"forever":"classic"}
const validImage=i=>typeof i==="string"&&(/^[a-z0-9_-]{2,70}$/.test(i)||i.startsWith("https://wowdb.assemblee-defias.fr/database-icons/"));
function imageUrl(i){if(i&&typeof i.icon==="string"&&i.icon.startsWith("https://wowdb.assemblee-defias.fr/database-icons/"))return i.icon;
return i&&validImage(i.icon)?"/forever_app/assets/icons/"+i.icon+".jpg":null}
function matches(item){
 if(status==="forever"&&sourceType(item)!=="forever"||status==="classic"&&sourceType(item)!=="classic")return false;
 const id=slot.value;if(id!=="all"&&!service.compatible(item.slot,id))return false;
 if(selection.size&&!selection.has(item.quality))return false;
 const q=search.value.trim().toLocaleLowerCase();
 return !q||String(item.id)===q||(item.name+" "+(item.origin||"")+" "+displayOrigin(item.origin||"")).toLocaleLowerCase().includes(q);
}
function drawQuality(){
 const root=chips;root.replaceChildren();const group=[...local,...forever,...classic];
 function control(quality,label,count){const active=quality==="all"?!selection.size:selection.has(quality);
 const btn=document.createElement("button");btn.type="button";btn.className="bis-v2-quality"+(active?" active":"");btn.textContent=label+(quality==="all"?"":" "+count);btn.setAttribute("aria-pressed",String(active));
 if(quality!=="all")btn.style.setProperty("--rarity",colors[quality]);
 btn.addEventListener("click",()=>{if(quality==="all")selection.clear();else if(selection.has(quality))selection.delete(quality);else selection.add(quality);queue();render()});root.append(btn)}
 control("all",tr.all,group.length);
 levels.forEach((q,n)=>control(q,labels[n],group.filter(i=>i.quality===q).length))
}
function render(){
 drawQuality();
 const byID=new Map();for(const i of [...forever,...local,...classic])if(!byID.has(i.id)||sourceType(i)==="forever")byID.set(i.id,i);
 const rows=[...byID.values()].filter(matches).sort((a,b)=>Number(sourceType(b)==="forever")-Number(sourceType(a)==="forever")||(b.itemLevel||b.level||0)-(a.itemLevel||a.level||0)||a.name.localeCompare(b.name));
 table.replaceChildren();
 count.textContent=rows.length+" "+(rows.length===1?tr.item:tr.items)+(total!==null&&status!=="forever"?" · "+total.toLocaleString(en?"en":"fr")+" Classic ("+tr.loaded+" : "+classic.length+")":"");
 if(!rows.length){const line=document.createElement("tr");rowText(line,loading?tr.loading:tr.noresult).colSpan=4;table.append(line)}
 for(const i of rows.slice(0,350)){const row=document.createElement("tr"),name=rowText(row,"");name.className="item-v2-name";const imgSrc=imageUrl(i);
 if(imgSrc){const pic=document.createElement("img");pic.className="result-icon item-v2-icon";pic.src=imgSrc;pic.alt="";pic.loading="lazy";pic.onerror=()=>pic.remove();name.append(pic)}
 const display=document.createElement("span");display.className="item-v2-label";display.style.setProperty("--rarity",colors[i.quality]||"#d7d7d7");
 const href=(typeof i.url==="string"&&(i.url.startsWith("https://www.wowhead.com/forever/")||i.url.startsWith("https://wowdb.assemblee-defias.fr/")))?i.url:null;
 const anchor=document.createElement(href?"a":"span");if(href){anchor.href=href;anchor.target="_blank";anchor.rel="noopener noreferrer"}anchor.textContent=i.name;display.append(anchor);name.append(display);
 const tag=document.createElement("span");tag.className="item-v3-provenance "+(sourceType(i)==="forever"?"forever":"classic");tag.textContent=sourceType(i)==="forever"?tr.badgeForever:tr.badgeClassic;name.append(tag);
 const detail=document.createElement("button");detail.type="button";detail.className="bis-v2-info-button item-v2-info";detail.textContent="ⓘ";detail.setAttribute("aria-label",tr.tooltip+" "+i.name);detail.addEventListener("click",()=>window.ForeverItemTooltip?.pin(i));name.append(detail);
 rowText(row,slotLabels[i.slot]||i.slot);
 rowText(row,Number.isFinite(i.itemLevel)?i.itemLevel:(Number.isFinite(i.level)?i.level:"—"));
 rowText(row,displayOrigin(i.origin)|| (sourceType(i)==="forever"?tr.badgeForever:tr.badgeClassic));
 table.append(row);
 window.ForeverItemTooltip?.bind(row,i);
 }
 if(loading)notice.textContent=tr.loading;else if(error)notice.textContent=error;else notice.textContent=status==="forever"?tr.beta:tr.classicNote;
 moreButton.hidden=!more||status==="forever"||loading;moreButton.disabled=loading;
}
function signature(){return JSON.stringify([status,slot.value,search.value.trim().toLowerCase(),[...selection].sort()])}
async function queryClassic(expected,append=false){
 if(status==="forever")return;
 loading=true;render();
 try{
 const q=search.value.trim(),numeric=/^\d{1,8}$/.test(q)?Number(q):null;
 let result;
 if(numeric){const direct=await service.itemById(numeric);result={items:direct?[direct]:[],hasMore:false,cursor:null,count:null}}
 else result=await service.loadClassic({slot:slot.value,query:q,qualities:[...selection],cursor:append?cursor:null});
 if(expected!==key)return;
 classic=append?[...classic,...result.items.filter(i=>!classic.some(old=>old.id===i.id))]:result.items;more=result.hasMore;cursor=result.cursor;total=result.count;error="";
 }catch(e){if(expected!==key)return;error=tr.unavailable;more=false}
 finally{if(expected===key){loading=false;render()}}
}
function queue(){
 const current=signature();if(current===key)return;key=current;classic=[];more=false;cursor=null;total=null;error="";clearTimeout(debounce);
 if(status!=="forever"){loading=true;debounce=setTimeout(()=>queryClassic(current),240)}else loading=false;
}
const control=document.createElement("label");control.className="item-v3-source-filter";control.textContent=tr.filter+" ";
const select=document.createElement("select");select.id="item-source";select.setAttribute("aria-label",tr.filter);
for(const [value,label] of [["all",tr.all],["forever",tr.forever],["classic",tr.classic]]){const opt=document.createElement("option");opt.value=value;opt.textContent=label;select.append(opt)}
control.append(select);document.querySelector(".item-v2-quality-controls")?.before(control);
const notice=document.createElement("p");notice.className="item-v3-live-note";notice.setAttribute("aria-live","polite");
const moreButton=document.createElement("button");moreButton.className="bis-v2-more item-v3-load";moreButton.type="button";moreButton.textContent=tr.load;
const actions=document.createElement("div");actions.className="item-v3-paging";actions.append(moreButton,notice);
table.closest(".result-table-wrap")?.after(actions);
moreButton.addEventListener("click",()=>{moreButton.disabled=true;queryClassic(key,true)});
select.addEventListener("change",()=>{status=select.value;queue();render()});
search.addEventListener("input",()=>{queue();render()});slot.addEventListener("change",()=>{queue();render()});
const options=[...slot.options];slot.replaceChildren(options[0]);
for(const [id,label] of Object.entries(slotLabels)){const o=document.createElement("option");o.value=id;o.textContent=label;slot.append(o)}
(async()=>{
 try{
 const [catalog,seed]=await Promise.all([fetch("/forever_app/data/items.json",{credentials:"omit"}).then(r=>r.json()),service.loadForever()]);
 local=Array.isArray(catalog.items)?catalog.items.filter(i=>i.verified===true&&Number.isInteger(i.id)).map(normalizeLocal):[];
 forever=seed;source.replaceChildren();source.append(document.createTextNode(en?"Sources: ":"Sources : "));
const aForever=document.createElement("a");aForever.href="https://www.wowhead.com/forever/items";aForever.target="_blank";aForever.rel="noopener noreferrer";aForever.textContent="Wowhead Forever";
const aClassic=document.createElement("a");aClassic.href="https://wowdb.assemblee-defias.fr/";aClassic.target="_blank";aClassic.rel="noopener noreferrer";aClassic.textContent="WoWDB des Défias";
source.append(aForever,document.createTextNode(" · "),aClassic,document.createTextNode(" · "+tr.beta));
 }catch(e){error=tr.unavailable}
 queue();render();
})();
})();