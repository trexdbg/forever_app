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
 summary.textContent=T(hits+" / 8 fabrications",""+hits+" / 8 crafts");
}
function renderSmelting(parent,a){
 put(parent,"strong",T("Fonte","Smelting"),"craft-method-title");
 if(a.skill_required!=null)put(parent,"p",T("Compétence : ","Skill: ")+a.skill_required);
 const ingredients=put(parent,"div",null,"craft-component-list");
 for(const c of a.ingredients||[])if(c&&validId(c.item_id)&&itemFor(c.item_id))linkSelect(ingredients,c.item_id,c.quantity);
 proof(parent,"Source ↗",a.evidence_url);
}
function renderMining(parent,a){
 put(parent,"strong",T("Minage : ","Mining: ")+(a.node?.[en?"en":"fr"]||""),"craft-method-title");
 if(a.mining_skill!=null)put(parent,"p",T("Compétence : ","Skill: ")+a.mining_skill);
 if(a.zones_documented?.length)put(parent,"p",a.zones_documented.join(", "));
 proof(parent,"Source ↗",a.evidence_url);
}
function displayAcquisition(parent,id){
 const entries=claimsFor(id).filter(a=>["smelting","mining_node","legacy_vendor_catalogue","vendor_index"].includes(a.method));
 if(!entries.length)return;
 const block=put(parent,"div",null,"craft-acquisition");put(block,"h5",T("Obtenir ce composant","Obtain this material"));
 for(const entry of entries){const row=put(block,"div",null,"craft-method");
  if(entry.method==="smelting")renderSmelting(row,entry);
  else if(entry.method==="mining_node")renderMining(row,entry);
  else proof(row,T("Marchands Classic ↗","Classic vendors ↗"),entry.evidence_url);
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
 const claim=put(detail,"div",null,"craft-proof-row");
 if(r){
  proof(claim,T("Source","Source"),r.evidence_url);
  put(detail,"p",T("Sort de fabrication ","Crafting spell ")+r.spell_id+" · "+
   T("",""),"craft-meta");
  const metrics=put(detail,"div",null,"craft-metrics");
  const skill=put(metrics,"div");put(skill,"strong",T("Compétence requise","Required skill"));
  skill.hidden=!Number.isSafeInteger(r.skill_required);put(skill,"span",r.skill_required??"");
  if(r.skill_required_source_url){
   proof(skill,T("Source du niveau requis","Required-skill source"),r.skill_required_source_url);
  }
  const yellow=put(metrics,"div");
  put(yellow,"strong",T("Seuil jaune","Yellow threshold"));
  put(yellow,"span",Number.isSafeInteger(r.skill_yellow)?String(r.skill_yellow):T("Inconnu","Unknown"));
  proof(yellow,T("Source du seuil jaune","Yellow-threshold source"),r.skill_yellow_source_url);
  if(r.output_quantity!=null)put(detail,"p",T("Quantité : ","Quantity: ")+r.output_quantity);
  put(detail,"h5",T("Composants","Ingredients"));
  const comps=put(detail,"div",null,"craft-component-list");
  for(const ingredient of r.ingredients||[]){
   if(ingredient&&validId(ingredient.item_id))linkSelect(comps,ingredient.item_id,ingredient.quantity);
  }
 }else{
  proof(claim,T("Fiche de référence de l'objet","Item reference"),item.evidence_url);
 }
 displayAcquisition(detail,item.id);
 const nav=put(detail,"div",null,"craft-actions");
 const back=put(nav,"button",T("Retour aux fabrications","Back to crafts"),"craft-back");
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
 notice.textContent=T("Chargement…","Loading…");
 state.pending=(async()=>{
  const res=await fetch("/data/crafting-chains-beta.json",{cache:"default"});
  if(!res.ok)throw Error("Crafting data unavailable");
  const d=await res.json();if(!validate(d))throw Error("Unexpected crafting preview dataset");
  state.data=d;notice.textContent=T("8 recettes d’ingénierie.",
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
