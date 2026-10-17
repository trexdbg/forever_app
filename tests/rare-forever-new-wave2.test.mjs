import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {auditRareLocations} from "../scripts/validate-rare-locations.mjs";
const load=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const db=JSON.parse(load("data/rares.json"));
const changed=db.rares.filter(r=>r.reference==="new_forever_community_documented_not_gameplay_confirmed");
const zephras=changed.filter(r=>r.zone==="zephras-isle");
const expectedLoot=new Map([
 ["259394",285269],
 ["forever-zephras-teldaeor",263015],
 ["forever-elwynn-elmpaw",247862],
 ["forever-redridge-drozem",277213],
 ["forever-tirisfal-decrepit-harvester",255007],
 ["forever-durotar-shalma",286746],
 ["forever-teldrassil-wrathvine",286749],
 ["forever-teldrassil-nightscreech",286750]
]);
const verifiedSource=value=>typeof value==="string"&&/^https:\/\/[^\s/]+\//.test(value);
test("new Forever rare discoveries are additive, deduplicated and do not rewrite the legacy 150",()=>{
 assert.equal(changed.length,24);
 assert.equal(db.rares.length,378);
 assert.equal(new Set(db.rares.map(r=>String(r.id))).size,db.rares.length);
 assert.equal(zephras.length,8);
 assert.equal(db.zones["zephras-isle"].uiMapID,2521);
 assert.ok(verifiedSource(db.zones["zephras-isle"].map_source_url));
 const scope=db.rares.filter(r=>r.beta_level30_in_scope);
 assert.equal(scope.length,161);
 assert.equal(changed.filter(r=>r.beta_level30_in_scope).length,11);
 assert.equal(changed.filter(r=>r.level===null).length,13);
 assert.equal(changed.reduce((n,r)=>n+r.points.length,0),44);
 assert.equal(changed.filter(r=>r.id!=="forever-tirisfal-the-condemned-one").reduce((n,r)=>n+r.loot.length,0),8);
});
test("all new waypoints have their own community Forever evidence without invented gameplay proof",()=>{
 for(const r of changed){
  assert.ok(db.zones[r.zone],r.id);
  assert.equal(r.seen_forever,false);
  assert.equal(r.coordinate_status,"documented_forever");
  assert.equal(r.location_review.location_status,r.coordinate_status);
  assert.equal(r.location_review.forever_presence,"community_report_not_firsthand_gameplay_confirmed");
  assert.equal(r.point_evidence.length,r.points.length);
  assert.ok(r.points.length);
  assert.equal(r.respawn_min_hours,null);
  assert.equal(r.respawn_max_hours,null);
  assert.ok(verifiedSource(r.source));
  assert.equal(r.name_fr_status,"unverified_fallback_english");
  for(let i=0;i<r.points.length;i++){
   const p=r.points[i],e=r.point_evidence[i];
   assert.deepEqual(p,e.coordinates);
   assert.equal(e.zone,r.zone);
   assert.equal(e.uiMapID,db.zones[r.zone].uiMapID);
   assert.equal(e.coordinate_system,db.coordinate_system);
   assert.equal(e.evidence_level,"documented_forever");
   assert.equal(e.origin,"forever_community_report");
   assert.equal(e.evidence_kind,"forever_community_page");
   assert.equal(e.observed_build,"unknown");
   assert.equal(e.observed_at,"2026-10-15");
   assert.ok(verifiedSource(e.source_url)&&verifiedSource(e.evidence_url));
   assert.match(e.evidence_note,/not a guaranteed live spawn/);
  }
  if(r.level===null){
   assert.equal(r.level_status,"unknown");
   assert.equal(r.level_context,"starter_zone");
   assert.equal(r.beta_level30_in_scope,false);
  }else{
   assert.ok(Number.isInteger(r.level)&&r.level>0&&r.level<=30);
   assert.equal(r.level_status,"documented_forever");
   assert.equal(r.beta_level30_in_scope,true);
  }
 }
});
test("eight new distinct Forever item rewards have exact IDs and no invented drop rates",()=>{
 for(const [id,itemID] of expectedLoot){
  const r=changed.find(x=>x.id===id);
  assert.ok(r);
  assert.equal(r.loot.length,1);
  const loot=r.loot[0];
  assert.equal(loot.item_id,itemID);
  assert.equal(loot.source_version,"forever_beta");
  assert.equal(loot.evidence_level,"documented_forever");
  assert.equal(loot.evidence_kind,"forever_community_page");
  assert.equal(loot.observed_build,"unknown");
  assert.equal(loot.chance_classic_percent,null);
  assert.equal(loot.chance_forever_observed_percent,null);
  assert.equal(loot.name_fr_status,"unverified_fallback_english");
  assert.ok(verifiedSource(loot.source_url)&&verifiedSource(loot.item_source_url));
  assert.match(loot.item_source_url,new RegExp("item="+itemID+"(?:\\b|$)"));
  assert.ok(loot.evidence_note.length>80);
 }
 assert.equal(changed.find(r=>r.id==="forever-tirisfal-decrepit-harvester").loot[0].drop_evidence,"forever_community_possible_drop");
});
test("special elite Elmpaw does not masquerade as a rare-classified creature",()=>{
 const elmpaw=changed.find(r=>r.name.en==="Elmpaw");
 assert.equal(elmpaw.classification,"elite");
 assert.equal(elmpaw.level,12);
 assert.equal(elmpaw.loot[0].item_id,247862);
});
test("all scoped points pass the original strict map validator",()=>{
 const report=auditRareLocations(db);
 assert.deepEqual(report.issues,[]);
 assert.equal(report.counts.forever_confirmed,0);
 assert.equal(report.counts.scoped,161);
 assert.equal(report.counts.forever_documented,36);
 assert.equal(report.counts.classic_indicative,309);
});
test("FR/EN browser code does not present unknown levels as zero and loads the Zephras map",()=>{
 const js=load("assets/rares.js");
 assert.match(js,/starterLevelUnknown/);
 assert.match(js,/exactLevel/);
 assert.match(js,/visibleAtBetaLevel/);
 assert.match(js,/level_context==="starter_zone"/);
 assert.match(js,/Niveau inconnu/);
 assert.match(js,/Elite \(special encounter\)/);
 assert.doesNotMatch(js,/level\.value==="low"\?r\.level<=30/);
 for(const path of ["rare/index.html","en/rare/index.html"]){
  const html=load(path);
  assert.match(html,/<option value="elite">/);
  assert.match(html,/rares\.js\?v=20261017-loot-icons-1/);
 }
});
