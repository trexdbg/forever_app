import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {auditTrainerLocations} from "../scripts/check-trainer-locations.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const db=JSON.parse(readFileSync(resolve(root,"data/npcs.json"),"utf8"));
const clone=x=>structuredClone(x);
const audit=x=>auditTrainerLocations(x);
const errors=x=>audit(x).issues.filter(i=>i.severity==="error").map(i=>i.code);
const trainer=(name)=>db.npcs.find(n=>n.role==="trainer"&&n.name===name);
const seeded=(name="Jandi")=>{
 const copy=clone(db);
 copy.npcs=copy.npcs.filter(n=>n.role==="trainer"&&n.name===name);
 return copy;
};
const mutate=(fn,name="Jandi")=>{
 const copy=seeded(name);
 fn(copy.npcs[0]);
 return copy;
};

test("153 trainers are audited, including 47 newly documented named waypoints",()=>{
 const report=audit(db);
 assert.equal(report.errorCount,0,JSON.stringify(report.issues.filter(x=>x.severity==="error")));
 assert.equal(report.summary.total,153);
 assert.equal(report.summary.positioned,153);
 assert.equal(report.summary.unknown,0);
 assert.equal(report.summary.positionEvidence,47);
 assert.equal(report.summary.documentedForeverPoints,47);
 assert.equal(report.summary.confirmedInGamePoints,0);
 assert.equal(report.summary.legacyPoints,106);
 assert.equal(report.summary.legacyClassicOrImported,81);
 assert.equal(report.summary.existingForeverGuidePoints,25);
 assert.equal(report.warningCount,106);
 for(const [trade,expected] of Object.entries({"Herboristerie":6,"Minage":5,"Dépeçage":8,"Cuisine":9,"Pêche":12,"Secourisme":7}))
   assert.equal(report.summary.professions[trade].documented,expected,trade);
});
test("representative Forever named waypoints correspond to exact profession, zone and source",()=>{
 const samples=[
 ["Jandi","Herboristerie","orgrimmar",55.6,39.6,"herbalism"],
 ["Makaru","Minage","orgrimmar",73,26.4,"mining"],
 ["Maris Granger","Dépeçage","stormwind",67.8,49,"skinning"],
 ["Cook Torka","Cuisine","durotar",51.2,42.6,"wow-forever"],
 ["Astaia","Pêche","darnassus",47.6,56.6,"fishing"],
 ["Nurse Neela","Secourisme","tirisfal",61.8,52.8,"first-aid"]
 ];
 for(const [name,trade,zone,x,y,sourceHint] of samples){
   const n=trainer(name);
   assert.ok(n,name);
   assert.equal(n.profession,trade);
   assert.equal(n.zone.id,zone);
   assert.deepEqual(n.coordinates,{x,y});
   assert.ok(n.coordinate_source.includes(sourceHint),name);
   assert.equal(n.location_evidence.evidence_level,"documented_forever");
   assert.equal(n.location_evidence.evidence_kind,"forever_community_page");
   assert.equal(n.location_evidence.observed_at,"2026-10-14");
   assert.equal(n.location_evidence.observed_build,"unknown");
   assert.equal(n.location_evidence.zone_id,zone);
   assert.equal(n.location_evidence.ui_map_id,db.zone_maps[zone].uiMapID);
   assert.match(n.location_evidence.evidence_note,/not gameplay-confirmed/i);
 }
});
test("a zone-only trainer never creates a false pin or /mappin",()=>{
 const one=mutate(n=>{
   n.coordinates=null;n.coordinate_status="forever_profession_guide_zone_only";
   delete n.location_evidence;delete n.coordinate_source;
 });
 const r=audit(one);
 assert.equal(r.errorCount,0);
 assert.equal(r.summary.unknown,1);
 assert.equal(r.summary.positioned,0);
 const ui=readFileSync(resolve(root,"assets/npcs.js"),"utf8");
 const map=readFileSync(resolve(root,"assets/npc-map.js"),"utf8");
 assert.ok(ui.includes("if(hasCoords(n)&&mapId)"),"UI command must require coordinates and map ID");
 assert.ok(map.includes('n?.coordinates&&id?'),"Map /mappin must require point and map ID");
 assert.ok(ui.includes('n.coordinate_source||n.source'),"UI must prefer precise location source");
});
test("preserves all 25 existing Zephras guide waypoints as legacy documentation",()=>{
 const zephras=db.npcs.filter(n=>n.role==="trainer"&&n.zone?.id==="zephras-isle");
 assert.equal(zephras.length,24);
 assert.ok(zephras.every(n=>n.coordinate_status==="forever_guide_waypoint"&&n.coordinates&&!n.location_evidence));
 assert.deepEqual(trainer("Nyassa Swiftdraught").coordinates,{x:43.8,y:43.6});
 assert.deepEqual(trainer("Nyalah Brightfire").coordinates,{x:60.6,y:72.6});
});
test("out-of-range coordinates cannot be published",()=>{
 assert.ok(errors(mutate(n=>n.coordinates.x=100.1)).includes("LOCATION_COORDINATES_INVALID"));
});
test("wrong map ID or zone in provenance is rejected",()=>{
 assert.ok(errors(mutate(n=>n.location_evidence.ui_map_id=777)).includes("LOCATION_PROVENANCE_MAP_CONFLICT"));
 assert.ok(errors(mutate(n=>n.location_evidence.zone_id="wrong-zone")).includes("LOCATION_PROVENANCE_MAP_CONFLICT"));
});
test("unmapped zone is a blocking error",()=>{
 assert.ok(errors(mutate(n=>n.zone.id="zone-not-in-index")).includes("LOCATION_MAP_UNKNOWN"));
});
test("source for sale is not confused with source for coordinates",()=>{
 assert.ok(errors(mutate(n=>n.coordinate_source="https://example.org/unrelated")).includes("LOCATION_EVIDENCE_SOURCE_CONFLICT"));
});
test("missing or misleading Forever evidence is rejected",()=>{
 assert.ok(errors(mutate(n=>delete n.location_evidence.evidence_url)).includes("LOCATION_PROVENANCE_URL_INVALID"));
 assert.ok(errors(mutate(n=>n.location_evidence.observed_at="2026-14-99")).includes("LOCATION_PROVENANCE_DATE_INVALID"));
 assert.ok(errors(mutate(n=>n.location_evidence.evidence_kind="classic_guide")).includes("LOCATION_KIND_MISMATCH"));
 assert.ok(errors(mutate(n=>{
   n.coordinate_source="https://www.wowhead.com/classic/guide/professions";
   n.location_evidence.source_url=n.coordinate_source;
 })).includes("LOCATION_CLASSIC_AS_FOREVER"));
});
test("a source conflict is not resolved by blindly choosing a point",()=>{
 const caseData=mutate(n=>n.location_evidence.conflicting_waypoints=[
   {x:70,y:35,source_url:"https://example.org/conflicting-capture"}
 ]);
 assert.ok(errors(caseData).includes("LOCATION_CONFLICT_UNRESOLVED"));
});
test("client row or community page alone cannot be flagged as an in-game capture",()=>{
 const actual=mutate(n=>{
   n.location_evidence.evidence_level="confirmed_in_game";
   n.location_evidence.evidence_kind="forever_community_page";
   n.location_evidence.observed_build="unknown";
 });
 assert.ok(errors(actual).includes("LOCATION_INGAME_PROOF_MISSING"));
});
test("location classified as documented Forever cannot claim certainty through legacy status",()=>{
 const caseData=mutate(n=>n.coordinate_status="classic_reference_unverified");
 assert.ok(errors(caseData).includes("LOCATION_STATUS_OVERRATED"));
});
test("all merchant offers, recipes and unrelated rare records stay out of this validator",()=>{
 assert.equal(db.npcs.filter(n=>n.role==="merchant").length,206);
 assert.ok(!Object.keys(db).includes("rares"));
 assert.equal(audit(db).summary.total,153);
});

