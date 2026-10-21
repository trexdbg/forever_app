import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";
const load=name=>JSON.parse(readFileSync(new URL("../data/"+name,import.meta.url),"utf8"));
const db=load("rares.json"),index=load("item-acquisition-index.json");
const byId=new Map(index.items.map(x=>[x.id,x]));
const records=[
 {rare:"tirisfal-farmer-solliden",npcId:1936,fr:"Fermier de Solliden",en:"Farmer Solliden",items:[4261]},
 {rare:"elwynn-morgaine-the-sly",npcId:99,fr:"Morgaine la rusée",en:"Morgaine the Sly",items:[1917,6201]}
];
test("three sourced Classic-only fallback items are linked by exact NPC and item IDs",()=>{
 for(const info of records){
  const rare=db.rares.find(r=>r.id===info.rare);
  assert.ok(rare);
  assert.equal(rare.name.en,info.en);
  assert.equal(rare.name.fr,info.fr);
  assert.equal(rare.name_fr_status,"classic_reference");
  assert.equal(rare.location_review.classic_numeric_id_reference,info.npcId);
  assert.ok(rare.name_fr_source_url.startsWith("https://www.wowhead.com/classic/fr/npc="));
  assert.deepEqual(rare.loot.map(x=>x.item_id).sort((a,b)=>a-b),info.items);
  assert.equal(rare.loot_coverage,"notable_only_not_complete");
  assert.equal(rare.seen_forever,false);
  assert.equal(rare.coordinate_status,"classic_reference");
  for(const loot of rare.loot){
   assert.equal(loot.source_version,"classic_reference");
   assert.equal(loot.evidence_level,"classic_reference");
   assert.equal(loot.evidence_kind,"classic_database");
   assert.equal(loot.stats_version,"classic_reference");
   assert.equal(loot.name_fr_status,"classic_reference");
   assert.equal(loot.chance_classic_percent,null);
   assert.equal(loot.chance_forever_observed_percent,null);
   assert.match(loot.source_url,/^https:\/\/www\.wowhead\.com\/classic\/item=/);
   assert.match(loot.evidence_url,new RegExp("/npc="+info.npcId+"(?:/|$)"));
   assert.match(loot.item_source_url,new RegExp("/item="+loot.item_id+"(?:/|$)"));
   assert.match(loot.evidence_note,/no evidence of current WoW Forever drop/);
   const ref=byId.get(loot.item_id);
   assert.ok(ref,"Missing indexed item "+loot.item_id);
   assert.equal(ref.sources.length,1);
   const source=ref.sources[0];
   assert.equal(source.kind,"rare");
   assert.equal(source.name_en,info.en);
   assert.equal(source.evidence_level,"classic_reference");
   assert.equal(source.source_status,"classic_rare_loot_reference");
   assert.equal(source.reference_url,loot.source_url);
  }
 }
});
test("2 new documented Classic fallbacks increase catalogue navigation without promoting Forever evidence",()=>{
 assert.deepEqual(index,buildFromFiles());
 assert.equal(index.totals.unique_items,739);
 assert.equal(index.totals.relations,1265);
 assert.equal(index.totals.by_kind.rare,123);
 assert.equal(index.totals.by_evidence.classic_reference,771);
 assert.equal(index.totals.by_evidence.documented_forever,470);
 const scoped=db.rares.filter(x=>x.beta_level30_in_scope);
 assert.equal(scoped.length,161);
 assert.equal(scoped.filter(x=>x.loot.length).length,83);
 assert.equal(scoped.filter(x=>!x.loot.length).length,78);
 for(const r of db.rares.filter(x=>records.some(p=>p.rare===x.id))){
  assert.ok(r.points.length>0);
  assert.ok(r.point_evidence.every(e=>e.origin==="classic_reference"));
 }
});
