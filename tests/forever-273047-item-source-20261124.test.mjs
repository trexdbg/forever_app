import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=p=>JSON.parse(readFileSync(new URL("../"+p,import.meta.url),"utf8"));
const editorial=read("data/items-forever.json");
const observed=read("data/bis-niveaux-forever-observed.json");
const dungeons=read("data/dungeons-forever.json");

test("item 273047 Forever tooltip has only corroborated current stats in editorial and BiS",()=>{
 const item=editorial.items.find(x=>x.id===273047);
 const bis=observed.items.find(x=>x.id===273047);
 assert.ok(item&&bis);
 const expected=["Unstable Crystalline Shoulderpads","Item Level 33","Shoulder Leather",
 "81 Armor","+9 Agility","+6 Stamina","Restores +2 mana per 5 sec.","Requires Level 28"];
 assert.deepEqual(item.tooltip,expected);
 assert.deepEqual(bis.tooltip,expected);
 for(const row of [item,bis]){
  assert.equal(row.requiredLevel,28);
  assert.equal(row.itemLevel,33);
  assert.equal(row.name,"Unstable Crystalline Shoulderpads");
  assert.deepEqual(row.stats_evidence.evidence_level,"documented_forever");
  assert.equal(row.stats_evidence.observed_at,"2026-11-24");
  assert.equal(row.stats_evidence.observed_build,"unknown");
  assert.equal(row.stats_evidence.evidence_kind,"forever_community_page");
  assert.equal(row.stats_evidence.source_url,
    "https://www.wowhead.com/forever/item=273047/unstable-crystalline-shoulderpads");
  assert.equal(row.stats_evidence.evidence_url,
    "https://db.icy-veins.com/wow-forever/items/273047");
  assert.match(row.stats_evidence.evidence_note,/not current boss drop, live availability or drop chance/);
  assert.equal(row.verified_forever??false,false,"documentation cannot imply confirmed gameplay");
  assert.ok(!row.tooltip.some(s=>/\+5 Stamina|\+8 health/i.test(s)));
 }
});

test("BiS icon mirrors exactly matching Forever editorial icon and preserves sources",()=>{
 const item=editorial.items.find(x=>x.id===273047);
 const bis=observed.items.find(x=>x.id===273047);
 assert.equal(item.icon,"inv_shoulder_07");
 assert.equal(bis.icon,item.icon);
 assert.equal(bis.icon_evidence.icon_file_id,135038);
 assert.equal(bis.icon_evidence.catalogue_reference,"data/items-forever.json");
 assert.equal(bis.icon_evidence.evidence_level,"documented_forever");
 assert.match(bis.icon_evidence.evidence_note,/not independent gameplay or loot verification/);
 assert.equal(bis.acquisition.boss,"Unstable Sentinel");
 assert.equal(bis.acquisition.dungeon,"City of Dalaran");
 assert.equal(bis.acquisition.verification,"observed_beta_2026-10");
 assert.equal(bis.source_status,"forever_beta_observed");
 assert.equal(item.source_status,"forever_beta_wowhead");
 // Beta drop-percentage data must remain a differently sourced historical
 // snapshot; do not promote it to a contemporary verified rate.
 const dungeon=dungeons.dungeons.find(x=>x.id==="city-of-dalaran");
 const boss=dungeon.bosses.find(x=>x.name.en==="Unstable Sentinel");
 const drop=boss.loot.find(x=>x.id===273047);
 assert.equal(drop.chanceReported,31);
 assert.equal(drop.evidence_level,"documented_forever");
 assert.match(drop.evidence_note,/not a verified personal drop capture/);
});

test("Forever item 273047 stays covered after the subsequent exact-ID icon backfill",()=>{
 const missing=(rows)=>rows.filter(x=>!x.icon||!String(x.icon).trim()).length;
 assert.equal(observed.items.length,79);
 // Follow-up exact-ID/English-name Forever icon matches are tested separately.
 assert.equal(missing(observed.items),0);
 assert.equal(editorial.items.length,183);
 assert.equal(missing(editorial.items),19);
});