test("119 profession directory references keep correct trainer zones and factions",()=>{
 const directory=JSON.parse(readFileSync(resolve(root,"data/professions.json"),"utf8"));
 const byName=new Map(db.npcs.filter(n=>n.role==="trainer").map(n=>[n.name,n]));
 let checked=0;
 for(const profession of directory.professions)for(const row of profession.trainers){
   const record=byName.get(row.name);
   assert.ok(record,"Unknown trainer in profession directory: "+row.name);
   assert.equal(record.faction,row.faction,row.name+" faction mismatch");
   const normalized=s=>s==="Stormwind City"?"Stormwind":s;
   assert.equal(normalized(row.zone.en),normalized(record.zone.en),row.name+" actual zone mismatch");
   checked++;
 }
 assert.equal(checked,119);
 assert.equal(byName.get("Hgarth").zone.id,"stonetalon");
 assert.equal(byName.get("Finbus Geargrind").zone.id,"duskwood");
});

test("trainer UI distinguishes 72 Forever-guide and 81 Classic-only/imported waypoints without changing pins",()=>{
 const trainers=db.npcs.filter(n=>n.role==="trainer");
 const count=status=>trainers.filter(n=>n.coordinate_status===status).length;
 assert.equal(count("forever_guide_waypoint"),72);
 assert.equal(count("forever_guides_classic_waypoint_not_ingame_verified"),70);
 assert.equal(count("classic_reference_unverified"),11);
 assert.equal(trainers.filter(n=>n.location_evidence?.evidence_level==="confirmed_in_game").length,0);
 const js=readFileSync(resolve(root,"assets/npcs.js"),"utf8");
 assert.match(js,/function trainerWaypointCaveat\(n\)/);
 assert.match(js,/trainerWaypointCaveat\(n\),"npc-datacaveat"/);
 assert.match(js,/n\.coordinate_status==="forever_guide_waypoint"/);
 assert.match(js,/n\.coordinate_status==="forever_guides_classic_waypoint_not_ingame_verified"/);
 assert.match(js,/n\.coordinate_status==="classic_reference_unverified"/);
 assert.match(js,/Documenté dans un guide Forever/);
 assert.match(js,/Référence Classic reprise dans un guide Forever/);
 assert.match(js,/Référence Classic uniquement/);
 assert.match(js,/not verified in-game/);
 assert.ok(js.includes("if(hasCoords(n)&&mapId)"),"No /mappin without an exact point");
});


