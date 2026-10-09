(()=>{"use strict";
const root="/",en=document.documentElement.lang==="en";
const S=(fr,eng)=>en?eng:fr;
const $=id=>document.getElementById(id);
const mk=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e};
const val=x=>String(x??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const fmt=n=>new Intl.NumberFormat(en?"en-US":"fr-FR",{maximumFractionDigits:1}).format(n);
const title=d=>d.name[en?"en":"fr"];
const side=d=>d.zone[en?"en":"fr"];
const faction={alliance:S("Alliance","Alliance"),horde:S("Horde","Horde"),neutral:S("Neutre","Neutral")};
const profession={Alchimie:S("Alchimie","Alchemy"),Couture:S("Couture","Tailoring"),Ingénierie:S("Ingénierie","Engineering"),Enchantement:S("Enchantement","Enchanting"),Forge:S("Forge","Blacksmithing"),"Travail du cuir":S("Travail du cuir","Leatherworking"),Secourisme:S("Secourisme","First Aid"),Cuisine:S("Cuisine","Cooking"),Herboristerie:S("Herboristerie","Herbalism"),Minage:S("Minage","Mining"),Dépeçage:S("Dépeçage","Skinning"),Pêche:S("Pêche","Fishing"),Armes:S("Armes","Weapons")};
const weaponLabels={"Bows":S("Arcs","Bows"),"Daggers":S("Dagues","Daggers"),"Fist Weapons":S("Armes de pugilat","Fist weapons"),"Staves":S("Bâtons","Staves"),"Thrown":S("Armes de jet","Thrown"),"Crossbows":S("Arbalètes","Crossbows"),"Guns":S("Armes à feu","Guns"),"One-Handed Axes":S("Haches à une main","One-handed axes"),"One-Handed Maces":S("Masses à une main","One-handed maces"),"Two-Handed Axes":S("Haches à deux mains","Two-handed axes"),"Two-Handed Maces":S("Masses à deux mains","Two-handed maces"),"One-Handed Swords":S("Épées à une main","One-handed swords"),"Two-Handed Swords":S("Épées à deux mains","Two-handed swords"),"Polearms":S("Armes d’hast","Polearms")};
const trainerIcons={"Alchimie":"trade_alchemy","Couture":"trade_tailoring","Ingénierie":"trade_engineering","Enchantement":"trade_engraving","Forge":"trade_blacksmithing","Travail du cuir":"trade_leatherworking","Secourisme":"spell_holy_sealofsacrifice","Cuisine":"inv_misc_food_15","Herboristerie":"trade_herbalism","Minage":"trade_mining","Dépeçage":"inv_misc_pelt_wolf_01","Pêche":"trade_fishing"};
const weaponIcons={"Bows":"inv_weapon_bow_01","Daggers":"inv_weapon_shortblade_01","Fist Weapons":"inv_gauntlets_04","Staves":"inv_staff_01","Thrown":"inv_throwingknife_01","Crossbows":"inv_weapon_crossbow_01","Guns":"inv_weapon_rifle_01","One-Handed Axes":"inv_axe_01","One-Handed Maces":"inv_mace_01","Two-Handed Axes":"inv_axe_10","Two-Handed Maces":"inv_hammer_04","One-Handed Swords":"inv_sword_04","Two-Handed Swords":"inv_sword_06","Polearms":"inv_spear_05"};
const rankLabels={"Apprenti":S("Apprenti","Apprentice"),"Compagnon":S("Compagnon","Journeyman"),"Expert":"Expert","Artisan":"Artisan","Tous rangs":S("Tous rangs","All tiers")};
function wowIcon(key,cls="npc-trainer-icon"){
 const frame=mk("span",null,"npc-item-icon "+cls),img=mk("img");
 img.src="https://wow.zamimg.com/images/wow/icons/medium/"+encodeURIComponent(key||"inv_hammer_04")+".jpg";
 img.alt="";img.loading="lazy";img.width=40;img.height=40;
 img.onerror=()=>{img.onerror=null;img.src=root+"assets/icons/inv_hammer_04.jpg"};
 frame.append(img);return frame;
}
const trainerIcon=n=>wowIcon(trainerType(n)==="weapon"?weaponIcons[(weapon?.value!=="all"&&weapon?.value)||n.weapon_skills?.[0]]:trainerIcons[n.profession]);
const trainerTitle=n=>trainerType(n)!=="weapon"?(profession[n.profession]||n.profession):weapon&&weapon.value!=="all"?(weaponLabels[weapon.value]||weapon.value):(n.weapon_skills||[]).slice(0,2).map(k=>weaponLabels[k]||k).join(" · ")+(n.weapon_skills?.length>2?" +"+(n.weapon_skills.length-2):"");
const trainerSkills=n=>(n.weapon_skills||[]).map(k=>weaponLabels[k]||k).join(" · ");
function factionTag(parent,n){
 const chip=append(parent,"span",null,"npc-faction npc-faction-"+(n.faction||"neutral"));
 if(n.faction==="alliance"||n.faction==="horde"){const img=mk("img");img.alt="";img.width=14;img.height=14;img.src=root+"assets/quest-factions/"+n.faction+".svg";chip.append(img)}
 append(chip,"span",faction[n.faction]||S("Neutre","Neutral"));
 return chip;
}
function trainerMeta(parent,n){
 const row=append(parent,"span",null,"npc-trainer-metadata");
 const loc=append(row,"span",null,"npc-trainer-area");
 append(loc,"span","⌖","npc-trainer-location-icon");
 append(loc,"span",side(n));
 append(row,"span",hasCoords(n)?fmt(n.coordinates.x)+" / "+fmt(n.coordinates.y):S("Position à confirmer","Position unconfirmed"),"npc-trainer-xy");
 return row;
}

const hasCoords=n=>Number.isFinite(n.coordinates?.x)&&Number.isFinite(n.coordinates?.y);
const trainerType=n=>n.trainer_kind==="weapon"?"weapon":"profession";
const human=n=>n>=60?(Math.floor(n/60)+" "+S("h","h")+(n%60?" "+(n%60)+" min":"")):fmt(n)+" min";const time=(a,b)=>a===b?human(a):human(a)+" – "+human(b);
const store={db:null,records:[],filtered:[],active:null,mode:document.body.dataset.page==="trainers"?"trainer":"merchant",showReportsOnly:false};
const q=$("npc-search"),zone=$("npc-zone"),trade=$("npc-profession"),aff=$("npc-faction"),rank=$("npc-rank"),reports=$("npc-evidence-only"),type=$("npc-type"),weapon=$("npc-weapon");
const list=$("npc-results"),detail=$("npc-detail"),count=$("npc-count"),kind=$("npc-kind");

/* Progressive-enhanced WoW icon filters. Native selects stay the source of truth. */
const iconPickers=[],factionControls=[];
function iconForFilter(select,value){
 if(select===type)return ({all:"inv_misc_book_09",profession:"trade_blacksmithing",weapon:"inv_sword_04"})[value]||"inv_misc_book_09";
 if(select===trade)return trainerIcons[value]||"inv_misc_book_09";
 return weaponIcons[value]||"inv_sword_04";
}
function closeIconPickers(except){
 for(const picker of iconPickers)if(picker!==except)picker.close();
}
function makeIconPicker(select){
 if(!select||store.mode!=="trainer"||select.dataset.iconPicker)return;
 const field=select.closest(".npc-field");
 if(!field)return;
 const filterLabel=field.querySelector("label");
 const trigger=mk("button",null,"npc-filter-trigger");
 trigger.type="button";trigger.id=select.id+"-trigger";
 trigger.setAttribute("aria-haspopup","listbox");trigger.setAttribute("aria-expanded","false");
 const pop=mk("div",null,"npc-filter-options");
 pop.id=select.id+"-options";pop.setAttribute("role","listbox");pop.hidden=true;
 trigger.setAttribute("aria-controls",pop.id);
 const entryButtons=[];
 const picker={close(){pop.hidden=true;trigger.setAttribute("aria-expanded","false")},open(){
   closeIconPickers(picker);pop.hidden=false;trigger.setAttribute("aria-expanded","true");
 },sync(){
   const selected=[...select.options].find(o=>o.value===select.value)||select.options[0];
   if(!selected)return;
   trigger.replaceChildren();
   trigger.append(wowIcon(iconForFilter(select,selected.value),"npc-filter-wow-icon"));
   append(trigger,"span",selected.textContent,"npc-filter-value");
   append(trigger,"span","⌄","npc-filter-chevron").setAttribute("aria-hidden","true");
   trigger.setAttribute("aria-label",(filterLabel?.textContent||"")+" : "+selected.textContent);
   for(const option of entryButtons)option.setAttribute("aria-selected",String(option.dataset.value===select.value));
 }};
 for(const item of [...select.options]){
  const button=mk("button",null,"npc-filter-option");
  button.type="button";button.dataset.value=item.value;
  button.setAttribute("role","option");
  button.append(wowIcon(iconForFilter(select,item.value),"npc-filter-wow-icon"));
  append(button,"span",item.textContent);
  button.addEventListener("click",()=>{
   select.value=item.value;select.dispatchEvent(new Event("change",{bubbles:true}));
   picker.close();trigger.focus();
  });
  pop.append(button);entryButtons.push(button);
 }
 trigger.addEventListener("click",()=>pop.hidden?picker.open():picker.close());
 trigger.addEventListener("keydown",e=>{
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){
   e.preventDefault();picker.open();const current=entryButtons.findIndex(b=>b.dataset.value===select.value);
   entryButtons[(current+(e.key==="ArrowDown"?1:-1)+entryButtons.length)%entryButtons.length]?.focus();
  }else if(e.key==="Escape")picker.close();
 });
 pop.addEventListener("keydown",e=>{
  const index=entryButtons.indexOf(document.activeElement);
  if(e.key==="Escape"){e.preventDefault();picker.close();trigger.focus()}
  else if(e.key==="ArrowDown"||e.key==="ArrowUp"){
   e.preventDefault();entryButtons[(index+(e.key==="ArrowDown"?1:-1)+entryButtons.length)%entryButtons.length]?.focus();
  }else if(e.key==="Home"){e.preventDefault();entryButtons[0]?.focus()}
  else if(e.key==="End"){e.preventDefault();entryButtons[entryButtons.length-1]?.focus()}
 });
 document.addEventListener("pointerdown",e=>{if(!field.contains(e.target))picker.close()});
 field.append(trigger,pop);
 if(filterLabel)filterLabel.htmlFor=trigger.id;
 select.hidden=true;select.dataset.iconPicker="true";
 select.addEventListener("change",()=>picker.sync());
 iconPickers.push(picker);picker.sync();
}
function factionEmblem(value){
 const img=mk("img");img.src=root+"assets/quest-factions/"+value+".svg";
 img.alt="";img.width=20;img.height=20;img.loading="lazy";return img;
}
function enhanceFactionFilter(){
 if(!aff||store.mode!=="trainer"||aff.dataset.iconPicker)return;
 const field=aff.closest(".npc-field");
 if(!field)return;
 const filterLabel=field.querySelector("label");
 const group=mk("div",null,"npc-faction-toggle");
 group.setAttribute("role","group");
 group.setAttribute("aria-label",filterLabel?.textContent||S("Faction","Faction"));
 for(const value of ["all","alliance","horde"]){
  const button=mk("button",null,"npc-faction-filter npc-faction-filter-"+value);
  button.type="button";button.dataset.value=value;
  button.setAttribute("aria-pressed","false");
  if(value==="all"){const emblems=mk("span",null,"npc-faction-pair");emblems.append(factionEmblem("alliance"),factionEmblem("horde"));button.append(emblems)}
  else button.append(factionEmblem(value));
  const label=[...aff.options].find(o=>o.value===value)?.textContent||value;
  append(button,"span",label,"npc-faction-filter-label");
  button.addEventListener("click",()=>{aff.value=value;aff.dispatchEvent(new Event("change",{bubbles:true}))});
  factionControls.push(button);group.append(button);
 }
 field.append(group);aff.hidden=true;aff.dataset.iconPicker="true";
 if(filterLabel)filterLabel.removeAttribute("for");
}
function syncTrainerFilters(){
 if(store.mode!=="trainer")return;
 for(const picker of iconPickers)picker.sync();
 for(const button of factionControls)button.setAttribute("aria-pressed",String(button.dataset.value===aff?.value));
}
function setupTrainerIconFilters(){
 if(store.mode!=="trainer")return;
 makeIconPicker(type);makeIconPicker(trade);makeIconPicker(weapon);
 enhanceFactionFilter();syncTrainerFilters();
}

function updateFilterVisibility(){
 if(!type||store.mode!=="trainer")return;
 const armed=type.value==="weapon";
 if(trade)trade.closest(".npc-field").hidden=armed;
 if(rank)rank.closest(".npc-field").hidden=armed;
 const advanced=rank?.closest(".npc-advanced-controls");if(advanced)advanced.hidden=armed;
 if(weapon)weapon.closest(".npc-field").hidden=!armed;
}
const evidence=(vendor,item)=>store.db.evidence.find(e=>e.vendor_name===vendor.name&&e.item===item?.id?.toString());
const append=(parent,tag,t,cls)=>{const el=mk(tag,t,cls);parent.append(el);return el};
const link=(parent,text,url)=>{const a=mk("a",text);a.href=url;a.target="_blank";a.rel="noopener noreferrer";parent.append(a);return a};
const iconSrc=item=>item?.icon_status==="wowhead_icon_verified"?"https://wow.zamimg.com/images/wow/icons/medium/"+encodeURIComponent(item.icon)+".jpg":root+"assets/icons/inv_scroll_07.jpg";
const iconNode=(item)=>{const frame=mk("span",null,"npc-item-icon npc-image-icon");const img=mk("img");img.alt="";img.loading="lazy";img.width=40;img.height=40;img.src=iconSrc(item);img.onerror=()=>{img.onerror=null;img.src=root+"assets/icons/inv_scroll_07.jpg"};frame.append(img);return frame};
const copperFmt=c=>{const g=Math.floor(c/10000),s=Math.floor(c%10000/100),b=c%100;return [g?g+" "+S("po","g"):"",s?s+" "+S("pa","s"):"",b?b+" "+S("pc","c"):""].filter(Boolean).join(" ")||"0 "+S("pc","c")};
const stockWord=item=>item.supply==="unlimited"?S("Stock illimité (référence Classic)","Unlimited stock (Classic reference)"):item.supply==="reputation"?S("Vente liée à la réputation","Reputation-gated sale"):S("Stock limité (référence Classic)","Limited stock (Classic reference)");
function filters(){
 if(weapon){for(const key of [...new Set(store.db.npcs.filter(n=>trainerType(n)==="weapon"&&n.role==="trainer").flatMap(n=>n.weapon_skills||[]))].sort((a,b)=>(weaponLabels[a]||a).localeCompare(weaponLabels[b]||b))){const op=mk("option",weaponLabels[key]||key);op.value=key;weapon.append(op)}}
 for(const key of [...new Set(store.db.npcs.filter(n=>n.role===store.mode&&(store.mode!=="trainer"||trainerType(n)==="profession")).map(n=>n.profession))].sort((a,b)=>a.localeCompare(b))){const op=mk("option",profession[key]||key);op.value=key;trade.append(op)}
 const zones=new Map(store.db.npcs.filter(n=>n.role===store.mode).map(n=>[n.zone.id,n.zone]));
 for(const z of [...zones.values()].sort((a,b)=>a[en?"en":"fr"].localeCompare(b[en?"en":"fr"]))){const op=mk("option",z[en?"en":"fr"]);op.value=z.id;zone.append(op)}
 if(rank)for(const key of ["Apprenti","Compagnon","Expert","Artisan","Tous rangs"]){if(store.db.npcs.some(n=>n.role===store.mode&&n.rank===key)){const op=mk("option",en?({Apprenti:"Apprentice",Compagnon:"Journeyman",Expert:"Expert",Artisan:"Artisan","Tous rangs":"All tiers"}[key]||key):key);op.value=key;rank.append(op)}}
}
function makeRecords(){
 const rec=[];for(const n of store.db.npcs){if(n.role!==store.mode)continue;if(n.role==="trainer"){rec.push({npc:n,item:null,key:"trainer:"+n.profession+":"+n.name});continue}
 for(const itemId of n.offers){const item=store.db.items[itemId];if(item)rec.push({npc:n,item,key:n.name+":"+itemId})}
 }store.records=rec;
}
function selectRecord(r){store.active=r;renderList();renderDetail()}
function filteredRecords(){
 const needle=val(q.value);
 return store.records.filter(r=>{
 const {npc:n,item}=r;
 if(n.role!==store.mode)return false;
 if(type&&type.value!=="all"&&trainerType(n)!==type.value)return false;
 if(weapon&&weapon.value!=="all"&&!(n.weapon_skills||[]).includes(weapon.value))return false;
 if(aff.value!=="all"&&n.faction!==aff.value&&n.faction!=="neutral")return false;
 if(trade.value!=="all"&&(item?.profession||n.profession)!==trade.value)return false;
 if(zone.value!=="all"&&n.zone.id!==zone.value)return false;
 if(rank&&rank.value!=="all"&&(trainerType(n)==="weapon"||n.rank!==rank.value&&n.rank!=="Tous rangs"))return false;
 if(kind&&kind.value!=="all"&&item?.kind!==kind.value&&n.role==="merchant")return false;
 if(store.showReportsOnly&&!item)return false;
 if(store.showReportsOnly&&!evidence(n,item))return false;
 if(!needle)return true;
 const terms=[n.name,n.zone.fr,n.zone.en,n.note,n.note_en,n.profession,profession[n.profession],item?.profession,profession[item?.profession],n.rank,item?.name?.fr,item?.name?.en,item?.id,...(item?.search_aliases||[]),...(n.weapon_skills||[]),...(n.weapon_skills||[]).map(k=>weaponLabels[k]||k),trainerType(n)==="weapon"?S("maître d’armes","weapon master"):""];
 return terms.some(x=>val(x).includes(needle));
 }).sort((a,b)=>{
 const ea=!!a.item&&!!evidence(a.npc,a.item),eb=!!b.item&&!!evidence(b.npc,b.item);
 if(ea!==eb)return ea?-1:1;
 if(store.mode==="trainer"){
  const first=trainerTitle(a.npc).localeCompare(trainerTitle(b.npc),en?"en":"fr");
  if(first)return first;
  if(hasCoords(a.npc)!==hasCoords(b.npc))return hasCoords(a.npc)?-1:1;
  const location=side(a.npc).localeCompare(side(b.npc),en?"en":"fr");
  if(location)return location;
  return a.npc.name.localeCompare(b.npc.name);
 }
 return (a.item?title(a.item):a.npc.name).localeCompare(b.item?title(b.item):b.npc.name);
 });
}
function groupedItems(){
 const buckets=new Map();
 for(const r of store.filtered){
  if(!r.item)continue;
  const id=String(r.item.id);
  if(!buckets.has(id))buckets.set(id,{item:r.item,records:[],evidence:false});
  const b=buckets.get(id);b.records.push(r);
  if(evidence(r.npc,r.item))b.evidence=true;
 }
 return [...buckets.values()].sort((a,b)=>{
  if(a.evidence!==b.evidence)return a.evidence?-1:1;
  return title(a.item).localeCompare(title(b.item),en?"en":"fr");
 });
}
function renderList(){
 if(store.mode==="merchant"){
  list.replaceChildren();
  list.replaceChildren();
  const groups=groupedItems();
  for(const g of groups){
   const b=mk("button",null,"npc-result npc-result-group");b.type="button";b.setAttribute("role","option");
   b.setAttribute("aria-selected",String(store.active?.item?.id===g.item.id));
   b.append(iconNode(g.item));
   const copy=append(b,"span",null,"npc-result-copy");
   append(copy,"strong",title(g.item));
   const sellers=g.records.length;
   append(copy,"small",sellers+" "+S(sellers>1?"vendeurs":"vendeur",sellers>1?"vendors":"vendor")+" · "+(profession[g.item.profession]||g.item.profession));
   if(g.evidence)append(copy,"span",S("Témoignages disponibles","Reports available"),"npc-evidence-flag");
   append(b,"span","›","npc-arrow").setAttribute("aria-hidden","true");
   b.addEventListener("click",()=>{
    const keep=g.records.find(r=>r.npc.name===store.active?.npc.name);
    selectRecord(keep||g.records[0]);
   });
   list.append(b);
  }
  count.textContent=groups.length+" "+S("objets","items")+" · "+store.filtered.length+" "+S("ventes référencées","referenced offers");
  if(!store.filtered.length)append(list,"p",S("Aucun résultat. Modifiez les filtres ou la recherche.","No matches. Change the filters or search."),"npc-empty");
  return;
 }

 list.replaceChildren();
 for(const r of store.filtered){
  const n=r.npc,b=mk("button",null,"npc-result npc-trainer-result");
  b.type="button";b.setAttribute("role","option");
  b.setAttribute("aria-selected",String(store.active?.key===r.key));
  b.setAttribute("aria-label",trainerTitle(n)+", "+side(n)+", "+(faction[n.faction]||"")+", "+n.name);
  b.append(trainerIcon(n));
  const copy=append(b,"span",null,"npc-result-copy");
  append(copy,"strong",trainerTitle(n),"npc-trainer-primary");
  if(trainerType(n)==="weapon"){
   const skills=append(copy,"span",null,"npc-trainer-skills");
   const keys=n.weapon_skills||[];
   for(const key of keys.slice(0,4)){const chip=append(skills,"span",null,"npc-weapon-mini");chip.append(wowIcon(weaponIcons[key],"npc-mini-wow-icon"));append(chip,"span",weaponLabels[key]||key)}
   if(keys.length>4)append(skills,"span","+"+(keys.length-4),"npc-more-skills");
  }
  trainerMeta(copy,n);
  const bottom=append(copy,"span",null,"npc-trainer-bottom");
  factionTag(bottom,n);
  if(n.rank&&trainerType(n)==="profession")append(bottom,"span",rankLabels[n.rank]||n.rank,"npc-rank-label");
  append(bottom,"span",n.name,"npc-trainer-person");
  append(b,"span","›","npc-arrow").setAttribute("aria-hidden","true");
  b.addEventListener("click",()=>{
   selectRecord(r);
   if(window.matchMedia("(max-width:700px)").matches)$("npc-map-canvas")?.scrollIntoView({behavior:"smooth",block:"center"});
  });
  list.append(b);
 }
 if(!store.filtered.length)append(list,"p",S("Aucun maître pour ces filtres. Essayez une autre faction ou zone.","No trainers match these filters. Try another faction or zone."),"npc-empty");
 count.textContent=store.filtered.length+" "+S("maîtres","trainers");

}
function sectionText(parent,head,body){append(parent,"h4",head);append(parent,"p",body,"npc-subtitle")}

function renderTrainerDetail(n){
 detail.replaceChildren();
 const heading=append(detail,"div",null,"npc-trainer-detail-heading");
 heading.append(trainerIcon(n));
 const copy=append(heading,"div",null,"npc-trainer-detail-title");
 append(copy,"span",trainerType(n)==="weapon"?S("Maître d’armes","Weapon master"):S("Maître de métier","Profession trainer"),"npc-detail-kicker");
 append(copy,"h3",trainerTitle(n));
 const metadata=append(detail,"div",null,"npc-trainer-detail-location");
 const place=append(metadata,"div");
 append(place,"span",S("EMPLACEMENT","LOCATION"),"npc-mini-label");
 append(place,"strong",side(n));
 const coords=append(metadata,"div");
 append(coords,"span",S("COORDONNÉES","COORDINATES"),"npc-mini-label");
 append(coords,"strong",hasCoords(n)?fmt(n.coordinates.x)+" / "+fmt(n.coordinates.y):S("À confirmer","Unconfirmed"),"npc-trainer-detail-xy");
 const tags=append(detail,"div",null,"npc-trainer-detail-tags");
 factionTag(tags,n);
 if(n.rank&&trainerType(n)==="profession")append(tags,"span",rankLabels[n.rank]||n.rank,"npc-chip gold");
 if(trainerType(n)==="weapon"){
  append(detail,"h4",S("Armes enseignées","Weapon types taught"));
  const skills=append(detail,"div",null,"npc-weapon-teaching");
  for(const skill of n.weapon_skills||[]){
   const chip=append(skills,"span",null,"npc-weapon-teaching-skill");
   chip.append(wowIcon(weaponIcons[skill],"npc-mini-wow-icon"));
   append(chip,"span",weaponLabels[skill]||skill);
  }
 }
 const actions=append(detail,"div",null,"npc-actions");
 const mapId=store.db.zone_maps?.[n.zone.id]?.uiMapID;
 if(hasCoords(n)&&mapId){
  const command="/mappin "+mapId+" "+n.coordinates.x+" "+n.coordinates.y;
  const btn=append(actions,"button",S("⌖ Copier /mappin","⌖ Copy /mappin"),"npc-copy");
  btn.type="button";btn.addEventListener("click",async()=>{
   try{await navigator.clipboard.writeText(command);btn.textContent=S("Commande copiée ✓","Copied ✓")}
   catch(_){btn.textContent=command}
  });
 }
 append(detail,"p",S("PNJ : ","NPC: ")+n.name,"npc-trainer-person-detail");
 append(detail,"p",!hasCoords(n)?S("Le guide indique uniquement la zone : aucune position inventée.","Only the zone is documented; no guessed waypoint."):n.coordinate_status==="forever_guide_waypoint"?S("Point cité dans un guide Forever, non confirmé en jeu.","Waypoint from a Forever guide, not verified in-game."):S("Coordonnées de référence Classic ou de guides Forever : à vérifier en jeu.","Classic or Forever-guide reference coordinates; verify in-game."),"npc-datacaveat");
 const source=append(detail,"p",null,"npc-source");
 link(source,S("Source de la position ↗","Waypoint source ↗"),n.coordinate_source||n.source);
 window.ForeverNpcMap?.show(n,store.db,npcName=>{
  const matched=store.records.find(r=>r.npc.name===npcName&&r.npc.role==="trainer");
  if(!matched)return;
  if(!store.filtered.some(r=>r.key===matched.key)){
   if(q)q.value="";
   if(zone)zone.value="all";
   if(trade)trade.value="all";
   if(rank)rank.value="all";
   if(weapon)weapon.value="all";
   if(aff)aff.value="all";
   if(type)type.value=trainerType(matched.npc);
   updateFilterVisibility();
   store.filtered=filteredRecords();
  }
  selectRecord(matched);
 },{type:type?.value||"all",profession:trade?.value||"all",weaponSkill:weapon?.value||"all"});
}
function renderDetail(){
 detail.replaceChildren();const r=store.active;if(!r){append(detail,"p",S("Sélectionnez un résultat.","Select a result."),"npc-empty");if(store.mode==="trainer")window.ForeverNpcMap?.clear?.();return}
 const n=r.npc,i=r.item;
 if(store.mode==="trainer"){renderTrainerDetail(n);return}
 append(detail,"span",i?S("Objet · Vendeur","Item · Vendor"):trainerType(n)==="weapon"?S("Armes · Maître d’armes","Weapons · Weapon master"):S("Métier · Maître","Profession · Trainer"),"npc-detail-kicker");
 if(i){const heading=append(detail,"div",null,"npc-item-heading");heading.append(iconNode(i));append(heading,"h3",title(i));}else append(detail,"h3",n.name);
 append(detail,"p",i?n.name:trainerType(n)==="weapon"?S("Apprentissage des compétences d’armes","Weapon proficiency training"):S("Maître de métier","Profession trainer"),"npc-subtitle");
 const chips=append(detail,"div",null,"npc-chips");
 append(chips,"span",profession[i?.profession||n.profession]||i?.profession||n.profession,"npc-chip gold");
 append(chips,"span",faction[n.faction],"npc-chip");
 if(i&&i.skill>0&&i.kind==="recipe")append(chips,"span",S("Compétence "+i.skill,"Skill "+i.skill),"npc-chip");
 if(i)append(chips,"span",i.kind==="component"?S("Composant","Material"):S("Recette / patron","Recipe / pattern"),"npc-chip");
 if(n.rank)append(chips,"span",en?({"Apprenti":"Apprentice","Compagnon":"Journeyman","Expert":"Expert","Artisan":"Artisan","Tous rangs":"All tiers"}[n.rank]||n.rank):n.rank,"npc-chip");
 const place=append(detail,"div",null,"npc-location"), p=append(place,"div");
 append(p,"strong",side(n));if(n.note&&(!en||n.note_en))append(p,"small",en?n.note_en:n.note);
 append(place,"span",hasCoords(n)?fmt(n.coordinates.x)+" / "+fmt(n.coordinates.y):S("Position à confirmer","Location unconfirmed"),"npc-coords");
 const actions=append(detail,"div",null,"npc-actions"),mapId=store.db.zone_maps?.[n.zone.id]?.uiMapID,command=hasCoords(n)?"/way "+(mapId?"#"+mapId+" ":"")+n.coordinates.x+" "+n.coordinates.y:"";
 if(command){const btn=append(actions,"button",S("Copier /way","Copy /way"),"npc-copy");btn.type="button";
 btn.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(command);btn.textContent=S("Commande copiée ✓","Copied ✓")}catch(_){btn.textContent=command}});}
 if(i){link(actions,S("Fiche Classic ↗","Classic item ↗"),"https://www.wowhead.com/classic/item="+i.id);
 link(actions,S("Vérifier Forever ↗","Check Forever ↗"),"https://www.wowhead.com/forever/item="+i.id)}
 if(n.id)link(actions,S("Fiche PNJ ↗","NPC details ↗"),"https://www.wowhead.com/classic/npc="+n.id);

 if(i){
 const panel=append(detail,"section",null,"npc-stock");
 append(panel,"span",S("Disponibilité estimée","Reference availability"),"npc-stock-label");
 append(panel,"div",stockWord(i),"npc-stock-value");
 if(Number.isInteger(i.vendor_price_copper)){append(panel,"p",S("Prix de référence : ","Reference vendor price: ")+copperFmt(i.vendor_price_copper));}
 if(Number.isInteger(i.vendor_stock)&&i.vendor_stock>0){append(panel,"p",S("Stock maximal indicatif (Classic) : ","Indicative maximum stock (Classic): ")+i.vendor_stock+" "+S("unité(s)","unit(s)")+".");}
 const report=evidence(n,i);
 if(report){
 const obs=append(panel,"div",null,"npc-evidence");
 append(obs,"strong",report.kind==="unlimited_report"?S("Source Classic : stock illimité","Classic source: unlimited stock"):report.kind==="observed_wait"&&Number.isFinite(report.min_minutes)&&Number.isFinite(report.max_minutes)?S("Attente observée : ","Observed wait: ")+time(report.min_minutes,report.max_minutes):S("Témoignage de stock","Stock report"));
 append(obs,"p",report[en?"en":"fr"]);
 append(obs,"p",report.confidence==="contradictory"?S("Confiance faible · Témoignages contradictoires","Low confidence · Conflicting reports"):report.confidence==="low"?S("Confiance faible · Peu de témoignages","Low confidence · Limited reports"):S("Témoignages communautaires","Community reports"));
 link(obs,S("Consulter la source ↗","View source ↗"),report.url);
 }else append(panel,"p",i.supply==="limited"?S("Délai de réapparition non documenté pour ce couple objet-vendeur.","No documented restock time for this item at this vendor."):S("Aucun délai fiable identifié dans les commentaires.","No reliable delay documented in comments."));
 append(panel,"p",S("Les durées indiquent des attentes rapportées, pas un minuteur exact ni le prochain réapprovisionnement.","These are reported waits, not exact timers or predictions of the next restock."));
 const others=store.db.npcs.filter(v=>v.role==="merchant"&&v.offers.includes(String(i.id)))
 .sort((a,b)=>{
  const av=a.faction===aff.value||a.faction==="neutral"||aff.value==="all",bv=b.faction===aff.value||b.faction==="neutral"||aff.value==="all";
  if(av!==bv)return av?-1:1;
  if(a.name===n.name)return -1;if(b.name===n.name)return 1;
  return side(a).localeCompare(side(b),en?"en":"fr")||a.name.localeCompare(b.name);
 });
 const group=append(detail,"section",null,"npc-alternatives");
 append(group,"h4",S("Où acheter cet objet ? ("+others.length+")","Where to buy this item ("+others.length+")"));
 append(group,"p",S("Vendeurs regroupés par objet · référence Classic, pas de stock en direct.","Vendors grouped by item · Classic references, no live inventory."),"npc-group-intro");
 const choices=append(group,"div",null,"npc-alternative-list");
 for(const seller of others){
  const b=append(choices,"button",null,"npc-seller-button");b.type="button";
  b.setAttribute("aria-pressed",String(seller.name===n.name));
  const main=append(b,"span",null,"npc-seller-main");
  append(main,"strong",seller.name);append(main,"small",side(seller)+" · "+faction[seller.faction]);
  if(evidence(seller,i))append(b,"span",S("Avis stock","Stock report"),"npc-seller-report");
  b.addEventListener("click",()=>{
   q.value="";zone.value="all";trade.value="all";aff.value="all";
   if(kind)kind.value="all";if(rank)rank.value="all";
   store.showReportsOnly=false;if(reports)reports.checked=false;
   const choice=store.records.find(rec=>rec.npc.name===seller.name&&rec.item?.id===i.id);
   if(choice){store.filtered=filteredRecords();selectRecord(choice)}
  });
 }
 const purchase=n.offer_details?.[String(i.id)]||{};
 if(i.specialization||purchase.specialization){const s=purchase.specialization||i.specialization;
  append(panel,"p",S("Spécialisation requise (référence Classic) : ","Required specialization (Classic): ")+s,"npc-requirement");
 }
 if(i.bind==="pickup"||purchase.bind==="pickup")append(panel,"p",S("Lié quand ramassé (référence Classic).","Bind on Pickup (Classic reference)."),"npc-requirement");
 if(purchase.shared_stock_group)append(panel,"p",S("Emplacement de stock partagé : une autre recette peut apparaître à la place.","Shared inventory slot: a different recipe may appear instead."),"npc-requirement");
 if(purchase.source){const cite=append(panel,"p",null,"npc-offer-source");link(cite,S("Source de cette vente ↗","Source for this sale ↗"),purchase.source)}
 }else if(trainerType(n)==="weapon"){
 append(detail,"h4",S("Armes enseignées","Weapons taught"));
 const types=append(detail,"div",null,"npc-weapon-skills");for(const k of n.weapon_skills||[])append(types,"span",weaponLabels[k]||k,"npc-chip");
 if((n.weapon_skills||[]).includes("Polearms"))append(detail,"p",S("Les armes d’hast nécessitent le niveau 20 dans Classic. Chaque classe ne peut apprendre que ses types d’armes autorisés.","Polearms require level 20 in Classic. Each class can only train weapon types it is allowed to wield."),"npc-subtitle");
 else append(detail,"p",S("Une classe ne peut apprendre que les armes qu’elle est autorisée à utiliser.","Classes can train only weapon types they are eligible to wield."),"npc-subtitle");
 }else{
 sectionText(detail,S("Formation","Training"),S("Rang référencé : ","Referenced tier: ")+(n.rank||S("non indiqué","unspecified")));
 append(detail,"p",S("Les maîtres de métiers apprennent des compétences ; ils ne vendent pas nécessairement les objets recherchés.","Trainers teach professions; they do not necessarily sell the items in this catalog."),"npc-subtitle")
 }
 append(detail,"p",!hasCoords(n)?S("Zone identifiée dans un guide Forever ; aucune coordonnée fiable à afficher. Aucun marqueur ni /way inventé.","Zone listed in a Forever guide; no reliable coordinates to show. No invented pin or /way."):n.coordinate_status==="forever_guide_waypoint"?S("Coordonnées publiées dans un guide de la bêta Forever. Présence effective à confirmer en jeu.","Waypoint from a Forever beta guide. Actual in-game presence is not confirmed."):S("Coordonnées de référence issues de guides Classic ou orientés Forever, à vérifier en jeu. Carte de zone en pourcentage (0–100).","Waypoints from Classic or Forever-oriented guides; not verified in-game. Zone coordinates are percentages (0–100)."),"npc-datacaveat");
 const s=append(detail,"p",null,"npc-source");s.append(document.createTextNode(S("Sources : ","Sources: ")));link(s,S("Guide de référence ↗","Reference guide ↗"),n.source);
 window.ForeverNpcMap?.show(n,store.db,npcName=>{
  const matched=store.filtered.find(r=>r.npc.name===npcName&&r.item?.id===store.active?.item?.id)||store.records.find(r=>r.npc.name===npcName&&r.item?.id===store.active?.item?.id)||store.filtered.find(r=>r.npc.name===npcName)||store.records.find(r=>r.npc.name===npcName);
  if(!matched)return;
  if(!store.filtered.some(r=>r.key===matched.key)){
   q.value="";zone.value="all";trade.value="all";aff.value="all";
   if(kind)kind.value="all";if(rank)rank.value="all";
   store.showReportsOnly=false;if(reports)reports.checked=false;
   store.filtered=filteredRecords();
  }
  if(type&&type.value!=="all"&&trainerType(matched.npc)!==type.value)type.value="all";
  if(weapon&&weapon.value!=="all"&&!(matched.npc.weapon_skills||[]).includes(weapon.value))weapon.value="all";
  selectRecord(matched);
 },{type:type?.value||"all",profession:trade.value,weaponSkill:weapon?.value||"all"});
 append(detail,"p",store.mode==="merchant"?S("Important : données historiques Classic. Les PNJ, objets, emplacements et stocks peuvent différer sur WoW Forever. Aucun suivi du stock en temps réel.","Important: historical Classic data. NPCs, items, positions and stock may differ on WoW Forever. No live inventory monitoring."):S("Certaines fiches proviennent des guides Forever ; les autres restent des références Classic. Les PNJ et leurs positions peuvent différer en jeu.","Some entries come from Forever guides; others are Classic references. NPC presence and locations may differ in-game."),"npc-datacaveat");
}
function refresh(){syncTrainerFilters();store.filtered=filteredRecords();if(!store.filtered.some(r=>r.key===store.active?.key))store.active=store.filtered[0]||null;renderList();renderDetail()}
for(const e of [q,zone,trade,aff,kind,rank,type,weapon].filter(Boolean))e.addEventListener(e===q?"input":"change",()=>{if(e===type){if(type.value==="weapon"){trade.value="all";if(rank)rank.value="all"}if(weapon)weapon.value="all"}if(e===trade&&trade.value!=="all"&&type){type.value="profession";if(weapon)weapon.value="all"}if(e===weapon&&weapon.value!=="all"&&type){type.value="weapon";trade.value="all";if(rank)rank.value="all"}updateFilterVisibility();refresh()});
if(reports)reports.addEventListener("change",e=>{store.showReportsOnly=e.target.checked;refresh()});
const params=new URLSearchParams(location.search);
if(params.get("q"))q.value=params.get("q").slice(0,120);
if(type&&["all","profession","weapon"].includes(params.get("type")))type.value=params.get("type");
fetch(root+"data/npcs.json").then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(db=>{
 if(db.schema_version!==1||!Array.isArray(db.npcs)||!db.items||!Array.isArray(db.evidence))throw Error("Invalid NPC data");
 store.db=db;makeRecords();filters();setupTrainerIconFilters();
 // Atlas deep links select the complete zone, not just a text search result.
 const requestedZone=params.get("zone");
 if(requestedZone&&Array.from(zone.options).some(option=>option.value===requestedZone))zone.value=requestedZone;
 updateFilterVisibility();
 refresh();$("npc-load-status").textContent=store.mode==="trainer"?db.npcs.filter(n=>n.role==="trainer").length+" "+S("maîtres recensés","trainers listed"):Object.keys(db.items).length+" "+S("objets Classic","Classic items");
}).catch(e=>{$("npc-load-status").textContent=S("Données indisponibles","Data unavailable");append(list,"p",S("Impossible de charger l'annuaire. Réessayez plus tard.","Unable to load the directory."),"npc-empty");console.warn("NPC dataset:",e.message)});
})();