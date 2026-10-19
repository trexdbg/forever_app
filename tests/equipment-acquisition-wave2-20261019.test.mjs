import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const items=JSON.parse(read("data/items.json")).items;
const byId=new Map(items.map(x=>[x.id,x]));
const previouslyMissing=[12640,12784,13102,14152,14154,14551,14552,14624,14637,15062,15063,17182,18510,18681,19019,14554,14616,12553,16710,12783];
const added=previouslyMissing.flatMap(id=>(byId.get(id)?.acquisition_sources||[]).map(s=>({id,s})));
test("20 originally missing equipment sources now all have an individual evidence trail",()=>{
 assert.equal(items.length,65);
 assert.equal(new Set(items.map(x=>x.id)).size,65);
 assert.equal(new Set(previouslyMissing).size,20);
 assert.equal(items.filter(x=>!x.acquisition_sources?.length).length,0);
 assert.equal(added.length,40);
 assert.equal(items.reduce((n,x)=>n+x.acquisition_sources.length,0),88);
 for(const id of previouslyMissing)assert.ok(byId.get(id).acquisition_sources.length>0,"Missing "+id);
});
test("40 new relationships distinguish client-documented craft and Classic reference, without inventing a Forever rate",()=>{
 for(const {id,s} of added){
  assert.ok(["boss","craft","world_drop","quest","legendary"].includes(s.kind),"kind "+id);
  assert.ok(["classic_reference","documented_forever"].includes(s.evidence_level));
  assert.equal(s.source_url,s.evidence_url);
  assert.match(s.source_url,/^https:\/\//);
  assert.equal(s.observed_at,"2026-10-19");
  assert.ok(s.evidence_note.includes(String(id))&&s.evidence_note.includes(byId.get(id).name));
  assert.match(s.evidence_note,/not .*Forever|does not prove/i);
  assert.ok(s.name_en&&s.name_fr&&s.location_en&&s.location_fr);
  assert.ok(!Object.hasOwn(s,"chance_forever_percent"));
  if(s.kind==="craft"){
   assert.equal(s.evidence_level,"documented_forever");
   assert.equal(s.evidence_kind,"forever_community_page");
   assert.equal(s.observed_build,"1.60.1.70425");
   assert.equal(s.source_url,"https://foreverchanges.pro/item/"+id);
   assert.ok(s.recipe_source_en&&s.recipe_source_fr);
  }else{
   assert.equal(s.evidence_level,"classic_reference");
   assert.equal(s.evidence_kind,"classic_guide");
   assert.match(s.observed_build,/Classic/);
  }
  if(!["boss"].includes(s.kind))assert.equal(s.classic_drop_chance_percent,undefined);
  else assert.ok(s.classic_drop_chance_percent>0&&s.classic_drop_chance_percent<=100);
 }
 assert.equal(added.filter(x=>x.s.kind==="craft").length,8);
 assert.equal(added.filter(x=>x.s.kind==="world_drop").length,4);
 assert.equal(added.filter(x=>x.s.kind==="boss").length,26);
 assert.equal(added.filter(x=>["quest","legendary"].includes(x.s.kind)).length,2);
});
test("Scholomance multi-source drops use the per-boss Classic table, not a fake global percentage",()=>{
 const references={14624:["Lord Alexei Barov",9],14637:["Lord Alexei Barov",9.3],18681:["Lord Alexei Barov",9.12],14616:["The Ravenian",4.7]};
 for(const [key,[boss,rate]] of Object.entries(references)){
  const id=Number(key),sources=byId.get(id).acquisition_sources;
  assert.equal(sources.length,6);
  assert.equal(sources[0].name_en,boss);
  assert.equal(sources[0].classic_drop_chance_percent,rate);
  assert.equal(new Set(sources.map(x=>x.name_en)).size,6);
  assert.ok(sources.every(x=>x.location_en==="Scholomance"&&x.source_url==="https://foreverchanges.pro/item/"+id));
 }
 const shadowcraft=byId.get(16710).acquisition_sources;
 assert.equal(shadowcraft.length,1);
 assert.equal(shadowcraft[0].name_en,"Instructor Malicia");
 assert.equal(shadowcraft[0].classic_drop_chance_percent,4.5);
 const moira=byId.get(12553).acquisition_sources[0];
 assert.equal(moira.name_en,"Princess Moira Bronzebeard");
 assert.equal(moira.classic_drop_chance_percent,23);
});
test("World drops and legendary chains are not attributed to a single boss or a direct-drop rate",()=>{
 for(const id of [13102,14551,14552,14554])assert.equal(byId.get(id).acquisition_sources[0].kind,"world_drop");
 const sulfuras=byId.get(17182).acquisition_sources[0];
 assert.equal(sulfuras.kind,"legendary");
 assert.match(sulfuras.detail_en,/Eye/);
 assert.match(sulfuras.detail_en,/Sulfuras itself does not drop/);
 assert.equal(sulfuras.classic_drop_chance_percent,undefined);
 const thunder=byId.get(19019).acquisition_sources[0];
 assert.equal(thunder.kind,"quest");
 assert.match(thunder.detail_en,/Garr and Baron Geddon/);
 assert.equal(thunder.classic_drop_chance_percent,undefined);
});
test("French and English source panels include recipes and differentiate Classic from the Forever client",()=>{
 const js=read("assets/items-v3.js");
 assert.match(js,/world_drop:"World drop"/);
 assert.match(js,/craft:"Fabrication"/);
 assert.match(js,/recipe_source_en/);
 assert.match(js,/rec\.evidence_level==="documented_forever"/);
 assert.match(js,/source\.classic_drop_chance_percent/);
 assert.match(js,/item-acquisition-footnote/);
 const css=read("assets/item-catalogue.css");
 assert.match(css,/item-acquisition-extra/);
 for(const path of ["equipements/index.html","en/equipements/index.html"]){
  const html=read(path);
  for(const asset of ["items-v3.js","item-catalogue.css"])
   assert.ok(html.includes(asset+"?v=20261019-source-hints"),path+"/"+asset);
 }
});
