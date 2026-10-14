/* Agent 03 — research-only Forever crafting preview. No archive or merchant-side mutations. */
(()=>{"use strict";
const root=document.getElementById("craft-beta");
if(!root)return;
const en=document.documentElement.lang==="en",T=(fr,eng)=>en?eng:fr;
const find=id=>document.getElementById(id),input=find("craft-beta-search"),list=find("craft-beta-list"),
 detail=find("craft-beta-detail"),notice=find("craft-beta-status"),summary=find("craft-beta-count");
const validId=x=>/^[1-9]\d*$/.test(String(x??""))&&Number.isSafeInteger(Number(x));
const safeUrl=x=>{try{const u=new URL(x);return u.protocol==="https:"&&!u.username&&!u.password?u.href:null}catch{return null}};
const fold=x=>String(x??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase().trim();
const narrow=()=>typeof window.matchMedia==="function"&&window.matchMedia("(max-width: 720px)").matches;
const make=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined&&text!==null)node.textContent=String(text);if(cls)node.className=cls;return node};
const put=(parent,tag,text,cls)=>{const n=make(tag,text,cls);parent.append(n);return n};
function proof(parent,caption,href){
 const url=safeUrl(href);if(!url)return put(parent,"span",T("Preuve non disponible","Evidence unavailable"),"craft-muted");
 const a=put(parent,"a",caption+" ↗","craft-proof");a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;
}
const state={data:null,pending:null,selected:null,query:""};
function validate(d){
 if(!d||d.schema_version!==1||d.scope?.status!=="research_only_not_published"||
    d.scope?.preview?.status!=="opt_in_documentary_preview"||
    !Array.isArray(d.scope.preview.recipe_item_ids)||d.scope.preview.recipe_item_ids.length!==8||
    !d.items||Array.isArray(d.items)||!Array.isArray(d.acquisitions)||!Array.isArray(d.recipes)||d.recipes.length!==8)
  return false;
 const ids=new Set(),seen=new Set();
 for(const r of d.recipes){
  if(!r||!validId(r.output_item_id)||!validId(r.spell_id)||ids.has(r.output_item_id)||
    !d.scope.preview.recipe_item_ids.includes(r.output_item_id)||!Array.isArray(r.ingredients)||
    !r.ingredients.every(x=>x&&validId(x.item_id)&&Number.isSafeInteger(x.quantity)&&x.quantity>0&&d.items[String(x.item_id)])||
    !["unknown","conflicting_sources","documented_forever"].includes(r.output_quantity_status)||
    !(r.output_quantity===null||(Number.isSafeInteger(r.output_quantity)&&r.output_quantity>0))||
    (r.output_quantity_status==="conflicting_sources"&&r.output_quantity!==null)||
    !safeUrl(r.evidence_url)||ids.has(r.output_item_id))return false;
  const o=d.items[String(r.output_item_id)];
  if(!o||!o.name||!o.name.fr||!o.name.en||o.id!==r.output_item_id||r.profession_id!==202)return false;
  ids.add(r.output_item_id);
 }
 for(const [key,o] of Object.entries(d.items)){
  if(!validId(key)||!o||Number(key)!==o.id||!o.name||typeof o.name.fr!=="string"||
    typeof o.name.en!=="string"||!o.name.fr||!o.name.en)return false;
  seen.add(Number(key));
 }
 return ids.size===8&&seen.size===21&&d.scope.preview.recipe_item_ids.every(x=>ids.has(x));
}
const recipeFor=id=>state.data?.recipes.find(r=>r.output_item_id===Number(id))||null;
const smeltFor=id=>state.data?.acquisitions.find(a=>a.method==="smelting"&&a.item_id===Number(id))||null;
const itemFor=id=>state.data?.items[String(id)]||null;
const title=item=>item?.name?.[en?"en":"fr"]||item?.name?.en||item?.name?.fr||T("Objet inconnu","Unknown item");
function linkSelect(parent,id,quantity){
 const item=itemFor(id),r=recipeFor(id),smelt=smeltFor(id);
 const button=put(parent,"button",null,"craft-component");button.type="button";
 put(button,"strong",(quantity!=null?quantity+" × ":"")+title(item));
 put(button,"small","#"+id+" · "+(r?T("Voir la fabrication →","View recipe →"):smelt?T("Voir la fonte →","View smelting →"):T("Composant · voir la source →","Material · view sources →")));
 button.addEventListener("click",()=>select(id,true));return button;
}
function claimsFor(id){return Array.isArray(state.data?.acquisitions)?state.data.acquisitions.filter(a=>a?.item_id===Number(id)):[]}
function renderList(){
 if(!state.data)return;
 list.replaceChildren();
 let hits=0;
 for(const r of state.data.recipes){
  const item=itemFor(r.output_item_id);
  if(!item)continue;
  const terms=[item.name.fr,item.name.en,String(r.output_item_id),String(r.spell_id)].map(fold);
  if(state.query&&!terms.some(t=>t.includes(state.query)))continue;
  hits++;
  const row=put(list,"button",null,"craft-result");row.type="button";row.dataset.craft=String(r.output_item_id);
  row.setAttribute("aria-pressed",String(state.selected===r.output_item_id));
  put(row,"strong",title(item));
  put(row,"small","#"+r.output_item_id+" · "+T("sort","spell")+" "+r.spell_id);
  row.addEventListener("click",()=>select(r.output_item_id,true));
 }
 if(!hits)put(list,"p",T("Aucune fabrication correspondant à cette recherche.","No documented craft matches this search."),"craft-muted");
 summary.textContent=T(hits+" / 8 fabrications documentées",""+hits+" / 8 documented crafts");
}
function renderSmelting(parent,a){
 put(parent,"strong",T("Fonte documentée pour Forever · sort ","Documented Forever smelting · spell ")+a.spell_id,"craft-method-title");
 put(parent,"p",T("Métier : Minage · forge nécessaire. ","Profession: Mining · forge required. ")+
  (a.skill_required===null?T("Compétence d’apprentissage inconnue.","Trainer learning requirement unknown."):
   T("Compétence de départ documentée : ","Documented starting skill: ")+a.skill_required)+
  T(" Seuil jaune : "," Yellow threshold: ")+a.skill_yellow+".","craft-footnote");
 proof(parent,T("Recette et seuil jaune (client Forever)","Recipe and yellow threshold (Forever client)"),a.evidence_url);
 const ingredients=put(parent,"div",null,"craft-component-list");
 for(const c of a.ingredients||[])if(c&&validId(c.item_id)&&itemFor(c.item_id))linkSelect(ingredients,c.item_id,c.quantity);
 put(parent,"p",T("Rendement de fonte inconnu : sources contradictoires. Ne pas calculer le nombre de fontes ni les besoins totaux.",
  "Smelting yield unknown: conflicting sources. Do not calculate smelt count or total materials."),"craft-caution");
 if(Array.isArray(a.output_quantity_candidates)){
  const sources=put(parent,"div",null,"craft-proof-row");
  for(const c of a.output_quantity_candidates)if(c&&Number.isSafeInteger(c.quantity))
   proof(sources,T("Source : "+c.quantity+" barre(s)","Source: "+c.quantity+" bar(s)"),c.source_url);
 }
 put(parent,"p",T("Accès au maître, fonte effective et quantité obtenue en jeu non confirmés.",
  "Trainer access, actual smelt and in-game yield not confirmed."),"craft-footnote");
}
function renderMining(parent,a){
 put(parent,"strong",T("Minage : ","Mining: ")+(a.node?.[en?"en":"fr"]||T("filon documenté","documented node")),"craft-method-title");
 put(parent,"p",T("Compétence de minage du filon : ","Node mining skill: ")+a.mining_skill+". "+
   T("Zones citées dans le guide : ","Guide-listed zones: ")+(a.zones_documented||[]).join(", ")+".","craft-footnote");
 proof(parent,T("Guide Minage Forever","Forever Mining guide"),a.evidence_url);
 put(parent,"p",T("Emplacement exact, rendement du filon et présence en jeu non vérifiés.",
  "Exact node coordinates, gathering yield and actual spawn are not verified."),"craft-muted");
}
function displayAcquisition(parent,id){
 const entries=claimsFor(id);
 if(!entries.length){put(parent,"p",T("Source d’obtention non vérifiée sur Forever","Acquisition source unverified on Forever"),"craft-caution");return;}
 const block=put(parent,"div",null,"craft-acquisition");
 put(block,"h5",T("Modes d’obtention · preuves documentaires, non confirmés en jeu","Acquisition sources · documentary evidence, not confirmed in game"));
 for(const entry of entries){
  const row=put(block,"div",null,"craft-method");
  if(entry.method==="legacy_vendor_catalogue"){
   row.textContent=T(
    entry.candidate_sellers+" marchands candidats issus de Classic · disponibilité, prix, stock et réapprovisionnement Forever inconnus. ",
    entry.candidate_sellers+" Classic-reference candidate vendors · Forever availability, prices, stock and restock unknown. ");
   proof(row,T("Référence Classic","Classic reference"),entry.evidence_url);
  }else if(entry.method==="vendor_index"){
   row.textContent=T("Liste de vendeurs référencée Classic, non vérifiée sur Forever. ","Vendor index labeled Classic, not verified on Forever. ");
   proof(row,T("Référence Classic","Classic reference"),entry.evidence_url);
  }else if(entry.method==="smelting_candidate"){
   row.textContent=T("Source d’obtention non vérifiée sur Forever.","Acquisition source unverified on Forever.");
  }else if(entry.method==="smelting"){
   renderSmelting(row,entry);
  }else if(entry.method==="mining_node"){
   renderMining(row,entry);
  }else if(entry.method==="classic_loot_reference"){
   put(row,"p",T("Butin possible dans les références Classic · aucune créature ni probabilité vérifiée sur Forever.","Possible Classic-reference loot · no creature or drop chance verified on Forever."),"craft-footnote");
   proof(row,T("Référence Classic uniquement","Classic reference only"),entry.evidence_url);
  }
 }
}
function displaySelected(){
 detail.replaceChildren();
 if(!state.data||!validId(state.selected))return;
 const item=itemFor(state.selected);if(!item){put(detail,"p",T("Objet non documenté dans ce lot.","Item not documented in this subset."),"craft-muted");return}
 const r=recipeFor(state.selected),smelt=smeltFor(state.selected),head=put(detail,"div",null,"craft-detail-head");
 if(typeof item.icon==="string"&&/^[a-z0-9_]+$/.test(item.icon)){
  const icon=make("img");icon.src="https://wow.zamimg.com/images/wow/icons/medium/"+item.icon+".jpg";icon.alt="";icon.loading="lazy";
  icon.width=46;icon.height=46;icon.addEventListener("error",()=>{icon.hidden=true});head.append(icon);
 }
 const names=put(head,"div");
 put(names,"h4",title(item));
 put(names,"p","#"+item.id+" · "+(r?T("Ingénierie","Engineering"):smelt?T("Fonte · Minage","Smelting · Mining"):T("Composant","Material")),"craft-id");
 put(detail,"p",T("Nom français de référence : localisation officielle non certifiée.","French name is a reference translation; official localization is not certified."),"craft-caution");
 const claim=put(detail,"div",null,"craft-proof-row");
 put(claim,"span",r?T("Recette documentée pour Forever, non confirmée en jeu.","Recipe documented for Forever, not confirmed in game."):
  T("Fiche documentaire : l'obtention en jeu reste inconnue.","Documentary item: in-game acquisition remains unknown."),"craft-caution");
 if(r){
  proof(claim,T("Preuve de la recette","Recipe evidence"),r.evidence_url);
  put(detail,"p",T("Sort de fabrication ","Crafting spell ")+r.spell_id+" · "+
   T("Apprentissage et disponibilité auprès d'un maître non confirmés.","Trainer learning and availability not confirmed."),"craft-meta");
  const metrics=put(detail,"div",null,"craft-metrics");
  const skill=put(metrics,"div");put(skill,"strong",T("Compétence requise (documentation)","Required skill (documentation)"));
  put(skill,"span",Number.isSafeInteger(r.skill_required)?String(r.skill_required):T("Inconnue","Unknown"));
  if(r.skill_required_source_url){
   proof(skill,T("Source du niveau requis","Required-skill source"),r.skill_required_source_url);
  }else{
   put(skill,"small",T("Exigence d'apprentissage non démontrée séparément sur Forever.","Trainer requirement not independently established for Forever."),"craft-muted");
  }
  const yellow=put(metrics,"div");
  put(yellow,"strong",T("Seuil jaune (pas le niveau requis)","Yellow threshold (not required skill)"));
  put(yellow,"span",Number.isSafeInteger(r.skill_yellow)?String(r.skill_yellow):T("Inconnu","Unknown"));
  proof(yellow,T("Source du seuil jaune","Yellow-threshold source"),r.skill_yellow_source_url);
  const yieldBox=put(detail,"div",null,"craft-yield");
  put(yieldBox,"strong",T("Quantité fabriquée : ","Produced quantity: ")+
   (r.output_quantity===null?T("inconnue","unknown"):String(r.output_quantity)));
  put(yieldBox,"span",r.output_quantity_status==="conflicting_sources"?
   T("Sources contradictoires : aucun calcul de rendement ou coût unitaire.","Conflicting sources: no computed output or cost per unit."):
   T("Rendement non confirmé en jeu ; pas de calcul de coût unitaire.","Yield not confirmed in game; no computed unit cost."),"craft-muted");
  if(r.output_quantity===null&&Array.isArray(r.output_quantity_candidates)){
   const candidates=put(yieldBox,"div",null,"craft-proof-row");
   for(const c of r.output_quantity_candidates){
    if(!c||!Number.isSafeInteger(c.quantity))continue;
    proof(candidates,T("Source : "+c.quantity+" produit(s)","Source: "+c.quantity+" produced"),c.source_url);
   }
  }
  put(detail,"h5",T("Composants par recette (quantités documentaires)","Ingredients per recipe (documentary amounts)"));
  const comps=put(detail,"div",null,"craft-component-list");
  for(const ingredient of r.ingredients||[]){
   if(ingredient&&validId(ingredient.item_id))linkSelect(comps,ingredient.item_id,ingredient.quantity);
  }
 }else{
  proof(claim,T("Fiche de référence de l'objet","Item reference"),item.evidence_url);
  if(!smelt)put(detail,"p",T("Aucune sous-recette d’ingénierie documentée dans ce lot de huit fabrications.","No documented engineering sub-recipe in this eight-craft subset."),"craft-muted");
 }
 displayAcquisition(detail,item.id);
 const nav=put(detail,"div",null,"craft-actions");
 const back=put(nav,"button",T("Retour aux fabrications","Back to documented crafts"),"craft-back");
 back.type="button";back.addEventListener("click",()=>{state.selected=null;detail.replaceChildren();renderList();
  const u=new URL(location.href);u.searchParams.delete("craft");history.pushState(null,"",u.pathname+u.search+u.hash)});
}
function select(id,push){
 if(!state.data||!validId(id)||!itemFor(id))return false;
 state.selected=Number(id);
 if(push){
  const u=new URL(location.href);u.searchParams.set("craft",String(id));
  history.pushState(null,"",u.pathname+u.search+u.hash);
 }
 root.open=true;renderList();displaySelected();
 if(push&&narrow()&&typeof detail.scrollIntoView==="function")detail.scrollIntoView({behavior:"smooth",block:"start"});
 return true;
}
async function load(){
 if(state.data)return state.data;
 if(state.pending)return state.pending;
 notice.textContent=T("Chargement du lot documentaire…","Loading the documentary subset…");
 state.pending=(async()=>{
  const res=await fetch("/data/crafting-chains-beta.json",{cache:"default"});
  if(!res.ok)throw Error("Crafting data unavailable");
  const d=await res.json();if(!validate(d))throw Error("Unexpected crafting preview dataset");
  state.data=d;notice.textContent=T("Prévisualisation documentaire : 8 recettes sur 8, aucun accès en jeu certifié.",
   "Documentary preview: 8 of 8 recipes, no in-game availability certified.");
  renderList();return d;
 })().catch(e=>{state.pending=null;notice.textContent=T(
  "Données indisponibles ou invalides. Refermez puis rouvrez pour réessayer.",
  "Data unavailable or invalid. Close and reopen to retry.");console.warn("Crafting preview",e);return null});
 return state.pending;
}
async function openFromUrl(scroll=false){
 const id=new URLSearchParams(location.search).get("craft");
 if(!validId(id))return;
 root.open=true;
 if(await load()){
  if(!select(Number(id),false)){
   notice.textContent=T("Objet absent de ce lot documentaire.","Item not included in this documentary subset.");
  }else if(scroll){const target=narrow()?detail:root;
    if(typeof target.scrollIntoView==="function")target.scrollIntoView({behavior:"instant",block:"start"});
   }
 }
}
root.addEventListener("toggle",()=>{if(root.open){void load()}else{state.query="";input.value="";if(state.data)renderList();}});
input.addEventListener("input",()=>{state.query=fold(input.value);renderList()});
window.addEventListener("popstate",()=>{const id=new URLSearchParams(location.search).get("craft");
 if(validId(id)){void openFromUrl()}else{state.selected=null;detail.replaceChildren();renderList()}});
if(validId(new URLSearchParams(location.search).get("craft")))void openFromUrl(true);
})();