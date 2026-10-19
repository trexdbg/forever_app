import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));
const audit=json("data/dungeon-gear-audit-20261019.json");
const byID=new Map(audit.items.map(x=>[x.id,x]));
const ready=audit.items.filter(x=>x.audit_status==="ready_for_catalogue");
const missing=audit.items.filter(x=>x.audit_status==="metadata_missing");
const legacy=ready.filter(x=>x.source_status==="forever_beta_server_reported");
const databases=[
 "items.json","items-classic-cache.json","items-forever.json",
 "items-forever-cache.json","bis-niveaux-classic.json","bis-niveaux-forever-observed.json"
].flatMap(path=>json("data/"+path).items);
const baseline=new Set(databases.map(item=>item.id));
const dungeon=json("data/dungeons-forever.json");
const expected=dungeon.dungeons.flatMap(d=>d.bosses.flatMap(b=>(b.loot||[]).filter(l=>
 Number.isSafeInteger(l.id)&&l.id>0&&!baseline.has(l.id)&&
 (l.source_status==="classic_loot_reference"||l.evidence_level==="documented_forever")
).map(l=>({id:l.id,name:l.en,boss:b.name.en}))));

test("all 83 dungeon loot rows account for exactly 82 new item IDs and one duplicate reference",()=>{
 assert.equal(audit.schema_version,1);
 assert.equal(audit.items.length,82);
 assert.equal(expected.length,83);
 assert.equal(new Set(expected.map(x=>x.id)).size,82);
 assert.equal(new Set(audit.items.map(x=>x.id)).size,82);
 assert.equal(audit.counts.original_reference_rows,83);
 assert.equal(audit.counts.unique_item_ids,82);
 assert.equal(audit.counts.duplicate_item_rows,1);
 assert.deepEqual([...byID.keys()].sort((a,b)=>a-b),[...new Set(expected.map(x=>x.id))].sort((a,b)=>a-b));
 for(const x of expected)assert.equal(byID.get(x.id).name,x.name,"ID/name mismatch for "+x.id);
 for(const x of audit.items)assert.ok(!baseline.has(x.id),"Never shadow a previously catalogued item: "+x.id);
});

test("40 original beta-server 70058 item profiles retain their provenance beside 42 new community files",()=>{
 assert.equal(ready.length,82);
 assert.equal(legacy.length,40);
 assert.equal(missing.length,0);
 assert.equal(audit.counts.metadata_vetted,82);
 assert.equal(audit.counts.metadata_pending,0);
 assert.equal(audit.counts.classic_1_12_odds_documented,43);
 for(const row of legacy){
  assert.equal(row.audit_status,"ready_for_catalogue");
  assert.ok(Number.isSafeInteger(row.id)&&row.id>0);
  assert.equal(row.quality,"rare");
  assert.ok(["head","shoulders","back","chest","wrist","hands","waist","legs","feet","mainhand","offhand","ranged"].includes(row.slot));
  assert.ok(["cloth","leather","mail","plate",null].includes(row.armorType));
  assert.ok(Number.isInteger(row.itemLevel)&&row.itemLevel>0);
  assert.ok(Number.isInteger(row.requiredLevel)&&row.requiredLevel>0);
  assert.ok(row.itemLevel>=row.requiredLevel);
  assert.equal(row.source_status,"forever_beta_server_reported");
  assert.equal(row.evidence_level,"documented_forever");
  assert.equal(row.evidence_kind,"forever_community_page");
  assert.equal(row.observed_at,"2026-09-30");
  assert.equal(row.observed_build,"70058");
  assert.equal(row.reviewed_at,"2026-10-19");
  assert.equal(row.source_url,"https://theforeverera.com/en/items/"+row.id+"/");
  assert.equal(row.evidence_url,row.source_url);
  assert.equal(row.verified_forever,false);
  assert.match(row.evidence_note,/not a verified player-observed drop or a Forever probability/);
  assert.ok(row.origin.includes(row.dungeon_fr)&&row.origin_en.includes(row.dungeon_en));
  assert.equal(typeof row.name,"string");
 }
 for(const row of missing){
  assert.equal(row.quality,null);
  assert.equal(row.itemLevel,null);
  assert.equal(row.requiredLevel,null);
  assert.equal(row.audit_status,"metadata_missing");
  assert.ok(!row.source_status);
  assert.ok(!row.verified_forever);
  assert.ok(!row.acquisition_sources);
  assert.match(row.issue,/Do not publish/);
  assert.ok(row.research_url.endsWith("/"+row.id+"/"));
 }
});

