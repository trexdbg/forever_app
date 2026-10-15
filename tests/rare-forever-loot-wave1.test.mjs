import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const catalog=JSON.parse(readFileSync(new URL("../data/rares.json",import.meta.url),"utf8"));
const expected=new Map([
 ["classic-barrens-aean-swiftriver",285347],
 ["classic-barrens-thora-feathermoon",285346],
 ["classic-barrens-hannah-bladeleaf",285348],
 ["classic-barrens-marcus-bel",285350],
 ["classic-stonetalon-taskmaster-whipfang",284386],
 ["classic-stonetalon-foreman-rigger",284400],
 ["5865",286533],["3253",286534],["5832",286537],["5822",284287],
 ["5859",285328],["darkshore-shadowclaw",284174]
]);
const https=x=>typeof x==="string"&&/^https:\/\/[^\s/]+\//.test(x);
const scoped=catalog.rares.filter(x=>x.beta_level30_in_scope&&x.reference!=="new_forever_community_documented_not_gameplay_confirmed");
test("maintains the exact 150 legacy rare catalogue and 12 first-wave Forever additions",()=>{
 assert.equal(scoped.length,150);
 const withLoot=scoped.filter(x=>x.loot.length);
 const withoutLoot=scoped.filter(x=>!x.loot.length);
 assert.equal(withLoot.length,62);
 assert.equal(withoutLoot.length,88);
 assert.equal(expected.size,12);
 for(const [id,itemId] of expected){
  const rare=scoped.find(x=>x.id===id);
  assert.ok(rare,"Missing scoped rare "+id);
  assert.equal(rare.loot.filter(x=>x.item_id===itemId).length,1,"Duplicate or missing Forever loot "+id);
  assert.equal(rare.loot_coverage,"notable_only_not_complete");
 }
});
test("every new item association is explicitly source-backed and non-guaranteed",()=>{
 for(const [id,itemId] of expected){
  const rare=scoped.find(x=>x.id===id);
  const drop=rare.loot.find(x=>x.item_id===itemId);
  assert.equal(drop.source_version,"forever_beta");
  assert.equal(drop.evidence_level,"documented_forever");
  assert.equal(drop.evidence_kind,"forever_community_page");
  assert.equal(drop.observed_at,"2026-10-14");
  assert.equal(drop.observed_build,"unknown");
  assert.ok(https(drop.source_url)&&https(drop.evidence_url)&&https(drop.item_source_url));
  assert.equal(drop.source_url,drop.evidence_url);
  assert.match(drop.item_source_url,new RegExp("(?:item=|/items/)"+itemId+"(?:\\b|$)"));
  assert.ok(drop.evidence_note.length>75);
  assert.ok(Number.isInteger(drop.item_level)&&Number.isInteger(drop.required_level));
  assert.ok(drop.required_level<=30);
  assert.equal(drop.chance_classic_percent,null);
  assert.equal(drop.chance_forever_observed_percent,null);
  assert.ok(drop.name.en && drop.name.fr);
  assert.equal(drop.name_fr_status,"unverified_fallback_english","Do not invent localized Forever labels");
  assert.ok(drop.stats?.en && drop.stats?.fr);
  assert.ok(drop.slot?.en && drop.slot?.fr);
  assert.equal(rare.seen_forever,false,"A loot listing must not prove a gameplay sighting");
  assert.equal(rare.reference,"classic_cmangos_not_forever_verified","Do not promote old Classic position");
 }
});
test("conflicting Marcus Bel attribution remains transparent and non-certifying",()=>{
 const r=scoped.find(x=>x.id==="classic-barrens-marcus-bel");
 const d=r.loot.find(x=>x.item_id===285350);
 assert.equal(d.drop_evidence,"forever_database_documented_drop_conflicting_sources");
 assert.equal(d.conflicting_source_url,"https://www.forevercraft.app/items/285350");
 assert.match(d.evidence_note,/Conflicting Forevercraft/);
 assert.equal(d.chance_forever_observed_percent,null);
});
test("Foreman Rigger is a community report rather than a verified gameplay drop",()=>{
 const r=scoped.find(x=>x.id==="classic-stonetalon-foreman-rigger");
 const d=r.loot.find(x=>x.item_id===284400);
 assert.equal(d.drop_evidence,"forever_community_report_unconfirmed");
 assert.match(d.evidence_note,/not a confirmed gameplay capture/);
 assert.ok(d.source_url.includes("stillsixty.com/rare/foreman-rigger"));
});
test("stale Classic timers and map coordinates remain unpromoted",()=>{
 for(const [id] of expected){
  const r=scoped.find(x=>x.id===id);
  assert.ok(Array.isArray(r.points));
  assert.ok(["classic_reference","documented_forever"].includes(r.location_review?.location_status));
  if(r.location_review.location_status==="classic_reference")
   assert.equal(r.location_review.forever_presence,"not_established_by_location_audit");
  for(const p of r.points)assert.ok(p.every(v=>Number.isFinite(v)&&v>=0&&v<=100));
 }
 const a=scoped.find(x=>x.id==="classic-barrens-hannah-bladeleaf");
 assert.deepEqual(a.points,[[49,80]],"Coordinate correction must remain independent of new loot");
});
test("unrelated rare records and drop source categories are preserved",()=>{
 const newItems=[...expected.values()];
 assert.equal(new Set(newItems).size,newItems.length);
 assert.equal(catalog.rares.filter(x=>x.beta_level30_in_scope===true).length,161);
 assert.equal(catalog.rares.filter(x=>x.beta_level30_in_scope&&x.reference==="new_forever_community_documented_not_gameplay_confirmed").length,11);
 assert.ok(catalog.rares.some(x=>x.id==="5828"&&x.loot.some(y=>y.item_id===285331)));
 const newLinks=scoped.flatMap(r=>r.loot.filter(l=>newItems.includes(l.item_id))).length;
 assert.equal(newLinks,12);
});