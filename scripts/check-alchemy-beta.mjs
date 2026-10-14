#!/usr/bin/env node
/* Agent 03 mission 05: strict evidence-scoped acquisitions and beta allowlist validation. */
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";
const goodUrl=x=>typeof x==="string"&&/^https:\/\/[^\s/]+\S*$/.test(x);
const pos=x=>Number.isSafeInteger(x)&&x>0;
const txt=x=>typeof x==="string"&&x.trim().length>0;
const obj=x=>x&&typeof x==="object"&&!Array.isArray(x);
export const ALLOWED=[4596,2455,2456,247239,247240,3385];
export const EXCLUDED=[118,858];

/* Mission 06: model claims independently; a guide itinerary is not a node coordinate
   and a supplier class is not a proven NPC→item transaction. */
export const REAGENTS=[3371,3372,2447,785,2450,2453,3820,730];
export const METHODS=["vendor","herbalism_node","loot","classic_reference","unverified"];
const kinds={
 confirmed_in_game:["gameplay_capture","gameplay_log"],
 documented_forever:["forever_official_page","forever_community_page"],
 datamined:["client_db2","addon_snapshot","cache_snapshot"],
 classic_reference:["classic_database","classic_guide"],
 unverified:["unknown",null,undefined]
};
const date=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+"T00:00:00Z"))&&
 new Date(x+"T00:00:00Z").toISOString().slice(0,10)===x;
const nil=x=>x===null;
const emptyFields=(a,fields)=>fields.every(k=>nil(a[k]));
export function checkAcquisition(a,items){
 const issues=[],bad=x=>issues.push(x);
 if(!obj(a)||!REAGENTS.includes(a.item_id)||items?.[String(a.item_id)]?.kind!=="component"||
    !METHODS.includes(a.method))return ["ACQUISITION_METHOD_OR_ITEM"];
 if(a.quantity!==null||a.verified_for_forever!==false)bad("ACQUISITION_UNVERIFIED_VALUE");
 if(!txt(a.evidence_note)||!kinds[a.evidence_level]?.includes(a.evidence_kind))bad("ACQUISITION_EVIDENCE_LEVEL");
 if(a.evidence_level==="unverified"){
  if(a.method!=="unverified"||!["vendor","herbalism_node","loot"].includes(a.scope)||
     !emptyFields(a,["mob_id","mob_name","drop_rate","respawn_minutes","coordinates","price","stock","restock_minutes"]))
     bad("ACQUISITION_UNVERIFIED_PROMOTION");
  return issues;
 }
 if(!["confirmed_in_game","documented_forever","datamined","classic_reference"].includes(a.evidence_level)||
    ![a.source_url,a.evidence_url].every(goodUrl)||!date(a.observed_at)||
    !txt(a.observed_build)||!txt(a.evidence_note)||a.observed_at>new Date().toISOString().slice(0,10))bad("ACQUISITION_PROVENANCE");
 if(a.evidence_level==="confirmed_in_game"&&(a.observed_build==="unknown"||!a.evidence_url))
  bad("ACQUISITION_GAMEPLAY_PROOF");
 if(a.evidence_level==="datamined"&&a.observed_build==="unknown")bad("ACQUISITION_CLIENT_BUILD");
 if(a.guide_updated_at!==undefined&&(!date(a.guide_updated_at)||!date(a.observed_at)||a.guide_updated_at>a.observed_at))
  bad("ACQUISITION_GUIDE_DATE");
 if(a.method==="vendor"){
  if(items[String(a.item_id)]?.category!=="vial")bad("ACQUISITION_CATEGORY");
  if(a.scope==="supplier_category"){
   if(a.evidence_level!=="documented_forever"||!txt(a.supplier_types?.fr)||
      !txt(a.supplier_types?.en)||!emptyFields(a,["vendor_id","vendor_name","price","stock","restock_minutes","coordinates","faction","zone"]))
    bad("ACQUISITION_VENDOR_PROOF");
  }else if(a.scope==="npc_item_sale"){
   if(!pos(a.vendor_id)||!txt(a.vendor_name?.fr)||!txt(a.vendor_name?.en)||
      !["documented_forever","confirmed_in_game"].includes(a.evidence_level)||
      !emptyFields(a,["price","stock","restock_minutes","coordinates"]))bad("ACQUISITION_VENDOR_PROOF");
  }else bad("ACQUISITION_VENDOR_PROOF");
 }else if(a.method==="herbalism_node"){
  if(items[String(a.item_id)]?.category!=="herb"||
     a.node_name?.en!==items[String(a.item_id)]?.name?.en||
     a.node_name?.fr!==items[String(a.item_id)]?.name?.fr)
    bad("ACQUISITION_CATEGORY_OR_NODE_IDENTITY");
  if(a.scope!=="guide_named_herb"||a.evidence_level!=="documented_forever"||
     !txt(a.node_name?.fr)||!txt(a.node_name?.en)||a.node_id!==null||
     a.skill_required!==null||a.coordinates!==null||a.zone_scope!=="shared_guide_itinerary"||
     a.skill_band_kind!=="suggested_leveling_route"||!Array.isArray(a.skill_band)||
     a.skill_band.length!==2||!a.skill_band.every(pos)||a.skill_band[0]>a.skill_band[1]||
     !Array.isArray(a.suggested_zones?.fr)||!Array.isArray(a.suggested_zones?.en)||
     !a.suggested_zones.fr.length||a.suggested_zones.fr.length!==a.suggested_zones.en.length||
     !a.suggested_zones.fr.every(txt)||!a.suggested_zones.en.every(txt))
    bad("ACQUISITION_NODE_PROOF");
 }else if(a.method==="loot"){
  if(items[String(a.item_id)]?.category!=="loot")bad("ACQUISITION_CATEGORY");
  if(a.scope!=="mob_item_drop"||!pos(a.mob_id)||!txt(a.mob_name?.fr)||!txt(a.mob_name?.en)||
     !["documented_forever","confirmed_in_game"].includes(a.evidence_level)||
     !emptyFields(a,["drop_rate","respawn_minutes","coordinates"]))bad("ACQUISITION_LOOT_PROOF");
 }else if(a.method==="classic_reference"){
  if(a.evidence_level!=="classic_reference"||a.scope!=="lead_only"||
     !emptyFields(a,["coordinates","price","stock","restock_minutes","drop_rate","respawn_minutes"]))
    bad("ACQUISITION_CLASSIC_SEPARATION");
 }else bad("ACQUISITION_METHOD_OR_ITEM");
 return issues;
}

