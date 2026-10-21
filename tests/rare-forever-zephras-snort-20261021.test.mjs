import test from "node:test";
import {BASELINE as current} from "./helpers/catalogue-baseline.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";

const read = name => JSON.parse(readFileSync(new URL("../data/"+name,import.meta.url), "utf8"));
const rares = read("rares.json").rares;
const equipment = read("items-forever.json").items;
const index = read("item-acquisition-index.json");
const byItem = new Map(equipment.map(x=>[x.id,x]));
const byIndex = new Map(index.items.map(x=>[x.id,x]));
const cases = [
  ["barrens-snort-the-heckler", [286536]],
  ["256492", [285272,285273,285274]],
  ["259388", [285228]]
];
test("five Forever item IDs are linked to exactly three 1-30 rare records with independently cited source pages",()=>{
 assert.equal(equipment.length,179);
 assert.equal(new Set(equipment.map(x=>x.id)).size,equipment.length);
 for(const [rareId,ids] of cases){
   const rare=rares.find(x=>x.id===rareId);
   assert.ok(rare&&rare.beta_level30_in_scope,rareId);
   assert.deepEqual(rare.loot.map(x=>x.item_id),ids,rareId);
   assert.equal(rare.loot_coverage,"notable_only_not_complete");
   for(const drop of rare.loot){
     const item=byItem.get(drop.item_id),indexed=byIndex.get(drop.item_id);
     assert.ok(item&&indexed,drop.item_id);
     assert.equal(drop.item_level,item.itemLevel);
     assert.equal(drop.required_level,item.requiredLevel);
     assert.equal(drop.name.en,item.name);
     assert.equal(item.verified_forever,false);
     assert.equal(drop.evidence_level,"documented_forever");
     assert.equal(drop.evidence_kind,"forever_community_page");
     assert.equal(drop.source_version,"forever_beta");
     assert.equal(drop.observed_at,"2026-10-21");
     assert.match(drop.source_url,/^https:\/\//);
     assert.match(drop.evidence_url,/^https:\/\//);
     assert.match(drop.item_source_url,/^https:\/\//);
     assert.notEqual(drop.source_url,drop.item_source_url,"Drop attribution must cite a different page than item stats");
     assert.equal(drop.chance_forever_observed_percent,null);
     assert.equal(drop.chance_classic_percent,null);
     assert.equal(item.acquisition_sources[0].name_en,rare.name.en);
     assert.equal(indexed.sources.length,1);
     assert.equal(indexed.sources[0].evidence_level,"documented_forever");
     assert.equal(indexed.sources[0].reference_url,drop.source_url);
   }
 }
});
test("Mystmane conflicting drop source stays a documentary report, never confirmed",()=>{
 const rare=rares.find(x=>x.id==="259388"),drop=rare.loot[0],item=byItem.get(285228);
 assert.equal(rare.seen_forever,false);
 assert.match(drop.evidence_note,/The Forever Era/);
 assert.match(drop.evidence_note,/Conflicting documentary evidence/);
 assert.equal(drop.conflicting_source_url,"https://theforeverera.com/en/items/285228/");
 assert.match(item.acquisition_conflict_note_en,/unknown/);
 assert.ok(item.acquisition_sources.every(s=>s.evidence_level==="documented_forever"));
});
test("beta loot hints retain Classic points, no invented spawn times or loot percentages",()=>{
 const snort=rares.find(x=>x.id==="barrens-snort-the-heckler");
 assert.equal(snort.coordinate_status,"classic_reference");
 assert.deepEqual(snort.points,[[41.2,22.2]]);
 assert.equal(snort.loot[0].drop_evidence,"forever_community_single_loot_observation");
 for(const id of ["256492","259388"]){
   const r=rares.find(x=>x.id===id);
   assert.equal(r.seen_forever,false);
   assert.equal(r.respawn_min_hours,null);
   assert.equal(r.respawn_max_hours,null);
   assert.equal(r.coordinate_status,"documented_forever");
 }
});
test("reproducible acquisition index includes 5 new documented rare links with no certainty promotion",()=>{
 assert.deepEqual(index,buildFromFiles());
 assert.equal(index.totals.unique_items,current.index.uniqueItems);
 assert.equal(index.totals.relations,current.index.relations);
 assert.equal(index.totals.by_kind.rare,current.index.byKind.rare);
 assert.equal(index.totals.by_evidence.documented_forever,current.index.byEvidence.documented_forever);
 assert.equal(index.totals.by_evidence.classic_reference,current.index.byEvidence.classic_reference);
 assert.ok(!index.items.some(x=>x.sources.some(s=>s.evidence_level==="confirmed_in_game")));
});
