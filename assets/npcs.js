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
const trainerIcon=n=>{const frame=mk("span",null,"npc-item-icon npc-trainer-icon");const img=mk("img");img.src="https://wow.zamimg.com/images/wow/icons/medium/"+(trainerIcons[n.profession]||"inv_hammer_04")+".jpg";img.alt="";img.loading="lazy";img.width=38;img.height=38;img.onerror=()=>{img.onerror=null;img.src=root+"assets/icons/inv_hammer_04.jpg"};frame.append(img);return frame};
const hasCoords=n=>Number.isFinite(n.coordinates?.x)&&Number.isFinite(n.coordinates?.y);
const trainerType=n=>n.trainer_kind==="weapon"?"weapon":"profession";
const human=n=>n>=60?(Math.floor(n/60)+" "+S("h","h")+(n%60?" "+(n%60)+" min":"")):fmt(n)+" min";const time=(a,b)=>a===b?human(a):human(a)+" – "+human(b);
const store={db:null,records:[],filtered:[],active:null,mode:document.body.dataset.page==="trainers"?"trainer":"merchant",showReportsOnly:false};
const q=$("npc-search"),zone=$("npc-zone"),trade=$("npc-profession"),aff=$("npc-faction"),rank=$("npc-rank"),reports=$("npc-evidence-only"),type=$("npc-type"),weapon=$("npc-weapon");
const list=$("npc-results"),detail=$("npc-detail"),count=$("npc-count"),kind=$("npc-kind");
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
 return (a.item?title(a.item):a.npc.name).localeCompare(b.item?title(b.item):b.npc.name);
 });
}
function renderList(){
 list.replaceChildren();for(const r of store.filtered){const b=mk("button",null,"npc-result");b.type="button";b.setAttribute("aria-selected",String(store.active?.key===r.key));b.setAttribute("role","option");const mark=r.item?iconNode(r.item):trainerType(r.npc)==="weapon"?mk("span","⚔","npc-item-icon"):trainerIcon(r.npc);b.append(mark);mark.setAttribute("aria-hidden","true");
 const copy=append(b,"span",null,"npc-result-copy");
 append(copy,"strong",r.item?title(r.item):r.npc.name);
 append(copy,"small",r.item?r.npc.name+" · "+side(r.npc):side(r.npc)+" · "+(trainerType(r.npc)==="weapon"?S("Maître d’armes","Weapon master"):profession[r.npc.profession]||r.npc.profession));
 if(!r.item){append(copy,"small",trainerType(r.npc)==="weapon"?(r.npc.weapon_skills||[]).map(k=>weaponLabels[k]||k).join(" · "):(r.npc.rank||"")+" · "+(hasCoords(r.npc)?S("Repère sur carte","Mapped waypoint"):S("Zone uniquement","Zone only")),"npc-result-extras");}
 if(r.item&&evidence(r.npc,r.item))append(copy,"span",S("Témoignages sur le stock","Stock reports"),"npc-evidence-flag");
 append(b,"span","›","npc-arrow").setAttribute("aria-hidden","true");
 b.addEventListener("click",()=>selectRecord(r));list.append(b)}
 if(!store.filtered.length)append(list,"p",S("Aucun résultat. Essayez un autre objet, une autre zone ou désactivez le filtre des témoignages.","No matches. Try another item, zone, or disable the reports-only filter."),"npc-empty");
 count.textContent=store.filtered.length+" "+S("résultats","results");
}
function sectionText(parent,head,body){append(parent,"h4",head);append(parent,"p",body,"npc-subtitle")}
function renderDetail(){
 detail.replaceChildren();const r=store.active;if(!r){append(detail,"p",S("Sélectionnez un résultat.","Select a result."),"npc-empty");return}
 const n=r.npc,i=r.item;
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
 const alternatives=store.db.npcs.filter(v=>v.name!==n.name&&v.offers.includes(String(i.id))&&(aff.value==="all"||v.faction==="neutral"||v.faction===aff.value));
 if(alternatives.length){
  const group=append(detail,"section",null,"npc-alternatives");
  append(group,"h4",S("Autres vendeurs ("+alternatives.length+")","Other vendors ("+alternatives.length+")"));
  const links=append(group,"div",null,"npc-alternative-list");
  for(const seller of alternatives.sort((a,b)=>a.zone[en?"en":"fr"].localeCompare(b.zone[en?"en":"fr"]))){
   const b=append(links,"button",seller.name+" · "+seller.zone[en?"en":"fr"]);b.type="button";
   b.addEventListener("click",()=>{
     q.value="";zone.value="all";trade.value="all";kind.value="all";store.showReportsOnly=false;$("npc-evidence-only").checked=false;
     const choice=store.records.find(rec=>rec.npc.name===seller.name&&rec.item?.id===i.id);
     if(choice){store.filtered=filteredRecords();selectRecord(choice)}
   });
  }
 }
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
  const matched=store.filtered.find(r=>r.npc.name===npcName)||store.records.find(r=>r.npc.name===npcName);
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
function refresh(){store.filtered=filteredRecords();if(!store.filtered.some(r=>r.key===store.active?.key))store.active=store.filtered[0]||null;renderList();renderDetail()}
for(const e of [q,zone,trade,aff,kind,rank,type,weapon].filter(Boolean))e.addEventListener(e===q?"input":"change",()=>{if(e===type&&type.value==="weapon"){trade.value="all";if(rank)rank.value="all"}if(e===trade&&trade.value!=="all"&&type)type.value="profession";if(e===weapon&&weapon.value!=="all"&&type){type.value="weapon";trade.value="all";if(rank)rank.value="all"}refresh()});
if(reports)reports.addEventListener("change",e=>{store.showReportsOnly=e.target.checked;refresh()});
const params=new URLSearchParams(location.search);
if(params.get("q"))q.value=params.get("q").slice(0,120);
if(type&&["all","profession","weapon"].includes(params.get("type")))type.value=params.get("type");
fetch(root+"data/npcs.json").then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(db=>{
 if(db.schema_version!==1||!Array.isArray(db.npcs)||!db.items||!Array.isArray(db.evidence))throw Error("Invalid NPC data");
 store.db=db;makeRecords();filters();
 // Atlas deep links select the complete zone, not just a text search result.
 const requestedZone=params.get("zone");
 if(requestedZone&&Array.from(zone.options).some(option=>option.value===requestedZone))zone.value=requestedZone;
 refresh();$("npc-load-status").textContent=store.mode==="trainer"?db.npcs.filter(n=>n.role==="trainer").length+" "+S("maîtres recensés","trainers listed"):Object.keys(db.items).length+" "+S("objets · Classic","items · Classic");
}).catch(e=>{$("npc-load-status").textContent=S("Données indisponibles","Data unavailable");append(list,"p",S("Impossible de charger l'annuaire. Réessayez plus tard.","Unable to load the directory."),"npc-empty");console.warn("NPC dataset:",e.message)});
})();