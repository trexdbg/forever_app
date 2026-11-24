import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const records=JSON.parse(readFileSync(new URL("../data/items-forever.json",import.meta.url),"utf8")).items;
const restored=[
 [
  277017,
  "Azure Skyforged Wristguards",
  "inv_bracer_mail_skybornec60_b_01"
 ],
 [
  277023,
  "Azure Gustwoven Bracers",
  "inv_bracer_leather_skybornec60_b_01"
 ],
 [
  277035,
  "Azure Stormsewn Cuffs",
  "inv_bracer_cloth_skybornec60_b_01"
 ],
 [
  277058,
  "Al'Aketh Gauntlets",
  "inv_glove_mail_skybornec60_b_01"
 ],
 [
  277064,
  "Al'Aketh Gloves",
  "inv_glove_leather_skybornec60_b_01"
 ],
 [
  277069,
  "Al'Aketh Armguards",
  "inv_bracer_leather_skybornec60_b_02"
 ],
 [
  277075,
  "Al'Aketh Cuffs",
  "inv_bracer_cloth_skybornec60_b_01"
 ],
 [
  277024,
  "Azure Gustwoven Gloves",
  "inv_glove_leather_skybornec60_b_01"
 ],
 [
  277032,
  "Azure Windraveled Pants",
  "inv_pant_leather_skybornec60_b_02"
 ],
 [
  277094,
  "Zephrali Mitts",
  "inv_glove_leather_skybornec60_b_02"
 ],
 [
  263015,
  "Skyseer's Pants",
  "inv_pant_armor_skybornec60_d_01"
 ],
 [
  283259,
  "Bearhide Vicegrips",
  "inv_gauntlets_05"
 ],
 [
  273293,
  "Bandsaw Wristbands",
  "inv_bracer_03"
 ],
 [
  284715,
  "First Mate Band",
  "inv_jewelry_ring_01"
 ],
 [
  281926,
  "Bound Bracers",
  "inv_bracer_12"
 ],
 [
  281927,
  "Boulderheart Band",
  "inv_jewelry_ring_03"
 ],
 [
  252512,
  "Brawler's Leather Helm",
  "inv_helmet_15"
 ],
 [
  282716,
  "Imbued Scaled Cuffs",
  "inv_bracer_01"
 ],
 [
  271920,
  "Seal of the Expedition",
  "inv_jewelry_necklace_08"
 ],
 [
  274068,
  "Thermaplugg Medal of Honor",
  "inv_jewelry_amulet_03"
 ],
 [
  284697,
  "Arcane Charged Robes",
  "inv_chest_cloth_24"
 ],
 [
  273654,
  "Crystal Thread Cloak",
  "inv_misc_cape_07"
 ],
 [
  285192,
  "Kobold Firestarter",
  "inv_torch_lit"
 ]
];

test("23 exact-ID lowlevel icon identities are individually documented in Forever client records",()=>{
 assert.equal(restored.length,23);
 assert.equal(new Set(restored.map(x=>x[0])).size,23);
 for(const [id,name,icon] of restored){
  const hits=records.filter(x=>x.id===id);
  assert.equal(hits.length,1,"exact item ID "+id);
  const item=hits[0],e=item.icon_evidence;
  assert.equal(item.name,name);
  assert.equal(item.icon,icon);
  assert.ok(Number.isInteger(item.requiredLevel)&&item.requiredLevel<=30,"early equipment "+id);
  assert.ok(item.source_status.startsWith("forever_beta_"),"original provenance "+id);
  assert.equal(e.evidence_level,"documented_forever");
  assert.equal(e.source_url,"https://zephras.com/forever/enUS/item/"+id+"/");
  assert.equal(e.evidence_url,e.source_url);
  assert.equal(e.provider,"Zephras Forever client-derived item page");
  assert.equal(e.observed_at,"2026-11-24");
  assert.equal(e.observed_build,"unknown");
  assert.equal(e.evidence_kind,"forever_community_page");
  assert.ok(e.evidence_note.includes("ID "+id+" and English name"));
  assert.ok(e.evidence_note.includes(name));
  assert.ok(e.evidence_note.includes(icon));
  assert.match(e.evidence_note,/not gameplay acquisition, drop rate, rare spawn location or live availability/);
  assert.ok(!("drop_chance_percent" in e));
 }
});
test("remaining editorial unknowns are preserved and no acquisition is invented",()=>{
 assert.equal(records.length,183);
 assert.equal(records.filter(x=>!x.icon).length,19);
 for(const id of [271807,277029,277008,277020]){
  const x=records.find(x=>x.id===id);
  assert.ok(x);
  assert.equal(x.icon,null);
  assert.equal(x.icon_evidence,undefined);
 }
 // Source-only images are never grounds to turn an unknown source into a known seller/boss.
 for(const id of [252512,281926,283259,285192]){
  const item=records.find(x=>x.id===id);
  assert.ok(item.icon);
  assert.ok(!item.icon_evidence.evidence_note.includes("confirmed drop"));
 }
});
