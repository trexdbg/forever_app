import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";
const load = path => JSON.parse(readFileSync(new URL("../data/"+path,import.meta.url),"utf8"));
const db = load("rares.json");
const index = load("item-acquisition-index.json");
const expected = [
 ["10356",283462,"Bayne's Bite"],
 ["hillsbrad-creepthess",282720,"Spider Swarm"],
 ["14429",284166,"Gnarlpine War Staff"],
 ["forever-durotar-dustwind-eggtender",286745,"Furlfeather Ring"],
 ["forever-elwynn-matriarch-bristlefur",286748,"Bristlebark Bow"],
 ["forever-mulgore-snarlsnout",286753,"Snarlsnout Shooter"],
 ["forever-mulgore-stormherald-ukta",286754,"Ukta's Conduit"],
 ["forever-mulgore-thornstarter-igleg",286752,"Igleggings"]
];
test("eight independently attributed Forever rare rewards have exact item IDs and no invented gameplay proof",()=>{
 assert.equal(new Set(expected.map(x=>x[1])).size,expected.length);
 for(const [id,itemId,name] of expected){
  const rare=db.rares.find(r=>r.id===id);
  assert.ok(rare,"Missing rare "+id);
  assert.equal(rare.loot.length,1);
  assert.equal(rare.loot_coverage,"notable_only_not_complete");
  assert.equal(rare.seen_forever,false,"Do not infer an in-game encounter from a loot listing");
  const loot=rare.loot[0];
  assert.equal(loot.item_id,itemId);
  assert.equal(loot.name.en,name);
  assert.equal(loot.name.fr,name);
  assert.equal(loot.name_fr_status,"unverified_fallback_english");
  assert.equal(loot.source_version,"forever_beta");
  assert.equal(loot.evidence_level,"documented_forever");
  assert.equal(loot.evidence_kind,"forever_community_page");
  assert.equal(loot.observed_at,"2026-11-03");
  assert.equal(loot.observed_build,"unknown");
  assert.match(loot.source_url,/^https:\/\//);
  assert.match(loot.item_source_url,/^https:\/\//);
  assert.match(loot.evidence_url,/^https:\/\//);
  assert.ok(loot.evidence_note.length>100);
  assert.equal(loot.chance_classic_percent,null);
  assert.equal(loot.chance_forever_observed_percent,null);
  assert.equal(loot.chance_forever_percent,undefined);
  assert.notEqual(loot.drop_evidence,"confirmed_in_game");
 }
});
test("source index points back to eight documentary rare claims, not verified live drops",()=>{
 for(const [id,itemId] of expected){
  const rare=db.rares.find(r=>r.id===id),loot=rare.loot[0];
  const entry=index.items.find(i=>i.id===itemId);
  assert.ok(entry,"Missing index entry "+itemId);
  const refs=entry.sources.filter(s=>s.kind==="rare" && s.name_en===rare.name.en);
  assert.equal(refs.length,1);
  assert.equal(refs[0].evidence_level,"documented_forever");
  assert.equal(refs[0].source_status,"forever_beta_rare_loot");
  assert.equal(refs[0].reference_url,loot.source_url);
 }
 assert.deepEqual(index,buildFromFiles(),"Rebuild acquisition index after every rare-data edit");
});
test("beta rare coverage gains four documented rows without changing uncertain Classic map points",()=>{
 const scoped=db.rares.filter(r=>r.beta_level30_in_scope);
 assert.equal(scoped.filter(r=>r.loot.length).length,90);
 assert.equal(scoped.filter(r=>!r.loot.length).length,71);
 assert.equal(db.rares.reduce((n,r)=>n+r.loot.length,0),136);
 for(const [id] of expected.slice(0,3)){
  const rare=db.rares.find(r=>r.id===id);
  assert.equal(rare.coordinate_status,"classic_reference","New loot source must not silently certify historical location");
 }
});
