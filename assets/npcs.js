(()=>{"use strict";
const root="/forever_app/",en=document.documentElement.lang==="en";
const S=(fr,eng)=>en?eng:fr;
const $=id=>document.getElementById(id);
const mk=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e};
const val=x=>String(x??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const fmt=n=>new Intl.NumberFormat(en?"en-US":"fr-FR",{maximumFractionDigits:1}).format(n);
const title=d=>d.name[en?"en":"fr"];
const side=d=>d.zone[en?"en":"fr"];
const faction={alliance:S("Alliance","Alliance"),horde:S("Horde","Horde"),neutral:S("Neutre","Neutral")};
const profession={Alchimie:S("Alchimie","Alchemy"),Couture:S("Couture","Tailoring"),Ingénierie:S("Ingénierie","Engineering"),Enchantement:S("Enchantement","Enchanting"),Forge:S("Forge","Blacksmithing"),"Travail du cuir":S("Travail du cuir","Leatherworking"),Secourisme:S("Secourisme","First Aid")};
const human=n=>n>=60?(Math.floor(n/60)+" "+S("h","h")+(n%60?" "+(n%60)+" min":"")):fmt(n)+" min";const time=(a,b)=>a===b?human(a):human(a)+" – "+human(b);
const store={db:null,records:[],filtered:[],active:null,mode:"merchant",showReportsOnly:false};
const q=$("npc-search"),zone=$("npc-zone"),trade=$("npc-profession"),aff=$("npc-faction");
const list=$("npc-results"),detail=$("npc-detail"),count=$("npc-count");
const evidence=(vendor,item)=>store.db.evidence.find(e=>e.vendor_name===vendor.name&&e.item===item?.id?.toString());
const append=(parent,tag,t,cls)=>{const el=mk(tag,t,cls);parent.append(el);return el};
const link=(parent,text,url)=>{const a=mk("a",text);a.href=url;a.target="_blank";a.rel="noopener noreferrer";parent.append(a);return a};
const stockWord=item=>item.supply==="unlimited"?S("Stock illimité (référence Classic)","Unlimited stock (Classic reference)"):item.supply==="reputation"?S("Vente liée à la réputation","Reputation-gated sale"):S("Stock limité (référence Classic)","Limited stock (Classic reference)");
function filters(){
 for(const key of [...new Set(store.db.npcs.map(n=>n.profession))].sort((a,b)=>a.localeCompare(b))){const op=mk("option",profession[key]||key);op.value=key;trade.append(op)}
 const zones=new Map(store.db.npcs.map(n=>[n.zone.id,n.zone]));
 for(const z of [...zones.values()].sort((a,b)=>a[en?"en":"fr"].localeCompare(b[en?"en":"fr"]))){const op=mk("option",z[en?"en":"fr"]);op.value=z.id;zone.append(op)}
}
function makeRecords(){
 const rec=[];for(const n of store.db.npcs){if(n.role==="trainer"){rec.push({npc:n,item:null,key:"trainer:"+n.name});continue}
 for(const itemId of n.offers){const item=store.db.items[itemId];if(item)rec.push({npc:n,item,key:n.name+":"+itemId})}
 }store.records=rec;
}
function selectRecord(r){store.active=r;renderList();renderDetail()}
function filteredRecords(){
 const needle=val(q.value);
 return store.records.filter(r=>{
 const {npc:n,item}=r;
 if(n.role!==store.mode)return false;
 if(aff.value!=="all"&&n.faction!==aff.value&&n.faction!=="neutral")return false;
 if(trade.value!=="all"&&n.profession!==trade.value)return false;
 if(zone.value!=="all"&&n.zone.id!==zone.value)return false;
 if(store.showReportsOnly&&!item)return false;
 if(store.showReportsOnly&&!evidence(n,item))return false;
 if(!needle)return true;
 const terms=[n.name,n.zone.fr,n.zone.en,n.note,n.profession,profession[n.profession],n.rank,item?.name?.fr,item?.name?.en,item?.id];
 return terms.some(x=>val(x).includes(needle));
 }).sort((a,b)=>{
 const ea=!!a.item&&!!evidence(a.npc,a.item),eb=!!b.item&&!!evidence(b.npc,b.item);
 if(ea!==eb)return ea?-1:1;
 return (a.item?title(a.item):a.npc.name).localeCompare(b.item?title(b.item):b.npc.name);
 });
}
function renderList(){
 list.replaceChildren();for(const r of store.filtered){const b=mk("button",null,"npc-result");b.type="button";b.setAttribute("aria-selected",String(store.active?.key===r.key));b.setAttribute("role","option");const mark=append(b,"span",r.item?"✧":"⚒","npc-item-icon");mark.setAttribute("aria-hidden","true");
 const copy=append(b,"span",null,"npc-result-copy");
 append(copy,"strong",r.item?title(r.item):r.npc.name);
 append(copy,"small",r.item?r.npc.name+" · "+side(r.npc):side(r.npc)+" · "+(profession[r.npc.profession]||r.npc.profession));
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
 append(detail,"span",i?S("Objet · Vendeur","Item · Vendor"):S("Métier · Maître","Profession · Trainer"),"npc-detail-kicker");
 append(detail,"h3",i?title(i):n.name);
 append(detail,"p",i?n.name:S("Maître de métier","Profession trainer"),"npc-subtitle");
 const chips=append(detail,"div",null,"npc-chips");
 append(chips,"span",profession[n.profession]||n.profession,"npc-chip gold");
 append(chips,"span",faction[n.faction],"npc-chip");
 if(i)append(chips,"span",S("Compétence "+i.skill,"Skill "+i.skill),"npc-chip");
 if(n.rank)append(chips,"span",en?({"Compagnon":"Journeyman","Expert":"Expert","Artisan":"Artisan"}[n.rank]||n.rank):n.rank,"npc-chip");
 const place=append(detail,"div",null,"npc-location"), p=append(place,"div");
 append(p,"strong",side(n));if(n.note&&(!en||n.note_en))append(p,"small",en?n.note_en:n.note);
 append(place,"span",fmt(n.coordinates.x)+" / "+fmt(n.coordinates.y),"npc-coords");
 const actions=append(detail,"div",null,"npc-actions"),command="/way "+n.coordinates.x+" "+n.coordinates.y;
 const btn=append(actions,"button",S("Copier /way","Copy /way"),"npc-copy");btn.type="button";
 btn.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(command);btn.textContent=S("Commande copiée ✓","Copied ✓")}catch(_){btn.textContent=command}});
 if(i){link(actions,S("Fiche Classic ↗","Classic item ↗"),"https://www.wowhead.com/classic/item="+i.id);
 link(actions,S("Vérifier Forever ↗","Check Forever ↗"),"https://www.wowhead.com/forever/item="+i.id)}
 if(n.id)link(actions,S("Fiche PNJ ↗","NPC details ↗"),"https://www.wowhead.com/classic/npc="+n.id);
 if(store.db && ["azshara","blasted-lands","burning-steppes","epl","searing-gorge","silithus","swamp-of-sorrows","ungoro","winterspring","wpl"].includes(n.zone.id)){
 const map=append(detail,"div",null,"npc-map"),img=mk("img");img.src=root+"assets/maps/"+n.zone.id+".jpg";img.alt=S("Carte de référence : ","Reference map: ")+side(n);img.loading="lazy";map.append(img);
 const pin=append(map,"span",null,"npc-map-marker");pin.style.left=n.coordinates.x+"%";pin.style.top=n.coordinates.y+"%";
 append(detail,"div",S("Repère Classic non vérifié sur Forever.","Classic position not verified on Forever."),"npc-map-caption")
 }
 if(i){
 const panel=append(detail,"section",null,"npc-stock");
 append(panel,"span",S("Disponibilité estimée","Reference availability"),"npc-stock-label");
 append(panel,"div",stockWord(i),"npc-stock-value");
 const report=evidence(n,i);
 if(report){
 const obs=append(panel,"div",null,"npc-evidence");
 append(obs,"strong",report.kind==="unlimited_report"?S("Source Classic : stock illimité","Classic source: unlimited stock"):S("Attente observée : ","Observed wait: ")+time(report.min_minutes,report.max_minutes));
 append(obs,"p",report[en?"en":"fr"]);
 append(obs,"p",report.confidence==="contradictory"?S("Confiance faible · Témoignages contradictoires","Low confidence · Conflicting reports"):report.confidence==="low"?S("Confiance faible · Peu de témoignages","Low confidence · Limited reports"):S("Témoignages communautaires","Community reports"));
 link(obs,S("Consulter la source ↗","View source ↗"),report.url);
 }else append(panel,"p",i.supply==="limited"?S("Délai de réapparition non documenté pour ce couple objet-vendeur.","No documented restock time for this item at this vendor."):S("Aucun délai fiable identifié dans les commentaires.","No reliable delay documented in comments."));
 append(panel,"p",S("Les durées indiquent des attentes rapportées, pas un minuteur exact ni le prochain réapprovisionnement.","These are reported waits, not exact timers or predictions of the next restock."));
 }else{
 sectionText(detail,S("Formation","Training"),S("Rang référencé : ","Referenced tier: ")+(n.rank||S("non indiqué","unspecified")));
 append(detail,"p",S("Les maîtres de métiers apprennent des compétences ; ils ne vendent pas nécessairement les objets recherchés.","Trainers teach professions; they do not necessarily sell the items in this catalog."),"npc-subtitle")
 }
 append(detail,"p",S("Coordonnées de zone : X vers la droite, Y vers le bas (0–100). Utiliser /way une fois dans cette zone avec un addon compatible.","Zone coordinates: X grows right, Y grows down (0–100). Use /way when inside this zone with a compatible add-on."),"npc-datacaveat");
 const s=append(detail,"p",null,"npc-source");s.append(document.createTextNode(S("Sources : ","Sources: ")));link(s,S("Guide de référence ↗","Reference guide ↗"),n.source);
 append(detail,"p",S("Important : données historiques Classic. Les PNJ, objets, emplacements et stocks peuvent différer sur WoW Forever. Aucun suivi du stock en temps réel.","Important: historical Classic data. NPCs, items, positions and stock may differ on WoW Forever. No live inventory monitoring."),"npc-datacaveat");
}
function refresh(){store.filtered=filteredRecords();if(!store.filtered.some(r=>r.key===store.active?.key))store.active=store.filtered[0]||null;renderList();renderDetail()}
for(const e of [q,zone,trade,aff])e.addEventListener(e===q?"input":"change",refresh);
document.querySelectorAll("[data-npc-mode]").forEach(btn=>btn.addEventListener("click",()=>{
 store.mode=btn.dataset.npcMode;
 document.querySelectorAll("[data-npc-mode]").forEach(b=>b.setAttribute("aria-pressed",String(b===btn)));
 if(store.mode==="trainer"&&store.showReportsOnly){store.showReportsOnly=false;$("npc-evidence-only").checked=false}$("npc-evidence-only").disabled=store.mode==="trainer"
 refresh()
}));
$("npc-evidence-only").addEventListener("change",e=>{store.showReportsOnly=e.target.checked;refresh()});
const params=new URLSearchParams(location.search);
if(params.get("q"))q.value=params.get("q").slice(0,120);
fetch(root+"data/npcs.json").then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(db=>{
 if(db.schema_version!==1||!Array.isArray(db.npcs)||!db.items||!Array.isArray(db.evidence))throw Error("Invalid NPC data");
 store.db=db;makeRecords();filters();refresh();$("npc-load-status").textContent=S("Références Classic","Classic references");
}).catch(e=>{$("npc-load-status").textContent=S("Données indisponibles","Data unavailable");append(list,"p",S("Impossible de charger l'annuaire. Réessayez plus tard.","Unable to load the directory."),"npc-empty");console.warn("NPC dataset:",e.message)});
})();