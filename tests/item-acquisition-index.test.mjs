import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles,buildAcquisitionIndex} from "../scripts/build-item-acquisition-index.mjs";

const read=path=>JSON.parse(readFileSync(new URL("../data/"+path,import.meta.url),"utf8"));
const published=read("item-acquisition-index.json");
const generated=buildFromFiles();
const material=()=>JSON.stringify(published);
const all=published.items.flatMap(row=>row.sources.map(s=>({id:row.id,...s})));

test("public acquisition index matches its reproducible input-catalogue build",()=>{
 assert.deepEqual(published,generated);
 assert.equal(published.schema_version,1);
 assert.equal(published.totals.unique_items,published.items.length);
 assert.equal(published.totals.relations,all.length);
 assert.ok(published.items.length>=500,"Insufficient useful linked item coverage");
 assert.ok(all.length>=950,"Unexpected loss of existing catalogue relations");
 assert.equal(published.totals.relations,996);
 assert.equal(published.totals.unique_items,572);
 assert.equal(published.totals.by_evidence.documented_forever,232);
});
test("IDs, source paths, categories and evidence statuses are valid",()=>{
 const ids=new Set();
 for(const row of published.items){
  assert.ok(Number.isSafeInteger(row.id)&&row.id>0);
  assert.ok(!ids.has(row.id),"Duplicate indexed item ID "+row.id);ids.add(row.id);
  assert.ok(row.sources.length>0);
  const keys=new Set();
  for(const s of row.sources){
   assert.ok(["merchant","rare","boss","recipe"].includes(s.kind));
   assert.ok(["documented_forever","classic_reference","datamined","unverified","confirmed_in_game"].includes(s.evidence_level));
   assert.ok(s.name_en&&s.name_fr);
   assert.match(s.href,/^\/(marchands|rare|donjons|metiers)\/\?/);
   const url=new URL(s.href,"https://foreveroth.com");
   assert.equal(url.origin,"https://foreveroth.com");
   if(s.reference_url!==null)assert.match(s.reference_url,/^https:\/\/[^\s/]+\//);
   const key=s.kind+"|"+s.href+"|"+s.name_en;
   assert.ok(!keys.has(key),"Duplicate relation "+row.id+" / "+key);keys.add(key);
  }
 }
});
test("Forever documentary links are never promoted to confirmed gameplay",()=>{
 assert.ok(all.some(s=>s.evidence_level==="documented_forever"));
 assert.ok(all.some(s=>s.evidence_level==="classic_reference"));
 assert.ok(!all.some(s=>s.evidence_level==="confirmed_in_game"),
  "No live game proof was established by this navigational cross-index");
 assert.equal(all.filter(s=>s.kind==="merchant").length,672);
 assert.equal(all.filter(s=>s.kind==="boss").length,205);
 assert.equal(all.filter(s=>s.kind==="rare").length,105);
 assert.equal(all.filter(s=>s.kind==="recipe").length,14);
});
test("all twenty-four documented Forever rare additions appear in the cross-catalogue lookup",()=>{
 const mustInclude=[285347,285346,285348,285350,284386,284400,286533,286534,286537,284287,285328,284174,285269,263015,247862,277213,255007,286746,286749,286750,286755,285345,282716,284666];
 assert.equal(mustInclude.length,24);
 for(const id of mustInclude){
  const item=published.items.find(i=>i.id===id);
  assert.ok(item,"Missing source-linked Forever item "+id);
  assert.ok(item.sources.some(s=>s.kind==="rare"&&s.evidence_level==="documented_forever"),"Forever rare provenance lost for "+id);
 }
});
test("an engineering item keeps both its Forever recipe and Classic merchant leads",()=>{
 const item=published.items.find(row=>row.id===4357);
 assert.ok(item?.sources.some(s=>s.kind==="recipe"&&s.evidence_level==="documented_forever"));
 assert.ok(item?.sources.some(s=>s.kind==="merchant"&&s.evidence_level==="classic_reference"));
 assert.equal(item.sources[0].kind,"recipe","Forever claim should appear before Classic pointers");
});
test("a classic-only item stays Classic rather than automatically becoming Forever",()=>{
 const item=published.items.find(row=>row.id===1404);
 assert.ok(item?.sources.some(s=>s.kind==="rare"&&s.name_en==="Prince Nazjak"));
 assert.ok(item.sources.filter(s=>s.kind==="rare").every(s=>s.evidence_level==="classic_reference"));
});
test("does not manufacture links for unproven ID-less drops",()=>{
 const small=buildAcquisitionIndex({
  npcs:{npcs:[]},rares:{rares:[]},
  dungeons:{dungeons:[{id:"test",name:{fr:"Test",en:"Test"},bosses:[{name:{fr:"Boss",en:"Boss"},loot:[{fr:"Unknown",en:"Unknown",source_status:"forever_beta_community"}]}]}]},
  crafting:{recipes:[]},alchemy:{recipes:[]}
 });
 assert.equal(small.totals.relations,0);
});
test("the equipment catalogue exposes expandable source panels in French and English",()=>{
 const js=readFileSync(new URL("../assets/items-v3.js",import.meta.url),"utf8");
 assert.match(js,/loadAcquisitionIndex\(/);
 assert.match(js,/aria-expanded/);
 assert.match(js,/Où l'obtenir/);
 assert.match(js,/Where to find/);
 assert.match(js,/classic_reference/);
 for(const path of ["equipements/index.html","en/equipements/index.html"]){
  const html=readFileSync(new URL("../"+path,import.meta.url),"utf8");
  assert.match(html,/items-v3\.js\?v=20261014-acquisitions/);
 }
 assert.ok(material().length>10000);
});

test("Forever rare acquisition status requires proof of the exact claim, not just source_version",()=>{
 const mk=(item_id,fields)=>({
   id:"sample-rare",name:{fr:"Rare test",en:"Test rare"},zone:"elwynn",
   loot:[{item_id,source_version:"forever_beta",source_url:"https://www.wowhead.com/forever/item="+item_id,...fields}]
 });
 const run=rare=>buildAcquisitionIndex({npcs:{npcs:[]},rares:{rares:[rare]},
   dungeons:{dungeons:[]},crafting:{recipes:[]},alchemy:{recipes:[]}}).items[0].sources[0];
 const loose=run(mk(999001,{}));
 assert.equal(loose.evidence_level,"unverified");
 assert.equal(loose.source_status,"rare_loot_without_individual_forever_proof");
 const unsupported=run(mk(999002,{
   evidence_level:"documented_forever",evidence_url:"https://example.org/claims",
   observed_at:"2026-10-15",observed_build:"unknown",evidence_kind:"classic_database",
   evidence_note:"Item exists, but the claim does not have Forever evidence"
 }));
 assert.equal(unsupported.evidence_level,"unverified");
 const documented=run(mk(999003,{
   evidence_level:"documented_forever",evidence_url:"https://www.wowhead.com/forever/item=999003",
   observed_at:"2026-10-15",observed_build:"unknown",evidence_kind:"forever_community_page",
   evidence_note:"Item-to-creature association directly listed on a Forever item page"
 }));
 assert.equal(documented.evidence_level,"documented_forever");
});
