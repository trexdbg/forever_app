#!/usr/bin/env node
/** Read-only, source-scoped crafting-chain audit. No Classic-to-Forever promotion. */
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {checkExplicitProvenance} from "./check-data-quality.mjs";
const object=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const positive=x=>Number.isSafeInteger(x)&&x>0;
const word=x=>typeof x==="string"&&x.trim().length>0;
const url=x=>typeof x==="string"&&/^https:\/\/[^\s/]+\S*$/.test(x);
const labels=x=>object(x)&&word(x.fr)&&word(x.en);
const evidences=new Set(["confirmed_in_game","documented_forever","datamined","classic_reference","unverified"]);
export function auditCraftingChains(catalogue,npcs,professions) {
 const issues=[],report=(severity,code,path,message)=>issues.push({severity,code,path,message});
 const error=(code,path,message)=>report("error",code,path,message);
 const items=catalogue?.items,recipes=catalogue?.recipes,claims=catalogue?.acquisitions;
 if(!object(catalogue))error("CRAFT_CATALOGUE_INVALID","data/crafting-chains-beta.json","Expected object");
 if(!object(items))error("CRAFT_ITEMS_INVALID","items","Expected keyed objects");
 if(!Array.isArray(recipes))error("CRAFT_RECIPES_INVALID","recipes","Expected recipes array");
 if(!Array.isArray(claims))error("CRAFT_ACQUISITIONS_INVALID","acquisitions","Expected array");
 if(!object(npcs?.items)||!Array.isArray(npcs?.npcs))error("CRAFT_NPC_CATALOGUE_INVALID","data/npcs.json","Expected merchant catalogue");
 if(!Array.isArray(professions?.professions))error("CRAFT_PROFESSIONS_INVALID","data/professions.json","Expected profession catalogue");
 const result=()=>({issues,errorCount:issues.filter(i=>i.severity==="error").length,warningCount:issues.filter(i=>i.severity==="warning").length,
 summary:{itemCount:object(items)?Object.keys(items).length:0,recipeCount:Array.isArray(recipes)?recipes.length:0,
 ingredientEdges:Array.isArray(recipes)?recipes.reduce((sum,r)=>sum+(Array.isArray(r?.ingredients)?r.ingredients.length:0),0):0,
 acquisitionCount:Array.isArray(claims)?claims.length:0}});
 if(!object(items)||!Array.isArray(recipes)||!Array.isArray(claims)||!object(npcs?.items)||!Array.isArray(npcs?.npcs)||!Array.isArray(professions?.professions))return result();
 if(catalogue.scope?.status!=="research_only_not_published")error("CRAFT_PUBLICATION_UNSUPPORTED","scope.status","Unconfirmed research must stay unpublished");
 const known=new Set(Object.keys(items));
 for(const [key,item] of Object.entries(items)) {
  const p="items."+key;
  if(!object(item)){error("CRAFT_ITEM_INVALID",p,"Expected object");continue;}
  if(!/^[1-9]\d*$/.test(key)||!positive(item.id)||String(item.id)!==key)error("CRAFT_ITEM_ID",p,"Key and ID must agree");
  if(!labels(item.name))error("CRAFT_ITEM_LOCALE",p+".name","FR and EN labels required");
  if(item.icon!==null&&item.icon!==undefined&&(!word(item.icon)||!/^[a-z0-9_]+$/.test(item.icon)))error("CRAFT_ICON_INVALID",p+".icon","Invalid icon code");
  if(!["crafted","material"].includes(item.role))error("CRAFT_ITEM_ROLE",p+".role","Expected crafted or material");
  if(!evidences.has(item.evidence_level))error("CRAFT_EVIDENCE_LEVEL",p,"Unknown source classification");
  checkExplicitProvenance(item,p,report);
  if(item.evidence_level==="confirmed_in_game")error("CRAFT_FALSE_GAME_PROOF",p,"No direct gameplay captures in this research sample");
  if(item.role==="material"&&item.name_verification!=="translation_reference_only")error("CRAFT_TRANSLATION_UNVERIFIED",p,"Do not imply official client localization");
 }
 const validProf=new Set(professions.professions.filter(object).map(p=>p.id));
 const spellIds=new Set(),outputToRecipe=new Map();
 for(const [i,r] of recipes.entries()){
  const p="recipes["+i+"]";
  if(!object(r)){error("CRAFT_RECIPE_INVALID",p,"Expected recipe object");continue;}
  if(!positive(r.spell_id)||spellIds.has(r.spell_id))error("CRAFT_SPELL_ID",p+".spell_id","Invalid or repeated spell");
  else spellIds.add(r.spell_id);
  if(r.recipe_item_id!==null&&r.recipe_item_id!==undefined&&!positive(r.recipe_item_id))error("CRAFT_RECIPE_ITEM_ID",p+".recipe_item_id","Recipe item must be positive or unknown");
  if(!positive(r.output_item_id)||!known.has(String(r.output_item_id)))error("CRAFT_OUTPUT_MISSING",p+".output_item_id","Output not in curated item catalogue");
  else {
   if(outputToRecipe.has(r.output_item_id))error("CRAFT_OUTPUT_DUPLICATE",p+".output_item_id","Multiple recipes for one output need distinct declarations");
   outputToRecipe.set(r.output_item_id,r);
  }
  if(!validProf.has(r.profession_id))error("CRAFT_PROFESSION_UNKNOWN",p+".profession_id","Unknown profession");
  if(r.skill_required!==null&&(!Number.isSafeInteger(r.skill_required)||r.skill_required<1))error("CRAFT_SKILL_INVALID",p+".skill_required","Invalid learnable requirement");
  if(r.skill_yellow!==null&&(!Number.isSafeInteger(r.skill_yellow)||r.skill_yellow<1))error("CRAFT_SKILL_YELLOW",p+".skill_yellow","Invalid color threshold");
  if(positive(r.skill_yellow)&&(!url(r.skill_yellow_source_url)||!word(r.skill_yellow_observed_at)||
      !word(r.skill_yellow_observed_build)||r.skill_yellow_evidence_kind!=="forever_community_page"||
      !word(r.skill_yellow_evidence_note)))
   error("CRAFT_SKILL_YELLOW_PROVENANCE",p+".skill_yellow_source_url","Yellow threshold needs an explicit Forever index, observed build/date and scope note");
  if(r.skill_required_source_url!==undefined){
   if(!url(r.skill_required_source_url)||r.skill_required_evidence_level!=="documented_forever"||
      r.skill_required_evidence_kind!=="forever_community_page"||!word(r.skill_required_observed_at)||
      !word(r.skill_required_observed_build)||!word(r.skill_required_evidence_note))
    error("CRAFT_SKILL_REQUIRED_PROVENANCE",p+".skill_required_source_url","Documented trainer skill needs separate claim-scoped evidence");
  }
  if(positive(r.skill_required)&&positive(r.skill_yellow)&&r.skill_yellow<r.skill_required)error("CRAFT_SKILL_ORDER",p,"Yellow threshold before required skill");
  if(!object(r.learning)||!["trainer","profession"].includes(r.learning.method))error("CRAFT_LEARNING_INVALID",p+".learning","Unknown acquisition of spell");
  if(r.learning?.available_in_game!==null)error("CRAFT_AVAILABILITY_UNPROVEN",p+".learning.available_in_game","Do not assert live trainer access");
  if(r.output_quantity!==null){
   if(!positive(r.output_quantity))error("CRAFT_OUTPUT_QUANTITY",p+".output_quantity","Invalid positive output");
   if(r.output_quantity_status==="conflicting_sources")error("CRAFT_OUTPUT_CONFLICT_HIDDEN",p,"Must not choose a disputed output count");
   if(r.output_quantity_status!=="documented_forever")error("CRAFT_OUTPUT_RESOLUTION_INVALID",p+".output_quantity_status","Documented resolution must be separately sourced");
   if(!url(r.output_quantity_source_url)||!word(r.output_quantity_evidence_note))
    error("CRAFT_OUTPUT_RESOLUTION_UNSOURCED",p,"Resolved output requires a specific source and explanation, not a guess");
  }else if(r.output_quantity_status!=="conflicting_sources"&&r.output_quantity_status!=="unknown")
   error("CRAFT_OUTPUT_UNKNOWN_STATUS",p+".output_quantity_status","Explain unknown count");
  if(r.output_quantity_status==="conflicting_sources"){
   if(!Array.isArray(r.output_quantity_candidates)||
      new Set(r.output_quantity_candidates.filter(object).map(x=>x.quantity)).size<2||
      new Set(r.output_quantity_candidates.filter(object).map(x=>x.source_url)).size<2)
    error("CRAFT_OUTPUT_CONFLICT_UNSUPPORTED",p+".output_quantity_candidates","Conflicts require at least two distinct yields from two distinct sources");
  }
  if(Array.isArray(r.output_quantity_candidates))for(const [j,q] of r.output_quantity_candidates.entries()){
   if(!object(q)||!positive(q.quantity)||!url(q.source_url)||!word(q.evidence_note))error("CRAFT_OUTPUT_CANDIDATE_INVALID",p+".output_quantity_candidates["+j+"]","Positive yield, HTTPS source and precise evidence note required");
  }
  if(!Array.isArray(r.ingredients)||!r.ingredients.length){error("CRAFT_INGREDIENTS_INVALID",p+".ingredients","No ingredients");continue;}
  const unique=new Set();
  for(const [j,c] of r.ingredients.entries()){
   const k=p+".ingredients["+j+"]";
   if(!object(c)){error("CRAFT_COMPONENT_INVALID",k,"Expected ingredient record");continue;}
   if(!positive(c.item_id)||!known.has(String(c.item_id)))error("CRAFT_COMPONENT_MISSING",k,"Ingredient ID absent from catalogue");
   if(!positive(c.quantity))error("CRAFT_COMPONENT_QUANTITY",k,"Ingredient quantity must be positive");
   if(unique.has(c.item_id))error("CRAFT_COMPONENT_DUPLICATE",k,"Duplicate ingredient");
   unique.add(c.item_id);
  }
  if(!evidences.has(r.evidence_level))error("CRAFT_EVIDENCE_LEVEL",p,"Unknown recipe source classification");
  checkExplicitProvenance(r,p,report);
  if(r.evidence_level==="confirmed_in_game"||r.evidence_level==="classic_reference")
   error("CRAFT_RECIPE_PROMOTION",p,"This sample requires a Forever-specific documentary recipe, not a Classic-only or unproven live claim");
  if(!url(r.corroborating_url))error("CRAFT_CORROBORATION_INVALID",p+".corroborating_url","Missing independent source");
 }
 const active=new Set(),done=new Set();
 function walk(id,trail){
  if(active.has(id)){error("CRAFT_CYCLE","recipes","Crafting cycle: "+[...trail,id].join(" -> "));return;}
  if(done.has(id))return;
  active.add(id);const r=outputToRecipe.get(id);
  for(const c of (Array.isArray(r?.ingredients)?r.ingredients:[])){
   if(object(c)&&positive(c.item_id)&&outputToRecipe.has(c.item_id))walk(c.item_id,[...trail,id]);
  }
  active.delete(id);done.add(id);
 }
 for(const id of outputToRecipe.keys())walk(id,[]);
 for(const [i,a] of claims.entries()){
  const p="acquisitions["+i+"]";
  if(!object(a)){error("CRAFT_ACQUISITION_INVALID",p,"Expected record");continue;}
  if(!positive(a.item_id)||!known.has(String(a.item_id)))error("CRAFT_ACQUISITION_ITEM_MISSING",p,"Unknown item");
  if(!["legacy_vendor_catalogue","vendor_index","smelting_candidate"].includes(a.method))error("CRAFT_ACQUISITION_METHOD",p,"Invalid acquisition method");
  if(a.verified_for_forever!==false)error("CRAFT_VENDOR_PROMOTION",p,"These leads are not proven obtainable on Forever");
  if(a.evidence_level==="confirmed_in_game"||a.evidence_level==="datamined")error("CRAFT_ACQUISITION_FALSE_PROOF",p,"A client row cannot verify a purchase");
  checkExplicitProvenance(a,p,report);
  if(a.method==="legacy_vendor_catalogue"){
   const item=npcs.items[String(a.item_id)];
   const sellers=npcs.npcs.filter(n=>object(n)&&Array.isArray(n.offers)&&n.offers.map(String).includes(String(a.item_id)));
   if(!item||a.candidate_sellers!==sellers.length)error("CRAFT_VENDOR_LIST_MISMATCH",p,"Legacy vendor count diverges from catalogue");
   if(item&&(a.price_copper!==item.vendor_price_copper||a.stock_quantity!==item.vendor_stock))
    error("CRAFT_VENDOR_PRICE_MISMATCH",p,"Legacy price/stock must match source data, not Forever assertions");
   if(a.evidence_level!=="classic_reference")error("CRAFT_VENDOR_NOT_CLASSIC",p,"Historical vendor lead is Classic only");
  }
  if(a.restock_minutes!==undefined&&a.restock_minutes!==null)error("CRAFT_RESTOCK_UNVERIFIED",p,"Live timer not proven");
 }
 return result();
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const load=path=>JSON.parse(readFileSync(resolve(root,path),"utf8"));
 const result=auditCraftingChains(load("data/crafting-chains-beta.json"),load("data/npcs.json"),load("data/professions.json"));
 if(process.argv.includes("--json"))process.stdout.write(JSON.stringify(result,null,2)+"\n");
 else {process.stdout.write(JSON.stringify({summary:result.summary,errors:result.errorCount,warnings:result.warningCount},null,2)+"\n");
  for(const issue of result.issues.filter(i=>i.severity==="error").slice(0,30))process.stdout.write(issue.code+" "+issue.path+": "+issue.message+"\n");}
 if(result.errorCount)process.exitCode=1;
}
