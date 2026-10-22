import test from "node:test";
import {BASELINE as current} from "./helpers/catalogue-baseline.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles,buildAcquisitionIndex} from "../scripts/build-item-acquisition-index.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const catalogue=JSON.parse(read("data/dungeons-forever.json"));
const index=JSON.parse(read("data/item-acquisition-index.json"));
const counts={
 "hall-of-thanes":[12,0],"ruins-of-lordaeron":[15,7],
 "excavation-site-wetlands":[9,2],"city-of-dalaran":[18,8],
 "ragefire-chasm":[6,0],"wailing-caverns":[1,0],
 "the-stockade":[4,0],"gnomeregan":[2,2],
 "razorfen-kraul":[5,1],"scarlet-monastery-graveyard":[2,2]
};
const rows=catalogue.dungeons.flatMap(d=>d.bosses.flatMap(b=>
 (b.loot||[]).map(item=>({dungeon:d,boss:b,item}))));

test("all 96 Forever-catalogued boss drops have claim-level classification; Classic records remain untouched",()=>{
 const classic=rows.filter(r=>r.item.source_status==="classic_loot_reference");
 const forever=rows.filter(r=>r.item.source_status!=="classic_loot_reference");
 assert.equal(classic.length,110);
 assert.equal(forever.length,96);
 assert.equal(forever.filter(r=>r.item.evidence_level==="documented_forever").length,74);
 assert.equal(forever.filter(r=>r.item.evidence_level==="unverified").length,22);
 assert.equal(rows.length,206);
 const actual={};
 for(const {dungeon,boss,item} of forever){
  const id=dungeon.id;
  actual[id]??=[0,0];
  assert.ok(Number.isSafeInteger(item.id)||!item.id,"Legacy unresolved IDs must not be fabricated");
  assert.ok(item.evidence_note?.includes(boss.name.en)&&item.evidence_note.includes(item.en),
   "Evidence note must identify the precise boss-item relationship: "+boss.name.en+" / "+item.en);
  if(item.evidence_level==="documented_forever"){
   actual[id][0]++;
   const source="https://wowsrc.com/loot/"+id+"/";
   assert.equal(item.source_url,source);
   assert.equal(item.evidence_url,source);
   assert.equal(item.evidence_kind,"forever_community_page");
   assert.equal(item.observed_at,([273052,273051,273049].includes(item.id)?"2026-10-22":"2026-10-16"));
   assert.equal(item.observed_build,"unknown");
   assert.equal(item.loot_attribution_status,"boss_item_pair_documented_forever");
   assert.match(item.evidence_note,/not a verified personal drop capture/);
   assert.ok(!source.includes("/item="));
  }else{
   actual[id][1]++;
   assert.equal(item.evidence_level,"unverified");
   assert.equal(item.loot_attribution_status,"boss_item_pair_needs_independent_evidence");
   assert.ok(!item.evidence_url,"Do not backfill item-only links as proof of a drop");
  }
 }
 assert.deepEqual(actual,counts,"The ten independently checked tables have fixed, reviewed coverage");
});

test("inconsistent boss names and blueprint-only item sheets remain unresolved, never silently removed",()=>{
 const pairs=[
  ["ruins-of-lordaeron","The Forsaken",271207],
  ["ruins-of-lordaeron","Lordaeron Captain",6641],
  ["ruins-of-lordaeron","Rath'mael",273085],
  ["city-of-dalaran","Lyn the Unheeded",273053],
  ["city-of-dalaran","Fel-Touched Ancient",273037],
  ["city-of-dalaran","Archmage's Shade",273103],
  ["city-of-dalaran","Unstable Sentinel",273099],
  ["gnomeregan","Grubbis",274042],
  ["scarlet-monastery-graveyard","Interrogator Vishas",252455]
 ];
 for(const [d,b,id] of pairs){
  const row=rows.find(r=>r.dungeon.id===d&&r.boss.name.en===b&&r.item.id===id);
  assert.ok(row,"Unresolved historical source link must not be deleted: "+[d,b,id].join("/"));
  assert.equal(row.item.evidence_level,"unverified",d+"/"+b+"/"+id);
 }
 assert.ok(rows.find(r=>r.item.en==="Plans: Arcane Recycler"&&!r.item.id),
  "The existing ID-less reference stays pending; never invent a numeric ID");
});

