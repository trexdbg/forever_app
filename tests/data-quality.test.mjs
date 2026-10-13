import test from "node:test";
import assert from "node:assert/strict";
import {auditDatasets, classifyRecord, LEVELS, DATA_FILES} from "../scripts/check-data-quality.mjs";

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
const documented = {
  source_url:"https://example.org/guide",
  evidence_url:"https://example.org/guide",
  observed_at:"2026-10-13",
  observed_build:"unknown",
  evidence_kind:"forever_community_page",
  evidence_note:"This Forever guide lists an item, not a verified boss drop."
};
const direct = {
  ...documented, evidence_url:"https://example.org/capture.png",
  observed_build:"1.60.1.70291", evidence_kind:"gameplay_capture",
  evidence_note:"Game screenshot shows this item in a dated Forever beta session."
};
test("in-game confirmation requires per-claim URLs, valid date, pinned client build and direct evidence",()=>{
  const p="data/items.json";
  const missing=issues({[p]:{items:[item({evidence_level:"confirmed_in_game"})]}});
  assert.ok(missing.some(i=>i.code==="PROVENANCE_FIELD_MISSING"&&i.path.endsWith(".source_url")));
  assert.ok(missing.some(i=>i.code==="UNSUPPORTED_GAME_CONFIRMATION"));
  assert.equal(issues({[p]:{items:[item({evidence_level:"confirmed_in_game",...direct})]}})
    .filter(i=>i.severity==="error").length,0);
});
test("Forever documentation permits unknown build but not a missing dated evidence description",()=>{
  const p="data/items.json";
  assert.equal(issues({[p]:{items:[item({evidence_level:"documented_forever",...documented})]}})
    .filter(i=>i.severity==="error").length,0);
  const missing=issues({[p]:{items:[item({evidence_level:"documented_forever",...documented,evidence_url:null})]}});
  assert.ok(missing.some(i=>i.code==="PROVENANCE_FIELD_MISSING"&&i.path.endsWith(".evidence_url")));
  const invalid=issues({[p]:{items:[item({evidence_level:"documented_forever",...documented,observed_at:"2026-02-30"})]}});
  assert.ok(invalid.some(i=>i.code==="PROVENANCE_INVALID_DATE"));
});
test("datamined evidence must pin the exact Forever build and match source kind",()=>{
  const p="data/items.json";
  const good={...direct,evidence_kind:"client_db2", evidence_note:"DB2 snapshot contains item identifier; game availability unverified."};
  assert.equal(issues({[p]:{items:[item({evidence_level:"datamined",...good})]}})
    .filter(i=>i.severity==="error").length,0);
  const bad=issues({[p]:{items:[item({evidence_level:"datamined",...good,observed_build:"unknown",evidence_kind:"gameplay_capture"})]}});
  assert.ok(bad.some(i=>i.code==="PROVENANCE_INVALID_BUILD"));
  assert.ok(bad.some(i=>i.code==="PROVENANCE_KIND_MISMATCH"));
});
test("unverified records may lack invented URLs/build/date but require explanation",()=>{
  const p="data/items.json";
  assert.equal(issues({[p]:{items:[item({evidence_level:"unverified",evidence_note:"No primary proof has been located."})]}})
    .filter(i=>i.severity==="error").length,0);
  assert.ok(issues({[p]:{items:[item({evidence_level:"unverified"})]}})
    .some(i=>i.code==="PROVENANCE_NOTE_INSUFFICIENT"));
});
test("Classic sources require their own edition and evidence kind, never gameplay proof",()=>{
  const p="data/items.json";
  const proof={...documented,observed_build:"Classic Era 1.15.9",evidence_kind:"classic_database",evidence_note:"Classic database contains the item; Forever availability unverified."};
  assert.equal(issues({[p]:{items:[item({evidence_level:"classic_reference",source_status:"classic_reference",...proof})]}})
    .filter(i=>i.severity==="error").length,0);
  assert.ok(issues({[p]:{items:[item({evidence_level:"classic_reference",source_status:"classic_reference",...proof,observed_build:"unknown"})]}})
    .some(i=>i.code==="PROVENANCE_INVALID_BUILD"));
});
test("first audit is explicitly allowlisted and non-exhaustive",()=>{
  assert.equal(DATA_FILES.length,11);
  assert.ok(DATA_FILES.includes("data/quests/manifest.json"));
  assert.ok(!DATA_FILES.includes("data/quests/alliance.json"));
  assert.ok(!DATA_FILES.includes("data/mining-points.json"));
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
