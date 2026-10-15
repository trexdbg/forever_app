import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {auditRareLocations,waypointFor} from "../scripts/validate-rare-locations.mjs";

const path=new URL("../data/rares.json",import.meta.url);
const db=JSON.parse(readFileSync(path,"utf8"));
const pick=name=>{
  const rare=db.rares.find(r=>r.name.en===name&&r.beta_level30_in_scope);
  assert.ok(rare,name);
  return structuredClone({zones:{[rare.zone]:db.zones[rare.zone]},coordinate_system:db.coordinate_system,rares:[rare]});
};
const codes=data=>auditRareLocations(data).issues.map(x=>x.code);
const edited=(name,fn)=>{const data=pick(name);fn(data.rares[0],data);return codes(data)};

test("legacy 150 rares retain provenance; 11 newly evidenced exact-level Forever rares expand numeric scope",()=>{
  const report=auditRareLocations(db);
  assert.deepEqual(report.issues,[]);
  assert.equal(report.counts.scoped,161);
  assert.equal(report.counts.points,345);
  assert.equal(report.counts.classic_indicative,309);
  assert.equal(report.counts.classic_sourced,17);
  assert.equal(report.counts.forever_documented,36);
  assert.equal(report.counts.forever_confirmed,0);
  assert.equal(report.counts.without_points,6);
  assert.equal(report.counts.instance_without_points,4);
  assert.equal(db.rares.filter(r=>r.beta_level30_in_scope&&r.location_review.initially_without_point).length,25);
});
test("all representative states remain distinct",()=>{
  for(const name of ["Vultros","Foreman Rigger","Sister Rathtalon","Bruegal Ironknuckle"])
    assert.deepEqual(codes(pick(name)),[],name);
  assert.equal(pick("Vultros").rares[0].coordinate_status,"classic_reference");
  assert.equal(pick("Foreman Rigger").rares[0].coordinate_status,"documented_forever");
  assert.equal(pick("Sister Rathtalon").rares[0].coordinate_status,"zone_only_unverified");
  assert.equal(pick("Bruegal Ironknuckle").rares[0].coordinate_status,"instance_map_required");
});
test("mismatched numeric rare ID is rejected",()=>{
  assert.ok(edited("Foreman Rigger",r=>{r.location_review.classic_numeric_id_reference=-1}).includes("UNPROVEN_NUMERIC_ID"));
  assert.ok(edited("Foreman Rigger",r=>{r.location_review.classic_numeric_id_reference=99999}).includes("NUMERIC_REFERENCE_URL_MISMATCH"));
});
test("unknown zone or contradictory uiMapID is rejected",()=>{
  assert.ok(edited("Foreman Rigger",r=>{r.zone="unknown"}).includes("UNKNOWN_RARE_ZONE"));
  assert.ok(edited("Foreman Rigger",r=>{r.point_evidence[0].uiMapID=1413}).includes("POINT_ZONE_MISMATCH"));
  assert.ok(edited("Foreman Rigger",r=>{r.location_review.uiMapID=1413}).includes("MAP_ID_MISMATCH"));
});
test("out-of-bounds coordinates are rejected",()=>{
  assert.ok(edited("Foreman Rigger",r=>{r.points[0]=[101,0];r.point_evidence[0].coordinates=[101,0]}).includes("INVALID_RARE_COORDINATES"));
  assert.ok(edited("Foreman Rigger",r=>{r.points[0]=[-1,40]}).includes("INVALID_RARE_COORDINATES"));
});
test("source and date and build must match Forever documentation claim",()=>{
  assert.ok(edited("Foreman Rigger",r=>{delete r.point_evidence[0].evidence_url}).includes("INCOMPLETE_POINT_PROOF"));
  assert.ok(edited("Foreman Rigger",r=>{r.point_evidence[0].observed_at="2026-02-30"}).includes("INCOMPLETE_POINT_PROOF"));
  assert.ok(edited("Foreman Rigger",r=>{r.point_evidence[0].observed_build="wrong"}).includes("FOREVER_PROVENANCE_MISMATCH"));
});
test("a single point cannot borrow another point's coordinates or zone proof",()=>{
  assert.ok(edited("Foreman Rigger",r=>{r.point_evidence[0].coordinates=r.points[1]}).includes("POINT_EVIDENCE_MISMATCH"));
  assert.ok(edited("Foreman Rigger",r=>{r.point_evidence.pop()}).includes("MISSING_POINT_PROVENANCE"));
});
test("seen_forever does not certify any historical Classic coordinate",()=>{
  const d=pick("Snort the Heckler");
  assert.equal(d.rares[0].seen_forever,true);
  assert.equal(d.rares[0].point_evidence[0].evidence_level,"unverified");
  assert.deepEqual(codes(d),[]);
  d.rares[0].coordinate_status="confirmed_in_game";
  d.rares[0].location_review.location_status="confirmed_in_game";
  assert.ok(codes(d).includes("CLASSIC_POINT_STATUS_MISMATCH"));
  assert.ok(codes(d).includes("PROMOTED_WITHOUT_GAMEPLAY"));
});
test("gameplay confirmation cannot be substituted with a community page",()=>{
  const problem=edited("Foreman Rigger",r=>{
    r.coordinate_status="confirmed_in_game";
    r.location_review.location_status="confirmed_in_game";
    r.point_evidence.forEach(e=>{e.evidence_level="confirmed_in_game";e.evidence_kind="forever_community_page"});
  });
  assert.ok(problem.includes("INCOMPLETE_POINT_PROOF"));
  assert.ok(problem.includes("INVALID_FOREVER_BUILD"));
  assert.ok(problem.includes("NO_DIRECT_GAMEPLAY_PROOF"));
});
test("source conflict cannot quietly produce a Forever pin",()=>{
  const data=pick("Sister Rathtalon");
  assert.ok(data.rares[0].location_review.conflict_sources.length===2);
  data.rares[0].location_review.conflict_sources=[];
  assert.ok(edited("Sister Rathtalon",r=>{r.location_review.conflict_sources=null}).includes("UNRESOLVED_CONFLICT_MISSING_SOURCES"));
  assert.equal(waypointFor(data.rares[0]),null);
  assert.ok(edited("Sister Rathtalon",r=>{r.points=[[96,75]];r.point_evidence=[{coordinates:[96,75]}]}).includes("UNRESOLVED_CONFLICT_WITH_PIN"));
  assert.ok(edited("Akkrilus",r=>{delete r.location_review.conflict_note.fr}).includes("MISSING_CONFLICT_TRANSLATION"));
});
test("instance rares cannot be put on outdoor maps",()=>{
  assert.ok(edited("Bruegal Ironknuckle",r=>{r.points=[[55,50]];r.point_evidence=[{coordinates:[55,50]}]}).includes("INSTANCE_OUTDOOR_PIN"));
  assert.equal(waypointFor(pick("Bruegal Ironknuckle").rares[0]),null);
});
test("waypoint works only with real coordinates, not a zone-only claim",()=>{
  assert.equal(waypointFor(pick("Sister Rathtalon").rares[0]),null);
  assert.equal(waypointFor({points:[[101,20]]}),null);
  assert.equal(waypointFor(pick("Foreman Rigger").rares[0]),"/way 65.2 52.8");
});
test("UI still guards /way button behind existing points and labels confidence",()=>{
  const js=readFileSync(new URL("../assets/rares.js",import.meta.url),"utf8");
  assert.match(js,/if\(r\.points\.length\).*rare-copy/);
  assert.match(js,/documented_forever/);
  assert.match(js,/Classic/);
});