test("published acquisition index agrees with inputs and labels only individually documented boss links",()=>{
 assert.deepEqual(index,buildFromFiles(),"The published index must be rebuilt by the deterministic generator");
 assert.equal(index.updated_at,"2026-10-17");
 assert.equal(index.totals.unique_items,current.index.uniqueItems);
 assert.equal(index.totals.relations,current.index.relations);
 assert.equal(index.totals.by_kind.boss,current.index.byKind.boss);
 assert.equal(index.totals.by_evidence.documented_forever,current.index.byEvidence.documented_forever);
 assert.equal(index.totals.by_evidence.classic_reference,current.index.byEvidence.classic_reference);
 assert.equal(index.totals.by_evidence.unverified,current.index.byEvidence.unverified);
 const links=index.items.flatMap(row=>row.sources.filter(s=>s.kind==="boss").map(s=>({id:row.id,...s})));
 assert.equal(links.filter(s=>s.evidence_level==="documented_forever").length,74);
 assert.equal(links.filter(s=>s.evidence_level==="unverified").length,24);
 assert.equal(links.filter(s=>s.evidence_level==="classic_reference").length,110);
 for(const source of links.filter(s=>s.evidence_level==="documented_forever")){
  assert.match(source.reference_url,/^https:\/\/wowsrc\.com\/loot\/[^/]+\/$/);
  assert.equal(source.source_status,"forever_documented_boss_loot");
 }
 for(const source of links.filter(s=>s.evidence_level==="unverified"))
  assert.equal(source.source_status,"forever_boss_loot_without_direct_source");
});

test("item page or cache alone never promotes a boss drop; exact independent evidence is required",()=>{
 const url="https://wowsrc.com/loot/hall-of-thanes/";
 const base={id:989001,en:"Test Ring",fr:"Anneau test",itemUrl:"https://www.wowhead.com/forever/item=989001",
  source_status:"forever_beta_community",source_url:url,evidence_url:url,
  evidence_level:"documented_forever",evidence_kind:"forever_community_page",
  observed_at:"2026-10-16",observed_build:"unknown",
  evidence_note:"WoW Source lists Test Ring under Sample Boss (community documented only)."};
 const create=loot=>buildAcquisitionIndex({
  npcs:{npcs:[]},rares:{rares:[]},
  dungeons:{dungeons:[{id:"test",name:{fr:"Test",en:"Test"},bosses:[{name:{fr:"Boss",en:"Sample Boss"},loot:[loot]}]}]},
  crafting:{recipes:[]},alchemy:{recipes:[]}
 }).items[0].sources[0];
 assert.equal(create(base).evidence_level,"documented_forever");
 assert.equal(create(base).reference_url,url);
 for(const bad of [
  {...base,evidence_url:base.itemUrl},
  {...base,evidence_url:"https://foreverchanges.pro/item/989001"},
  {...base,evidence_note:"An item exists, no boss link verified"},
  {...base,evidence_kind:"classic_database"},
  {...base,observed_at:null},
  {...base,source_status:"classic_loot_reference"}
 ]){
  const record=create(bad);
  if(bad.source_status==="classic_loot_reference")
   assert.equal(record.evidence_level,"classic_reference");
  else assert.equal(record.evidence_level,"unverified");
 }
});

test("bilingual dungeon pages show explicit trust labels, sources, and current data JS",()=>{
 const js=read("assets/dungeons.js");
 assert.ok(js.includes('filter(it=>dropProof(it)!=="unverified")'));
 assert.ok(!js.includes('dg-panel-disclaimer'));
 assert.ok(js.includes('"Source ↗"'));
 assert.ok(js.includes('dropProof(item)'));
 assert.ok(js.includes('/data/dungeons-forever.json?v=20261016-loot-provenance'));
 for(const path of ["donjons/index.html","en/donjons/index.html"]){
  const html=read(path);
  assert.ok(html.includes('/assets/dungeons.js?v=20261017-clean-1'),path);
 }
 for(const path of ["quetes/index.html","en/quetes/index.html"])
  assert.ok(read(path).length>1000,"Classic quests remain available");
});


test("Archmage's Shade three source-listed items are documentary only; blueprint remains unverified",()=>{
 const shade=catalogue.dungeons.find(d=>d.id==="city-of-dalaran").bosses.find(b=>b.name.en==="Archmage's Shade");
 const proven=shade.loot.filter(item=>item.evidence_level==="documented_forever");
 assert.deepEqual(proven.map(item=>item.id).sort((a,b)=>a-b),[273049,273051,273052]);
 for(const item of proven){
  assert.equal(item.evidence_url,"https://wowsrc.com/loot/city-of-dalaran/");
  assert.match(item.evidence_note,/alternative name/);
  assert.match(item.evidence_note,/not a verified personal drop capture/);
  assert.equal(item.observed_build,"unknown");
  const link=index.items.find(row=>row.id===item.id).sources.find(s=>s.kind==="boss"&&s.name_en==="Archmage's Shade");
  assert.equal(link.evidence_level,"documented_forever");
  assert.equal(link.reference_url,item.evidence_url);
 }
 const blueprint=shade.loot.find(item=>item.id===273103);
 assert.equal(blueprint.evidence_level,"unverified");
 assert.equal(blueprint.evidence_url,undefined);
});
