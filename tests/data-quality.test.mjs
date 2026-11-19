import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
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

test("Forever icon backfill uses exact item identity and preserves source metadata",()=>{
 const read=(name)=>JSON.parse(readFileSync(new URL("../data/"+name,import.meta.url),"utf8"));
 const rows=read("dungeons-forever.json").dungeons.flatMap(d=>(d.bosses??[]).flatMap(b=>(b.loot??[]).map(x=>({...x,boss:b.name?.en,dungeon:d.name?.en??d.id}))));
 const sets=[
  ["items-forever.json",[270227,271096,271209]],
  ["bis-niveaux-forever-observed.json",[270227,271096,270230,270231,271095,270228,270229,271098,270256,270260,270261,273023,273028,271204,271205,271206,271201,271203,271207,271208,271216,271215,271209,271210,271217,271211,271212,271218,6641,6642,271214]]
 ];
 for(const [name,ids] of sets){
  const items=read(name).items;
  for(const id of ids){
   const item=items.find(x=>x.id===id);
   assert.ok(item);
   const proof=item.icon_catalogue_reference;
   assert.equal(proof.item_id,id);
   assert.equal(proof.item_name,item.name);
   assert.equal(proof.file,"data/dungeons-forever.json");
   assert.match(proof.source_commit,/^[0-9a-f]{40}$/);
   assert.match(proof.reviewed_on,/^\d{4}-\d{2}-\d{2}$/);
   const matching=rows.filter(x=>x.id===id&&x.en===item.name&&x.icon&&x.icon_source);
   assert.equal(new Set(matching.map(x=>x.icon)).size,1);
   assert.ok(matching.some(x=>x.icon===item.icon&&x.icon_source===proof.icon_source&&x.dungeon===proof.dungeon&&x.boss===proof.boss));
  }
 }
 const orb=read("items-forever.json").items.find(x=>x.id===249394);
 assert.equal(orb.name,"Orb of Mystic Insight");
 assert.equal(orb.icon,"inv_misc_orb_blue");
 assert.equal(orb.icon_evidence.evidence_url,"https://www.wowhead.com/forever/item=249394/orb-of-mystic-insight");
 assert.equal(orb.icon_evidence.evidence_level,"documented_forever");
 assert.match(orb.icon_evidence.evidence_note,/availability, acquisition or drop rate/);
});

test("six reviewed Forever recipes retain exact item identity and separate crafting from plan acquisition",()=>{
 const rows=JSON.parse(readFileSync(new URL("../data/items-forever.json",import.meta.url),"utf8")).items;
 const expected=[
 [249394,"Orb of Mystic Insight","Enchanting","5 Strange Dust, 2 Small Glimmering Shard, 2 Greater Astral Essence"],
 [250486,"Sterling Silver Shoulders","Blacksmithing","2 Copper Bar, 6 Silver Bar, 2 Coarse Grinding Stone"],
 [250500,"Protector's Chain Helm","Blacksmithing","6 Tigerseye, 8 Bronze Bar, 2 Coarse Grinding Stone"],
 [249234,"Dreambough Wand","Enchanting","1 Vision Dust, 2 Lesser Nether Essence, 1 Star Wood"],
 [249237,"Greater Eternal Wand","Enchanting","1 Star Wood, 2 Greater Eternal Essence, 1 Illusion Dust"],
 [249385,"Brilliant Wand","Enchanting","1 Star Wood, 2 Large Brilliant Shard, 1 Greater Eternal Essence, 3 Illusion Dust"]
 ];
 for(const [id,name,profession,reagents] of expected){
  const row=rows.find(x=>x.id===id);
  assert.equal(row.name,name);
  assert.equal(row.verified_forever,false);
  assert.equal(row.acquisition_status,"documented_forever");
  assert.equal(row.acquisition_sources.length,1);
  const src=row.acquisition_sources[0];
  assert.equal(src.kind,"craft");
  assert.equal(src.recipe_source_en,profession+" · "+reagents);
  assert.equal(src.source_url,"https://db.icy-veins.com/wow-forever/items/"+id);
  assert.equal(src.evidence_url,src.source_url);
  assert.equal(src.evidence_level,"documented_forever");
  assert.equal(src.observed_build,"unknown");
  assert.match(src.detail_en,/Plan\/formula acquisition not established/);
  assert.ok(!Object.keys(src).some(k=>/chance|drop_rate/.test(k)));
  assert.ok(src.recipe_source_fr);
 }
});

test("Blessed Plate and Frozen Heart recipes distinguish learning skill and teaching-item drops",()=>{
 const items=JSON.parse(readFileSync(new URL("../data/items-forever.json",import.meta.url),"utf8")).items;
 const expected=[
 [250587,1252336,251439,240,[[8566,1.12]],"24 Thorium Bar, 1 Blue Sapphire, 6 Rugged Leather"],
 [250588,1252337,251440,245,[[7155,0.891]],"20 Thorium Bar, 2 Blue Sapphire"],
 [250590,1252339,251442,255,[[7108,2.09]],"16 Thorium Bar, 1 Blue Sapphire"],
 [250592,1252341,251444,270,[[8600,3.33]],"18 Thorium Bar, 1 Blue Sapphire, 1 Iron Buckle, 6 Rugged Leather"],
 [250593,1252342,251445,null,[],"30 Thorium Bar, 2 Blue Sapphire"],
 [250594,1252343,251446,280,[[249221,2.16],[249222,2.08],[249220,0.901]],"36 Thorium Bar, 2 Blue Sapphire"],
 [249469,1249107,249519,265,[],"1 Blood of the Mountain, 1 Essence of Undeath, 3 Small Brilliant Shard"]
 ];
 for(const [id,spell,plan,skill,drops,reagents] of expected){
  const row=items.find(x=>x.id===id);
  const src=row.acquisition_sources[0];
  assert.equal(row.acquisition_status,"documented_forever");
  assert.equal(row.verified_forever,false);
  assert.equal(src.kind,"craft");
  assert.equal(src.recipe_spell_id,spell);
  assert.equal(src.teaching_item_id,plan);
  assert.ok(src.recipe_source_en.endsWith(reagents));
  assert.equal(src.evidence_level,"documented_forever");
  assert.equal(src.location_en,id===249469?"Black Forge":"Anvil");
  assert.ok(!("reported_chance_percent" in src));
  if(skill===null){
   assert.ok(!src.teaching_item_evidence);
   assert.ok(!row.origin_en.includes("("));
  }else{
   const evidence=src.teaching_item_evidence;
   assert.equal(evidence.required_skill,skill);
   assert.equal(evidence.id,plan);
   assert.equal(evidence.evidence_url,"https://db.icy-veins.com/wow-forever/items/"+plan);
   assert.ok(row.origin_en.endsWith("("+skill+")"));
   assert.deepEqual((evidence.reported_drops||[]).map(d=>[d.npc_id,d.reported_chance_percent]),drops);
   assert.match(evidence.evidence_note,/sample size/);
  }
 }
});
