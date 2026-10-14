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
test("Copper Tube 3924 separates documented trainer minimum 50 from Yellow 80 and Green 95",()=>{
 const r=source.recipes.find(x=>x.spell_id===3924);
 assert.equal(r.output_item_id,4361);
 assert.equal(r.skill_required,50);
 assert.equal(r.skill_yellow,80);
 assert.equal(r.skill_required_source_url,"https://wowtbc.gg/warcraftforever/professions/engineering/");
 assert.equal(r.skill_required_evidence_level,"documented_forever");
 assert.equal(r.skill_required_evidence_kind,"forever_community_page");
 assert.equal(r.skill_required_observed_at,"2026-10-13");
 assert.match(r.skill_required_evidence_note,/not a gameplay capture/i);
 assert.equal(r.skill_yellow_source_url,"https://wowforevertalents.com/professions/engineering/parts/");
 assert.match(r.skill_yellow_evidence_note,/Yellow 80/);
 assert.match(r.skill_note,/green 95/);
 const bad=clone();bad.recipes.find(x=>x.spell_id===3924).skill_required_source_url="";
 assert.ok(codes(run(bad)).includes("CRAFT_SKILL_REQUIRED_PROVENANCE"));
});
test("eight recipe Yellow thresholds match the Forever client index, not Green values",()=>{
 const expected=new Map([[3918,20],[3924,80],[3929,85],[3938,105],[3942,125],[12584,150],[3958,160],[3961,170]]);
 assert.equal(source.recipes.length,expected.size);
 for(const r of source.recipes){
  assert.equal(r.skill_yellow,expected.get(r.spell_id),"Wrong Yellow for spell "+r.spell_id);
  assert.equal(r.skill_yellow_source_url,"https://wowforevertalents.com/professions/engineering/parts/");
  assert.equal(r.skill_yellow_observed_build,"1.60.1.70338");
  assert.equal(r.skill_yellow_observed_at,"2026-10-13");
  assert.match(r.skill_yellow_evidence_note,new RegExp("Yellow "+r.skill_yellow+"\\b"));
 }
 const bad=clone();bad.recipes[3].skill_yellow_source_url="http://example.net/forever";
 assert.ok(codes(run(bad)).includes("CRAFT_SKILL_YELLOW_PROVENANCE"));
});
test("independently documented yield conflicts remain unresolved for specific recipes",()=>{
 const index="https://wowforevertalents.com/professions/engineering/parts/";
 const contested=new Map([
  [3924,[1,2,"https://www.wowhead.com/forever/spell=3924/copper-tube"]],
  [3938,[1,2,"https://www.wowhead.com/forever/spell=3938/bronze-tube"]],
  [12584,[3,4,"https://www.wowhead.com/forever/spell=12584/gold-power-core"]],
  [3961,[1,2,"https://www.wowhead.com/forever/spell=3961/gyrochronatom"]]
 ]);
 for(const [spell,[first,second,spellUrl]] of contested){
  const r=source.recipes.find(x=>x.spell_id===spell);
  assert.equal(r.output_quantity,null,"Do not invent yield for "+spell);
  assert.equal(r.output_quantity_status,"conflicting_sources");
  assert.deepEqual(r.output_quantity_candidates.map(c=>c.quantity),[first,second]);
  assert.deepEqual(r.output_quantity_candidates.map(c=>c.source_url),[index,spellUrl]);
  assert.ok(r.output_quantity_candidates.every(c=>c.evidence_note.includes("not direct")||c.evidence_note.includes("not an observed")));
 }
 const bad=clone();bad.recipes.find(x=>x.spell_id===3938).output_quantity=2;
 assert.ok(codes(run(bad)).includes("CRAFT_OUTPUT_CONFLICT_HIDDEN"));
});
test("other yields are unknown with just one supportable source, without false conflicts",()=>{
 for(const spell of [3918,3929,3942,3958]){
  const r=source.recipes.find(x=>x.spell_id===spell);
  assert.equal(r.output_quantity,null);
  assert.equal(r.output_quantity_status,"unknown");
  assert.deepEqual(r.output_quantity_candidates.map(c=>c.quantity),[1]);
  assert.equal(r.output_quantity_candidates[0].source_url,"https://wowforevertalents.com/professions/engineering/parts/");
 }
 const c=clone();const first=c.recipes.find(r=>r.spell_id===3918);
 first.output_quantity=1;first.output_quantity_status="documented_forever";
 first.output_quantity_source_url="https://wowforevertalents.com/professions/engineering/parts/";
 first.output_quantity_evidence_note="Fixture: an explicitly sourced, recipe-specific index value; not a live gameplay result.";
 assert.deepEqual(codes(run(c)),[],"Resolving one sourced recipe must not break the remaining seven recipes");
 const missing=clone();missing.recipes.find(r=>r.spell_id===3918).output_quantity=1;
 assert.ok(codes(run(missing)).includes("CRAFT_OUTPUT_RESOLUTION_UNSOURCED"));
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
