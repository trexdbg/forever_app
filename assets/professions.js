/* ForEveroth professions: Forever beta metadata plus opt-in audited recipe archive. */
(()=>{"use strict";
const ROOT="/forever_app/",en=document.documentElement.lang==="en";
const T=(fr,eng)=>en?eng:fr,$=id=>document.getElementById(id);
const mk=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e};
const put=(p,tag,text,cls)=>{const v=mk(tag,text,cls);p.append(v);return v};
const safe=n=>Number.isFinite(Number(n))?Number(n):0;
const fmt=n=>new Intl.NumberFormat(en?"en-US":"fr-FR").format(n);
const imageNames={171:"trade_alchemy",164:"trade_blacksmithing",333:"trade_engraving",202:"trade_engineering",182:"trade_herbalism",165:"trade_leatherworking",186:"trade_mining",393:"inv_misc_pelt_wolf_01",197:"trade_tailoring",185:"inv_misc_food_15",356:"trade_fishing",129:"spell_holy_sealofsacrifice"};
const state={meta:null,archive:null,active:null,query:"",status:"all",sort:"skill",category:"all",skill:150,page:0};
const PAGE=30;
const groupLabels={craft:T("Fabrication","Crafting"),gather:T("Récolte","Gathering"),secondary:T("Secondaire","Secondary")};
const label=p=>p.name[en?"en":"fr"];
const imgFor=(p)=>"https://wow.zamimg.com/images/wow/icons/medium/"+(imageNames[p.id]||"inv_scroll_07")+".jpg";
function pic(p){const img=mk("img");img.src=imgFor(p);img.alt="";img.width=42;img.height=42;img.loading="lazy";img.onerror=()=>{img.onerror=null;img.src=ROOT+"assets/icons/inv_scroll_07.jpg"};return img}
function external(p,text,url){const a=put(p,"a",text);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a}
const loading=$("prof-load"),cards=$("prof-grid"),chosen=$("prof-selected"),facts=$("prof-facts"),counter=$("prof-recipes-count");
function item(id){return state.archive?.items?.[String(id)]||{name:T("Objet ","Item ")+id,id}}
function itemText(id){const i=item(id);return (i.available===false?i.classicName||i.name:i.name)||T("Objet ","Item ")+id}
function statusWord(status){return ({new:T("Nouveau Forever","New in Forever"),changed:T("Modifié","Changed"),unchanged:T("Identique à Classic","Same as Classic"),inherited:T("Identifiant hérité","Inherited ID"),removed:T("Absent de Forever","Not in Forever")})[status]||status}
function choose(p,updateHash=true){
 state.active=p;state.page=0;cards.querySelectorAll("button[data-prof]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.prof===p.slug)));
 chosen.replaceChildren();
 const top=put(chosen,"div",null,"prof-selected-head");const head=put(top,"div",null,"prof-namegroup");head.append(pic(p));
 const words=put(head,"div");put(words,"span",groupLabels[p.group],"prof-mini-label");put(words,"h3",label(p));put(top,"span",fmt(p.count)+" "+T("recettes · client Forever","recipes · Forever client"),"prof-selected-count");
 put(chosen,"p",p.description[en?"en":"fr"],"prof-summary");
 const line=put(chosen,"div",null,"prof-selected-stats");
 put(line,"span",fmt(p.added)+" "+T("nouvelles","new"),"prof-stat-new");
 put(line,"span",fmt(p.changed)+" "+T("modifiées","changed"),"prof-stat-change");
 const title=put(chosen,"h4",T("Exemples de campements","Camp crafting highlights"));
 const tiers=put(chosen,"div",null,"prof-camp-list");
 for(const c of p.camp){const a=put(tiers,"div",null,"prof-camp");
  put(a,"span",c.skill?String(c.skill):"·","prof-camp-level");put(a,"strong",c.name);
 }
 if(p.highlights?.length){put(chosen,"h4",T("Exemples de nouveautés","Featured examples"));
  const examples=put(chosen,"div",null,"prof-highlights");for(const x of p.highlights)put(examples,"span",x);
 }
 put(chosen,"h4",T("Paliers de formation","Training tiers"));
 const levels=put(chosen,"div",null,"prof-training-tiers");
 for(const row of (state.meta.trainer_ranks.variants[p.slug]||(p.group==="gather"?state.meta.trainer_ranks.variants.gather:state.meta.trainer_ranks.rows))){
  const block=put(levels,"div",null,"prof-training-tier");
  put(block,"strong",row.name[en?"en":"fr"]+" "+row.from+"–"+row.to);
  put(block,"small",row.min_skill?T("Métier "+row.min_skill,"Skill "+row.min_skill)+(row.min_level?" · "+T("Niv. ","Lv. ")+row.min_level:""):T("Accessible dès le début","Available from the start"));
 }
 put(chosen,"h4",T("Maîtres recensés sur Forever ("+p.trainers.length+")","Forever guide trainers ("+p.trainers.length+")"));
 const trainerNote=put(chosen,"p",state.meta.trainer_directory_status[en?"en":"fr"],"prof-trainer-note");
 const trainerFilter=put(chosen,"div",null,"prof-trainer-controls");
 const factionSelect=put(trainerFilter,"select");factionSelect.setAttribute("aria-label",T("Filtrer la faction","Filter trainer faction"));
 for(const [id,fr,eng] of [["all","Toutes les factions","All factions"],["alliance","Alliance","Alliance"],["horde","Horde","Horde"],["neutral","Neutre","Neutral"]]){const option=put(factionSelect,"option",T(fr,eng));option.value=id;}
 const tSearch=put(trainerFilter,"input");tSearch.type="search";tSearch.placeholder=T("Maître ou zone…","Trainer or zone…");tSearch.setAttribute("aria-label",T("Rechercher un maître","Search trainers"));
 const trainerList=put(chosen,"div",null,"prof-trainer-list");
 const tierLabel={apprentice:T("Apprenti","Apprentice"),journeyman:T("Compagnon","Journeyman"),expert:T("Expert","Expert"),artisan:T("Artisan","Artisan"),all:T("1–300 référencé","1–300 listed")};
 function updateTrainers(){
  const q=(tSearch.value||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().trim();
  const found=p.trainers.filter(x=>(factionSelect.value==="all"||x.faction===factionSelect.value)&&[x.name,x.zone.fr,x.zone.en].some(t=>t.normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().includes(q)));
  trainerList.replaceChildren();
  for(const trainer of found.slice(0,22)){
   const row=put(trainerList,"div",null,"prof-trainer-row");
   put(row,"strong",trainer.name);
   put(row,"span",trainer.zone[en?"en":"fr"]);
   put(row,"small",tierLabel[trainer.tier]||trainer.tier);
  }
  if(!found.length)put(trainerList,"p",T("Aucun maître dans ce filtre.","No matching trainers."),"prof-empty");
  if(found.length>22)put(trainerList,"p",T("Affinez pour voir les autres maîtres.","Refine to see other trainers."),"prof-empty");
 }
 factionSelect.addEventListener("change",updateTrainers);
 tSearch.addEventListener("input",updateTrainers);
 updateTrainers();
 const trainerSource=put(chosen,"p",null,"prof-trainer-source");external(trainerSource,T("Source des maîtres ↗","Trainer guide ↗"),p.trainers_source);
 const actions=put(chosen,"div",null,"prof-links");
 external(actions,T("Liste à jour ↗","Current list ↗"),p.source);
 external(actions,T("Guide 1–300 ↗","1–300 guide ↗"),p.leveling_guide);
 const toTrainer=put(actions,"button",T("Localiser les maîtres ↓","Find trainers ↓"),"prof-trainer-jump");toTrainer.type="button";toTrainer.addEventListener("click",()=>{
  const term=$("npc-search");if(term){term.value=p.name.fr;term.dispatchEvent(new Event("input",{bubbles:true}));}
  $("prof-trainers")?.scrollIntoView({behavior:"smooth",block:"start"});
 });
 if(p.id===186){const m=put(actions,"a",T("Carte des minerais ↗","Ore maps ↗"));m.href=ROOT+(en?"en/":"")+"minage/"}
 const archives=$("prof-archive");if(archives){archives.hidden=!state.archive;render();}
 if(updateHash)history.replaceState(null,"","#"+p.slug);
}
function renderCards(){
 cards.replaceChildren();for(const p of state.meta.professions){
  const b=put(cards,"button",null,"prof-card");b.type="button";b.dataset.prof=p.slug;b.setAttribute("aria-pressed",String(state.active?.slug===p.slug));
  const heading=put(b,"div",null,"prof-card-head");heading.append(pic(p));
  const wrap=put(heading,"span");put(wrap,"strong",label(p));put(wrap,"small",groupLabels[p.group]);
  put(b,"span",fmt(p.count)+" "+T("recettes","recipes"),"prof-card-count");
  const nums=put(b,"div",null,"prof-card-counts");put(nums,"span","★ "+p.added+" "+T("nouvelles","new"));put(nums,"span","◆ "+p.changed+" "+T("modifiées","changed"));
  b.addEventListener("click",()=>choose(p));
 }
}
function testArchive(data){return data&&Array.isArray(data.professions)&&data.professions.length>=12&&Array.isArray(data.records)&&data.records.length>2000&&data.items&&data.build==="1.60.1.69876"}
async function loadArchive(){
 const btn=$("prof-load-archive");btn.disabled=true;btn.textContent=T("Chargement du catalogue…","Loading catalog…");
 const status=$("prof-archive-status");
 status.textContent=T("Données externes archivées, plusieurs Mo à charger.","Loading archived external data (several MB).");
 try{
 let data=null,err=null;
 for(const url of [state.meta.detailed_archive.url,state.meta.detailed_archive.fallback_url]){
  try{const response=await fetch(url,{mode:"cors"});if(!response.ok)throw Error("HTTP "+response.status);
   const value=await response.json();if(!testArchive(value))throw Error("Unrecognized dataset or build");data=value;break;
  }catch(e){err=e;}
 }
 if(!data)throw err||Error("Load failure");
 state.archive=data;
 state.archive.searchIndex=new Map();
 for(const r of data.records){
  if(r.status==="removed"||r.seasonal)continue;
  const idx=[r.name,r.id,r.category,r.description,...(r.outputs||[]).map(x=>itemText(x.id)),...(r.reagents||[]).map(x=>itemText(x.id)),...(r.books||[]).map(itemText)].join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  state.archive.searchIndex.set(r.professionID+":"+r.id,idx);
 }
 status.textContent=T("Archive Forever "+data.build+" chargée. Plus ancienne que le référentiel actuel ("+state.meta.reference_build+").","Loaded Forever archive "+data.build+". Older than the current reference ("+state.meta.reference_build+").");
 btn.hidden=true;$("prof-archive").hidden=false;render();
 }catch(e){
  status.textContent=T("Le catalogue externe ne peut pas être chargé. Utilisez les liens « Liste à jour » pour consulter les recettes, ou réessayez.","The external catalog could not be loaded. Use the current recipe links or retry.");
  btn.disabled=false;btn.textContent=T("Réessayer","Retry");
  console.warn("Profession archive",e);
 }
}
function tier(r){
 const low=safe(r.skillupLow),high=safe(r.skillupHigh);
 if(!high)return T("Palier inconnu","No threshold");
 if(state.skill>=high)return T("Gris","Grey");
 if(state.skill<low)return T("Orange","Orange");
 return T("Jaune / vert","Yellow / green");
}
function render(){
 if(!state.archive||!state.active)return;
 const rows=state.archive.records.filter(r=>{
  if(r.professionID!==state.active.id||r.status==="removed"||r.seasonal)return false;
  if(state.status!=="all"&&r.status!==state.status)return false;
  if(state.category==="camp"&&r.category!=="Camping")return false;
  if(state.category==="recipes"&&!["recipe","enchant"].includes(r.kind))return false;
  if(state.category==="materials"&&r.category!=="Reagents"&&r.category!=="Parts")return false;
  if(state.query&&!state.archive.searchIndex.get(r.professionID+":"+r.id)?.includes(state.query))return false;
  return true;
 });
 if(state.sort==="name")rows.sort((a,b)=>a.name.localeCompare(b.name));
 else if(state.sort==="status")rows.sort((a,b)=>(a.status==="new"?-1:a.status==="changed"?0:1)-(b.status==="new"?-1:b.status==="changed"?0:1)||a.name.localeCompare(b.name));
 else rows.sort((a,b)=>safe(a.skillupLow)-safe(b.skillupLow)||a.name.localeCompare(b.name));
 const total=rows.length;const pages=Math.max(1,Math.ceil(total/PAGE));
 state.page=Math.max(0,Math.min(state.page,pages-1));
 const from=state.page*PAGE;counter.textContent=fmt(total)+" "+T("entrées du catalogue "+state.archive.build,"entries from archive "+state.archive.build);
 $("prof-page").textContent=(state.page+1)+" / "+pages;
 $("prof-prev").disabled=state.page===0;$("prof-next").disabled=state.page>=pages-1;
 const out=$("prof-recipe-list");out.replaceChildren();
 const list=rows.slice(from,from+PAGE);
 if(!list.length){put(out,"p",T("Aucun résultat dans cette sélection.","No matching recipes."),"prof-empty");return}
 for(const r of list){
  const card=put(out,"article",null,"prof-recipe");
  const top=put(card,"div",null,"prof-recipe-heading");
  const typ=put(top,"span",statusWord(r.status),"prof-tag "+(r.status==="new"?"new":r.status==="changed"?"changed":""));
  if(r.category)put(top,"span",r.category,"prof-recipe-category");
  const h=put(card,"h4",r.name);
  const sub=put(card,"p",T("Sort ","Spell ")+r.id+(r.skillupLow||r.skillupHigh?" · "+T("Seuils de progression","Skill-up thresholds")+" "+r.skillupLow+" / "+r.skillupHigh:""),"prof-recipe-meta");
  const body=put(card,"div",null,"prof-recipe-parts");
  if(r.outputs?.length){const pane=put(body,"div");put(pane,"small",T("Fabrique","Produces"),"prof-recipe-label");
   for(const o of r.outputs){const p=put(pane,"p",null);const mult=safe(o.min)>0?fmt(o.min)+" × ":"";p.textContent=mult+itemText(o.id);}
  }
  if(r.reagents?.length){const pane=put(body,"div");put(pane,"small",T("Composants","Materials"),"prof-recipe-label");
   for(const m of r.reagents){put(pane,"p",fmt(m.count)+" × "+itemText(m.id));}
  }
  if(r.kind==="enchant"&&r.enchantments?.length)put(card,"p",r.enchantments.map(x=>x.name).join(" · "),"prof-recipe-enchant");
  if(r.tools?.length||r.station){
   const req=put(card,"p",null,"prof-recipe-meta");
   req.textContent=(r.station?T("Atelier : ","Station: ")+r.station+" · ":"")+(r.tools?.length?T("Outil : ","Tool: ")+r.tools.join(", "):"");
  }
  const foot=put(card,"div",null,"prof-recipe-footer");
  put(foot,"span",tier(r),"prof-tier");
  if(r.books?.length){
   const books=put(card,"details");put(books,"summary",T("Plan ou patron requis ("+r.books.length+")","Recipe book ("+r.books.length+")"));
   for(const id of r.books){const row=put(books,"p",null);
    external(row,itemText(id)+" ↗","https://www.wowhead.com/forever/item="+id);
    const vendor=put(row,"a"," · "+T("Trouver un vendeur","Find vendor"));vendor.href=ROOT+(en?"en/":"")+"marchands/?q="+encodeURIComponent(itemText(id));
   }
  }
  external(foot,T("Sort sur Wowhead ↗","Spell on Wowhead ↗"),"https://www.wowhead.com/forever/spell="+r.id);
 }
}
const handle=$("prof-load-archive");handle.addEventListener("click",loadArchive);
$("prof-recipe-search").addEventListener("input",e=>{state.query=e.target.value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();state.page=0;render()});
$("prof-recipe-status").addEventListener("change",e=>{state.status=e.target.value;state.page=0;render()});
$("prof-recipe-sort").addEventListener("change",e=>{state.sort=e.target.value;state.page=0;render()});
$("prof-recipe-type").addEventListener("change",e=>{state.category=e.target.value;state.page=0;render()});
$("prof-skill").addEventListener("input",e=>{state.skill=+e.target.value;$("prof-skill-label").textContent=e.target.value;render()});
$("prof-prev").addEventListener("click",()=>{state.page--;render();$("prof-archive").scrollIntoView({block:"start",behavior:"smooth"})});
$("prof-next").addEventListener("click",()=>{state.page++;render();$("prof-archive").scrollIntoView({block:"start",behavior:"smooth"})});
fetch(ROOT+"data/professions.json").then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(data=>{
 if(data.schema_version!==1||data.professions?.length!==12)throw Error("Invalid profession metadata");
 state.meta=data;
 const total=data.professions.reduce((v,p)=>v+p.count,0),newTotal=data.professions.reduce((v,p)=>v+p.added,0);
 put(facts,"span",fmt(total)+" "+T("recettes","recipes"));
 put(facts,"span",fmt(newTotal)+" "+T("nouvelles","new"));
 put(facts,"span","12 "+T("métiers","professions"));
 $("prof-build").textContent=data.reference_build;
 renderCards();
 const hash=location.hash.replace("#",""),p=data.professions.find(p=>p.slug===hash)||data.professions[0];
 choose(p,false);loading.textContent=T("Client Forever · bêta "+data.reference_build,"Forever client · beta "+data.reference_build);
}).catch(err=>{loading.textContent=T("Données indisponibles","Data unavailable");put(cards,"p",T("Impossible de charger les métiers.","Unable to load the profession directory."));console.warn("Professions",err)});
})();