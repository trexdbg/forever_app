import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const rare=JSON.parse(readFileSync(new URL("../data/rares.json",import.meta.url),"utf8"));
const rows=rare.rares.flatMap(r=>(r.loot||[]).map(item=>({rare:r,item})));
test("historical Classic loot provenance is explicit and never upgraded to Forever",()=>{
 assert.equal(rare.rares.length,378);
 const classic=rows.filter(({item})=>item.source_version==="classic_reference");
 const forever=rows.filter(({item})=>item.source_version==="forever_beta");
 assert.ok(classic.length>=77);
 assert.ok(forever.length>=40);
 for(const {rare:r,item} of classic){
  assert.equal(item.evidence_level,"classic_reference",
     r.id+" / "+item.item_id+": Classic source is not a Forever observation");
  assert.equal(item.source_version,"classic_reference");
  assert.ok(typeof item.source_url==="string"&&item.source_url.startsWith("https://"));
 }
 for(const {rare:r,item} of forever){
  assert.ok(["documented_forever","confirmed_in_game"].includes(item.evidence_level),
    r.id+" / "+item.item_id+" has no Forever documentary evidence");
 }
 assert.equal(rows.filter(({item})=>!item.evidence_level).length,0);
});
test("Classic droprate remains historic, not a claimed Forever observed probability",()=>{
 const classic=rows.filter(({item})=>item.source_version==="classic_reference");
 assert.ok(classic.some(({item})=>Number.isFinite(item.chance_classic_percent)));
 for(const {item} of classic){
  assert.equal(item.chance_forever_observed_percent,undefined);
  assert.equal(item.evidence_level,"classic_reference");
 }
});
