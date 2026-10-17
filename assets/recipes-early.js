/* Forever 1-150 archived recipes: lazy, documentary, provenance-first. */
(()=>{"use strict";
const root=document.getElementById("early-recipes");
if(!root)return;
const en=document.documentElement.lang==="en",T=(fr,english)=>en?english:fr;
const $=id=>document.getElementById(id);
const search=$("early-recipe-search"),profession=$("early-recipe-profession"),change=$("early-recipe-change"),
 count=$("early-recipe-count"),list=$("early-recipe-results"),detail=$("early-recipe-detail"),more=$("early-recipe-more");
let records=[],page=0,selected=null,loading=null;
let recentSnapshots=new Map();
const PAGE=45;
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=String(text);if(cls)n.className=cls;return n};
const place=(where,tag,text,cls)=>{const n=node(tag,text,cls);where.append(n);return n};
const fold=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const professionsFr={
 "Alchemy":"Alchimie","Blacksmithing":"Forge","Cooking":"Cuisine","Enchanting":"Enchantement",
 "Engineering":"Ingénierie","First Aid":"Secourisme","Fishing":"Pêche","Herbalism":"Herboristerie",
 "Leatherworking":"Travail du cuir","Mining":"Minage","Skinning":"Dépeçage","Tailoring":"Couture"
};
const profLabel=s=>en?s:(professionsFr[s]||s);

const safeLink=(parent,url,caption,cls="")=>{if(typeof url!=="string"||!/^https:\/\/[^\s/]+\//.test(url))return;
 const a=place(parent,"a",caption,cls);a.href=url;a.rel="noopener noreferrer";a.target="_blank";return a};
const itemName=x=>{
 const resolved=window.ForeverItemLocale?.name({id:x.item_id,name:x.name_en,source_status:"forever_beta_archive"});
 return resolved||x.name_en;
};
const kindLabel=status=>({new:T("Nouveau Forever","New in Forever"),changed:T("Modifié vs Classic","Changed vs Classic"),
 unchanged:T("Classic","Classic"),inherited:T("Hérité","Inherited")})[status]||status;
function match(r){
 const q=fold(search.value.trim());
 if(profession.value!=="all"&&String(r.profession_id)!==profession.value)return false;
 if(change.value!=="all"&&r.forever_archive_status!==change.value)return false;
 if(!q)return true;
 const values=[r.name_en,r.profession_en,profLabel(r.profession_en),r.spell_id,...r.outputs.flatMap(o=>[o.name_en,o.item_id]),...r.ingredients.flatMap(i=>[i.name_en,i.item_id]),...r.vendor_references.map(v=>v.name_en)];
 return values.some(v=>fold(v).includes(q));
}
const sort=(a,b)=>a.skill_yellow_archive-b.skill_yellow_archive||
 (a.forever_archive_status==="new"?-1:a.forever_archive_status==="changed"?0:1)-
 (b.forever_archive_status==="new"?-1:b.forever_archive_status==="changed"?0:1)||
 a.name_en.localeCompare(b.name_en);
function render(){
 if(!records.length)return;
 const hits=records.filter(match).sort(sort),visible=hits.slice(0,(page+1)*PAGE);
 if(selected&&!hits.some(r=>r.spell_id===selected.spell_id))selected=null;
 if(!selected&&hits.length)selected=hits[0];
 count.textContent=T(hits.length+" recettes",hits.length+" recipes");
 list.replaceChildren();
 for(const r of visible){
  const b=place(list,"button",null,"early-recipe-row");b.type="button";b.setAttribute("aria-pressed",String(r.spell_id===selected?.spell_id));
  place(b,"strong",r.name_en);
  place(b,"small",profLabel(r.profession_en)+" · "+T("Seuil jaune ","Yellow threshold ")+r.skill_yellow_archive+" · "+recipeView(r).edition);
  b.addEventListener("click",()=>select(r));
 }
 if(!hits.length)place(list,"p",T("Aucune recette trouvée.","No matching recipe."),"early-muted");
 more.hidden=visible.length>=hits.length;more.textContent=T("Afficher davantage ("+visible.length+"/"+hits.length+")","Show more ("+visible.length+"/"+hits.length+")");
 renderDetail();
}
function select(r){selected=r;render();detail.scrollIntoView({block:"nearest",behavior:"smooth"})}
// Resolve one display value per property; evidence remains in the JSON catalogues.
function recipeView(r){
 const candidate=recentSnapshots.get(r.spell_id);
 const recent=candidate?.profession_id===r.profession_id?candidate:null;
 return {
  edition:recent||["new","changed"].includes(r.forever_archive_status)?"Forever":"Classic",
  yellow:recent?.skill_yellow_reported??r.skill_yellow_archive,
  green:recent?.skill_green_reported??r.skill_green_archive,
  grey:recent?.skill_grey_reported??r.skill_grey_archive,
  learning:recent?.learning_skill_reported??r.learning_skill_required,
  outputs:recent?[{...recent.output,reported_client_output_quantity:recent.output.quantity_reported}]:r.outputs,
  ingredients:recent?.ingredients??r.ingredients,
  books:recent?.book_item_ids??r.book_item_ids,
  source:recent?.evidence_url??r.sources.forever_spell_url
 };
}
function renderDetail(){
 detail.replaceChildren();
 const r=selected;if(!r){place(detail,"p",T("Choisissez une recette.","Choose a recipe."),"early-muted");return;}
 const view=recipeView(r);
 place(detail,"h3",r.name_en);
 place(detail,"p",profLabel(r.profession_en)+" · "+view.edition,"early-meta");
 const grid=place(detail,"div",null,"early-facts");
 for(const [label,value] of [
  [T("Compétence requise","Required skill"),view.learning],
  [T("Jaune","Yellow"),view.yellow],
  [T("Vert","Green"),view.green],
  [T("Gris","Grey"),view.grey]
 ]){if(value==null)continue;const fact=place(grid,"span",null,"early-fact");place(fact,"small",label);place(fact,"strong",value);}
 place(detail,"h4",T("Objet fabriqué","Output"));
 for(const o of view.outputs){
  const line=place(detail,"div",null,"early-material");
  safeLink(line,"https://www.wowhead.com/forever/item="+o.item_id,itemName(o));
  if(o.reported_client_output_quantity!=null)place(line,"span","×"+o.reported_client_output_quantity,"early-muted");
 }
 place(detail,"h4",T("Composants","Reagents"));
 const ingredients=place(detail,"ul",null,"early-reagent-list");
 for(const i of view.ingredients){const li=place(ingredients,"li");place(li,"b",i.quantity+" × ");
  safeLink(li,"https://www.wowhead.com/forever/item="+i.item_id,itemName(i));}
 if(r.station_en||r.tools_en.length)place(detail,"p",[
  r.station_en?T("Atelier : ","Station: ")+r.station_en:null,
  r.tools_en.length?T("Outils : ","Tools: ")+r.tools_en.join(", "):null
 ].filter(Boolean).join(" · "),"early-muted");
 if(view.books.length){
  place(detail,"h4",T("Plans et recettes","Recipe items"));
  const books=place(detail,"ul",null,"early-reagent-list");
  for(const id of view.books){const li=place(books,"li");safeLink(li,"https://www.wowhead.com/forever/item="+id,"#"+id);}
 }
 if(r.vendor_references.length){
  place(detail,"h4",T("Marchands","Vendors"));
  const sellers=place(detail,"ul",null,"early-vendor-list");
  for(const v of r.vendor_references){const li=place(sellers,"li");const a=place(li,"a",v.name_en+" ↗");
   a.href="/"+(en?"en/":"")+"marchands/?q="+encodeURIComponent(v.name_en);}
 }
 const sources=place(detail,"p",null,"early-sources");safeLink(sources,view.source,"Source ↗");
}
async function load(){
 if(loading)return loading;
 count.textContent=T("Chargement des recettes…","Loading recipes…");
 loading=fetch("/data/recipes-forever-early-archive.json?v=20261017-vendors-1",{credentials:"omit"})
 .then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()})
 .then(db=>{
  if(db.schema_version!==1||db.status!=="historical_client_archive_not_in_game_verified"||db.source_build!=="1.60.1.69876"||!Array.isArray(db.recipes)||db.recipes.length<600)throw Error("Incorrect archive");
  records=db.recipes;
  const options=[...new Set(records.map(r=>r.profession_id+"|"+r.profession_en))].sort((a,b)=>a.localeCompare(b));
  for(const option of options){const [id,name]=option.split("|");const o=place(profession,"option",profLabel(name));o.value=id}
  render();
 loadRecentSnapshots();
 }).catch(()=>{loading=null;count.textContent=T("Recettes indisponibles.","Recipes unavailable.")});
 return loading;
}
async function loadRecentSnapshots(){
 try{
  const response=await fetch("/data/recipes-forever-70425-snapshots.json?v=20261017-1",{credentials:"omit"});
  if(!response.ok)return;
  const db=await response.json();
  if(db.schema_version!==1||db.observed_build!=="1.60.1.70425"||!Array.isArray(db.recipes))return;
  const id=n=>Number.isSafeInteger(n)&&n>0;
  const valid=s=>s&&id(s.spell_id)&&id(s.profession_id)&&s.evidence_level==="documented_forever"&&s.observed_build===db.observed_build&&
   typeof s.name_en==="string"&&typeof s.observed_at==="string"&&/^https:\/\/[^\s/]+\//.test(s.evidence_url??"")&&
   id(s.skill_yellow_reported)&&id(s.skill_green_reported)&&id(s.skill_grey_reported)&&
   s.skill_yellow_reported<=s.skill_green_reported&&s.skill_green_reported<=s.skill_grey_reported&&
   (s.learning_skill_reported===null||id(s.learning_skill_reported))&&
   s.output&&id(s.output.item_id)&&id(s.output.quantity_reported)&&id(s.output.item_level_reported)&&
   Array.isArray(s.ingredients)&&s.ingredients.length&&s.ingredients.every(i=>id(i.item_id)&&id(i.quantity)&&typeof i.name_en==="string")&&
   Array.isArray(s.book_item_ids)&&s.book_item_ids.every(id);
  recentSnapshots=new Map(db.recipes.filter(valid).map(s=>[s.spell_id,s]));
  render();
 }catch{/* Optional newer documentary evidence must never disable the historic archive. */}
}
root.addEventListener("toggle",()=>{if(root.open)load()});
for(const x of [search,profession,change])x.addEventListener(x===search?"input":"change",()=>{page=0;selected=null;render()});
more.addEventListener("click",()=>{page++;render()});
})();
