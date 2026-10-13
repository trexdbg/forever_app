import test from "node:test";
import assert from "node:assert/strict";
import {auditDatasets, classifyRecord, LEVELS} from "../scripts/check-data-quality.mjs";

const item = (patch={}) => ({id:123,name:"Documented item",itemLevel:20,requiredLevel:10,source_status:"forever_beta_community",
  url:"https://www.wowhead.com/forever/item=123",verified_forever:false,...patch});
const issues = data => auditDatasets(data).issues;
test("taxonomy distinguishes Classic, Forever documentation, datamining and unknown without automatic game promotion",()=>{
  assert.equal(LEVELS.length,5);
  assert.equal(classifyRecord(item({source_status:"classic_reference"})),"classic_reference");
  assert.equal(classifyRecord(item({source_status:"forever_beta_observed"})),"documented_forever");
  assert.equal(classifyRecord(item({source_status:"forever_beta_60tools"})),"datamined");
  assert.equal(classifyRecord(item({source_status:"forever_beta_client_present"})),"datamined");
  assert.equal(classifyRecord({}),"unverified");
});
test("Classic cannot claim Forever verification",()=>{
  assert.ok(issues({"data/items.json":{items:[item({source_status:"classic_reference",verified_forever:true})]}})
    .some(i=>i.code==="CLASSIC_MARKED_FOREVER_VERIFIED"&&i.severity==="error"));
});
test("in-game confirmation requires a dated, build-pinned source",()=>{
  assert.ok(issues({"data/items.json":{items:[item({evidence_level:"confirmed_in_game"})]}})
    .some(i=>i.code==="UNSUPPORTED_GAME_CONFIRMATION"));
  assert.equal(issues({"data/items.json":{items:[item({evidence_level:"confirmed_in_game",
    evidence_url:"https://example.org/capture",observed_build:"beta-1",observed_at:"2026-10-13"})]}})
    .filter(i=>i.severity==="error").length,0);
});
test("mismatched item URL and duplicate ID are errors",()=>{
  const report=auditDatasets({"data/items.json":{items:[item({url:"https://www.wowhead.com/forever/item=124"}),item()]}});
  assert.ok(report.issues.some(i=>i.code==="ITEM_URL_ID_MISMATCH"));
  assert.ok(report.issues.some(i=>i.code==="DUPLICATE_ID"));
});
test("missing rare coordinates and NPC ids are non-destructive warnings",()=>{
  const result=auditDatasets({"data/rares.json":{rares:[{id:1,points:[],source:"https://example.org"}]},
    "data/npcs.json":{npcs:[{id:null,coordinates:null,source:"https://example.org"}]}});
  assert.equal(result.errorCount,0);
  assert.ok(result.issues.some(i=>i.code==="RARE_LOCATION_UNKNOWN"));
  assert.ok(result.issues.some(i=>i.code==="NPC_ID_UNKNOWN"));
});
test("invalid coordinates, timer, drop chance and dungeon range are detected",()=>{
  const result=auditDatasets({"data/rares.json":{rares:[{id:1,points:[[101,2]],respawn_min_hours:48,respawn_max_hours:12,loot:[{chance_classic_percent:120}],source:"https://example.org"}]},
    "data/dungeons-forever.json":{dungeons:[{id:"test",level:[20,10],source:"https://example.org",bosses:[]}]}});
  for (const code of ["INVALID_COORDINATES","INVALID_RESPAWN_RANGE","INVALID_DROP_CHANCE","INVALID_DUNGEON_LEVELS"])
    assert.ok(result.issues.some(i=>i.code===code),code);
});
test("Classic quest manifest guard and indirect loot sources",()=>{
  const data={"data/quests/manifest.json":{source_repo:"https://github.com/trexdbg/vanilla-questing",coordinate_system:"zone_percent_0_100"},
    "data/dungeons-forever.json":{dungeons:[{id:"trial",level:[10,20],source:"https://example.org/guide",
      bosses:[{loot:[{id:123,en:"Documented item",itemUrl:"https://www.wowhead.com/forever/item=123",source_status:"forever_beta_community"}]}]}]}};
  assert.equal(auditDatasets(data).errorCount,0);
  assert.ok(issues(data).some(i=>i.code==="LOOT_SOURCE_INDIRECT"));
  assert.ok(issues({"data/quests/manifest.json":{source_repo:"https://example.org/forever",coordinate_system:"zone_percent_0_100"}})
    .some(i=>i.code==="CLASSIC_QUEST_MANIFEST_CHANGED"));
});
