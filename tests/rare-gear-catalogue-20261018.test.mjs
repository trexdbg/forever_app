import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const db=JSON.parse(read("data/items-forever.json")),cache=JSON.parse(read("data/items-forever-cache.json")),rares=JSON.parse(read("data/rares.json"));
const ids=[1965,4854,18610,18612,263015,277213,282716,284174,284287,284386,285269,285328,285345,285346,285350,286533,286534,286537,286746,286749,286750,286755];
const items=new Map(db.items.map(i=>[i.id,i]));
const drops=new Map(rares.rares.flatMap(r=>(r.loot||[]).filter(l=>l.source_version==="forever_beta").map(l=>[l.item_id,{r,l}])));

test("22 sourced Forever rare equipment entries add unique and accurately copied item facts",()=>{
 assert.equal(db.items.length,174);
 assert.equal(new Set(db.items.map(i=>i.id)).size,174);
 assert.equal(ids.length,22);
 for(const id of ids){
  const i=items.get(id),record=drops.get(id);
  assert.ok(i&&record,"Item not linked to documented rare: "+id);
  assert.ok(!cache.items.some(x=>x.id===id),"Item duplicated from beta archive: "+id);
  assert.equal(i.name,record.l.name.en);
  assert.equal(i.itemLevel,record.l.item_level);
  assert.equal(i.requiredLevel,record.l.required_level);
  assert.equal(i.url,record.l.item_source_url);
  assert.equal(i.evidence_level,"documented_forever");
  assert.equal(i.evidence_kind,"forever_community_page");
  assert.equal(i.evidence_url,i.source_url);
  assert.equal(i.observed_at,record.l.observed_at);
  assert.equal(i.observed_build,"unknown");
  assert.equal(i.quality,null);
  assert.equal(i.verified_forever,false);
  assert.equal(i.origin,"Rare signalé : "+record.r.name.fr);
  assert.equal(i.origin_en,"Reported rare: "+record.r.name.en);
  assert.ok(i.tooltip.includes(record.l.stats.en));
  assert.match(i.evidence_note,/not a verified in-game drop or rate/i);
 }
});
test("equipment search renders reported rare names in FR/EN and excludes non-equipment",()=>{
 assert.match(read("assets/items-v3.js"),/en&&i\.origin_en\?i\.origin_en:displayOrigin\(i\.origin\)/);
 assert.match(read("assets/gear-data.js"),/items-forever\.json\?v=20261018-rare-gear-22/);
 for(const id of [18610,1965,282716,286750,286755])assert.ok(ids.includes(id),String(id));
 for(const id of [5179,248004,247862,284666,284165,255007,284400])assert.ok(!ids.includes(id),String(id));
 assert.equal(rares.rares.flatMap(r=>r.loot).length,114);
});