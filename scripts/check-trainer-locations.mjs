#!/usr/bin/env node
/* Agent 03 / issue #51: offline, read-only checks of trainer waypoints and
 * their evidence; this does not claim verification in a live Forever client. */
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const object=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const validUrl=x=>typeof x==="string"&&/^https:\/\/[^\s/]+/.test(x);
const percentage=x=>Number.isFinite(x)&&x>=0&&x<=100;
const date=x=>typeof x==="string"&&/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(x)&&!Number.isNaN(Date.parse(x));
const levels=["confirmed_in_game","documented_forever","classic_reference","datamined","unverified"];
const statuses=["forever_guide_waypoint","forever_guides_classic_waypoint_not_ingame_verified","classic_reference_unverified","forever_profession_guide_zone_only","forever_zone_only"];
const coordKey=n=>[n.name,n.profession,n.zone?.id].join("|");
const clone=x=>JSON.parse(JSON.stringify(x));
export function auditTrainerLocations(db) {
  const issues=[];
  const report=(severity,code,path,message)=>issues.push({severity,code,path,message});
  const error=(code,path,msg)=>report("error",code,path,msg);
  const warn=(code,path,msg)=>report("warning",code,path,msg);
  const trainers=(db?.npcs||[]).filter(x=>x?.role==="trainer");
  const maps=db?.zone_maps||{};
  const seen=new Set();
  const tally={total:trainers.length,positioned:0,unknown:0,
    positionEvidence:0,documentedForeverPoints:0,confirmedInGamePoints:0,
    legacyPoints:0,legacyClassicOrImported:0,existingForeverGuidePoints:0,
    statuses:{},professions:{},zones:{}};
  for(const [i,n] of trainers.entries()){
    const path="trainer["+i+"] "+n.name;
    const key=coordKey(n);
    if(seen.has(key))error("TRAINER_IDENTITY_COLLISION",path,key);
    seen.add(key);
    const status=n.coordinate_status;
    tally.statuses[status]=(tally.statuses[status]||0)+1;
    const profession=n.profession||"unknown";
    const prof=tally.professions[profession]||(tally.professions[profession]={total:0,positioned:0,documented:0});
    prof.total++;
    const zone=n.zone?.id;
    const z=tally.zones[zone]||(tally.zones[zone]={total:0,positioned:0});
    z.total++;
    if(!statuses.includes(status))error("LOCATION_STATUS_UNKNOWN",path,status);
    const map=maps[zone];
    if(!Number.isInteger(map?.uiMapID)||map.uiMapID<=0)error("LOCATION_MAP_UNKNOWN",path,"No valid zone mapping: "+zone);
    if(n.coordinates===null||n.coordinates===undefined){
      tally.unknown++;
      if(n.location_evidence?.evidence_level==="documented_forever"||n.location_evidence?.evidence_level==="confirmed_in_game")
        error("LOCATION_ASSERTION_WITHOUT_COORDINATES",path,"Positive waypoint assertion but no coordinates");
      if(n.coordinate_status==="forever_guide_waypoint")
        error("WAYPOINT_STATUS_WITHOUT_POINT",path,"A waypoint status requires a point");
      continue;
    }
    tally.positioned++;prof.positioned++;z.positioned++;
    const point=n.coordinates;
    if(!object(point)||!percentage(point.x)||!percentage(point.y))
      error("LOCATION_COORDINATES_INVALID",path,"Expected zone percentage x/y in 0..100");
    const ev=n.location_evidence;
    if(!ev){
      tally.legacyPoints++;
      if(status==="forever_guides_classic_waypoint_not_ingame_verified"||status==="classic_reference_unverified")
        tally.legacyClassicOrImported++;
      else if(status==="forever_guide_waypoint")tally.existingForeverGuidePoints++;
      warn("LOCATION_LEGACY_EVIDENCE",path,"Historical point retained with source status; no per-point proof object");
      continue;
    }
    tally.positionEvidence++;
    if(!object(ev)){error("LOCATION_EVIDENCE_MALFORMED",path,"Expected evidence object");continue;}
    if(!levels.includes(ev.evidence_level))error("LOCATION_EVIDENCE_LEVEL_INVALID",path,"Invalid evidence level");
    if(!validUrl(ev.source_url)||!validUrl(ev.evidence_url))
      error("LOCATION_PROVENANCE_URL_INVALID",path,"HTTPS source and precise evidence URL required");
    if(!date(ev.observed_at))error("LOCATION_PROVENANCE_DATE_INVALID",path,"Actual consultation/capture date required");
    if(typeof ev.observed_build!=="string"||!ev.observed_build.trim())
      error("LOCATION_PROVENANCE_BUILD_MISSING",path,"Build or explicit unknown required");
    if(typeof ev.evidence_note!=="string"||ev.evidence_note.length<40)
      error("LOCATION_PROVENANCE_NOTE_MISSING",path,"Describe precise waypoint and its limits");
    if(ev.coordinate_system!=="zone_percent_0_100"||ev.zone_id!==zone||ev.ui_map_id!==map?.uiMapID)
      error("LOCATION_PROVENANCE_MAP_CONFLICT",path,"Evidence map/zone mismatch");
    if(ev.source_url!==n.coordinate_source)
      error("LOCATION_EVIDENCE_SOURCE_CONFLICT",path,"Point source must be linked, not another NPC-level source");
    if(Array.isArray(ev.conflicting_waypoints)&&ev.conflicting_waypoints.length)
      error("LOCATION_CONFLICT_UNRESOLVED",path,"Conflicting sources: do not choose a waypoint");
    if(ev.evidence_level==="documented_forever"){
      tally.documentedForeverPoints++;prof.documented++;
      if(status!=="forever_guide_waypoint")
        error("LOCATION_STATUS_OVERRATED",path,"Documented guide point cannot claim in-game confirmation");
      if(ev.evidence_kind!=="forever_community_page"&&ev.evidence_kind!=="forever_official_page")
        error("LOCATION_KIND_MISMATCH",path,"Forever document needs correct evidence kind");
      if(!(/\/forever\//.test(ev.source_url||"")||/\/wow-forever\//.test(ev.source_url||"")))
        error("LOCATION_CLASSIC_AS_FOREVER",path,"The location source must explicitly concern Forever");
      if(ev.evidence_note&&!/not.*(gameplay|game|in-game)|non.*confirm|not.*confirmed/i.test(ev.evidence_note))
        error("LOCATION_CERTAINTY_OVERSTATED",path,"Documented source needs an in-game caveat");
    }else if(ev.evidence_level==="confirmed_in_game"){
      tally.confirmedInGamePoints++;
      if(!["gameplay_capture","gameplay_log"].includes(ev.evidence_kind)||ev.observed_build==="unknown"||!validUrl(ev.evidence_url))
        error("LOCATION_INGAME_PROOF_MISSING",path,"In-game must have captured evidence, a concrete build and correct evidence type");
    }else if(ev.evidence_level==="classic_reference"&&status==="forever_guide_waypoint")
      error("LOCATION_CLASSIC_AS_FOREVER",path,"Classic waypoint is not a documented Forever waypoint");
  }
  return {issues,errorCount:issues.filter(x=>x.severity==="error").length,
    warningCount:issues.filter(x=>x.severity==="warning").length,summary:tally};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
  const db=JSON.parse(readFileSync(resolve(root,"data/npcs.json"),"utf8"));
  const report=auditTrainerLocations(db);
  if(process.argv.includes("--json"))console.log(JSON.stringify(report,null,2));
  else {
    console.log(JSON.stringify({summary:report.summary,errors:report.errorCount,warnings:report.warningCount},null,2));
    for(const i of report.issues.filter(x=>x.severity==="error"))console.error(i.code,i.path,i.message);
  }
  if(report.errorCount)process.exitCode=1;
}
