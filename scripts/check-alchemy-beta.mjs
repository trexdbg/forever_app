#!/usr/bin/env node
/* Agent 03 mission 05: conservative provenance and beta allowlist validation. */
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";
const goodUrl=x=>typeof x==="string"&&/^https:\/\/[^\s/]+\S*$/.test(x);
const pos=x=>Number.isSafeInteger(x)&&x>0;
const txt=x=>typeof x==="string"&&x.trim().length>0;
const obj=x=>x&&typeof x==="object"&&!Array.isArray(x);
export const ALLOWED=[4596,2455,2456,247239,247240,3385];
export const EXCLUDED=[118,858];
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
 if(data.acquisitions.length!==0)fail("UNVERIFIED_SOURCES_EXPOSED","acquisitions");
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
