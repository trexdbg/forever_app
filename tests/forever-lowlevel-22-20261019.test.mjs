import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const catalog=JSON.parse(read("data/items-forever.json"));
const audit=JSON.parse(read("data/forever-equipment-acquisition-gaps-20261019.json"));
const byId=new Map(catalog.items.map(item=>[item.id,item]));
const ids=[277057,277063,277075,277058,277064,283473,283259,281926,285348,285192,282653,278019,279838,281251,270031,283254,277239,270097,284272,260208,276340,272407];

test("the full 22-item backlog now has ID-specific evidence pinned to build 70425",()=>{
 assert.equal(catalog.items.length,174);
 assert.equal(new Set(catalog.items.map(x=>x.id)).size,174);
 assert.equal(ids.length,22);
 assert.equal(new Set(ids).size,22);
 assert.equal(audit.completed_metadata_audit.length,22);
 assert.deepEqual(new Set(audit.completed_metadata_audit.map(x=>x.id)),new Set(ids));
 for(const id of ids){
  const row=byId.get(id);
  assert.ok(row,id+" exists");
  assert.ok(row.source_url.startsWith("https://www.60.tools/items/"+id+"-"));
  assert.equal(row.source_url,row.evidence_url);
  assert.equal(row.evidence_level,"documented_forever");
  assert.equal(row.evidence_kind,"forever_community_page");
  assert.equal(row.observed_build,"1.60.1.70425");
  assert.equal(row.observed_at,"2026-10-19");
  assert.equal(row.verified_forever,false);
  assert.match(row.evidence_note,/does not establish an acquisition source|60\.tools individual Forever beta/);
  assert.ok(Array.isArray(row.tooltip)&&row.tooltip.length>=5,id+" rich tooltip");
  assert.equal(row.tooltip[0],row.name);
  assert.ok(row.tooltip.includes("Item Level "+row.itemLevel));
  assert.ok(row.tooltip.some(s=>s.startsWith("Binds when ")));
  assert.ok(row.tooltip.some(s=>/Armor|\+[0-9]+|^Equip:/.test(s)));
  assert.ok(!row.origin.includes("source précise non documentée"));
  if(row.requiredLevel!==null)assert.ok(row.tooltip.includes("Requires Level "+row.requiredLevel));
  else assert.ok(!row.tooltip.some(s=>s.startsWith("Requires Level ")),"No invented restriction for "+id);
  assert.equal(row.icon,null,"No synthetic exact portrait for "+id);
 }
});

test("five starter Al'Aketh pieces match their separate armor material, armor value and stat",()=>{
 const expected=[
  [277057,"Wrist Mail","44 Armor","+1 Agility",4],
  [277063,"Wrist Leather","22 Armor","+1 Agility",4],
  [277075,"Wrist Cloth","8 Armor","+1 Spirit",4],
  [277058,"Hands Mail","67 Armor","+1 Stamina",5],
  [277064,"Hands Leather","34 Armor","+1 Stamina",5]
 ];
 for(const [id,slot,armor,stat,level] of expected){
  const i=byId.get(id);
  assert.equal(i.quality,"uncommon");
  assert.deepEqual(i.tooltip,[i.name,"Item Level "+i.itemLevel,"Binds when picked up",slot,armor,stat,"Requires Level "+level]);
  assert.equal(i.requiredLevel,level);
  assert.equal(i.acquisition_status,"unknown");
  assert.ok(!i.acquisition_sources?.length);
 }
});

