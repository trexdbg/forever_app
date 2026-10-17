import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const archive=JSON.parse(load("data/recipes-forever-early-archive.json"));
const merchantDb=JSON.parse(load("data/npcs.json"));
const existingEngineering=JSON.parse(load("data/crafting-chains-beta.json"));
const existingAlchemy=JSON.parse(load("data/alchemy-chains-beta.json"));
const https=s=>typeof s==="string"&&/^https:\/\/[^\s/]+\//.test(s);
test("649 distinct historic Forever client recipes across all 12 professions",()=>{
 assert.equal(archive.schema_version,1);
 assert.equal(archive.source_build,"1.60.1.69876");
 assert.equal(archive.source_snapshot_date,"2026-09-17");
 assert.equal(archive.status,"historical_client_archive_not_in_game_verified");
 assert.ok(https(archive.source_url));
 assert.equal(archive.recipes.length,649);
 assert.equal(archive.counts.recipes,649);
 assert.equal(new Set(archive.recipes.map(r=>r.spell_id)).size,649);
 assert.equal(new Set(archive.recipes.map(r=>r.profession_id)).size,12);
 assert.deepEqual(archive.counts.by_status,{unchanged:124,changed:206,inherited:2,new:317});
 assert.ok(archive.counts.by_profession.Engineering>=60);
 assert.ok(archive.counts.by_profession.Alchemy>=45);
});
test("all reagents are exact positive item IDs with nonzero archive quantities",()=>{
 let count=0,links=0,documented=0;
 for(const r of archive.recipes){
  assert.ok(Number.isSafeInteger(r.spell_id)&&r.spell_id>0);
  assert.ok(Number.isSafeInteger(r.profession_id)&&r.profession_id>0);
  assert.ok(r.name_en&&r.name_fr===null);
  assert.equal(r.name_fr_status,"not_independently_localized");
  assert.ok(Number.isSafeInteger(r.skill_yellow_archive)&&r.skill_yellow_archive>=1&&r.skill_yellow_archive<=150);
  assert.ok(r.skill_grey_archive===null||r.skill_grey_archive>=r.skill_yellow_archive);
  assert.equal(r.skill_green_archive,null);
  assert.equal(r.learning_skill_required,null);
  assert.equal(r.learning_skill_status,"not_in_client_archive");
  assert.equal(r.sources.evidence_level,"datamined");
  assert.equal(r.sources.availability_in_game,null);
  assert.equal(r.sources.archived_build,archive.source_build);
  assert.ok(https(r.sources.archive_url));
  assert.equal(r.sources.forever_spell_url,"https://www.wowhead.com/forever/spell="+r.spell_id);
  assert.ok(r.outputs.length>=1&&r.ingredients.length>=1);
  for(const o of r.outputs){
   assert.ok(Number.isSafeInteger(o.item_id)&&o.item_id>0);
   assert.ok(o.name_en&&o.name_fr===null);
   assert.equal(o.verified_live_yield,null);
   assert.ok(o.player_level_required===null||o.player_level_required<=30);
  }
  for(const i of r.ingredients){
   assert.ok(Number.isSafeInteger(i.item_id)&&i.item_id>0);
   assert.ok(i.name_en&&i.name_fr===null);
   assert.ok(Number.isSafeInteger(i.quantity)&&i.quantity>0);
   count++;
  }
  for(const v of r.vendor_references){
   assert.ok(["classic_reference","documented_forever"].includes(v.evidence_level));
   assert.ok(r.book_item_ids.includes(v.recipe_item_id));
   assert.equal(v.recipe_item_id,v.item_id);
   assert.ok(https(v.evidence_url));
   assert.equal(v.stock_status,"unknown_for_forever");
   assert.ok(merchantDb.npcs.some(n=>n.name===v.name_en&&(n.offers||[]).map(Number).includes(v.recipe_item_id)));
   if(v.evidence_level==="documented_forever"){
    documented++;
    assert.ok(merchantDb.npcs.some(n=>n.name===v.name_en&&n.offer_details?.[String(v.recipe_item_id)]?.verification_status==="forever_documented"));
   }
   links++;
  }
 }
 assert.equal(count,1913);
 assert.equal(links,436);
 assert.equal(documented,300);
 assert.equal(archive.counts.reagent_edges,count);
 assert.equal(archive.counts.vendor_reference_edges,links);
 assert.equal(archive.counts.documented_forever_vendor_edges,documented);
});
test("historical Copper Tube client yield does not override the newer conflicted research",()=>{
 const tube=archive.recipes.find(r=>r.spell_id===3924);
 assert.ok(tube&&tube.name_en==="Copper Tube");
 assert.equal(tube.skill_yellow_archive,80);
 assert.equal(tube.learning_skill_required,null);
 assert.deepEqual(tube.ingredients.map(i=>[i.item_id,i.quantity]),[[2840,2],[2880,1]]);
 assert.equal(tube.outputs[0].reported_client_output_quantity,1);
 assert.equal(tube.outputs[0].verified_live_yield,null);
 const preview=existingEngineering.recipes.find(r=>r.spell_id===3924);
 assert.equal(preview.output_quantity_status,"conflicting_sources");
 assert.equal(preview.output_quantity,null);
 assert.equal(existingEngineering.recipes.length,8);
 assert.equal(existingAlchemy.recipes.length,6);
});
test("classic fallback recipe item seller is never promoted to Forever availability",()=>{
 const r=archive.recipes.find(r=>r.spell_id===2542);
 assert.equal(r.name_en,"Goretusk Liver Pie");
 assert.ok(r.vendor_references.some(v=>v.name_en==="Kendor Kabonka"&&v.evidence_level==="classic_reference"));
 assert.ok(archive.recipes.some(r=>r.vendor_references.some(v=>v.evidence_level==="documented_forever")));
 assert.ok(archive.recipes.every(r=>r.sources.availability_in_game===null));
});
test("new Forever and changed-vs-Classic recipes are distinct from inherited older data",()=>{
 const newOne=archive.recipes.find(r=>r.spell_id===1230161);
 assert.equal(newOne.name_en,"Lodestone");
 assert.equal(newOne.forever_archive_status,"new");
 assert.ok(archive.recipes.filter(r=>r.forever_archive_status==="changed").some(r=>r.classic_comparison?.differences?.length));
 for(const x of archive.recipes.filter(r=>r.forever_archive_status==="changed")){
  assert.ok(Array.isArray(x.classic_comparison?.classic_ingredients));
  assert.ok(Array.isArray(x.classic_comparison?.classic_output_quantities));
 }
});
test("archive is opt-in, loads lazily and both localized professions pages link the same dataset",()=>{
 const js=load("assets/recipes-early.js");
 assert.match(js,/root\.addEventListener\("toggle"/);
 assert.match(js,/if\(root\.open\)load\(\)/);
 assert.match(js,/historical_client_archive_not_in_game_verified/);
 assert.match(js,/function recipeView/);
 assert.match(js,/edition:/);
 assert.match(js,/"Engineering":"Ingénierie"/);
 assert.match(js,/"Cooking":"Cuisine"/);
 assert.match(js,/"First Aid":"Secourisme"/);
 assert.match(js,/profLabel\(r\.profession_en\)/);
 assert.match(js,/profLabel\(name\)/);
 assert.match(js,/Compétence requise/);
 for(const p of ["metiers/index.html","en/metiers/index.html"]){
  const html=load(p);
  assert.match(html,/id="early-recipes"/);
  assert.match(html,/id="early-recipe-change"/);
  assert.match(html,/recipes-early\.js\?v=20261017-clean-1/);
  assert.match(html,/recipes-early\.css\?v=20261015-1/);
  assert.match(html,/id="early-recipe-results"/);
 }
});

test("initial recipe selection is reflected in aria-pressed before buttons render",()=>{
 const js=load("assets/recipes-early.js");
 const select=js.indexOf("if(!selected&&hits.length)selected=hits[0]");
 const rows=js.indexOf("for(const r of visible)");
 const aria=js.indexOf('b.setAttribute("aria-pressed"');
 assert.ok(select>=0&&rows>=0&&aria>=0);
 assert.ok(select<rows&&rows<aria,
  "The default selected recipe must be picked before aria-pressed values are assigned");
 assert.match(js,/if\(selected&&!hits\.some\(r=>r\.spell_id===selected\.spell_id\)\)selected=null/);
});
