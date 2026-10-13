import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {auditCraftingChains} from "../scripts/check-crafting-chains.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const load=f=>JSON.parse(readFileSync(resolve(root,f),"utf8"));
const source=load("data/crafting-chains-beta.json"),npcs=load("data/npcs.json"),professions=load("data/professions.json");
const clone=()=>structuredClone(source);
const run=c=>auditCraftingChains(c,npcs,professions);
const codes=r=>r.issues.filter(i=>i.severity==="error").map(i=>i.code);
test("real research catalogue is internally valid and scoped to beta research",()=>{
 const r=run(source);
 assert.deepEqual(codes(r),[]);
 assert.equal(source.scope.status,"research_only_not_published");
 assert.equal(r.summary.itemCount,16);
 assert.equal(r.summary.recipeCount,8);
 assert.equal(r.summary.ingredientEdges,12);
 assert.equal(r.summary.acquisitionCount,7);
});
test("Bronze Tube 4371 has actual spell 3938 and exact reagent IDs",()=>{
 const r=source.recipes.find(r=>r.output_item_id===4371);
 assert.equal(r.spell_id,3938);
 assert.equal(r.profession_id,202);
 assert.equal(r.skill_required,105);
 assert.deepEqual(r.ingredients,[{item_id:2841,quantity:2},{item_id:2880,quantity:1}]);
 assert.equal(source.items["4371"].name.fr,"Tube en bronze");
 assert.equal(source.items["4371"].name.en,"Bronze Tube");
 assert.equal(source.items["4371"].icon,"inv_gizmo_pipe_01");
});
test("Gyrochronatom 4389 has actual spell 3961 and nested Gold Power Core recipe",()=>{
 const r=source.recipes.find(r=>r.output_item_id===4389);
 assert.equal(r.spell_id,3961);
 assert.deepEqual(r.ingredients,[{item_id:3575,quantity:1},{item_id:10558,quantity:1}]);
 assert.equal(r.skill_required,170);
 assert.equal(source.items["4389"].name.fr,"Gyrochronatome");
 assert.equal(source.items["4389"].icon,"inv_misc_pocketwatch_02");
 const nested=source.recipes.find(r=>r.output_item_id===10558);
 assert.equal(nested.spell_id,12584);
 assert.deepEqual(nested.ingredients,[{item_id:3577,quantity:1}]);
});
test("disputed recipe output stays unknown, with competing source reports",()=>{
 for(const r of source.recipes){
  assert.equal(r.output_quantity,null);
  assert.equal(r.output_quantity_status,"conflicting_sources");
  assert.ok(r.output_quantity_candidates.length>=2);
  assert.ok(new Set(r.output_quantity_candidates.map(c=>c.quantity)).size>1);
 }
 const broken=clone();broken.recipes[0].output_quantity=2;
 assert.ok(codes(run(broken)).includes("CRAFT_OUTPUT_CONFLICT_HIDDEN"));
});
test("ingredient references, IDs and quantities are enforced",()=>{
 const c=clone();c.recipes[0].ingredients=[{item_id:999999,quantity:0}];
 const issues=codes(run(c));
 assert.ok(issues.includes("CRAFT_COMPONENT_MISSING"));
 assert.ok(issues.includes("CRAFT_COMPONENT_QUANTITY"));
});
test("duplicate ingredients, spell IDs and output references are rejected",()=>{
 const c=clone();c.recipes[1].spell_id=c.recipes[0].spell_id;
 c.recipes[1].output_item_id=c.recipes[0].output_item_id;
 c.recipes[1].ingredients.push(c.recipes[1].ingredients[0]);
 const issues=codes(run(c));
 for(const code of ["CRAFT_SPELL_ID","CRAFT_OUTPUT_DUPLICATE","CRAFT_COMPONENT_DUPLICATE"])assert.ok(issues.includes(code),code);
});
test("closed crafting loops are detected",()=>{
 const c=clone();
 c.recipes.find(r=>r.output_item_id===10558).ingredients.push({item_id:4389,quantity:1});
 assert.ok(codes(run(c)).includes("CRAFT_CYCLE"));
});
test("profession, skill levels and learning cannot be invented",()=>{
 const c=clone();
 c.recipes[0].profession_id=999;c.recipes[0].skill_required=99;
 c.recipes[0].learning.available_in_game=true;
 const issues=codes(run(c));
 for(const code of ["CRAFT_PROFESSION_UNKNOWN","CRAFT_SKILL_ORDER","CRAFT_AVAILABILITY_UNPROVEN"])assert.ok(issues.includes(code),code);
});
test("preserve distinct item, spell and recipe-item IDs including explicit unknown",()=>{
 for(const r of source.recipes){assert.ok(Number.isSafeInteger(r.spell_id));assert.equal(r.recipe_item_id,null);}
 const c=clone();c.recipes[0].recipe_item_id=-4;
 assert.ok(codes(run(c)).includes("CRAFT_RECIPE_ITEM_ID"));
});
test("no Classic vendor line becomes a Forever sale or a verified restock",()=>{
 const q=source.acquisitions.filter(a=>a.method==="legacy_vendor_catalogue");
 assert.equal(q.length,2);
 for(const a of q){
  assert.equal(a.evidence_level,"classic_reference");
  assert.equal(a.verified_for_forever,false);
  assert.equal(a.candidate_sellers,16);
  assert.equal(a.restock_minutes,null);
 }
 const c=clone();c.acquisitions[0].verified_for_forever=true;c.acquisitions[0].restock_minutes=30;
 for(const code of ["CRAFT_VENDOR_PROMOTION","CRAFT_RESTOCK_UNVERIFIED"])assert.ok(codes(run(c)).includes(code),code);
});
test("legacy merchant vendor count and price must match the untouched NPC module",()=>{
 const c=clone();c.acquisitions[0].candidate_sellers=12;c.acquisitions[1].price_copper=123;
 const issues=codes(run(c));
 for(const code of ["CRAFT_VENDOR_LIST_MISMATCH","CRAFT_VENDOR_PRICE_MISMATCH"])assert.ok(issues.includes(code),code);
});
test("prevent a Classic source or an unsupported source status from becoming Forever confirmation",()=>{
 const c=clone();
 c.recipes[0].evidence_level="classic_reference";
 c.items["4371"].evidence_level="confirmed_in_game";
 const issues=codes(run(c));
 for(const code of ["CRAFT_RECIPE_PROMOTION","CRAFT_FALSE_GAME_PROOF"])assert.ok(issues.includes(code),code);
});
test("bilingual names, safe icons and unsupported page status are checked",()=>{
 const c=clone();c.items["4389"].name.fr="";c.items["4389"].icon="<img>";
 c.scope.status="published";
 const issues=codes(run(c));
 for(const code of ["CRAFT_ITEM_LOCALE","CRAFT_ICON_INVALID","CRAFT_PUBLICATION_UNSUPPORTED"])assert.ok(issues.includes(code),code);
});
test("missing provenance is an error, not a guess",()=>{
 const c=clone();delete c.recipes[0].observed_at;
 assert.ok(codes(run(c)).includes("PROVENANCE_FIELD_MISSING"));
});
test("malformed root, recipes and acquisition records produce errors, not exceptions",()=>{
 const r=auditCraftingChains(null,null,null);
 assert.ok(r.errorCount>=3);
 const c=clone();c.items["2835"]=null;c.recipes[0]=null;c.acquisitions[0]=null;
 const issues=codes(run(c));
 for(const code of ["CRAFT_ITEM_INVALID","CRAFT_RECIPE_INVALID","CRAFT_ACQUISITION_INVALID"])assert.ok(issues.includes(code),code);
});
test("unknown smelting inputs, merchant NPC identity and unsourced stock remain null",()=>{
 for(const a of source.acquisitions.filter(a=>a.method==="smelting_candidate")){
  assert.equal(a.spell_id,null);
  assert.equal(a.ingredients,null);
  assert.equal(a.verified_for_forever,false);
 }
 const weakFlux=source.acquisitions.find(a=>a.item_id===2880);
 assert.equal(weakFlux.vendor_npc_id,null);
 assert.equal(weakFlux.price_copper,null);
 assert.equal(weakFlux.restock_minutes,null);
});