test("beta 70058 differs materially from Classic for key pre-30 items; no Classic quality promoted",()=>{
 for(const [id,itemLevel,required,slot] of [
  [14148,18,13,"wrist"],[14151,18,13,"mainhand"],
  [6460,22,17,"waist"],[5404,23,18,"shoulders"],
  [10412,21,16,"waist"],[273007,18,13,"feet"],
  [872,23,18,"mainhand"],[274158,31,26,"mainhand"],
  [274161,34,29,"legs"]
 ]){
  const x=byID.get(id);
  assert.equal(x.itemLevel,itemLevel,String(id));
  assert.equal(x.requiredLevel,required,String(id));
  assert.equal(x.slot,slot,String(id));
  assert.equal(x.quality,"rare",String(id));
 }
});

test("33 historical Classic drop rates refer to a named boss and source URL, never to Forever",()=>{
 const drops=legacy.flatMap(x=>(x.acquisition_sources||[]).map(s=>({id:x.id,row:x,s})));
 assert.equal(drops.length,33);
 for(const {id,row,s} of drops){
  assert.equal(s.kind,"boss");
  assert.equal(s.evidence_level,"classic_reference");
  assert.equal(s.evidence_kind,"classic_guide");
  assert.ok(s.classic_drop_chance_percent>0&&s.classic_drop_chance_percent<=100);
  assert.equal(s.name_en,[1937,2169].includes(id)?"Sneed's Shredder":row.boss_en);
  assert.equal(s.location_en,row.dungeon_en);
  assert.equal(s.source_url,row.source_url);
  assert.equal(s.evidence_url,row.source_url);
  assert.match(s.evidence_note,/NOT a verified Forever drop/);
  assert.ok(!("chance_forever_percent" in s));
  assert.ok(!("drop_chance_percent" in row));
 }
 assert.equal(byID.get(6460).acquisition_sources[0].classic_drop_chance_percent,20);
 assert.equal(byID.get(872).acquisition_sources[0].classic_drop_chance_percent,5);
 assert.equal(byID.get(14151).acquisition_sources[0].classic_drop_chance_percent,20);
 for(const id of [273007,273804,274155,274158,274159,274161]){
  assert.equal(byID.get(id).acquisition_sources,undefined);
  assert.equal(byID.get(id).original_evidence_level,"documented_forever");
 }
});

test("FR/EN equipment list loads only ready, source-labelled records from the local audit",()=>{
 const script=read("assets/items-v3.js");
 assert.match(script,/data\/dungeon-gear-audit-20261019\.json\?v=20261019-all82/);
 assert.match(script,/i\.audit_status==="ready_for_catalogue"/);
 assert.match(script,/i\.evidence_level==="documented_forever"/);
 assert.match(script,/i\.observed_build==="70058"/);
 assert.match(script,/Number\.isSafeInteger\(i\.id\)/);
 assert.match(script,/dungeonVetted\.map\(normalizeLocal\)/);
 assert.match(script,/sourceIndex=new Map/);
 assert.match(script,/function indexedSources\(item\)/);
 for(const path of ["equipements/index.html","en/equipements/index.html"]){
  assert.ok(read(path).includes("items-v3.js?v=20261019-all82"));
 }
});
