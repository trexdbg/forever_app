import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const items=JSON.parse(readFileSync(new URL("../data/items-forever.json",import.meta.url),"utf8")).items;
const candidates=[
 [
  285269,
  "Thendal Watcher's Boots",
  "inv_boot_mail_skybornec60_b_01"
 ],
 [
  285272,
  "Skyseer's Belt",
  "inv_belt_cloth_skybornec60_b_01"
 ],
 [
  285273,
  "Scout Ranger's Belt",
  "inv_belt_leather_skybornec60_b_02"
 ],
 [
  285274,
  "Thendal Watcher's Belt",
  "inv_belt_mail_skybornec60_b_01"
 ],
 [
  3008,
  "Wendigo Fur Cloak",
  "inv_misc_cape_04"
 ],
 [
  284287,
  "Felweaver's Staff",
  "inv_staff_10"
 ],
 [
  6202,
  "Fingerless Gloves",
  "inv_gauntlets_05"
 ],
 [
  6203,
  "Thuggish Shield",
  "inv_shield_09"
 ],
 [
  5744,
  "Pale Skinner",
  "inv_sword_24"
 ],
 [
  284174,
  "Serrated Shadowclaw",
  "inv_weapon_shortblade_15"
 ],
 [
  286533,
  "Cheetah Hide Grips",
  "inv_gauntlets_24"
 ],
 [
  286536,
  "Heckler's Hide",
  "inv_chest_wolf"
 ],
 [
  285345,
  "Feather Padded Treads",
  "inv_boots_05"
 ],
 [
  284386,
  "Whipfang's Skinsearer",
  "inv_weapon_shortblade_24"
 ],
 [
  285350,
  "Alliance Outrunner Staff",
  "inv_staff_11"
 ],
 [
  285346,
  "Alliance Outrunner's Sword",
  "inv_sword_20"
 ],
 [
  285328,
  "Taurenbane's Family Cleaver",
  "inv_axe_04"
 ],
 [
  277213,
  "Dro'zem's Tunic",
  "inv_misc_cape_13"
 ],
 [
  285331,
  "Mark of the Pack Leader",
  "inv_jewelry_necklace_04"
 ],
 [
  273637,
  "Blade of Silverlaine",
  "inv_sword_05"
 ],
 [
  273805,
  "Blackrock Harness",
  "inv_chest_leather_04"
 ],
 [
  285348,
  "Alliance Outrunner Healing Rod",
  "inv_wand_04"
 ]
];
test("22 low-level Forever catalogue icons are exact-ID and English-name documented",()=>{
 assert.equal(candidates.length,22);
 assert.equal(new Set(candidates.map(([id])=>id)).size,22);
 for(const [id,name,icon] of candidates){
  const found=items.filter(x=>x.id===id);
  assert.equal(found.length,1,"item "+id);
  const item=found[0];
  assert.equal(item.name,name,"name for "+id);
  assert.equal(item.icon,icon,"icon for "+id);
  assert.ok(Number.isInteger(item.requiredLevel)&&item.requiredLevel<=30,
    "this icon wave must cover early-game equipment");
  assert.ok(item.source_status.startsWith("forever_beta_"),
    "existing item source-status classification remains in place");
  assert.equal(item.icon_evidence.evidence_level,"documented_forever");
  assert.equal(item.icon_evidence.source_url,"https://zephras.com/forever/enUS/item/"+id+"/");
  assert.equal(item.icon_evidence.evidence_url,item.icon_evidence.source_url);
  assert.equal(item.icon_evidence.evidence_kind,"forever_community_page");
  assert.equal(item.icon_evidence.observed_at,"2026-11-24");
  assert.equal(item.icon_evidence.observed_build,"unknown");
  assert.equal(item.icon_evidence.provider,"Zephras Forever client-derived item page");
  assert.ok(item.icon_evidence.evidence_note.includes("ID "+id+" and English name"));
  assert.ok(item.icon_evidence.evidence_note.includes(name));
  assert.ok(item.icon_evidence.evidence_note.includes(icon));
  assert.match(item.icon_evidence.evidence_note,/not gameplay acquisition, drop rate, rare spawn location or live availability/);
  assert.ok(!("drop_chance" in item.icon_evidence));
 }
});
test("no unrelated editorial item is auto-enriched or promoted to proven gameplay",()=>{
 assert.equal(items.length,183);
 assert.equal(items.filter(x=>!x.icon).length,116);
 for(const id of [271807,276273,278019]){
   const item=items.find(x=>x.id===id);
   assert.ok(item);
   assert.equal(item.icon,undefined);
   assert.equal(item.icon_evidence,undefined);
   assert.ok(item.source_status.startsWith("forever_beta_"));
 }
 // Current client-database evidence does not overwrite independent acquisition.
 for(const id of [285269,273637,3008,285345]){
  const item=items.find(x=>x.id===id);
  assert.ok(item.origin);
  assert.ok(item.source_status.startsWith("forever_beta_"));
 }
});
