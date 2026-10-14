/* Agent 03 mission 05: separate, opt-in Forever alchemy research preview. */
(()=>{"use strict";
const root=document.getElementById("alchemy-beta");if(!root)return;
const en=document.documentElement.lang==="en",T=(fr,eng)=>en?eng:fr,$=id=>document.getElementById(id);
const input=$("alchemy-search"),list=$("alchemy-list"),detail=$("alchemy-detail"),status=$("alchemy-status"),counter=$("alchemy-count");
const safe=x=>{try{const u=new URL(x);return u.protocol==="https:"&&!u.username&&!u.password?u.href:null}catch{return null}};
const fold=x=>String(x??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase().trim();
const integer=x=>/^[1-9]\d*$/.test(String(x??""))&&Number.isSafeInteger(+x);
const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==null&&text!==undefined)e.textContent=String(text);if(cls)e.className=cls;return e};
const add=(p,t,v,c)=>{const x=make(t,v,c);p.append(x);return x};
const link=(p,txt,url)=>{const href=safe(url);if(!href)return add(p,"small",T("Preuve indisponible","Evidence unavailable"),"craft-muted");const a=add(p,"a",txt+" ↗","craft-proof");a.href=href;a.target="_blank";a.rel="noopener noreferrer";return a};
const mobile=()=>typeof window.matchMedia==="function"&&window.matchMedia("(max-width: 720px)").matches;
const state={data:null,pending:null,query:"",selected:null};
const item=id=>state.data?.items?.[String(id)]||null;
const recipe=id=>state.data?.recipes?.find(r=>r.output_item_id===Number(id))||null;
const title=i=>i?.name?.[en?"en":"fr"]||i?.name?.en||T("Objet inconnu","Unknown item");
function validate(d){
 const ids=d?.scope?.preview?.recipe_item_ids;
 if(d?.schema_version!==1||d?.scope?.status!=="research_only_not_published"||
 d?.scope?.preview?.status!=="opt_in_documentary_preview"||!Array.isArray(ids)||
 ids.length!==6||new Set(ids).size!==6||!d.items||!Array.isArray(d.recipes)||d.recipes.length!==6||
 !Array.isArray(d.acquisitions)||d.acquisitions.length!==0)return false;
 for(const r of d.recipes){
  if(!integer(r.output_item_id)||!integer(r.spell_id)||!ids.includes(r.output_item_id)||
   r.profession_id!==171||!Array.isArray(r.ingredients)||!safe(r.evidence_url)||
   r.available_in_game!==null||r.output_quantity!==null||r.verified_for_forever!==false||
   !itemValid(d.items[String(r.output_item_id)])||[118,858].includes(r.output_item_id)||
   r.ingredients.some(c=>!integer(c.item_id)||!integer(c.quantity)||!itemValid(d.items[String(c.item_id)])))return false;
 }
 return true;
}
function itemValid(i){return i&&i.name&&typeof i.name.fr==="string"&&i.name.fr.length>0&&typeof i.name.en==="string"&&i.name.en.length>0}
function listRender(){
 if(!state.data)return;
 list.replaceChildren();let hits=0;
 for(const r of state.data.recipes){
  const i=item(r.output_item_id);if(!i)continue;
  const terms=[i.name.fr,i.name.en,r.output_item_id,r.spell_id].map(fold);
  if(state.query&&!terms.some(x=>x.includes(state.query)))continue;
  hits++;
  const row=add(list,"button",null,"craft-result");row.type="button";row.dataset.alchemy=String(r.output_item_id);
  row.setAttribute("aria-pressed",String(state.selected===r.output_item_id));
  add(row,"strong",title(i));add(row,"small","#"+i.id+" · "+T("Sort ","Spell ")+r.spell_id);
  row.addEventListener("click",()=>select(i.id,true));
 }
 if(!hits)add(list,"p",T("Aucune recette correspondante.","No matching recipe."),"craft-muted");
 counter.textContent=hits+" / 6 "+T("potions documentées","documented potions");
}
function chooseIngredient(p,c){
 const i=item(c.item_id);const b=add(p,"button",null,"craft-component");b.type="button";
 add(b,"strong",c.quantity+" × "+title(i));add(b,"small","#"+c.item_id+" · "+T("Source à vérifier →","Source to verify →"));
 b.addEventListener("click",()=>select(c.item_id,true));
}
function detailRender(){
 detail.replaceChildren();if(!state.data||!integer(state.selected))return;
 const i=item(state.selected);if(!i){add(detail,"p",T("Objet hors de ce lot.","Item outside this preview."),"craft-muted");return}
 const r=recipe(i.id),head=add(detail,"div",null,"craft-detail-head"),names=add(head,"div");
 add(names,"h4",title(i));add(names,"p","#"+i.id+" · "+(r?T("Alchimie","Alchemy"):T("Composant","Material")),"craft-id");
 add(detail,"p",T("Nom français de référence, non certifié dans le client.","French name is a reference translation, not verified in the client."),"craft-caution");
 add(detail,"p",r?T("Recette référencée dans le client Forever, disponibilité en jeu inconnue.","Recipe indexed for Forever; in-game availability unverified."):
 T("Source d'obtention non vérifiée sur Forever.","Acquisition source unverified on Forever."),"craft-caution");
 if(r){
  const tag={new:T("Nouvelle Forever","New to Forever"),changed:T("Modifiée sur Forever","Changed in Forever"),unchanged:T("Présente comme Classic","Also present in Classic")};
  add(detail,"p",tag[r.change_status]+" · "+T("Niveau d'objet ","Item level ")+r.item_level+" · "+T("Niveau joueur requis : inconnu","Required player level: unknown"),"craft-meta");
  add(detail,"p",T("Sort de fabrication ","Crafting spell ")+r.spell_id+" · "+T("Métier : Alchimie","Profession: Alchemy"),"craft-meta");
  const metrics=add(detail,"div",null,"craft-metrics");
  const sk=add(metrics,"div");add(sk,"strong",T("Compétence d'apprentissage documentée","Documented learning skill"));add(sk,"span",r.skill_required??T("Inconnue","Unknown"));
  const yellow=add(metrics,"div");add(yellow,"strong",T("Seuil jaune (différent du niveau requis)","Yellow threshold (not required skill)"));add(yellow,"span",r.skill_yellow);
  link(yellow,T("Index du client Forever","Forever client index"),r.skill_yellow_source_url);
  if(r.learning_method==="recipe_item"){
   add(detail,"p",T("Plan de recette documenté : objet #","Documented recipe item: #")+r.recipe_item_id+" · "+T("source d'obtention du plan inconnue.","acquisition of recipe item unverified."),"craft-meta");
  }else add(detail,"p",T("Enseignée par un maître (index client) ; maître exact non confirmé.","Trainer-taught (client index); actual trainer unverified."),"craft-meta");
  add(detail,"p",T("Rendement réel inconnu : l'index indique 1 mais aucune fabrication en jeu n'a été observée.","Actual yield unknown: the index reports 1 but no in-game craft was observed."),"craft-caution");
  link(detail,T("Preuve de la recette / sort","Recipe / spell evidence"),r.evidence_url);
  add(detail,"h5",T("Ingrédients référencés","Indexed ingredients"));
  const comps=add(detail,"div",null,"craft-component-list");
  for(const c of r.ingredients)if(item(c.item_id))chooseIngredient(comps,c);
 }else{
  add(detail,"p",T("Aucun vendeur, filon ou monstre précis confirmé sur Forever dans ce lot.","No specific seller, herb node or creature confirmed on Forever in this subset."),"craft-muted");
  if(i.category==="vial")add(detail,"p",T("Fiole : vérifier une vente auprès d'un fournisseur Forever, sans reprendre les prix Classic.","Vial: verify a Forever supplier sale; Classic prices are not evidence."),"craft-footnote");
  if(i.category==="herb")add(detail,"p",T("Plante : l'existence d'un filon d'herbes et ses coordonnées restent à confirmer.","Herb: actual gathering nodes and coordinates remain unverified."),"craft-footnote");
  if(i.category==="loot")add(detail,"p",T("Butin : monstre et taux de butin Forever non vérifiés.","Loot: Forever creature and drop rate unverified."),"craft-footnote");
  link(detail,T("Référence d'utilisation dans la recette Forever","Forever recipe ingredient reference"),i.evidence_url);
 }
 const foot=add(detail,"div",null,"craft-actions");
 const back=add(foot,"button",T("Retour aux potions","Back to potions"),"craft-back");back.type="button";
 back.addEventListener("click",()=>{state.selected=null;detail.replaceChildren();listRender();const u=new URL(location.href);u.searchParams.delete("alchemy");history.pushState(null,"",u.pathname+u.search+u.hash)});
}
function select(id,push){
 if(!state.data||!integer(id)||!item(id))return false;state.selected=Number(id);
 if(push){const u=new URL(location.href);u.searchParams.set("alchemy",String(id));history.pushState(null,"",u.pathname+u.search+u.hash)}
 root.open=true;listRender();detailRender();
 if(push&&mobile()&&typeof detail.scrollIntoView==="function")detail.scrollIntoView({behavior:"smooth",block:"start"});
 return true;
}
async function load(){
 if(state.data)return state.data;
 if(state.pending)return state.pending;
 status.textContent=T("Chargement du catalogue…","Loading preview…");
 state.pending=(async()=>{
  const res=await fetch("/data/alchemy-chains-beta.json",{cache:"default"});
  if(!res.ok)throw Error("Failed alchemy data fetch");
  const d=await res.json();if(!validate(d))throw Error("Invalid beta preview contract");
  state.data=d;listRender();
  status.textContent=T("6 potions documentaires, accès en jeu non confirmé.","6 documentary potions; in-game availability unverified.");
  return d;
 })().catch(e=>{state.pending=null;status.textContent=T("Données indisponibles. Fermez et rouvrez pour réessayer.","Data unavailable. Close and reopen to retry.");console.warn("Alchemy beta",e);return null});
 return state.pending;
}
async function fromUrl(scroll=false){
 const id=new URLSearchParams(location.search).get("alchemy");if(!integer(id))return;
 root.open=true;if(await load()){if(!select(id,false))status.textContent=T("Objet absent du lot.","Item outside the subset.");
 else if(scroll){const target=mobile()?detail:root;if(typeof target.scrollIntoView==="function")target.scrollIntoView({behavior:"instant",block:"start"});}}
}
root.addEventListener("toggle",()=>{if(root.open){void load()}else{state.query="";input.value="";if(state.data)listRender()}});
input.addEventListener("input",()=>{state.query=fold(input.value);listRender()});
window.addEventListener("popstate",()=>{const id=new URLSearchParams(location.search).get("alchemy");if(integer(id)){void fromUrl()}else{state.selected=null;detail.replaceChildren();listRender()}});
if(integer(new URLSearchParams(location.search).get("alchemy")))void fromUrl(true);
})();
