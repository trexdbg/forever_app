/* Shared WoW-style tooltips for BiS paperdoll and gear catalogue.
   Rich details are loaded on demand from WoWDB Classic (Vanilla 1.12), not Forever.
   All external data is rendered through textContent, never injected as HTML. */
(()=>{"use strict";
const en=document.documentElement.lang==="en";
const locale=()=>window.ForeverItemLocale;
const w=en?{
  itemLevel:"Item level",classic:"Classic Era reference — NOT confirmed for Forever",loading:"Loading Classic item details…",unavailable:"Additional Classic stats unavailable.",origin:"Source",view:"Open Classic item sheet ↗",close:"Close item details",open:"Item details",bind:"Binding",slot:"Slot",subtype:"Type",damage:"Damage",speed:"Speed",dps:"damage per second",required:"Requires level",armor:"Armor",sell:"Sell price",effects:"Classic effects (original text)",longPress:"Long-press an item for details",source:"Classic data: WoWDB des Défias",unknown:"Undocumented",set:"Item set"
}:{
  itemLevel:"Niveau d’objet",classic:"Référence Classic — NON confirmée sur Forever",loading:"Chargement des caractéristiques Classic…",unavailable:"Caractéristiques Classic supplémentaires indisponibles.",origin:"Origine",view:"Voir la fiche Classic ↗",close:"Fermer les détails",open:"Détails de l’objet",bind:"Lien",slot:"Emplacement",subtype:"Type",damage:"Dégâts",speed:"Vitesse",dps:"dégâts par seconde",required:"Niveau requis",armor:"Armure",sell:"Prix de vente",effects:"Effets Classic",longPress:"Appui long pour voir les détails",source:"Données Classic : WoWDB des Défias",unknown:"Non documenté",set:"Ensemble d’objets"
};
const QUALITY=new Set(["poor","common","uncommon","rare","epic","legendary"]);
const cache=new Map(),inflight=new Map(),unavailableUntil=new Map();
let active=null,token=0,loadTimer=0,visible=false,pinned=false,suspendUntil=0;
const panel=document.createElement("aside");
panel.id="forever-item-tooltip";panel.className="forever-item-tooltip";
panel.setAttribute("role","dialog");panel.setAttribute("aria-label",w.open);panel.setAttribute("aria-modal","false");panel.hidden=true;
const inner=document.createElement("div");inner.className="forever-item-tooltip__inner";panel.append(inner);
document.body.append(panel);
function elt(type,css,text){const node=document.createElement(type);if(css)node.className=css;if(text!==undefined)node.textContent=String(text);return node}
function write(parent,css,value){if(value===null||value===undefined||value==="")return null;const x=elt("div",css,value);parent.append(x);return x}
function isId(value){return Number.isSafeInteger(Number(value))&&Number(value)>0&&Number(value)<100000000}
function localizedSlot(slot){
if(!en)return slot||"";
const map={head:"Head",neck:"Neck",shoulders:"Shoulders",back:"Back",chest:"Chest",wrist:"Wrists",hands:"Hands",waist:"Waist",legs:"Legs",feet:"Feet",finger1:"Finger 1",finger2:"Finger 2",trinket1:"Trinket 1",trinket2:"Trinket 2",mainhand:"Main hand",offhand:"Off hand",ranged:"Ranged / relic",Tête:"Head",Cou:"Neck",Épaules:"Shoulders",Dos:"Back",Torse:"Chest",Poignets:"Wrists",Mains:"Hands",Taille:"Waist",Jambes:"Legs",Pieds:"Feet","Anneau 1":"Ring 1","Anneau 2":"Ring 2","Bijou 1":"Trinket 1","Bijou 2":"Trinket 2","Main droite":"Main hand","Main gauche":"Off hand","Distance / relique":"Ranged / relic"};
return map[slot]||slot||""}
function translateLine(line){
if(!en){
 const stats={"Strength":"Force","Agility":"Agilité","Stamina":"Endurance","Intellect":"Intelligence","Spirit":"Esprit","Armor":"Armure","Ranged Attack Power":"Puissance d'attaque à distance","Attack Power":"Puissance d'attaque"};
 const types={"Sword":"Épée","Axe":"Hache","Mace":"Masse","Dagger":"Dague","Staff":"Bâton","Polearm":"Arme d'hast","Wand":"Baguette","Bow":"Arc","Crossbow":"Arbalète","Gun":"Arme à feu","Leather":"Cuir","Mail":"Mailles","Plate":"Plaques","Cloth":"Tissu","Shield":"Bouclier","Trinket":"Bijou","Ring":"Anneau","Relic":"Relique"};
 return String(line)
 .replace(/^Item Level (\d+)$/,"Niveau d’objet $1")
 .replace(/^Requires Level (\d+)$/,"Niveau $1 requis")
 .replace(/^Ranged Wand$/,"Baguette à distance")
 .replace(/^Held in off hand$/,"Tenu en main gauche")
 .replace(/^Binds when picked up$/,"Lié quand ramassé")
 .replace(/^Binds when equipped$/,"Lié quand équipé")
 .replace(/^Two-Hand /,"Deux mains · ")
 .replace(/^One-Hand /,"À une main · ")
 .replace(/^Main Hand /,"Main droite · ")
 .replace(/^Off Hand /,"Main gauche · ")
 .replace(/^Durability (\d+) \/ (\d+)$/,"Durabilité $1 / $2")
 .replace(/^(\+\d+) (Strength|Agility|Stamina|Intellect|Spirit)$/,(full,n,attr)=>n+" "+stats[attr])
 .replace(/^(\d+) Armor$/,"$1 points d’armure")
 .replace(/^(Sword|Axe|Mace|Dagger|Staff|Polearm|Wand|Bow|Crossbow|Gun|Leather|Mail|Plate|Cloth|Shield|Trinket|Ring|Relic)$/,value=>types[value]||value)
 .replace(/^Ranged /,"Distance · ");
}
const direct={"Lié quand ramassé":"Binds when picked up","Lié quand équipé":"Binds when equipped","Unique":"Unique","Unique (1)":"Unique (1)","Équipé":"Equip","Ensemble":"Set"};
if(direct[line])return direct[line];
const translated={ "Main droite":"Main hand","Main gauche":"Off hand","À une main":"One-hand","Deux mains":"Two-hand","Épée":"Sword","Hache":"Axe","Masse":"Mace","Dague":"Dagger","Bâton":"Staff","Arc":"Bow","Arbalète":"Crossbow","Arme à feu":"Gun","Bouclier":"Shield","Tissu":"Cloth","Cuir":"Leather","Mailles":"Mail","Plaques":"Plate","Baguette":"Wand","Bijou":"Trinket","Anneau":"Ring","Tenue":"Set","Tête":"Head","Épaules":"Shoulders","Torse":"Chest","Dos":"Back","Mains":"Hands","Poignets":"Wrists","Taille":"Waist","Jambes":"Legs","Pieds":"Feet" };
if(translated[line])return translated[line];
const effectCrit=/^Équipé : Augmente vos chances d['’]infliger un coup critique de ([\d,.]+)%\.?$/i.exec(line);
if(effectCrit)return "Equip: Increases your chance to score a critical strike by "+effectCrit[1]+"%.";
const effectAp=/^Équipé : Augmente de (\d+) la puissance d['’]attaque\.?$/i.exec(line);
if(effectAp)return "Equip: Increases attack power by "+effectAp[1]+".";
return line.replace(/^Niveau d'objet (\d+)/,"Item level $1")
.replace(/^Dégâts : ([\d,.\s]+) - ([\d,.\s]+)/,"Damage: $1 - $2")
.replace(/^Vitesse ([\d,.]+)/,"Speed $1")
.replace(/dégâts par seconde/g,"damage per second")
.replace(/^Durabilité (\d+) \/ (\d+)/,"Durability $1 / $2")
.replace(/^Niveau (\d+) requis/,"Requires level $1")
.replace(/^\+([\d,.]+) Force$/,"+$1 Strength")
.replace(/^\+([\d,.]+) Agilité$/,"+$1 Agility")
.replace(/^\+([\d,.]+) Endurance$/,"+$1 Stamina")
.replace(/^\+([\d,.]+) Intelligence$/,"+$1 Intellect")
.replace(/^\+([\d,.]+) Esprit$/,"+$1 Spirit")
.replace(/^Équipé : /,"Equip: ")
.replace(/^Utiliser : /,"Use: ")
.replace(/^Armure : (\d+)/,"Armor: $1")}
function rawLineStyle(text){
if(/^(Équipé|Equip:|Utiliser|Use:|Chance quand vous|Chance on hit|Bonus d'ensemble|Set:|Ensemble \(\d+\)|\(\d+\) Ensemble|\(\d+\) Set)/i.test(text))return "forever-item-tooltip__effect";
if(/^(Niveau d'objet|Item level)/i.test(text))return "forever-item-tooltip__itemlevel";
if(/^(Armure|Damage|Dégâts|Vitesse|Speed|Durabilité|Durability|Niveau \d+ requis|Requires level)/i.test(text))return "forever-item-tooltip__line";
if(/^(\+\d+|Augmente |Increases )/i.test(text))return "forever-item-tooltip__stat";
if(/^(Ensemble|Set:|Armes de|Armure de|Tenue de)/i.test(text))return "forever-item-tooltip__set";
return "forever-item-tooltip__line"}
function validIcon(icon){return typeof icon==="string"&&/^[a-z0-9_-]{2,70}$/.test(icon)}
function render(item,data,status){const forever=typeof item.source_status==="string"&&item.source_status.startsWith("forever_beta_");if(!data&&Array.isArray(item.tooltip)&&item.tooltip.length)data={name:item.name,item_level:item.itemLevel,tooltip:item.tooltip};
inner.replaceChildren();panel.dataset.quality=QUALITY.has(item.quality)?item.quality:"common";
const controls=elt("div","forever-item-tooltip__top");
write(controls,"forever-item-tooltip__eyebrow",forever?(en?"FOREVER BETA / ITEM DETAILS":"FOREVER BÊTA / FICHE D’OBJET"):(en?"CLASSIC / ITEM DETAILS":"CLASSIC / FICHE D’OBJET"));
const close=elt("button","forever-item-tooltip__close","×");close.type="button";close.setAttribute("aria-label",w.close);close.addEventListener("click",hide);controls.append(close);inner.append(controls);
const title=elt("div","forever-item-tooltip__title");
const officialIcon=typeof item.icon_url==="string"&&/^https:\/\/wow\.zamimg\.com\/images\/wow\/icons\/(?:medium|large)\/[a-z0-9_-]{2,70}\.jpg$/.test(item.icon_url)?item.icon_url:null;
if(officialIcon||validIcon(item.icon)||typeof item.icon==="string"&&item.icon.startsWith("https://wowdb.assemblee-defias.fr/database-icons/")){
const pic=elt("img","forever-item-tooltip__icon");pic.alt="";
pic.src=officialIcon||(item.icon.startsWith("https://wowdb.assemblee-defias.fr/database-icons/")?item.icon:"/assets/icons/"+item.icon+".jpg");
pic.loading="lazy";
pic.onerror=()=>{if(!pic.dataset.fallback&&validIcon(item.icon)&&!officialIcon){pic.dataset.fallback="1";pic.src="https://wow.zamimg.com/images/wow/icons/large/"+item.icon+".jpg"}else pic.remove()};
title.append(pic)}
const heading=elt("div","forever-item-tooltip__heading");
const label=!en&&!forever&&data&&typeof data.name==="string"&&data.name?data.name:(locale()?.name(item)||item.name);
write(heading,"forever-item-tooltip__name",label);
if(!en&&locale()?.resolved(item)?.translated&&(locale()?.resolved(item)?.original||"")!==label){
 const original=elt("div","forever-item-tooltip__muted","EN : "+locale().resolved(item).original);original.lang="en";heading.append(original);
 if(locale().resolved(item).indicative)write(heading,"forever-item-tooltip__muted","Traduction indicative · nom anglais conservé");
}
if(data&&Number.isFinite(data.item_level)&&data.item_level>0)write(heading,"forever-item-tooltip__itemlevel",w.itemLevel+" "+data.item_level);
else if(Number.isFinite(item.itemLevel)&&item.itemLevel>0)write(heading,"forever-item-tooltip__itemlevel",w.itemLevel+" "+item.itemLevel);
title.append(heading);inner.append(title);
const body=elt("div","forever-item-tooltip__body");inner.append(body);
const lines=data&&Array.isArray(data.tooltip)?data.tooltip.filter(x=>typeof x==="string").slice(0,38):[];
let haveRich=false;
if(lines.length){haveRich=true;let index=0;
for(const original of lines){const text=original.trim();if(!text)continue;
if(index++===0&&(text===data.name||text===item.name||text===item.name_en||text===item.original_name))continue;
if(/^Niveau d'objet \d+/.test(text))continue;
const out=translateLine(text);
write(body,rawLineStyle(out),out);
}
}else if(data&&typeof data==="object"){haveRich=true;
if(data.slot_name)write(body,"forever-item-tooltip__line",en?(localizedSlot(item.slotLabel||item.slot)||data.slot_name):data.slot_name);
if(data.type_name)write(body,"forever-item-tooltip__line",data.type_name);
if(data.weapon&&typeof data.weapon==="object"){
const v=data.weapon;
if(Number.isFinite(v.damage_min)&&Number.isFinite(v.damage_max))write(body,"forever-item-tooltip__line",w.damage+": "+v.damage_min+" - "+v.damage_max);
if(Number.isFinite(v.speed))write(body,"forever-item-tooltip__line",w.speed+" "+v.speed.toFixed(2));
if(Number.isFinite(v.dps))write(body,"forever-item-tooltip__muted","("+v.dps.toFixed(1)+" "+w.dps+")");
}
if(Number.isFinite(data.required_level)&&data.required_level>0)write(body,"forever-item-tooltip__line",w.required+" "+data.required_level);
}
if(!haveRich){
write(body,"forever-item-tooltip__line",localizedSlot(item.slotLabel||item.slot));
if(typeof item.typeName==="string")write(body,"forever-item-tooltip__line",item.typeName);
if(status==="loading")write(body,"forever-item-tooltip__muted",w.loading);
else if(status==="unavailable")write(body,"forever-item-tooltip__muted",w.unavailable);
}
if(item.vendorDetails&&typeof item.vendorDetails==="object"){
const v=item.vendorDetails,group=elt("section","forever-item-tooltip__vendor");
write(group,"forever-item-tooltip__vendor-heading",v.verification?.includes("Forever")?(en?"MERCHANT REFERENCE · FOREVER BETA":"VENTE SOURCÉE · FOREVER BÊTA"):(en?"MERCHANT REFERENCE · CLASSIC":"RÉFÉRENCE MARCHAND · CLASSIC"));
if(v.verification)write(group,"forever-item-tooltip__line",v.verification);
if(v.type)write(group,"forever-item-tooltip__line",v.type+(v.profession?" · "+v.profession:""));
else if(v.profession)write(group,"forever-item-tooltip__line",v.profession);
if(Number.isFinite(v.skill)&&v.skill>0)write(group,"forever-item-tooltip__line",(en?"Profession skill (reference): ":"Compétence du métier (référence) : ")+v.skill);
if(v.stock)write(group,"forever-item-tooltip__line",v.stock);
if(Number.isFinite(v.vendorCount)&&v.vendorCount>0)write(group,"forever-item-tooltip__line",v.vendorCount+" "+(en?(v.vendorCount===1?"listed vendor":"listed vendors"):(v.vendorCount===1?"vendeur référencé":"vendeurs référencés")));
if(v.vendorName)write(group,"forever-item-tooltip__line",(en?"Selected vendor: ":"Vendeur sélectionné : ")+v.vendorName);
if(Number.isFinite(v.priceCopper)&&v.priceCopper>=0){
const g=Math.floor(v.priceCopper/10000),s=Math.floor((v.priceCopper%10000)/100),c=v.priceCopper%100;
const price=[g?(g+" "+(en?"g":"po")):"",s?(s+" "+(en?"s":"pa")):"",c?(c+" "+(en?"c":"pc")):""].filter(Boolean).join(" ")||"0 "+(en?"c":"pc");
write(group,"forever-item-tooltip__line",(en?"Classic vendor price (indicative): ":"Prix marchand Classic (indicatif) : ")+price);
}
if(Number.isInteger(v.currencyPrice)&&v.currencyPrice>=0)write(group,"forever-item-tooltip__vendor-currency",v.currencyPrice+" "+(en?"Merchant’s Favor":"Faveurs marchandes"));
if(Number.isInteger(v.maxStock)&&v.maxStock>0)write(group,"forever-item-tooltip__line",(en?"Classic reference maximum stock: ":"Stock maximal de référence Classic : ")+v.maxStock);
if(v.reputation&&typeof v.reputation==="object"){
 const rr={Friendly:en?"Friendly":"Amical",Honored:en?"Honored":"Honoré",Revered:en?"Revered":"Révéré",Exalted:en?"Exalted":"Exalté"};
 write(group,"forever-item-tooltip__vendor-warning",(forever?(en?"Required Forever beta reputation: ":"Réputation Forever bêta requise : "):(en?"Required Classic reputation: ":"Réputation Classic requise : "))+v.reputation.faction+" · "+(rr[v.reputation.rank]||v.reputation.rank));
}
if(v.seasonal)write(group,"forever-item-tooltip__vendor-warning",en?"Classic seasonal sale · Winter Veil; unverified on Forever":"Vente saisonnière Classic · Voile d'hiver ; non vérifiée sur Forever");
if(v.specialization)write(group,"forever-item-tooltip__vendor-warning",(en?"Classic specialization: ":"Spécialisation Classic : ")+v.specialization);
if(v.bindPickup)write(group,"forever-item-tooltip__vendor-warning",en?"Bind on Pickup (Classic reference)":"Lié quand ramassé (référence Classic)");
if(v.sharedStock)write(group,"forever-item-tooltip__vendor-warning",en?"Shared vendor stock slot":"Emplacement de stock partagé");
inner.append(group);
}
if(item.origin)write(inner,"forever-item-tooltip__origin",w.origin+" : "+item.origin);
if(status==="unavailable"&&haveRich)write(inner,"forever-item-tooltip__muted",w.unavailable);
write(inner,"forever-item-tooltip__disclaimer",
 forever?(item.source_status==="forever_beta_observed"
 ?(en?"Loot reported by the beta community; item and acquisition may change.":"Butin signalé par la communauté bêta ; objet et obtention susceptibles de changer.")
 :(en?"Seen in Forever beta data; not proof of in-game availability.":"Présent dans les données bêta Forever ; obtention en jeu non confirmée."))
 :w.classic);
const foot=elt("div","forever-item-tooltip__foot");
if(isId(item.id)){
const sourceUrl=(()=>{const url=item.source_url||item.url;if(!forever||typeof url!=="string")return null;try{const u=new URL(url);return u.protocol==="https:"&&(u.hostname==="www.60.tools"&&u.pathname.startsWith("/items/")||u.hostname==="www.wowhead.com"&&u.pathname.startsWith("/forever/"))?u.href:null}catch{return null}})();
const a=elt("a","forever-item-tooltip__source",forever?(en?"Forever beta source ↗":"Source Forever bêta ↗"):w.source+" ↗");
a.href=forever?(item.source_status==="forever_beta_observed"&&typeof item.source_url==="string"&&item.source_url.startsWith("https://foreverchanges.pro/item/")?item.source_url:(sourceUrl||"https://www.wowhead.com/forever/item="+Number(item.id))):"https://wowdb.assemblee-defias.fr/?id=classic:item:"+Number(item.id);a.target="_blank";a.rel="noopener noreferrer";foot.append(a);
}else write(foot,"forever-item-tooltip__source",w.source);
inner.append(foot);
}
function place(x,y,anchor){
if(!visible||pinned)return;
const rect=panel.getBoundingClientRect(),padding=12,gap=20;
let left=x+gap,top=y+gap;
if(left+rect.width+padding>window.innerWidth)left=x-rect.width-gap;
if(left<padding)left=padding;
if(top+rect.height+padding>window.innerHeight)top=window.innerHeight-rect.height-padding;
if(top<padding)top=padding;
panel.style.left=left+"px";panel.style.top=top+"px"}
function hide(){
clearTimeout(loadTimer);token++;visible=false;pinned=false;active=null;panel.hidden=true;panel.classList.remove("is-pinned");panel.style.left="";panel.style.top="";
}
function queueDetails(item,requestToken){
if(!isId(item.id)||typeof item.source_status==="string"&&item.source_status.startsWith("forever_beta_")||(Array.isArray(item.tooltip)&&item.tooltip.length))return;
const id=Number(item.id);
if(cache.has(id)){if(active&&requestToken===token){render(item,cache.get(id),"complete");if(!pinned)place(active.x,active.y)}return}
if(Date.now()<suspendUntil||Date.now()<(unavailableUntil.get(id)||0)){if(active&&requestToken===token)render(item,null,"unavailable");return;}
loadTimer=setTimeout(()=>{
let promise=inflight.get(id);
if(!promise){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),7000);
promise=fetch("https://api.wowdb.assemblee-defias.fr/v1/classic/items/"+id,{credentials:"omit",mode:"cors",signal:controller.signal})
.then(r=>{if(r.status===429||r.status===503)suspendUntil=Date.now()+60000;if(!r.ok)throw Error("HTTP "+r.status);return r.json()})
.then(data=>{if(!data||data.object!=="item"||Number(data.id)!==id)throw Error("Invalid item");cache.set(id,data);return data})
.finally(()=>{clearTimeout(timeout);inflight.delete(id)});
inflight.set(id,promise)}
promise.then(data=>{if(active&&token===requestToken&&Number(active.item.id)===id){render(active.item,data,"complete");if(!pinned)place(active.x,active.y)}}).catch(()=>{unavailableUntil.set(id,Date.now()+5*60000);if(active&&token===requestToken&&Number(active.item.id)===id){render(active.item,null,"unavailable");if(!pinned)place(active.x,active.y)}})
},200);
}
function show(item,evt,stick=false){
if(!item||typeof item.name!=="string")return;
clearTimeout(loadTimer);token++;const currentToken=token;
visible=true;pinned=Boolean(stick);
const anchor=evt&&evt.currentTarget&&evt.currentTarget.getBoundingClientRect?evt.currentTarget:null;
const rect=anchor?anchor.getBoundingClientRect():null;
const x=evt&&Number.isFinite(evt.clientX)?evt.clientX:rect?rect.right:window.innerWidth/2;
const y=evt&&Number.isFinite(evt.clientY)?evt.clientY:rect?rect.top:window.innerHeight/2;
active={item,x,y};panel.classList.toggle("is-pinned",pinned);panel.hidden=false;
render(item,cache.get(Number(item.id))||null,isId(item.id)&&!cache.has(Number(item.id))&&!(Array.isArray(item.tooltip)&&item.tooltip.length)&&!(typeof item.source_status==="string"&&item.source_status.startsWith("forever_beta_"))?"loading":"complete");
if(!pinned)place(x,y);
else {panel.style.left="";panel.style.top="";}
queueDetails(item,currentToken);
}
function bind(node,item){
if(!node||!item)return;
let longTimer=0,longPressed=false,startX=0,startY=0;
node.addEventListener("mouseenter",e=>{if(e.sourceCapabilities?.firesTouchEvents||pinned)return;show(item,e)});
node.addEventListener("mousemove",e=>{if(!pinned&&visible&&active&&Number(active.item.id)===Number(item.id)){active.x=e.clientX;active.y=e.clientY;place(e.clientX,e.clientY)}});
node.addEventListener("mouseleave",()=>{if(!pinned)hide()});
node.addEventListener("focusin",e=>{if(!pinned&&window.matchMedia("(hover: hover)").matches)show(item,e)});
node.addEventListener("focusout",()=>{if(!pinned)hide()});
node.addEventListener("pointerdown",e=>{if(e.pointerType!=="touch"&&e.pointerType!=="pen")return;clearTimeout(longTimer);longPressed=false;startX=e.clientX;startY=e.clientY;longTimer=setTimeout(()=>{longPressed=true;show(item,{clientX:startX,clientY:startY},true)},550)});
node.addEventListener("pointermove",e=>{if(Math.abs(e.clientX-startX)>12||Math.abs(e.clientY-startY)>12)clearTimeout(longTimer)});
for(const event of ["pointerup","pointercancel","pointerleave"])node.addEventListener(event,()=>clearTimeout(longTimer));
node.addEventListener("click",e=>{if(!longPressed)return;longPressed=false;e.preventDefault();e.stopImmediatePropagation()},true)
}
function pin(item){show(item,null,true)}
document.addEventListener("keydown",e=>{if(e.key==="Escape")hide()});
document.addEventListener("pointerdown",e=>{if(pinned&&!panel.contains(e.target)&&!e.target.closest(".bis-v2-info-button"))hide()},true);
window.addEventListener("resize",hide);
window.addEventListener("scroll",()=>{if(!pinned)hide()},{passive:true,capture:true});
window.ForeverItemTooltip={bind,hide,pin};
})();