export function checkAlchemy(data){
 const errors=[],fail=(code,path)=>errors.push({code,path});
 if(!obj(data)||data.schema_version!==1||data.scope?.status!=="research_only_not_published"||
 data.scope?.preview?.status!=="opt_in_documentary_preview"||!obj(data.items)||
 !Array.isArray(data.recipes)||!Array.isArray(data.acquisitions)||!Array.isArray(data.excluded_alchemy))
 {fail("INVALID_ROOT","root");return {errors,summary:null};}
 const allow=data.scope.preview.recipe_item_ids;
 if(!Array.isArray(allow)||allow.length!==ALLOWED.length||new Set(allow).size!==ALLOWED.length||
 ALLOWED.some(id=>!allow.includes(id)))fail("ALLOWLIST_INVALID","scope.preview.recipe_item_ids");
 if(data.recipes.length!==ALLOWED.length)fail("UNEXPECTED_RECIPE_COUNT","recipes");
 const ids=new Set(),spells=new Set();
 const allowedStates=new Set(["changed","new","unchanged"]);
 const entryNames=["source_url","evidence_url","observed_at","observed_build","evidence_kind","evidence_note"];
 for(const [key,item] of Object.entries(data.items)){
  if(!obj(item)||!pos(item.id)||String(item.id)!==key||!txt(item.name?.fr)||!txt(item.name?.en))
   {fail("ITEM_INVALID","items."+key);continue;}
  if(!["potion","component"].includes(item.kind)||item.name_verification!=="translation_reference_only")
   fail("ITEM_UNVERIFIED_LABEL","items."+key);
  if(item.player_level_required!==null)fail("UNVERIFIED_CHARACTER_LEVEL","items."+key);
  if(item.evidence_level!=="documented_forever"||entryNames.some(k=>!txt(item[k]))||
  !goodUrl(item.source_url)||!goodUrl(item.evidence_url))fail("ITEM_PROVENANCE","items."+key);
 }
 for(const [i,r] of data.recipes.entries()){
  const path="recipes["+i+"]";
  if(!obj(r)||!pos(r.output_item_id)||!pos(r.spell_id)||ids.has(r.output_item_id)||spells.has(r.spell_id)){
   fail("RECIPE_ID",path);continue;
  }
  ids.add(r.output_item_id);spells.add(r.spell_id);
  if(!ALLOWED.includes(r.output_item_id)||data.items[String(r.output_item_id)]?.kind!=="potion"||
   r.profession_id!==171||!allowedStates.has(r.change_status))fail("RECIPE_SCOPE",path);
  if(EXCLUDED.includes(r.output_item_id))fail("MOVED_FIRST_AID","recipes["+i+"]");
  if(r.recipe_item_id!==null&&!pos(r.recipe_item_id))fail("RECIPE_ITEM_ID",path);
  if(!["trainer","recipe_item"].includes(r.learning_method)||
     (r.learning_method==="trainer"&&r.recipe_item_id!==null)||
     (r.learning_method==="recipe_item"&&!pos(r.recipe_item_id)))fail("LEARNING_METHOD",path);
  if(r.skill_required!==null&&(!pos(r.skill_required)||r.skill_required>r.skill_yellow))
   fail("SKILL_REQUIRED",path);
  if(!pos(r.skill_yellow)||!goodUrl(r.skill_yellow_source_url))fail("YELLOW_PROVENANCE",path);
  if(!["trainer_requirement_not_in_client","client_known_required_skill","client_recipe_item_level"].includes(r.skill_required_status)||
    (r.skill_required_status==="trainer_requirement_not_in_client"&&r.skill_required!==null)||
    (r.skill_required_status!=="trainer_requirement_not_in_client"&&!pos(r.skill_required)))
   fail("TRAINER_LEVEL_INVENTED",path);
  if(!pos(r.item_level)||r.player_level_required!==null)fail("LEVEL_CONFLATION",path);
  if(r.output_quantity!==null||r.output_quantity_status!=="unverified_live_yield"||
     r.available_in_game!==null||r.verified_for_forever!==false)
   fail("UNVERIFIED_AVAILABILITY_OR_YIELD",path);
  if(r.evidence_level!=="documented_forever"||entryNames.some(k=>!txt(r[k]))||
    !goodUrl(r.source_url)||!goodUrl(r.evidence_url)||!goodUrl(r.reported_client_yield_source_url))
   fail("RECIPE_PROVENANCE",path);
  if(!Array.isArray(r.ingredients)||r.ingredients.length<1){fail("INGREDIENTS_MISSING",path);continue;}
  const components=new Set();
  for(const [j,c] of r.ingredients.entries()){
   if(!obj(c)||!pos(c.item_id)||!pos(c.quantity)||components.has(c.item_id)||
   data.items[String(c.item_id)]?.kind!=="component")
    fail("COMPONENT_INVALID",path+".ingredients["+j+"]");
   if(obj(c))components.add(c.item_id);
  }
 }
 if(ids.size!==ALLOWED.length||ALLOWED.some(id=>!ids.has(id)))fail("RECIPE_SET","recipes");

 const found=new Set(),keys=new Set();
 for(const [i,a] of data.acquisitions.entries()){
  const path="acquisitions["+i+"]";
  for(const code of checkAcquisition(a,data.items))fail(code,path);
  if(!obj(a))continue;
  found.add(a.item_id);
  const key=[a.item_id,a.method,a.scope,a.vendor_id??"",a.node_id??"",a.mob_id??""].join(":");
  if(keys.has(key))fail("ACQUISITION_DUPLICATE",path);
  keys.add(key);
 }
 if(REAGENTS.some(id=>!found.has(id)))fail("ACQUISITION_COVERAGE","acquisitions");

 if(data.excluded_alchemy.length!==2||EXCLUDED.some(id=>!data.excluded_alchemy.some(e=>e?.item_id===id&&e.reason==="moved_to_first_aid"&&goodUrl(e.source_url))))
  fail("FIRST_AID_EXCLUSION","excluded_alchemy");
 return {errors,summary:{recipes:data.recipes.length,items:Object.keys(data.items).length,acquisitions:data.acquisitions.length}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const db=JSON.parse(readFileSync(resolve(root,"data/alchemy-chains-beta.json"),"utf8"));
 const result=checkAlchemy(db);
 process.stdout.write(JSON.stringify({summary:result.summary,errorCount:result.errors.length,errors:result.errors},null,2)+"\n");
 if(result.errors.length)process.exitCode=1;
}
