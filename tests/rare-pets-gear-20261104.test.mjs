import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";

const read=file=>JSON.parse(readFileSync(new URL("../data/"+file,import.meta.url),"utf8"));
const catalog=read("rares.json"),acquisition=read("item-acquisition-index.json");
const cases=[
 {rare:"darkshore-licillin",item:284173,en:"Impcaster's Staff",fr:"Impcaster's Staff",level:16,requires:11,source:"https://www.wowhead.com/forever/item=284173/impcasters-staff",zone:"darkshore"},
 {rare:"loch-modan-lord-condar",item:282637,en:"Shaking Egg",fr:"Œuf tremblant",level:21,requires:null,source:"https://www.wowhead.com/forever/guide/collections/pets-locations-sources",zone:"loch-modan"},
 {rare:"2172",item:284176,en:"Tallstrider Hatchling",fr:"Jeune haut-trotteur",level:50,requires:null,source:"https://www.wowhead.com/forever/guide/collections/pets-locations-sources",zone:"darkshore"},
 {rare:"7017",item:284177,en:"Sinslayer's Smasher",fr:"Sinslayer's Smasher",level:18,requires:13,source:"https://warcraft.wiki.gg/wiki/Sinslayer%27s_Smasher",zone:"darkshore"}
];
test("four exact rare/item identities document Forever beta sources without claiming live launch loot",()=>{
 assert.equal(new Set(cases.map(x=>x.item)).size,4);
 for(const expected of cases){
  const rare=catalog.rares.find(x=>x.id===expected.rare);
  assert.ok(rare,expected.rare);
  assert.equal(rare.zone,expected.zone);
  assert.equal(rare.beta_level30_in_scope,true);
  assert.equal(rare.loot.length,1);
  assert.equal(rare.loot_coverage,"notable_only_not_complete");
  assert.equal(rare.seen_forever,false,"Do not infer a confirmed server encounter from a document");
  const loot=rare.loot[0];
  assert.equal(loot.item_id,expected.item);
  assert.equal(loot.name.en,expected.en);
  assert.equal(loot.name.fr,expected.fr);
  assert.equal(loot.item_level,expected.level);
  assert.equal(loot.required_level??null,expected.requires);
  assert.equal(loot.source_version,"forever_beta");
  assert.equal(loot.source_url,expected.source);
  assert.equal(loot.evidence_level,"documented_forever");
  assert.equal(loot.evidence_kind,"forever_community_page");
  assert.equal(loot.observed_at,"2026-11-04");
  assert.equal(loot.observed_build,"unknown");
  assert.equal(loot.chance_classic_percent,null);
  assert.equal(loot.chance_forever_observed_percent,null);
  assert.ok(!("chance_forever_percent" in loot));
  assert.match(loot.item_source_url,/^https:\/\//);
  assert.match(loot.evidence_url,/^https:\/\//);
  assert.ok(loot.evidence_note.length>130);
  assert.equal(rare.coordinate_status,"classic_reference","Loot documentation cannot validate a Classic coordinate");
  assert.equal(rare.location_review.location_status,"classic_reference");
  assert.ok(rare.point_evidence.every(p=>p.evidence_level==="unverified"||p.evidence_level==="classic_reference"));
 }
});
test("documented French companion labels are kept, untranslated weapon names remain explicit fallback",()=>{
 for(const item of [282637,284176]){
   const loot=catalog.rares.find(r=>r.loot.some(x=>x.item_id===item)).loot[0];
   assert.equal(loot.name_fr_status,"documented_forever");
   assert.notEqual(loot.name.fr,loot.name.en);
   assert.equal(loot.required_level,undefined,"Companion item level is not a required player level");
 }
 for(const item of [284173,284177]){
   const loot=catalog.rares.find(r=>r.loot.some(x=>x.item_id===item)).loot[0];
   assert.equal(loot.name_fr_status,"unverified_fallback_english");
   assert.equal(loot.name.fr,loot.name.en);
 }
});
test("equipment and collectible rare sources are linked by ID and the whole index remains reproducible",()=>{
 for(const expected of cases){
  const linked=acquisition.items.find(x=>x.id===expected.item);
  assert.ok(linked,expected.item);
  const source=linked.sources.find(s=>s.kind==="rare");
  assert.ok(source);
  assert.equal(source.evidence_level,"documented_forever");
  assert.equal(source.source_status,"forever_beta_rare_loot");
  assert.equal(source.reference_url,expected.source);
  assert.equal(source.name_en,catalog.rares.find(r=>r.id===expected.rare).name.en);
 }
 assert.deepEqual(acquisition,buildFromFiles());
 const scoped=catalog.rares.filter(r=>r.beta_level30_in_scope);
 assert.equal(scoped.filter(r=>r.loot.length>0).length,96);
 assert.equal(scoped.filter(r=>!r.loot.length).length,65);
 assert.equal(catalog.rares.reduce((n,r)=>n+r.loot.length,0),142);
 assert.equal(acquisition.totals.unique_items,758);
 assert.equal(acquisition.totals.relations,1284);
 const ghost=catalog.rares.find(r=>r.id==="forever-dun-morogh-ghostfang");
 assert.deepEqual(ghost.loot,[],"Conflicting Ghostfang source stays unverified");
});