test("leveling upgrades reproduce class-specific effects and avoid mixing binding types",()=>{
 assert.deepEqual(byId.get(281926).tooltip,["Bound Bracers","Item Level 23","Binds when equipped","Wrist Cloth","16 Armor","+3 Intellect","Equip: +4 Frost Spell Damage.","Requires Level 18"]);
 assert.deepEqual(byId.get(285192).tooltip,["Kobold Firestarter","Item Level 30","Binds when equipped","Held in off hand","+4 Stamina","Equip: +6 Fire Spell Damage.","Requires Level 25"]);
 assert.deepEqual(byId.get(283259).tooltip,["Bearhide Vicegrips","Item Level 16","Binds when equipped","Hands Leather","44 Armor","+3 Strength","Requires Level 11"]);
 assert.deepEqual(byId.get(270031).tooltip,["Dark Ritual Leggings","Item Level 29","Binds when picked up","Legs Leather","88 Armor","+9 Stamina","Equip: +14 Spell Power."]);
 assert.deepEqual(byId.get(279838).tooltip,["Arcane Infused Rod","Item Level 36","Binds when picked up","Held in off hand","+8 Intellect","Equip: +9 Arcane Spell Damage.","Requires Level 1"]);
 assert.equal(byId.get(281251).requiredLevel,null);
 assert.equal(byId.get(270097).requiredLevel,null);
 assert.equal(byId.get(276340).requiredLevel,null);
 assert.equal(audit.metrics.records_with_fewer_than_five_tooltip_lines,57);
});

test("only two quests are item-page documented; unknown remains unknown",()=>{
 const quests=[[279838,"Starving Arcane",33],[270031,"Blackfathom Villainy",27]];
 for(const [id,name,questLevel] of quests){
  const i=byId.get(id);
  assert.equal(i.acquisition_status,"documented_forever");
  assert.equal(i.acquisition_sources.length,1);
  const s=i.acquisition_sources[0];
  assert.equal(s.kind,"quest");
  assert.equal(s.name_en,name);
  assert.equal(s.evidence_level,"documented_forever");
  assert.equal(s.source_url,i.source_url);
  assert.match(s.evidence_note,new RegExp("level "+questLevel));
  assert.equal(s.observed_build,"1.60.1.70425");
  assert.ok(!("classic_drop_chance_percent" in s));
  assert.ok(!("community_reported_chance_percent" in s));
 }
 assert.equal(audit.metrics.documented_quest_associations,2);
 assert.equal(audit.metrics.acquisition_still_unknown,19);
 assert.equal(audit.review_queue.length,20);
 for(const row of catalog.items.filter(x=>ids.includes(x.id)&&x.acquisition_status==="unknown")){
  assert.ok(!row.acquisition_sources?.length);
  assert.equal(row.acquisition_evidence_level,"unverified");
 }
});

test("Alliance Outrunner rod cites the patrol and retains the Aean/Hannah conflict without fake rates",()=>{
 const rod=byId.get(285348),source=rod.acquisition_sources?.[0];
 assert.equal(rod.acquisition_status,"reported_forever");
 assert.equal(rod.acquisition_sources.length,1);
 assert.equal(source.kind,"rare");
 assert.equal(source.name_en,"Alliance Outrunners patrol");
 assert.equal(source.evidence_level,"documented_forever");
 assert.equal(source.source_url,"https://foreverchanges.pro/rares");
 assert.equal(source.evidence_url,"https://foreverchanges.pro/item/285348");
 assert.match(source.evidence_note,/Aean Swiftriver/);
 assert.match(source.evidence_note,/Hannah Bladeleaf/);
 assert.match(source.evidence_note,/Do not state that either specific NPC drops it/);
 assert.match(rod.acquisition_conflict_note_fr,/Aean Swiftriver/);
 assert.match(rod.acquisition_conflict_note_en,/Hannah Bladeleaf/);
 assert.ok(!("classic_drop_chance_percent" in source));
 assert.ok(!("community_reported_chance_percent" in source));
 assert.equal(audit.metrics.reported_patrol_associations,1);
});

test("FR/EN pages use the refreshed data and display the rare-patrol attribution discreetly",()=>{
 const gear=read("assets/gear-data.js"),itemsJs=read("assets/items-v3.js");
 assert.match(gear,/items-forever\.json\?v=20261019-all22-70425/);
 assert.match(itemsJs,/rare:"Rare patrol"/);
 assert.match(itemsJs,/rare:"Patrouille rare"/);
 assert.match(itemsJs,/disputedPatrol/);
 assert.match(itemsJs,/\["boss","rare","event"/);
 for(const path of ["equipements/index.html","en/equipements/index.html"]){
  const html=read(path);
  assert.ok(html.includes("gear-data.js?v=20261019-all22-70425"),path);
  assert.ok(html.includes("items-v3.js?v=20261019-rare-patrol"),path);
 }
});
