import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>JSON.parse(readFileSync(new URL("../"+path,import.meta.url),"utf8"));
const bis=read("data/bis-niveaux-forever-observed.json").items;
const cache=read("data/items-forever-cache.json").items;
const inherited=[251485,251486,251533,251534,271097,271202,271213,273027,273029,273030,273045,273052,279865,279867,279874,279875];

test("16 inherited BiS thumbnails have independently checkable internal cache identity",()=>{
 assert.equal(inherited.length,16);
 assert.equal(new Set(inherited).size,16);
 for(const id of inherited){
  const matches=bis.filter(x=>x.id===id),caches=cache.filter(x=>x.id===id);
  assert.equal(matches.length,1,"BiS "+id);
  assert.equal(caches.length,1,"Cache "+id);
  const row=matches[0],cached=caches[0],source=row.icon_catalogue_reference;
  assert.equal(row.name,cached.name);
  assert.equal(row.icon,cached.icon);
  assert.equal(cached.source_status,"forever_beta_cache");
  assert.equal(cached.verified_forever,false);
  assert.ok(row.icon&&typeof row.icon==="string");
  assert.equal(source.file,"data/items-forever-cache.json");
  assert.equal(source.source_commit,"88daf9f77a2ffc1f56d8e062e96a13b89470ebdb");
  assert.equal(source.item_id,id);
  assert.equal(source.item_name,row.name);
  assert.equal(source.icon,row.icon);
  assert.equal(source.icon_source,"existing_forever_beta_cache");
  assert.equal(source.reviewed_on,"2026-11-24");
  assert.match(source.note,/Internal catalogue provenance only/);
  assert.match(source.note,/not an independent Forever gameplay observation/);
  assert.equal(row.source_status,"forever_beta_observed","no upgrade from icon proof");
 }
});

test("79/79 BiS icon coverage has exactly one traceable identity category each",()=>{
 assert.equal(bis.length,79);
 assert.equal(bis.filter(x=>!x.icon).length,0);
 const unknown=bis.filter(x=>!x.icon_catalogue_reference&&!x.icon_evidence);
 assert.deepEqual(unknown,[]);
 assert.equal(bis.filter(x=>x.icon_evidence).length,32);
 assert.equal(bis.filter(x=>x.icon_catalogue_reference).length,47);
 for(const row of bis){
  const r=row.icon_catalogue_reference;
  if(!r)continue;
  assert.equal(r.item_id,row.id);
  assert.equal(r.item_name,row.name);
  assert.ok(r.file.startsWith("data/"));
 }
});
