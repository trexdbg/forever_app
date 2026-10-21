import test from "node:test";
import {BASELINE as current} from "./helpers/catalogue-baseline.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const items=JSON.parse(load("data/items-forever.json")).items;
const report=JSON.parse(load("data/forever-equipment-acquisition-gaps-20261019.json"));
const byID=new Map(items.map(x=>[x.id,x]));
const rows=[
 [277069,"unknown"],[277017,"craft"],[277020,"craft"],[277023,"craft"],[277024,"craft"],
 [277029,"craft"],[277032,"craft"],[277035,"craft"],[277204,"quest"],
 [271096,"boss"],[273293,"boss"],[276631,"unknown"],[279876,"quest"],
 [284715,"boss"],[271209,"boss"],[273637,"boss"],[273805,"boss"],
 [273808,"boss"],[273840,"boss"]
];
const expectTooltip=(id,expected)=>assert.deepEqual(byID.get(id).tooltip,[byID.get(id).name,"Item Level "+byID.get(id).itemLevel,...expected]);

test("19 ID-exact beta item pages enriched, 57 -> 38 short tooltips, 179 total editorial entries",()=>{
 assert.equal(items.length,current.editorialItems);
 assert.equal(new Set(items.map(x=>x.id)).size,current.editorialItems);
 assert.equal(rows.length,19);
 assert.equal(new Set(rows.map(x=>x[0])).size,19);
 assert.equal(report.metrics.records_with_fewer_than_five_tooltip_lines,38);
 assert.equal(items.filter(x=>!x.tooltip||x.tooltip.length<5).length,38);
 assert.equal(report.tooltip_followup_wave.items.length,19);
 assert.equal(report.metrics.additional_lowlevel_profiles_reviewed,19);
 assert.deepEqual(new Set(report.tooltip_followup_wave.items.map(x=>x.id)),new Set(rows.map(x=>x[0])));
 for(const [id,kind] of rows){
  const x=byID.get(id);
  assert.ok(x&&x.id===id);
  assert.ok(x.tooltip.length>=5);
  assert.equal(x.tooltip[0],x.name);
  assert.equal(x.tooltip[1],"Item Level "+x.itemLevel);
  assert.equal(x.evidence_level,"documented_forever");
  assert.equal(x.evidence_kind,"forever_community_page");
  assert.equal(x.evidence_url,x.source_url);
  assert.equal(x.observed_at,"2026-10-19");
  assert.equal(x.observed_build,"1.60.1.70425");
  assert.equal(x.verified_forever,false);
  assert.equal(x.icon,null);
  assert.ok(x.source_url.startsWith("https://www.60.tools/items/"+id+"-"));
  assert.ok(x.evidence_note.includes("does not alone prove live availability"));
  if(kind==="unknown"){
   assert.equal(x.acquisition_status,"unknown");
   assert.equal(x.acquisition_evidence_level,"unverified");
   assert.ok(!x.acquisition_sources?.length);
  } else {
   assert.equal(x.acquisition_status,"documented_forever");
   assert.equal(x.acquisition_sources.length,1);
   const source=x.acquisition_sources[0];
   assert.equal(source.kind,kind);
   assert.equal(source.evidence_level,"documented_forever");
   assert.equal(source.source_url,x.source_url);
   assert.equal(source.evidence_url,x.source_url);
   assert.equal(source.observed_build,"1.60.1.70425");
   assert.ok(!Object.hasOwn(source,"classic_drop_chance_percent"));
   assert.ok(!Object.hasOwn(source,"community_reported_chance_percent"));
   assert.match(source.evidence_note,/not first-hand proof/);
  }
 }
});

