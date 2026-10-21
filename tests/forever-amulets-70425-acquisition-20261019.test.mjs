import test from "node:test";
import {BASELINE as current} from "./helpers/catalogue-baseline.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const manual=JSON.parse(read("data/items-forever.json"));
const audit=JSON.parse(read("data/forever-equipment-acquisition-gaps-20261019.json"));
const byID=new Map(manual.items.map(x=>[x.id,x]));
// Snapshot 2026-10-19 is historical; later sourced additions are excluded from its metrics.
const addedLater=new Set([285228,285272,285273,285274,286536,3008]);
const historical=manual.items.filter(x=>!addedLater.has(x.id));
const targets=[
 {id:272185,name:"Amulet of Forgiveness",icon:"inv_jewelry_necklace_06",stats:["+7 Spirit","Equip: +13 Healing.","Equip: +4 Spell Damage."],old:["+10 Spirit","+8 Intellect"]},
 {id:272184,name:"Amulet of Vengeance",icon:"inv_jewelry_necklace_05",stats:["+7 Stamina","+6 Strength"],old:["+10 Stamina","+8 Strength"]}
];

test("both updated Forever amulets retain their ID, quality, patch and exact 70425 stats",()=>{
 assert.equal(manual.items.length,current.editorialItems);
 assert.equal(new Set(manual.items.map(x=>x.id)).size,current.editorialItems);
 for(const target of targets){
  const item=byID.get(target.id);
  assert.equal(item.name,target.name);
  assert.equal(item.slot,"neck");
  assert.equal(item.quality,"uncommon");
  assert.equal(item.itemLevel,43);
  assert.equal(item.requiredLevel,1);
  assert.equal(item.icon,target.icon);
  assert.equal(item.icon_source_url,"https://www.wowhead.com/forever/item="+target.id);
  assert.equal(item.source_status,"forever_beta_60tools");
  assert.equal(item.observed_build,"1.60.1.70425");
  assert.equal(item.observed_at,"2026-10-19");
  assert.equal(item.evidence_kind,"forever_community_page");
  assert.equal(item.evidence_level,"documented_forever");
  assert.equal(item.evidence_url,"https://foreverchanges.pro/item/"+target.id);
  assert.ok(item.source_url.startsWith("https://www.60.tools/items/"+target.id+"-"));
  assert.equal(item.tooltip[0],target.name);
  assert.deepEqual(item.tooltip.slice(4,4+target.stats.length),target.stats);
  assert.ok(item.tooltip.includes("Binds when picked up"));
  for(const old of target.old)assert.ok(!item.tooltip.includes(old),"Stale beta stat "+old);
  assert.match(item.evidence_note,/2026-10-08/);
  assert.match(item.evidence_note,/does NOT prove a source of acquisition/);
  assert.equal(item.verified_forever,false);
 }
});

test("no boss, quest or drop chance is invented for the two amulets",()=>{
 for(const {id} of targets){
  const row=byID.get(id);
  assert.equal(row.acquisition_status,"unknown");
  assert.equal(row.acquisition_evidence_level,"unverified");
  assert.ok(!row.acquisition_sources?.length);
  assert.ok(!("classic_drop_chance_percent" in row));
  assert.ok(!("community_reported_chance_percent" in row));
  assert.match(row.origin,/Obtention inconnue/);
  assert.match(row.origin_en,/Acquisition unknown/);
  assert.match(row.acquisition_note_fr,/aucune quête, aucun boss ni marchand/);
  assert.match(row.acquisition_note_en,/no quest, boss or vendor/);
 }
});

test("sparse record audit prioritizes the remaining 22 unknown origins instead of asserting completion of all Forever equipment",()=>{
 assert.equal(audit.schema_version,1);
 assert.equal(audit.metrics.editorial_forever_items,174);
 assert.equal(historical.length,174);
 assert.equal(audit.metrics.original_generic_origin,24);
 assert.equal(audit.metrics.amulets_updated,2);
 assert.equal(audit.metrics.remaining_generic_origin,0);
 assert.equal(audit.review_queue.length,20);
 assert.equal(audit.completed_metadata_audit.length,22);
 const generic=manual.items.filter(x=>x.origin==="60.tools · source précise non documentée");
 assert.equal(generic.length,0);
 assert.equal(audit.metrics.acquisition_still_unknown,19);
 assert.equal(historical.filter(x=>!Array.isArray(x.tooltip)||x.tooltip.length<5).length,audit.metrics.records_with_fewer_than_five_tooltip_lines);
 assert.equal(historical.filter(x=>!x.icon).length,audit.metrics.records_without_real_icon);
 assert.ok(!audit.review_queue.some(x=>x.id===272184||x.id===272185));
 assert.equal(audit.review_queue[0].required_level,4);
 for(const row of audit.review_queue){
  assert.ok(Number.isInteger(row.id));
  assert.ok(row.reference_url.startsWith("https://"));
  assert.ok(row.needs_review.includes("acquisition_source")||row.needs_review.includes("precise_drop_npc"));
  assert.ok(row.observed_build==="1.60.1.70425");
 }
});

test("bilingual source panel links proof of tooltip, not purported loot, and refreshes both asset caches",()=>{
 const js=read("assets/items-v3.js");
 const gear=read("assets/gear-data.js");
 assert.match(js,/item\.acquisition_status==="unknown"/);
 assert.match(js,/item\.acquisition_note_en:item\.acquisition_note_fr/);
 assert.match(js,/Fiche de l’objet bêta/);
 assert.match(js,/Beta item data/);
 assert.match(js,/!localSources\.length&&!unknownAcquisition/);
 assert.match(js,/localSources\.length\|\|unknownAcquisition/);
 assert.match(gear,/items-forever\.json\?v=20261019-lowlevel19-70425/);
 for(const path of ["equipements/index.html","en/equipements/index.html"]){
  const html=read(path);
  assert.ok(html.includes("gear-data.js?v=20261019-lowlevel19-70425"),path);
  assert.ok(html.includes("items-v3.js?v=20261019-rare-patrol"),path);
 }
});
