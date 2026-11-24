import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const items=JSON.parse(readFileSync(new URL("../data/items-forever.json",import.meta.url),"utf8")).items;
const expected=[
 [
  271904,
  "inv_misc_rune_08"
 ],
 [
  272059,
  "inv_misc_rune_06"
 ],
 [
  286639,
  "inv_chest_cloth_18"
 ],
 [
  283254,
  "inv_misc_orb_05"
 ],
 [
  274295,
  "inv_jewelry_ring_25"
 ],
 [
  280313,
  "inv_helmet_47"
 ],
 [
  249234,
  "inv_wand_04"
 ],
 [
  284272,
  "inv_pants_06"
 ],
 [
  286556,
  "spell_sandstorm"
 ],
 [
  250588,
  "inv_gauntlets_29"
 ],
 [
  249469,
  "inv_misc_gem_sapphire_01"
 ],
 [
  250590,
  "inv_bracer_19"
 ],
 [
  275610,
  "inv_gauntlets_25"
 ],
 [
  275621,
  "inv_boots_chain_12"
 ],
 [
  249237,
  "inv_wand_14"
 ],
 [
  249385,
  "inv_wand_07"
 ],
 [
  250593,
  "inv_helmet_24"
 ],
 [
  268873,
  "inv_misc_horn_02"
 ],
 [
  272830,
  "inv_bracer_06"
 ],
 [
  274256,
  "inv_gauntlets_29"
 ],
 [
  284101,
  "inv_sword_12"
 ],
 [
  272395,
  "inv_belt_26"
 ],
 [
  272406,
  "inv_jewelry_ring_24"
 ],
 [
  272407,
  "inv_jewelry_ring_60"
 ],
 [
  272408,
  "inv_jewelry_ring_01"
 ],
 [
  272411,
  "inv_misc_cape_05"
 ],
 [
  272413,
  "inv_misc_cape_06"
 ],
 [
  272693,
  "inv_sword_11"
 ],
 [
  273884,
  "inv_pant_leather_raiddruidhyjalc60_d_01"
 ],
 [
  273885,
  "inv_glove_leather_raiddruidhyjalc60_d_01"
 ],
 [
  273887,
  "inv_boot_leather_raiddruidhyjalc60_d_01"
 ],
 [
  273896,
  "inv_pant_leather_raiddruidhyjalc60_d_01"
 ],
 [
  273904,
  "inv_pant_cloth_raidmagehyjalc60_d_01"
 ],
 [
  273905,
  "inv_glove_cloth_raidmagehyjalc60_d_01"
 ],
 [
  273907,
  "inv_boot_cloth_raidmagehyjalc60_d_01"
 ],
 [
  273908,
  "inv_pant_plate_raidpaladinhyjalc60_d_01"
 ],
 [
  273912,
  "inv_pant_plate_raidpaladinhyjalc60_d_01"
 ],
 [
  273921,
  "inv_glove_cloth_raidpriesthyjalc60_d_01"
 ],
 [
  273922,
  "inv_shoulder_r_cloth_raidpriesthyjalc60_d_01"
 ],
 [
  273924,
  "inv_pant_cloth_raidpriesthyjalc60_d_01"
 ],
 [
  273925,
  "inv_glove_cloth_raidpriesthyjalc60_d_01"
 ],
 [
  273926,
  "inv_shoulder_r_cloth_raidpriesthyjalc60_d_01"
 ],
 [
  273927,
  "inv_boot_cloth_raidpriesthyjalc60_d_01"
 ],
 [
  273932,
  "inv_pant_mail_raidshamanhyjalc60_d_01"
 ],
 [
  273944,
  "inv_pant_plate_raidwarriorhyjalc60_d_01"
 ],
 [
  273949,
  "inv_glove_plate_raidwarriorhyjalc60_d_01"
 ],
 [
  273950,
  "inv_shoulder_plate_raidwarriorhyjalc60_d_01"
 ],
 [
  273951,
  "inv_boot_plate_raidwarriorhyjalc60_d_01"
 ],
 [
  279246,
  "inv_torch_lit"
 ],
 [
  279254,
  "inv_pants_cloth_08"
 ],
 [
  279259,
  "inv_sword_07"
 ],
 [
  279270,
  "inv_misc_cape_13"
 ],
 [
  284716,
  "inv_jewelry_ring_54"
 ]
];
const unresolved=[250587,250592,250594,252575,252581,252593,252602,252604,252605,270031,271807,273906,273940,275612,277008,277020,277029,277239,281310];

test("53 high-level Forever icon identities have exact ID, slug and provenance",()=>{
 assert.equal(expected.length,53);
 assert.equal(new Set(expected.map(([id])=>id)).size,53);
 for(const [id,icon] of expected){
  const matches=items.filter(x=>x.id===id);
  assert.equal(matches.length,1,"missing unique item "+id);
  const item=matches[0],e=item.icon_evidence;
  assert.equal(item.icon,icon,"icon slug for ID "+id);
  assert.ok(item.name&&typeof item.name==="string");
  assert.ok(item.source_status.startsWith("forever_beta_"),"original classification "+id);
  assert.equal(e.source_url,"https://zephras.com/forever/enUS/item/"+id+"/");
  assert.equal(e.evidence_url,e.source_url);
  assert.equal(e.evidence_level,"documented_forever");
  assert.equal(e.evidence_kind,"forever_community_page");
  assert.equal(e.observed_at,"2026-11-24");
  assert.equal(e.observed_build,"unknown");
  assert.equal(e.provider,"Zephras Forever client-derived item page");
  assert.ok(e.evidence_note.includes("item ID "+id+" and English name"));
  assert.ok(e.evidence_note.includes(item.name));
  assert.ok(e.evidence_note.includes(icon));
  assert.match(e.evidence_note,/icon identity only, not gameplay acquisition, drop rate, rare spawn location or live availability/);
  assert.ok(!("drop_chance" in e));
 }
});

test("public editorial catalogue retains only 19 explicit unknown icons rather than guesses",()=>{
 assert.equal(items.length,183);
 assert.equal(items.filter(x=>x.icon).length,164);
 const actual=items.filter(x=>!x.icon).map(x=>x.id).sort((a,b)=>a-b);
 assert.deepEqual(actual,[...unresolved].sort((a,b)=>a-b));
 for(const id of unresolved){
  const item=items.find(x=>x.id===id);
  assert.equal(item.icon,null);
  assert.equal(item.icon_evidence,undefined);
 }
 // Two external client references do not belong to this 183-row editorial
 // catalogue and must never be silently introduced as bogus item records.
 assert.ok(!items.some(x=>[273824,275633].includes(x.id)));
});
