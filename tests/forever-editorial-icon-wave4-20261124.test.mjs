import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const data=JSON.parse(readFileSync(new URL("../data/items-forever.json",import.meta.url),"utf8"));
const records=data.items;
const sources=[
 [
  276273,
  "Empty Fish Bucket",
  "inv_misc_1h_bucket_b_01"
 ],
 [
  276895,
  "Transformative Cocoon",
  "inv_misc_web_02"
 ],
 [
  278019,
  "Apology Ring",
  "inv_jewelry_ring_02"
 ],
 [
  279838,
  "Arcane Infused Rod",
  "inv_wand_04"
 ],
 [
  279870,
  "Tarnished Locket",
  "inv_jewelry_necklace_08"
 ],
 [
  279876,
  "Plaguefang",
  "inv_weapon_shortblade_54"
 ],
 [
  277057,
  "Al'Aketh Wristguards",
  "inv_bracer_mail_skybornec60_b_01"
 ],
 [
  277063,
  "Al'Aketh Bracers",
  "inv_bracer_leather_skybornec60_b_01"
 ],
 [
  283473,
  "Batwing Bindings",
  "inv_bracer_02"
 ],
 [
  276631,
  "Coldflame Saber",
  "inv_sword_05"
 ],
 [
  273808,
  "Bridgebreaker Bindings",
  "inv_bracer_07"
 ],
 [
  273840,
  "Cursed Murloc Eye",
  "spell_shadow_evileye"
 ],
 [
  282653,
  "Dissolved Locket",
  "inv_jewelry_necklace_01"
 ],
 [
  260208,
  "Prelate's Orb",
  "inv_misc_orb_yellow"
 ],
 [
  270072,
  "Alterac Assassin's Gloves",
  "inv_gauntlets_15"
 ],
 [
  270097,
  "Archer's Leggings",
  "inv_pants_03"
 ],
 [
  271670,
  "Curl of Life",
  "inv_jewelry_ring_12"
 ],
 [
  275711,
  "Chimaera Wing Cape",
  "inv_misc_cape_10"
 ],
 [
  276340,
  "Blademaster Hakama",
  "inv_pants_02"
 ],
 [
  277204,
  "Erudite's Amulet",
  "inv_jewelry_necklace_01"
 ],
 [
  281251,
  "Courier's Wristguards",
  "inv_bracer_02"
 ]
];
test("21 newly sourced Forever icons are exact-ID and name matches, with no invented acquisition",()=>{
 assert.equal(sources.length,21);
 assert.equal(new Set(sources.map(row=>row[0])).size,21);
 for(const [id,name,icon] of sources){
  const matches=records.filter(x=>x.id===id);
  assert.equal(matches.length,1,"item ID "+id);
  const x=matches[0],e=x.icon_evidence;
  assert.equal(x.name,name);
  assert.equal(x.icon,icon);
  assert.equal(e.evidence_level,"documented_forever");
  assert.equal(e.source_url,"https://zephras.com/forever/enUS/item/"+id+"/");
  assert.equal(e.evidence_url,e.source_url);
  assert.equal(e.observed_at,"2026-11-24");
  assert.equal(e.observed_build,"unknown");
  assert.equal(e.evidence_kind,"forever_community_page");
  assert.equal(e.provider,"Zephras Forever client-derived item page");
  assert.ok(e.evidence_note.includes("ID "+id+" and English name"));
  assert.ok(e.evidence_note.includes(name)&&e.evidence_note.includes(icon));
  assert.match(e.evidence_note,/not gameplay acquisition, drop rate, rare spawn location or live availability/);
  assert.ok(x.source_status.startsWith("forever_beta_"));
  assert.ok(!("drop_chance_percent" in e));
 }
});
test("the 183-record editorial count, 164 icon coverage and unknown restrictions stay exact",()=>{
 assert.equal(records.length,183);
 assert.equal(records.filter(x=>x.icon).length,164);
 assert.equal(records.filter(x=>!x.icon).length,19);
 const unresolved=records.filter(x=>[271807,277029,277008,277020].includes(x.id));
 assert.equal(unresolved.length,4);
 for(const x of unresolved)assert.equal(x.icon,null);
 // A quoted client icon does not prove an item's equip level or its quest's live availability.
 for(const id of [260208,270072,270097,271670,275711,276340,277204,281251]){
  const x=records.find(x=>x.id===id);
  assert.equal(x.requiredLevel,null);
  assert.equal(x.icon_evidence.observed_build,"unknown");
 }
 for(const id of [278019,277057,277063,283473]){
  const x=records.find(x=>x.id===id);
  assert.equal(x.verified_forever,false);
 }
});
