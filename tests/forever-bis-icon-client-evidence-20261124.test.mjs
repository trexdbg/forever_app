import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const bis=JSON.parse(readFileSync(new URL("../data/bis-niveaux-forever-observed.json",import.meta.url),"utf8"));
const editorial=JSON.parse(readFileSync(new URL("../data/items-forever.json",import.meta.url),"utf8"));
const entries=[
 [
  273022,
  "Supple Bellyskin Leggings",
  "inv_pants_11",
  "wowhead"
 ],
 [
  273024,
  "Glinteye Slippers",
  "inv_boots_05",
  "zephras"
 ],
 [
  273025,
  "Raptorclaw Greaves",
  "inv_boots_chain_08",
  "zephras"
 ],
 [
  273026,
  "Garb of Florid Feathers",
  "inv_misc_bandage_14",
  "zephras"
 ],
 [
  273036,
  "Graveweave Bindings",
  "inv_bracer_10",
  "zephras"
 ],
 [
  273054,
  "Cartilage Shapers",
  "inv_gauntlets_18",
  "zephras"
 ],
 [
  273031,
  "Runemender's Seal",
  "inv_jewelry_ring_28",
  "wowhead"
 ],
 [
  273043,
  "Wand of Mana Concentration",
  "inv_wand_06",
  "wowhead"
 ],
 [
  273044,
  "Violet Sorcerer's Robes",
  "inv_chest_cloth_17",
  "wowhead"
 ],
 [
  273051,
  "Violet Sorcerer's Mantle",
  "inv_shoulder_02",
  "wowhead"
 ],
 [
  273032,
  "Bonebinder's Signet",
  "inv_jewelry_ring_28",
  "wowhead"
 ],
 [
  273033,
  "Gravespike Repeater",
  "inv_weapon_crossbow_06",
  "wowhead"
 ],
 [
  273053,
  "Tendonscraper Dagger",
  "inv_misc_bone_06",
  "zephras"
 ],
 [
  273055,
  "Bonepile Gaze",
  "inv_shield_02",
  "wowhead"
 ],
 [
  273034,
  "Ephemeral Grips",
  "inv_gauntlets_24",
  "wowhead"
 ],
 [
  273035,
  "Mana-Warped Chain Shirt",
  "inv_chest_chain_04",
  "zephras"
 ],
 [
  273046,
  "Guardian's Dualblade",
  "inv_throwingaxe_05",
  "zephras"
 ],
 [
  273048,
  "Refractory Scaleguards",
  "inv_pants_mail_12",
  "zephras"
 ],
 [
  273040,
  "Spine of the Devourer",
  "inv_staff_07",
  "zephras"
 ],
 [
  273042,
  "Manascale Treads",
  "inv_boots_chain_08",
  "zephras"
 ],
 [
  273041,
  "Slitherwrap Girdle",
  "inv_belt_15",
  "zephras"
 ],
 [
  273039,
  "Blightleaf Rope",
  "inv_belt_10",
  "zephras"
 ],
 [
  273049,
  "Archmagister's Faceted Pendant",
  "inv_misc_necklacea8",
  "zephras"
 ],
 [
  286980,
  "Rotmender's Sash",
  "inv_belt_11",
  "zephras"
 ],
 [
  273038,
  "Garb of Fallen Felbark",
  "inv_shirt_09",
  "zephras"
 ],
 [
  273037,
  "Felbough Arm",
  "inv_spear_08",
  "zephras"
 ],
 [
  286979,
  "Rotmender's Gloves",
  "inv_gauntlets_22",
  "zephras"
 ],
 [
  286978,
  "Rotmender's Garb",
  "inv_shirt_04",
  "zephras"
 ],
 [
  279868,
  "Duty Bound Leggings",
  "inv_pants_06",
  "zephras"
 ],
 [
  279869,
  "Remembrance Armor",
  "inv_chest_chain",
  "zephras"
 ]
];
test("30 newly documented Forever BiS icons exactly match verified item identity and icon name",()=>{
 assert.equal(entries.length,30);
 assert.equal(new Set(entries.map(x=>x[0])).size,30);
 for(const [id,name,icon,provider] of entries){
  const matches=bis.items.filter(x=>x.id===id);
  assert.equal(matches.length,1,"BiS ID "+id);
  const item=matches[0];
  assert.equal(item.name,name);
  assert.equal(item.icon,icon,"icon for "+id);
  assert.equal(item.icon_evidence.evidence_level,"documented_forever");
  const expectedUrl=provider==="zephras"
   ?"https://zephras.com/forever/enUS/item/"+id+"/"
   :"https://www.wowhead.com/forever/item="+id;
  assert.equal(item.icon_evidence.source_url,expectedUrl);
  assert.equal(item.icon_evidence.evidence_url,expectedUrl);
  assert.equal(item.icon_evidence.observed_at,"2026-11-24");
  assert.equal(item.icon_evidence.observed_build,"unknown");
  assert.equal(item.icon_evidence.evidence_kind,"forever_community_page");
  assert.match(item.icon_evidence.evidence_note,new RegExp("Exact Forever item ID "+id));
  assert.ok(item.icon_evidence.evidence_note.includes(name));
  assert.ok(item.icon_evidence.evidence_note.includes(icon));
  assert.match(item.icon_evidence.evidence_note,/does not establish live availability, boss drop, quest reward, item stats, or drop chance/);
  assert.equal(item.source_status,"forever_beta_observed","icon backfill must not reclassify availability");
  assert.ok(item.acquisition,"original acquisition provenance remains available "+id);
  assert.ok(!("drop_chance_percent" in item.icon_evidence));
 }
});
test("the single unresolved icon remains explicitly unknown, not guessed from weapon type",()=>{
 assert.equal(bis.items.length,79);
 assert.equal(bis.items.filter(x=>!x.icon).length,1);
 const missing=bis.items.filter(x=>!x.icon);
 assert.deepEqual(missing.map(x=>x.id),[279864]);
 assert.equal(missing[0].name,"Monstrous Cleaver");
 assert.equal(missing[0].icon,undefined);
 assert.equal(missing[0].icon_evidence,undefined);
 // Historical Classic and client references must not be converted to proven drops.
 assert.equal(missing[0].source_status,"forever_beta_observed");
 assert.equal(editorial.items.length,183);
 assert.equal(editorial.items.filter(x=>!x.icon).length,138);
});
test("preexisting 2026 icon sources and verified 273047 tooltip are unchanged",()=>{
 for(const id of [270227,271096,271209]){
  const item=bis.items.find(x=>x.id===id);
  assert.ok(item.icon);
  assert.equal(item.icon_catalogue_reference.item_id,id);
  assert.equal(item.icon_catalogue_reference.file,"data/dungeons-forever.json");
 }
 const shoulder=bis.items.find(x=>x.id===273047);
 assert.equal(shoulder.icon,"inv_shoulder_07");
 assert.equal(shoulder.icon_evidence.icon_file_id,135038);
 assert.deepEqual(shoulder.tooltip.filter(x=>x.includes("Stamina")||x.includes("per 5 sec.")),["+6 Stamina","Restores +2 mana per 5 sec."]);
});
