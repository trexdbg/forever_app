import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const items=JSON.parse(read("data/items.json")).items;
const byID=new Map(items.map(x=>[x.id,x]));
const detailed=items.filter(x=>Array.isArray(x.acquisition_sources));
const rows=detailed.flatMap(item=>item.acquisition_sources.map(s=>({id:item.id,item,s})));
const legacyRows=rows.filter(({s})=>!s.source_url.startsWith("https://foreverchanges.pro/item/")
 && !s.source_url.startsWith("https://wowclassicdatabase.com/item/")
 && !s.source_url.includes("/sulfuras-hand-of-ragnaros")
 && !s.source_url.includes("/Thunderfury%2C_Blessed_Blade_of_the_Windseeker"));
const legacyDetailed=new Set(legacyRows.map(({id})=>id));

test("45 distinct gear cards include 37 Classic table links and 11 Classic quest rewards",()=>{
 assert.equal(items.length,65);
 assert.equal(legacyDetailed.size,45);
 assert.equal(legacyRows.filter(x=>x.s.kind!=="quest").length,37);
 assert.equal(legacyRows.filter(x=>x.s.kind==="quest").length,11);
 assert.equal(legacyRows.length,48);
 assert.equal(new Set(legacyRows.map(x=>x.id)).size,45);
 assert.equal(items.filter(x=>!x.acquisition_sources).length,0);
});

test("all added boss and quest statements have claim-level evidence, never Forever probability",()=>{
 for(const {id,item,s} of legacyRows){
  assert.equal(s.evidence_level,"classic_reference","Evidence source must not become Forever for "+id);
  assert.equal(s.evidence_kind,"classic_guide");
  assert.match(s.source_url,/^https:\/\//);
  assert.equal(s.evidence_url,s.source_url);
  assert.equal(s.observed_at,"2026-10-19");
  assert.match(s.observed_build,/Classic/);
  assert.ok(s.evidence_note.includes(item.name)&&s.evidence_note.includes(String(item.id)));
  assert.match(s.evidence_note,/not .*Forever/i);
  assert.ok(s.name_en&&s.name_fr);
  assert.ok(s.location_en&&s.location_fr);
  assert.ok(["boss","quest","event","chest"].includes(s.kind));
  assert.ok(!("chance_forever_percent" in s)&&!("verified_forever" in s));
  if(s.kind==="quest"){
   assert.ok(!("classic_drop_chance_percent" in s),"No random loot rate for a quest reward "+id);
  }else{
   assert.ok(s.observed_build.includes("CMaNGOS"));
   assert.ok(Number.isFinite(s.classic_drop_chance_percent)&&s.classic_drop_chance_percent>0&&s.classic_drop_chance_percent<=100);
  }
 }
});

test("Truestrike Shoulders is attributed to Emberseer with a labeled CMaNGOS Classic-only rate",()=>{
 const item=byID.get(12927);
 assert.equal(item.acquisition_sources.length,1);
 const source=item.acquisition_sources[0];
 assert.equal(source.name_en,"Pyroguard Emberseer");
 assert.equal(source.location_en,"Upper Blackrock Spire");
 assert.equal(source.classic_drop_chance_percent,20);
 assert.equal(source.source_url,"https://theforeverera.com/en/dungeons/upper-blackrock-spire/");
 assert.equal(source.evidence_level,"classic_reference");
 assert.equal(item.verified_forever,false);
});

test("conditional chests/events and faction-specific quest rewards remain distinct",()=>{
 const event=byID.get(11662).acquisition_sources[0];
 assert.equal(event.kind,"event");
 assert.equal(event.name_en,"Ring of Law");
 const tribute=byID.get(18500).acquisition_sources[0];
 assert.equal(tribute.kind,"chest");
 assert.equal(tribute.conditional,true);
 for(const id of [13959,13963,13965]){
  const sources=byID.get(id).acquisition_sources;
  assert.deepEqual(sources.map(s=>s.faction),["Alliance","Horde"]);
  assert.ok(sources.every(s=>s.kind==="quest"&&!s.classic_drop_chance_percent));
 }
});

test("FR/EN catalogue shows source near origin and expandable individually referenced evidence",()=>{
 const js=read("assets/items-v3.js");
 assert.match(js,/function curatedSources\(item\)/);
 assert.match(js,/item-acquisition-inline/);
 assert.match(js,/appendCuratedSources\(region,localSources\)/);
 assert.match(js,/x\.name_en/);
 assert.match(js,/Classic 1\.12/);
 assert.match(js,/classic_drop_chance_percent/);
 assert.match(js,/item-acquisition-footnote/);
 assert.match(read("assets/item-catalogue.css"),/item-acquisition-inline/);
 for(const path of ["equipements/index.html","en/equipements/index.html"]){
  const html=read(path);
  for(const asset of ["items-v3.js","item-catalogue.css"]){
   assert.ok(html.includes(asset+"?v="+(asset==="items-v3.js"?"20261019-dungeon-audit40":"20261019-source-hints")),path+" "+asset);
  }
 }
});
