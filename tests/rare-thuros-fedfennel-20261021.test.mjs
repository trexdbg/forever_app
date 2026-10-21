import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";
import {BASELINE as current} from "./helpers/catalogue-baseline.mjs";
const load=name=>JSON.parse(readFileSync(new URL("../data/"+name,import.meta.url),"utf8"));
const rares=load("rares.json").rares,items=load("items-forever.json").items,index=load("item-acquisition-index.json");
const expected=[
 ["elwynn-thuros-lightfingers",6202,13,8,"Fingerless Gloves"],
 ["elwynn-thuros-lightfingers",6203,13,8,"Thuggish Shield"],
 ["elwynn-fedfennel",5744,14,9,"Pale Skinner"]
];

test("two established rares gain three exact Forever beta item records, with separately documented acquisition",()=>{
 for(const [rareId,id,itemLevel,level,name] of expected){
  const rare=rares.find(x=>x.id===rareId),drop=rare?.loot?.find(x=>x.item_id===id);
  const item=items.find(x=>x.id===id),idx=index.items.find(x=>x.id===id);
  assert.ok(rare && drop && item && idx,name);
  assert.equal(drop.name.en,name);
  assert.equal(item.name,name);
  assert.equal(item.itemLevel,itemLevel);
  assert.equal(item.requiredLevel,level);
  assert.equal(drop.item_level,itemLevel);
  assert.equal(drop.required_level,level);
  assert.equal(drop.source_version,"forever_beta");
  assert.equal(drop.evidence_level,"documented_forever");
  assert.equal(drop.evidence_kind,"forever_community_page");
  assert.equal(drop.name_fr_status,"unverified_fallback_english");
  assert.equal(drop.chance_classic_percent,null);
  assert.equal(drop.chance_forever_observed_percent,null);
  assert.equal(rare.seen_forever,false);
  assert.equal(rare.coordinate_status,"classic_reference");
  assert.equal(item.verified_forever,false);
  assert.equal(item.acquisition_sources.length,1);
  assert.equal(item.acquisition_sources[0].evidence_level,"documented_forever");
  assert.equal(idx.sources[0].reference_url,drop.source_url);
  assert.equal(idx.sources[0].name_en,rare.name.en);
  assert.notEqual(drop.source_url,drop.item_source_url);
  assert.match(drop.evidence_note,/not a verified Forever creature drop|not a witnessed game drop|not independent live loot verification/i);
  assert.ok(!("confirmed_in_game" in drop));
 }
 const a=rares.find(x=>x.id==="elwynn-thuros-lightfingers");
 assert.deepEqual(a.loot.map(x=>x.item_id),[6202,6203]);
 const b=rares.find(x=>x.id==="elwynn-fedfennel");
 assert.deepEqual(b.loot.map(x=>x.item_id),[5744]);
});

test("Thuggish Shield stats and Fedfennel weapon are identified separately from Classic fallback rates",()=>{
 const shield=items.find(x=>x.id===6203),blade=items.find(x=>x.id===5744);
 assert.equal(shield.quality,"uncommon");
 assert.equal(shield.itemLevel,13);
 assert.ok(shield.tooltip.some(x=>x.includes("274 Armor")&&x.includes("+1 Strength")));
 assert.equal(blade.itemLevel,14);
 assert.ok(blade.tooltip.some(x=>x.includes("+1 Stamina")));
 for(const id of [6203,5744]){
  const row=rares.flatMap(x=>x.loot).find(x=>x.item_id===id);
  assert.match(row.evidence_note,/Classic 1.12|Classic fallback/i);
  assert.equal(row.chance_forever_observed_percent,null);
 }
});

test("published index is reproducible with no promotion of documentary reports into confirmed drops",()=>{
 assert.deepEqual(index,buildFromFiles());
 assert.equal(index.totals.unique_items,current.index.uniqueItems);
 assert.equal(index.totals.relations,current.index.relations);
 assert.equal(index.totals.by_kind.rare,current.index.byKind.rare);
 assert.equal(index.totals.by_evidence.documented_forever,current.index.byEvidence.documented_forever);
 assert.equal(index.totals.by_evidence.classic_reference,current.index.byEvidence.classic_reference);
 assert.equal(rares.filter(x=>x.beta_level30_in_scope&&x.loot.length).length,current.rares.betaWithLoot);
 assert.equal(rares.filter(x=>x.beta_level30_in_scope&&!x.loot.length).length,current.rares.betaWithoutLoot);
 assert.ok(!index.items.flatMap(x=>x.sources).some(x=>x.evidence_level==="confirmed_in_game"));
});
