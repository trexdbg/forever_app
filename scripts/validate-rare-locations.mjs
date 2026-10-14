#!/usr/bin/env node
/**
 * Offline, per-point quality gate for rare maps (issue #52).
 * It does not fetch URLs or turn Classic/cache references into in-game proof.
 */
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

export const EVIDENCE_LEVELS = new Set(["unverified","classic_reference","documented_forever","datamined","confirmed_in_game"]);
const kinds = {
  classic_reference:new Set(["classic_database","classic_guide"]),
  documented_forever:new Set(["forever_official_page","forever_community_page"]),
  confirmed_in_game:new Set(["gameplay_capture","gameplay_log"]),
  datamined:new Set(["client_db2","addon_snapshot","cache_snapshot"])
};
const validPct = v=>typeof v==="number"&&Number.isFinite(v)&&v>=0&&v<=100;
const https = v=>typeof v==="string"&&/^https:\/\/[^\s/]+\//.test(v);
const validDate = d=>{
  if(typeof d!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(d))return false;
  const x=new Date(d+"T00:00:00Z");
  return !Number.isNaN(x.getTime())&&x.toISOString().slice(0,10)===d;
};
const validBuild = s=>typeof s==="string"&&/^1\.\d+\.\d+\.\d+$/.test(s);

export function waypointFor(rare) {
  const p=rare?.points?.[0];
  return Array.isArray(p)&&p.length===2&&p.every(validPct)?"/way "+p[0]+" "+p[1]:null;
}

