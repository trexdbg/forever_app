/* Forever 1-150 archived recipes: lazy, documentary, provenance-first. */
(()=>{"use strict";
const root=document.getElementById("early-recipes");
if(!root)return;
const en=document.documentElement.lang==="en",T=(fr,english)=>en?english:fr;
const $=id=>document.getElementById(id);
const search=$("early-recipe-search"),profession=$("early-recipe-profession"),change=$("early-recipe-change"),
 count=$("early-recipe-count"),list=$("early-recipe-results"),detail=$("early-recipe-detail"),more=$("early-recipe-more");
let records=[],page=0,selected=null,loading=null;
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
 unchanged:T("Identique dans l'archive","Same as Classic in archive"),inherited:T("Hérité","Inherited")})[status]||status;
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
 count.textContent=T(hits.length+" recettes de l'archive Forever",""+hits.length+" recipes in Forever archive")+
  T(" · build 1.60.1.69876 (historique)"," · build 1.60.1.69876 (historic)");
 list.replaceChildren();
 for(const r of visible){
  const b=place(list,"button",null,"early-recipe-row");b.type="button";b.setAttribute("aria-pressed",String(r.spell_id===selected?.spell_id));
  place(b,"strong",r.name_en);
  place(b,"small",profLabel(r.profession_en)+" · "+T("Seuil jaune ","Yellow threshold ")+r.skill_yellow_archive+" · "+kindLabel(r.forever_archive_status));
  b.addEventListener("click",()=>select(r));
 }
 if(!hits.length)place(list,"p",T("Aucune recette trouvée.","No matching recipe."),"early-muted");
 more.hidden=visible.length>=hits.length;more.textContent=T("Afficher davantage ("+visible.length+"/"+hits.length+")","Show more ("+visible.length+"/"+hits.length+")");
 renderDetail();
}
function select(r){selected=r;render();detail.scrollIntoView({block:"nearest",behavior:"smooth"})}
function renderDetail(){
 detail.replaceChildren();
 const r=selected;if(!r){place(detail,"p",T("Choisissez une recette.","Choose a recipe."),"early-muted");return;}
 place(detail,"h3",r.name_en);
 const meta=place(detail,"p",profLabel(r.profession_en)+" · "+T("sort ","spell ")+r.spell_id+" · "+kindLabel(r.forever_archive_status),"early-meta");
 meta.dataset.source="historical_forever_archive";
 place(detail,"p",T("Client Forever archivé : ce sort et ses composants figuraient dans le build 1.60.1.69876. Disponibilité actuelle, apprentissage en jeu et traduction française non certifiés.",
  "Archived Forever client: this spell and its reagents appeared in build 1.60.1.69876. Current availability, live training and French localization are unverified."),"early-warning");
 const grid=place(detail,"div",null,"early-facts");
 for(const [name,v] of [
  [T("Jaune (archive)","Yellow (archive)"),r.skill_yellow_archive],
  [T("Gris (archive)","Grey (archive)"),r.skill_grey_archive??T("Inconnu","Unknown")],
  [T("Vert","Green"),T("Inconnu","Unknown")],
  [T("Compétence d'apprentissage","Learning skill"),T("Inconnue","Unknown")]
 ]){const el=place(grid,"span",null,"early-fact");place(el,"small",name);place(el,"strong",v);}
 place(detail,"h4",T("Objet fabriqué · rendement du client historique","Output · historical client-reported yield"));
 for(const o of r.outputs){
  const line=place(detail,"div",null,"early-material");const link=safeLink(line,"https://www.wowhead.com/forever/item="+o.item_id,itemName(o)+" · #"+o.item_id);
  if(!link)place(line,"span",o.name_en);
  place(line,"span",o.reported_client_output_quantity===null?T("Quantité inconnue","Quantity unknown"):
    "×"+o.reported_client_output_quantity+" "+T("(archive, pas de craft observé)","(archived, not a witnessed craft)"),"early-muted");
 }
 place(detail,"h4",T("Composants (client Forever archivé)","Reagents (archived Forever client)"));
 const ingredients=place(detail,"ul",null,"early-reagent-list");
 for(const i of r.ingredients){const li=place(ingredients,"li");place(li,"b",i.quantity+" × ");
  safeLink(li,"https://www.wowhead.com/forever/item="+i.item_id,itemName(i)+" · #"+i.item_id);
 }
 if(r.station_en||r.tools_en.length){
  place(detail,"p",(r.station_en?T("Atelier : ","Station: ")+r.station_en+" · ":"")+
   (r.tools_en.length?T("Outils : ","Tools: ")+r.tools_en.join(", "):""),"early-muted");
 }
 if(r.book_item_ids.length){
  place(detail,"h4",T("Plans et recettes associés à l'apprentissage","Recipe items linked to learning"));
  const book=place(detail,"ul",null,"early-reagent-list");
  for(const id of r.book_item_ids){const li=place(book,"li");
   safeLink(li,"https://www.wowhead.com/forever/item="+id,"#"+id);
  }
  if(r.vendor_references.length){
   place(detail,"p",T("Pistes de marchands : une référence Classic reste indicative, même si le plan existe dans le client Forever.",
    "Merchant leads: a Classic listing is still indicative even if the recipe exists in the Forever client."),"early-muted");
   const sellers=place(detail,"ul",null,"early-vendor-list");
   for(const v of r.vendor_references){
    const li=place(sellers,"li");
    const a=place(li,"a",v.name_en+" ↗");a.href="/"+(en?"en/":"")+"marchands/?q="+encodeURIComponent(v.name_en);
    place(li,"span",v.evidence_level==="documented_forever"?T("Forever · documenté","Forever · documented"):
      T("Classic · indicatif","Classic · indicative"),
     "early-provenance "+(v.evidence_level==="documented_forever"?"forever":"classic"));
    safeLink(li,v.evidence_url,T("Source","Source")+" ↗","early-small-link");
   }
  }else place(detail,"p",T("Vendeur du plan non identifié dans notre catalogue.","Recipe item seller not identified in our catalogue."),"early-muted");
 }else place(detail,"p",T("Aucun objet-recette identifié dans cette extraction ; cela ne garantit pas l'apprentissage auprès d'un maître.",
  "No recipe item identified in this extract; trainer availability is not established."),"early-muted");
 if(r.classic_comparison?.differences?.length){
  place(detail,"h4",T("Changements par rapport à Classic (archive)","Changes versus Classic (archive)"));
  place(detail,"p",r.classic_comparison.differences.join(", "),"early-muted");
 }
 const sources=place(detail,"p",null,"early-sources");
 safeLink(sources,r.sources.forever_spell_url,T("Fiche du sort Forever ↗","Forever spell page ↗"));
 safeLink(sources,r.sources.archive_url,T("Extraction historique ↗","Historical archive ↗"));
}
async function load(){
 if(loading)return loading;
 count.textContent=T("Chargement de l'archive historique…","Loading historical archive…");
 loading=fetch("/data/recipes-forever-early-archive.json?v=20261017-vendors-1",{credentials:"omit"})
 .then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()})
 .then(db=>{
  if(db.schema_version!==1||db.status!=="historical_client_archive_not_in_game_verified"||db.source_build!=="1.60.1.69876"||!Array.isArray(db.recipes)||db.recipes.length<600)throw Error("Incorrect archive");
  records=db.recipes;
  const options=[...new Set(records.map(r=>r.profession_id+"|"+r.profession_en))].sort((a,b)=>a.localeCompare(b));
  for(const option of options){const [id,name]=option.split("|");const o=place(profession,"option",profLabel(name));o.value=id}
  render();
 }).catch(()=>{loading=null;count.textContent=T("Archive indisponible ; les aperçus ciblés restent accessibles.","Archive unavailable; targeted previews remain accessible.")});
 return loading;
}
root.addEventListener("toggle",()=>{if(root.open)load()});
for(const x of [search,profession,change])x.addEventListener(x===search?"input":"change",()=>{page=0;selected=null;render()});
more.addEventListener("click",()=>{page++;render()});
})();
