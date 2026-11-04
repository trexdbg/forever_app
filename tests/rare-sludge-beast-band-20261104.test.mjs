import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";
const load=file=>JSON.parse(readFileSync(new URL("../data/"+file,import.meta.url),"utf8"));
const rares=load("rares.json"),archive=load("items-forever-cache.json"),index=load("item-acquisition-index.json");
const sludge=rares.rares.find(r=>r.id==="3295");
test("Sludge Beast's 286535 ring is a documentary Forever beta relation with exact cache identity",()=>{
 assert.equal(sludge.name.en,"Sludge Beast");
 assert.equal(sludge.zone,"barrens");
 assert.equal(sludge.loot.length,1);
 const loot=sludge.loot[0];
 const cache=archive.items.find(i=>i.id===loot.item_id);
 assert.ok(cache);
 assert.equal(cache.source_status,"forever_beta_cache");
 assert.equal(cache.verified_forever,false);
 assert.equal(cache.name,"Sludge-Stained Band");
 assert.equal(loot.name.en,cache.name);
 assert.equal(loot.item_id,286535);
 assert.equal(loot.icon,cache.icon);
 assert.equal(loot.item_level,cache.itemLevel);
 assert.equal(loot.required_level,cache.requiredLevel);
 assert.equal(loot.item_source_url,"https://www.60.tools/items/286535-sludge-stained-band");
 assert.equal(loot.source_url,"https://1mw.io/en/world/rares");
 assert.equal(loot.evidence_level,"documented_forever");
 assert.equal(loot.evidence_kind,"forever_community_page");
 assert.equal(loot.observed_at,"2026-11-04");
 assert.equal(loot.observed_build,"unknown");
 assert.match(loot.evidence_note,/WCLBox/);
 assert.match(loot.evidence_note,/intentionally not copied/);
 assert.equal(loot.chance_classic_percent,null);
 assert.equal(loot.chance_forever_observed_percent,null);
 assert.equal(sludge.seen_forever,false);
});
test("the Sludge Beast item is navigable without promoting Classic coordinates or timers",()=>{
 const row=index.items.find(i=>i.id===286535);
 assert.ok(row);
 assert.deepEqual(row.sources,[{
   kind:"rare",name_fr:"Bête de vase",name_en:"Sludge Beast",
   href:"/rare/?zone=barrens&q=Sludge%20Beast&level=all",
   evidence_level:"documented_forever",source_status:"forever_beta_rare_loot",
   reference_url:"https://1mw.io/en/world/rares"
 }]);
 assert.equal(sludge.coordinate_status,"classic_reference");
 assert.equal(sludge.location_review.location_status,"classic_reference");
 assert.deepEqual(sludge.points,[[56.7,8.2]]);
 assert.equal(sludge.point_evidence[0].evidence_level,"unverified");
 assert.equal(sludge.reference,"classic_cmangos_not_forever_verified");
 assert.equal(sludge.loot_coverage,"notable_only_not_complete");
 assert.deepEqual(index,buildFromFiles());
 const scoped=rares.rares.filter(r=>r.beta_level30_in_scope);
 assert.equal(scoped.filter(r=>r.loot.length).length,92);
 assert.equal(scoped.filter(r=>!r.loot.length).length,69);
});
