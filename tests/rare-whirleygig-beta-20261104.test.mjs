import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {auditRareLocations} from "../scripts/validate-rare-locations.mjs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";
const read=file=>JSON.parse(readFileSync(new URL("../data/"+file,import.meta.url),"utf8"));
const db=read("rares.json"),index=read("item-acquisition-index.json");
const rare=db.rares.find(r=>r.id==="5836");

test("Engineer Whirleygig's documented beta supply stash uses exact source and item identity",()=>{
 assert.equal(rare.name.en,"Engineer Whirleygig");
 assert.equal(rare.name.fr,"Ingénieur Tournevis");
 assert.equal(rare.zone,"barrens");
 assert.equal(rare.level,19);
 assert.equal(rare.loot.length,1);
 const drop=rare.loot[0];
 assert.equal(drop.item_id,285366);
 assert.equal(drop.name.en,"Whirleygig's Supply Stash");
 assert.equal(drop.name_fr_status,"unverified_fallback_english");
 assert.equal(drop.item_level,1);
 assert.equal(drop.required_level,1);
 assert.equal(drop.source_version,"forever_beta");
 assert.equal(drop.evidence_level,"documented_forever");
 assert.equal(drop.evidence_kind,"forever_community_page");
 assert.equal(drop.observed_at,"2026-11-04");
 assert.equal(drop.observed_build,"unknown");
 assert.equal(drop.evidence_url,"https://foreverchanges.pro/rares");
 assert.equal(drop.item_source_url,"https://www.stillsixty.com/item/285366");
 assert.match(drop.evidence_note,/2026-10-24/);
 assert.match(drop.evidence_note,/not a personally verified screenshot/);
 assert.equal(drop.chance_classic_percent,null);
 assert.equal(drop.chance_forever_observed_percent,null);
 assert.equal(rare.seen_forever,false,"A beta report cannot assert live launch presence");
});
test("Forever beta 56.2/8.4 replaces old Classic 56.2/8.8 without losing original uncertainty",()=>{
 assert.deepEqual(rare.points,[[56.2,8.4]]);
 assert.equal(rare.coordinate_status,"documented_forever");
 assert.equal(rare.location_review.location_status,rare.coordinate_status);
 assert.equal(rare.location_review.zone_evidence_level,"documented_forever");
 assert.equal(rare.location_review.forever_presence,"community_report_not_firsthand_gameplay_confirmed");
 assert.deepEqual(rare.location_review.historical_classic_waypoint.coordinates,[56.2,8.8]);
 assert.equal(rare.location_review.historical_classic_waypoint.point_evidence.evidence_level,"unverified");
 const p=rare.point_evidence[0];
 assert.deepEqual(p.coordinates,rare.points[0]);
 assert.equal(p.origin,"forever_community_report");
 assert.equal(p.zone,"barrens");
 assert.equal(p.uiMapID,1413);
 assert.equal(p.evidence_level,"documented_forever");
 assert.equal(p.evidence_kind,"forever_community_page");
 assert.equal(p.observed_build,"unknown");
 assert.equal(p.observed_at,"2026-11-04");
 assert.match(p.evidence_note,/not a guaranteed live spawn/);
 assert.equal(p.source_url,"https://www.60.tools/guides/rares");
 assert.equal(p.evidence_url,"https://foreverchanges.pro/rares");
 assert.equal(auditRareLocations(db).errorCount,0);
 assert.equal(rare.respawn_min_hours,2);
 assert.equal(rare.respawn_max_hours,3);
});
test("Whirleygig acquisition is exactly one documentary rare link, preserving Ghostfang uncertainty",()=>{
 const linked=index.items.find(x=>x.id===285366);
 assert.ok(linked);
 assert.equal(linked.sources.length,1);
 assert.deepEqual(linked.sources[0],{
  kind:"rare",name_fr:"Ingénieur Tournevis",name_en:"Engineer Whirleygig",
  href:"/rare/?zone=barrens&q=Engineer%20Whirleygig&level=all",
  evidence_level:"documented_forever",source_status:"forever_beta_rare_loot",
  reference_url:"https://foreverchanges.pro/rares"
 });
 assert.deepEqual(index,buildFromFiles());
 assert.ok(!index.items.some(x=>x.id===286751),"Ghostfang #286751 remains a disputed candidate, not a confirmed linked drop");
 const scoped=db.rares.filter(x=>x.beta_level30_in_scope);
 assert.equal(scoped.filter(x=>x.loot.length>0).length,92);
 assert.equal(scoped.filter(x=>!x.loot.length).length,69);
});