test("47 individually sourced trainer pins and 25 historical guide pins receive distinct FR/EN caveats",()=>{
 const ui=readFileSync(resolve(root,"assets/npcs.js"),"utf8");
 const from=ui.indexOf("function trainerWaypointCaveat(n){");
 const to=ui.indexOf("function renderTrainerDetail(n){",from);
 assert.ok(from>=0&&to>from);
 const fn=language=>new Function("hasCoords","S",ui.slice(from,to)+";return trainerWaypointCaveat;")(
  n=>n.coordinates&&Number.isFinite(n.coordinates.x)&&Number.isFinite(n.coordinates.y),
  (fr,en)=>language==="en"?en:fr
 );
 const fr=fn("fr"),en=fn("en");
 const sourced=trainer("Jandi"),legacy=trainer("Nyassa Swiftdraught"),classic=trainer("Balthus Stoneflayer");
 assert.ok(sourced?.location_evidence);
 assert.ok(legacy&&!legacy.location_evidence);
 assert.match(fr(sourced),/Documenté dans un guide Forever/);
 assert.match(en(sourced),/Documented in a Forever guide/);
 assert.match(fr(legacy),/preuve individuelle.*non retracée/);
 assert.match(en(legacy),/no traceable individual proof/);
 assert.doesNotMatch(fr(legacy),/^Documenté dans un guide Forever/);
 assert.ok(!/confirmée en jeu/.test(fr(legacy))||fr(legacy).includes("non confirmée en jeu"));
 const all=db.npcs.filter(n=>n.role==="trainer"&&n.coordinate_status==="forever_guide_waypoint");
 assert.equal(all.filter(n=>n.location_evidence?.evidence_level==="documented_forever").length,47);
 assert.equal(all.filter(n=>!n.location_evidence).length,25);
 const mismatched=structuredClone(sourced);
 mismatched.location_evidence.source_url="https://example.org/unrelated";
 assert.match(fr(mismatched),/preuve individuelle.*non retracée/);
 assert.match(fr(classic),/Référence Classic/);
});
