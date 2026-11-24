import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const get=p=>JSON.parse(readFileSync(new URL("../"+p,import.meta.url),"utf8"));
const catalogue=get("data/items-forever.json").items;
const bis=get("data/bis-niveaux-forever-observed.json").items;
const fixtures=[
 {id:273023,name:"Saltscale Girdle",icon:"inv_belt_21",boss:"Saltspine",required:26,
  tooltip:["Saltscale Girdle","Item Level 31","Waist Mail","124 Armor","+9 Strength","+9 Intellect","Requires Level 26"],
  source:"https://db.icy-veins.com/wow-forever/items/273023",
  second:"https://foreverchanges.pro/item/273023/saltscale-girdle"},
 {id:273028,name:"Reliquary Mantle",icon:"inv_shoulder_27",boss:"Relic Guardian",required:28,
  tooltip:["Reliquary Mantle","Item Level 33","Shoulder Mail","171 Armor","+12 Stamina","Equip: Improves your chance to hit by 0.4%.","Requires Level 28"],
  source:"https://db.icy-veins.com/wow-forever/items/273028",
  second:"https://www.foreverdb.app/en/forever/items/273028/reliquary-mantle"}
];
test("two reconciled level-30 dungeon gear tooltips match independent exact Forever sources",()=>{
 for(const fx of fixtures){
  const e=catalogue.find(x=>x.id===fx.id),b=bis.find(x=>x.id===fx.id);
  assert.ok(e&&b,"same exact item in both modules "+fx.id);
  for(const record of [e,b]){
   assert.equal(record.id,fx.id);
   assert.equal(record.name,fx.name);
   assert.deepEqual(record.tooltip,fx.tooltip);
   assert.equal(record.icon,fx.icon);
   assert.equal(record.requiredLevel,fx.required);
   assert.equal(record.stats_evidence.evidence_level,"documented_forever");
   assert.equal(record.stats_evidence.source_url,fx.source);
   assert.equal(record.stats_evidence.evidence_url,fx.second);
   assert.equal(record.stats_evidence.evidence_kind,"forever_community_page");
   assert.equal(record.stats_evidence.observed_at,"2026-11-24");
   assert.equal(record.stats_evidence.observed_build,"unknown");
   assert.match(record.stats_evidence.evidence_note,/not .*proof of live|not direct proof of live/i);
   assert.equal(record.verified_forever??false,false,"stat documentation not a claim of first-hand gameplay");
  }
  assert.equal(e.source_status,"forever_beta_wowhead");
  assert.equal(b.source_status,"forever_beta_observed");
  assert.equal(e.acquisition_sources[0].name_en,fx.boss);
  assert.equal(b.acquisition.boss,fx.boss);
  assert.equal(e.acquisition_sources[0].evidence_kind,"existing_catalogue_cross_reference");
  assert.equal(b.acquisition.verification,"observed_beta_2026-10");
  assert.ok(!("drop_chance_percent" in e.stats_evidence));
  assert.ok(!("drop_chance_percent" in b.stats_evidence));
 }
});

test("former Stamina/Spirit and numeric hit-rating mistakes are not shown as certain",()=>{
 const girdle=catalogue.find(x=>x.id===273023);
 const mantle=catalogue.find(x=>x.id===273028);
 assert.ok(!girdle.tooltip.some(t=>/Stamina/.test(t)));
 assert.ok(girdle.tooltip.includes("+9 Intellect"));
 assert.ok(!mantle.tooltip.some(t=>/Spirit|\+4 Hit Rating/i.test(t)));
 assert.ok(mantle.tooltip.includes("Equip: Improves your chance to hit by 0.4%."));
 assert.match(girdle.stats_evidence.evidence_note,/shift from \+9 Stamina to \+9 Intellect/);
 assert.equal(catalogue.length,183);
 assert.equal(bis.length,79);
 assert.equal(catalogue.filter(x=>!x.icon).length,19);
 assert.equal(bis.filter(x=>!x.icon).length,0);
});