export function auditRareLocations(db) {
  const issues=[],count={scoped:0,with_points:0,without_points:0,instance_without_points:0,
    points:0,classic_indicative:0,classic_sourced:0,forever_documented:0,forever_confirmed:0,forever_unknown:0};
  const add=(code,path,message)=>issues.push({code,path,message});
  if(!db||!db.zones||!Array.isArray(db.rares))return {issues:[{code:"INVALID_CATALOG",path:"data/rares.json",message:"zones/rares required"}],counts:count,errorCount:1};
  const ids=new Set();
  for(const [i,r] of db.rares.entries()) {
    if(!r.beta_level30_in_scope)continue;
    count.scoped++;
    const path="rares["+i+"]",z=db.zones[r.zone],review=r.location_review;
    if(ids.has(String(r.id)))add("DUPLICATE_RARE_ID",path,"Duplicate rare identity");ids.add(String(r.id));
    if(!z)add("UNKNOWN_RARE_ZONE",path+".zone","Zone key is not present in catalogue");
    if(!Number.isFinite(r.level)||r.level<1||r.level>30)add("INVALID_SCOPE_LEVEL",path+".level","Level 1–30 only (scope eligibility is not live presence)");
    if(!r.name||!r.name.fr||!r.name.en)add("MISSING_RARE_NAME",path+".name","FR and EN names required");
    if(!Array.isArray(r.points)){add("INVALID_POINTS",path+".points","Expected array of points");continue}
    if(r.points.length)count.with_points++;else count.without_points++;
    if(!review||typeof review!=="object"){add("MISSING_LOCATION_AUDIT",path,"Per-rare location review required");continue}
    if(review.zone!==r.zone||review.uiMapID!==z?.uiMapID)add("MAP_ID_MISMATCH",path+".location_review","Zone and uiMapID must match zone map");
    if(review.coordinate_system!==db.coordinate_system)add("COORDINATE_SYSTEM_MISMATCH",path,"Expected zone percentage coordinate system");
    if(review.map_kind!==(z?.instance?"instance":"outdoor"))add("MAP_KIND_MISMATCH",path,"Instance versus outdoor mismatch");
    if(!review.scope_reason||!review.identity_status||!review.evidence_note||!review.forever_presence)add("INCOMPLETE_LOCATION_AUDIT",path,"Reason, identity, evidence and Forever presence required");
    if(!validDate(review.reviewed_at))add("INVALID_REVIEW_DATE",path,"Review date required");
    if(review.identity_status==="classic_numeric_id_reference_only"&&(!Number.isInteger(review.classic_numeric_id_reference)||review.classic_numeric_id_reference<=0||!https(review.identity_reference_url)))
      add("UNPROVEN_NUMERIC_ID",path,"Numeric reference needs ID and original source");
    if(review.identity_status==="classic_numeric_id_reference_only"){
      const match=String(review.identity_reference_url||"").match(/(?:\/rare\/|\/npc(?:=|%3D))(\d+)/i);
      if(match&&Number(match[1])!==review.classic_numeric_id_reference)add("NUMERIC_REFERENCE_URL_MISMATCH",path,"Numeric reference must agree with the linked source URL");
      if(/^\d+$/.test(String(r.id))&&Number(r.id)!==review.classic_numeric_id_reference)add("NUMERIC_RARE_ID_MISMATCH",path,"Catalog ID contradicts linked Classic numeric ID");
    }
    if(!review.faction_status)add("MISSING_FACTION_REVIEW",path,"Faction must remain explicitly unknown or individually sourced");
    if(review.location_status!==r.coordinate_status)add("LOCATION_STATUS_MISMATCH",path,"Review and rare coordinate status disagree");
    if(!Array.isArray(r.point_evidence)||r.point_evidence.length!==r.points.length) {
      add("MISSING_POINT_PROVENANCE",path+".point_evidence","One evidence entry per exact coordinate, including legacy Classic");
      continue;
    }
    if(z?.instance&&r.points.length)add("INSTANCE_OUTDOOR_PIN",path,"Instance requires floor map, not outdoor /way");
    if(!r.points.length){
      if(review.location_status!==(z?.instance?"instance_map_required":"zone_only_unverified"))add("EMPTY_POINT_STATUS_MISMATCH",path,"Missing locations cannot be confirmed/documented");
      if(z?.instance)count.instance_without_points++;
      if(waypointFor(r)!==null)add("WAYPOINT_WITHOUT_POINT",path,"No waypoint from an empty coordinate list");
    }
    const levels=new Set();
    for(const [j,p] of r.points.entries()){
      const pp=path+".points["+j+"]",e=r.point_evidence[j];
      count.points++;
      if(!Array.isArray(p)||p.length!==2||!p.every(validPct))add("INVALID_RARE_COORDINATES",pp,"Coordinates must have valid 0–100 X/Y");
      if(!e||typeof e!=="object"){add("MISSING_POINT_EVIDENCE",pp,"Per-point source required");continue}
      if(!Array.isArray(e.coordinates)||e.coordinates.length!==2||e.coordinates.some((v,k)=>v!==p[k]))
        add("POINT_EVIDENCE_MISMATCH",pp,"Evidence must refer to this exact indexed point");
      if(e.zone!==r.zone||e.uiMapID!==z?.uiMapID)add("POINT_ZONE_MISMATCH",pp,"Evidence zone and map id must match rare");
      if(e.coordinate_system!==db.coordinate_system)add("POINT_COORDINATE_SYSTEM_MISMATCH",pp,"Evidence must specify zone percentage coordinates");
      if(!EVIDENCE_LEVELS.has(e.evidence_level))add("INVALID_EVIDENCE_LEVEL",pp,"Unsupported evidence level");
      levels.add(e.evidence_level);
      if(typeof e.evidence_note!=="string"||e.evidence_note.trim().length<15)add("INSUFFICIENT_EVIDENCE_NOTE",pp,"Describe exact claim and limits");
      if(e.evidence_level==="unverified"){
        count.classic_indicative++;
        if(e.origin!=="classic_reference")add("UNVERIFIED_ORIGIN_MISMATCH",pp,"Legacy coordinates must remain Classic indicative");
        if(e.source_url||e.evidence_url||e.observed_at) add("UNKNOWN_WITH_POSITIVE_SOURCE",pp,"Do not attach unverifiable positive provenance to legacy point");
      }else{
        if(!https(e.source_url)||!https(e.evidence_url)||!validDate(e.observed_at)||!e.observed_build||!kinds[e.evidence_level]?.has(e.evidence_kind))
          add("INCOMPLETE_POINT_PROOF",pp,"Source/evidence URLs, date, build, evidence kind required");
        if(["confirmed_in_game","datamined"].includes(e.evidence_level)&&!validBuild(e.observed_build))add("INVALID_FOREVER_BUILD",pp,"Direct gameplay/client needs exact build");
        if(e.evidence_level==="classic_reference"){
          count.classic_indicative++;count.classic_sourced++;
          if(e.origin!=="classic_reference"||e.observed_build==="unknown")add("CLASSIC_POINT_MISLABELLED",pp,"Classic original version must be given");
        }
        if(e.evidence_level==="documented_forever"){
          count.forever_documented++;
          if(e.origin!=="forever_community_report"||e.observed_build!=="unknown"&&!validBuild(e.observed_build))add("FOREVER_PROVENANCE_MISMATCH",pp,"Community claim must have compatible origin/build");
        }
        if(e.evidence_level==="confirmed_in_game")count.forever_confirmed++;
        if(e.evidence_level==="datamined")count.forever_unknown++;
      }
      if(e.evidence_level==="confirmed_in_game"&&e.evidence_kind!=="gameplay_capture"&&e.evidence_kind!=="gameplay_log")
        add("NO_DIRECT_GAMEPLAY_PROOF",pp,"Direct gameplay required");
    }
    if(r.points.length){
      const hasForever=levels.has("confirmed_in_game")||levels.has("documented_forever");
      if(hasForever&&![ "documented_forever","confirmed_in_game","mixed_sources"].includes(review.location_status))
        add("FOREVER_POINT_STATUS_MISMATCH",path,"Documented Forever points must be distinguished in review");
      if(!hasForever&&review.location_status!=="classic_reference")
        add("CLASSIC_POINT_STATUS_MISMATCH",path,"Classic-only points cannot be labelled Forever");
      if(review.location_status==="confirmed_in_game"&&!levels.has("confirmed_in_game"))
        add("PROMOTED_WITHOUT_GAMEPLAY",path,"Seen Forever or source URL alone is not in-game coordinate proof");
    }
    if(review.conflict&&!Array.isArray(review.conflict_sources))add("UNRESOLVED_CONFLICT_MISSING_SOURCES",path,"Conflicting zones/points must retain both sources");
    if(review.conflict&&(!review.conflict_note?.fr||!review.conflict_note?.en))add("MISSING_CONFLICT_TRANSLATION",path,"Conflicting locations need French and English explanations");
    if(review.conflict&&r.points.length&&!review.conflict_resolution)add("UNRESOLVED_CONFLICT_WITH_PIN",path,"Resolve the zone conflict with evidence before placing a point");
  }
  return {issues,counts:count,errorCount:issues.length};
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  const db=JSON.parse(readFileSync(new URL("../data/rares.json",import.meta.url),"utf8"));
  const report=auditRareLocations(db);
  console.log(JSON.stringify(report,null,2));
  if(report.errorCount)process.exitCode=1;
}