test("seven early crafted items have individually documented stats and skill thresholds",()=>{
 const recipes=[
  [277017,47,"+1 Strength",55,"Blacksmithing"],
  [277020,107,"+2 Stamina",65,"Blacksmithing"],
  [277023,24,"+1 Strength",55,"Leatherworking"],
  [277024,36,"+1 Agility",60,"Leatherworking"],
  [277029,24,"+1 Intellect",55,"Leatherworking"],
  [277032,54,"+2 Stamina",65,"Leatherworking"],
  [277035,8,"+1 Intellect",55,"Tailoring"]
 ];
 assert.equal(report.metrics.additional_lowlevel_crafting_sources,7);
 for(const [id,armor,stat,skill,profession] of recipes){
  const x=byID.get(id),src=x.acquisition_sources[0];
  assert.equal(x.quality,"uncommon");
  assert.equal(x.tooltip[2],"Binds when equipped");
  assert.ok(x.tooltip.includes(armor+" Armor"));
  assert.ok(x.tooltip.includes(stat));
  assert.ok(x.tooltip.includes("Requires Level "+x.requiredLevel));
  assert.match(src.recipe_source_en,new RegExp(profession+" \\("+skill+"\\)"));
  assert.match(src.recipe_source_fr,new RegExp("\\("+skill+"\\)"));
  assert.equal(src.kind,"craft");
 }
});
test("boss and quest links refer to individual Forever item sources, not Classic rates",()=>{
 assert.equal(report.metrics.additional_lowlevel_boss_sources,8);
 assert.equal(report.metrics.additional_lowlevel_quest_sources,2);
 const exactBoss=[[271096,"Faldrim Anvilmar"],[273293,"Sneed"],[284715,"Mr. Smite"],
  [271209,"Bjork"],[273637,"Baron Silverlaine"],[273805,"Targorr the Dread"],
  [273808,"Kam Deepfury"],[273840,"Gelihast"]];
 for(const [id,name] of exactBoss){
  const x=byID.get(id),source=x.acquisition_sources[0];
  assert.equal(source.kind,"boss");
  assert.equal(source.name_en,name);
  assert.match(x.origin_en,/Reported beta loot/);
  assert.ok(source.location_en);
  assert.ok(!("drop_chance_percent" in source));
 }
 for(const [id,name,level] of [[277204,"Friend of the Library",20],[279876,"The New Plague",22]]){
  const x=byID.get(id),source=x.acquisition_sources[0];
  assert.equal(source.kind,"quest");
  assert.equal(source.name_en,name);
  assert.ok(source.detail_en.includes("Level "+level+" quest"));
  assert.ok(source.detail_en.includes("not the item's required level"));
  assert.ok(!("classic_drop_chance_percent" in source));
 }
});
test("distinctive low-level effects, unique set data and item minimums are not discarded",()=>{
 expectTooltip(271096,["Binds when picked up","Wrist Cloth","15 Armor","+30 Armor","Requires Level 13","Equip: +3 Spell Power."]);
 expectTooltip(273293,["Binds when picked up","Wrist Mail","82 Armor","+5 Stamina","Requires Level 16","Equip: Deals 6 Physical damage every time you block."]);
 expectTooltip(276631,["Binds when picked up","Main hand Sword","25 - 48 Damage Speed 2.00","(18.4 damage per second)","+7 Intellect","Classes: Mage","Requires Level 21","Equip: Melee attacks deal 98 additional Fire damage against Frozen targets."]);
 expectTooltip(273840,["Binds when picked up","Unique-Equipped","Trinket","Requires Level 24","Equip: Spells and attacks deal 2 Shadow damage. Deals 4 times as much damage to Murlocs."]);
 expectTooltip(277069,["Binds when picked up","Wrist Leather","22 Armor","+1 Spirit","Requires Level 4"]);
 assert.ok(byID.get(284715).tooltip.includes("(2) Set: +22 Strength."));
 assert.ok(byID.get(284715).tooltip.includes("Band of the Better Half"));
 assert.ok(byID.get(279876).tooltip.some(x=>x.includes("Poisons target")));
 assert.equal(byID.get(277204).requiredLevel,null);
 assert.ok(!byID.get(277204).tooltip.some(x=>x.startsWith("Requires Level")));
});
test("FR/EN equipment bundles invalidate the browser cache for 19 updated records",()=>{
 assert.match(load("assets/gear-data.js"),/items-forever\.json\?v=20261019-lowlevel19-70425/);
 for(const path of ["equipements/index.html","en/equipements/index.html"])
  assert.ok(load(path).includes("gear-data.js?v=20261019-lowlevel19-70425"),path);
 assert.equal(report.metrics.records_without_real_icon,134);
});
