#!/usr/bin/env node
/**
 * Offline, dependency-free, read-only quality audit for existing ForEveroth JSON.
 * Historical missing evidence is a warning, never a deletion or a forced relabel.
 */
import {readFileSync} from "node:fs";
import {resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";

export const DATA_FILES = Object.freeze([
  "data/items.json", "data/items-forever.json",
  "data/items-classic-cache.json", "data/items-forever-cache.json",
  "data/bis.json", "data/bis-niveaux-classic.json",
  "data/bis-niveaux-forever-observed.json",
  "data/dungeons-forever.json", "data/rares.json",
  "data/npcs.json", "data/quests/manifest.json"
]);
export const LEVELS = Object.freeze(["confirmed_in_game","documented_forever","datamined","classic_reference","unverified"]);
const isObject = v => v !== null && typeof v === "object" && !Array.isArray(v);
const isNumber = v => typeof v === "number" && Number.isFinite(v);
const validPct = v => isNumber(v) && v >= 0 && v <= 100;
const link = v => typeof v === "string" && /^https:\/\/[^\s/]+/.test(v);
const meaningful = v => typeof v === "string" && v.trim().length > 0;

/** Conservative: a descriptive legacy status never upgrades to in-game confirmation. */
export function classifyRecord(record = {}) {
  const explicitly = record.evidence_level;
  if (explicitly !== undefined) return LEVELS.includes(explicitly) ? explicitly : "unverified";
  const status = String(record.source_status || record.reference || "").toLowerCase();
  if (/classic|vanilla/.test(status)) return "classic_reference";
  if (/client|db2|datamin|60tools|_cache/.test(status)) return "datamined";
  if (/forever|wowhead_forever/.test(status)) return "documented_forever";
  return "unverified";
}

export function auditDatasets(datasets) {
  const issues = [];
  const report = (severity, code, path, detail) => issues.push({severity, code, path, detail});
  const checkCoordinates = (p, xy) => {
    if (!Array.isArray(xy) || xy.length !== 2 || !xy.every(validPct))
      report("error","INVALID_COORDINATES",p,"Coordinates must be [x,y] within 0..100");
  };
  const unique = (rows, file, label, key = "id") => {
    const seen = new Set();
    rows.forEach((row,i) => {
      const id = row?.[key];
      if (id === undefined || id === null || id === "") return;
      const k = String(id);
      if (seen.has(k)) report("error","DUPLICATE_ID",file+"."+label+"["+i+"]","Duplicate ID "+k);
      seen.add(k);
    });
  };
  const checkItem = (item, p, requireStatus = true) => {
    if (!isObject(item) || !Number.isSafeInteger(item.id) || item.id <= 0) {
      report("error","INVALID_ITEM_ID",p,"Positive numeric item ID required"); return;
    }
    if (!meaningful(item.name) && !meaningful(item.en) && !meaningful(item.fr))
      report("warning","MISSING_ITEM_NAME",p,"No meaningful item name");
    for (const k of ["itemLevel","requiredLevel","level"]) {
      const v = item[k];
      if (v !== undefined && v !== null && (!Number.isInteger(v) || v < 0 || v > 1000))
        report("error","INVALID_ITEM_LEVEL",p+"."+k,String(v));
    }
    if (Number.isInteger(item.itemLevel) && Number.isInteger(item.requiredLevel) && item.itemLevel < item.requiredLevel)
      report("warning","ITEM_LEVEL_BELOW_REQUIREMENT",p,"Check item-level and required-level mapping");
    for (const key of ["url","source_url","itemUrl"]) {
      const url = item[key];
      if (url === undefined || url === null || url === "") continue;
      if (!link(url)) {report("warning","UNSAFE_SOURCE_URL",p+"."+key,String(url));continue;}
      const match = /(?:\bitem[=/]|\/items\/)(\d+)\b/.exec(url);
      if (match && Number(match[1]) !== item.id)
        report("error","ITEM_URL_ID_MISMATCH",p+"."+key,"Item ID "+item.id+" vs URL "+match[1]);
    }
    const classification = classifyRecord(item);
    if (item.evidence_level !== undefined && !LEVELS.includes(item.evidence_level))
      report("error","UNKNOWN_EVIDENCE_LEVEL",p,String(item.evidence_level));
    if (classification === "classic_reference" && item.verified_forever === true)
      report("error","CLASSIC_MARKED_FOREVER_VERIFIED",p,"Classic source alone cannot verify Forever");
    if (item.evidence_level === "confirmed_in_game" &&
      !(link(item.evidence_url) && meaningful(item.observed_build) && meaningful(item.observed_at)))
      report("error","UNSUPPORTED_GAME_CONFIRMATION",p,"Game confirmation requires capture URL, build and date");
    if (requireStatus && !meaningful(item.source_status) && !meaningful(item.reference))
      report("warning","MISSING_PROVENANCE_STATUS",p,"Legacy record lacks source_status/reference");
    if (![item.source_url,item.url,item.itemUrl].some(link))
      report("warning","MISSING_SOURCE_LINK",p,"No traceable source URL");
    if (classification === "classic_reference" &&
      link(item.url) && /\/forever\//.test(item.url) && !link(item.source_url))
      report("warning","CLASSIC_WITH_FOREVER_CATALOG_LINK",p,"Forever item lookup is not Classic source or Forever game proof");
  };
  for (const [file, data] of Object.entries(datasets)) {
    if (!isObject(data)) {report("error","INVALID_ROOT",file,"Expected JSON object");continue;}
    if (file.endsWith("quests/manifest.json")) {
      if (!/vanilla-questing/.test(String(data.source_repo)) || data.coordinate_system !== "zone_percent_0_100")
        report("error","CLASSIC_QUEST_MANIFEST_CHANGED",file,"Classic source and zone-percent convention must remain");
      continue;
    }
    if (/\/items(?:-classic-cache|-forever-cache|-forever)?\.json$|\/bis(?:-niveaux-classic|-niveaux-forever-observed)?\.json$/.test(file)) {
      if (!Array.isArray(data.items)) {report("error","MISSING_ITEMS_ARRAY",file,"items must be array");continue;}
      unique(data.items,file,"items");
      data.items.forEach((v,i)=>checkItem(v,file+".items["+i+"]"));
    }
    if (file.endsWith("/npcs.json")) {
      if (!Array.isArray(data.npcs)) {report("error","MISSING_NPCS_ARRAY",file,"npcs must be array");continue;}
      data.npcs.forEach((npc,i)=>{
        const p=file+".npcs["+i+"]";
        if (npc.id === null || npc.id === undefined) report("warning","NPC_ID_UNKNOWN",p,"Keep unknown; do not invent an ID");
        if (!npc.coordinates) report("warning","NPC_LOCATION_UNKNOWN",p,"Location not mapped");
        else if (!isObject(npc.coordinates) || !validPct(npc.coordinates.x) || !validPct(npc.coordinates.y))
          report("error","INVALID_COORDINATES",p+".coordinates","Expected x/y within 0..100");
        if (!link(npc.source)) report("warning","NPC_SOURCE_MISSING",p,"Source URL absent or not HTTPS");
      });
    }
    if (file.endsWith("/rares.json")) {
      if (!Array.isArray(data.rares)) {report("error","MISSING_RARES_ARRAY",file,"rares must be array");continue;}
      unique(data.rares,file,"rares");
      data.rares.forEach((rare,i)=>{
        const p=file+".rares["+i+"]";
        if (!Array.isArray(rare.points) || rare.points.length===0)
          report("warning","RARE_LOCATION_UNKNOWN",p,"No usable map point; retain entry");
        else rare.points.forEach((pt,j)=>checkCoordinates(p+".points["+j+"]",pt));
        const min=rare.respawn_min_hours,max=rare.respawn_max_hours;
        if (min!==null && min!==undefined && (!isNumber(min)||min<0) ||
            max!==null && max!==undefined && (!isNumber(max)||max<0) ||
            isNumber(min) && isNumber(max) && min>max)
          report("error","INVALID_RESPAWN_RANGE",p,"Invalid range of respawn hours");
        for (const [j,drop] of (rare.loot||[]).entries()) {
          const c=drop.chance_classic_percent;
          if (c!==undefined && c!==null && !validPct(c))
            report("error","INVALID_DROP_CHANCE",p+".loot["+j+"]",String(c));
        }
        if (!link(rare.source)) report("warning","RARE_SOURCE_MISSING",p,"Missing HTTPS source link");
      });
    }
    if (file.endsWith("/dungeons-forever.json")) {
      if (!Array.isArray(data.dungeons)) {report("error","MISSING_DUNGEONS_ARRAY",file,"dungeons must be array");continue;}
      unique(data.dungeons,file,"dungeons");
      data.dungeons.forEach((d,i)=>{
        const p=file+".dungeons["+i+"]";
        if (Array.isArray(d.level) && (d.level.length!==2 || !d.level.every(isNumber) || d.level[0]<1 || d.level[0]>d.level[1]))
          report("error","INVALID_DUNGEON_LEVELS",p,"Level interval must be ascending");
        if (!link(d.source)) report("warning","DUNGEON_SOURCE_MISSING",p,"Missing direct source");
        for(const [bi,boss] of (d.bosses||[]).entries()) {
          const bp=p+".bosses["+bi+"]";
          if (boss.mapPoint!==undefined && boss.mapPoint!==null) checkCoordinates(bp+".mapPoint",boss.mapPoint);
          for(const [li,loot] of (boss.loot||[]).entries()) {
            const lp=bp+".loot["+li+"]";
            if (loot.id !== undefined && loot.id !== null) checkItem({...loot,url:loot.itemUrl},lp,false);
            else report("warning","LOOT_ITEM_ID_UNKNOWN",lp,"Unresolved item ID");
            if (/^forever_beta/.test(String(loot.source_status||"")) && !link(loot.source_url))
              report("warning","LOOT_SOURCE_INDIRECT",lp,"Catalogue link or dungeon guide does not independently prove this boss drop");
          }
        }
      });
    }
  }
  const errors=issues.filter(x=>x.severity==="error");
  const warnings=issues.filter(x=>x.severity==="warning");
  const histogram = arr => Object.entries(arr.reduce((acc,v)=>(acc[v.code]=(acc[v.code]||0)+1,acc),{})).sort((a,b)=>b[1]-a[1]);
  return {filesChecked:Object.keys(datasets).length,errorCount:errors.length,warningCount:warnings.length,errorTypes:histogram(errors),warningTypes:histogram(warnings),issues};
}

export function loadDatasets(root) {
  const datasets = {}, readErrors = [];
  for (const path of DATA_FILES) {
    try {datasets[path] = JSON.parse(readFileSync(resolve(root,path),"utf8"));}
    catch(e) {readErrors.push({severity:"error",code:"JSON_READ_OR_PARSE_FAILURE",path,detail:e.message});}
  }
  return {datasets,readErrors};
}

function main() {
  const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
  const {datasets,readErrors}=loadDatasets(root);
  const result=auditDatasets(datasets);
  result.issues.unshift(...readErrors);
  result.errorCount+=readErrors.length;
  result.errorTypes=Object.entries(result.issues.filter(x=>x.severity==="error").reduce((a,v)=>(a[v.code]=(a[v.code]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]);
  if (process.argv.includes("--json")) console.log(JSON.stringify(result,null,2));
  else {
    console.log("ForEveroth data QA: "+result.filesChecked+"/"+DATA_FILES.length+" datasets; "+result.errorCount+" errors, "+result.warningCount+" legacy warnings");
    console.log("Errors by type:",JSON.stringify(result.errorTypes));
    console.log("Warnings by type:",JSON.stringify(result.warningTypes));
    for (const issue of result.issues.slice(0,30))
      console.log(issue.severity.toUpperCase(),issue.code,issue.path,issue.detail);
    if (result.issues.length>30) console.log("... "+(result.issues.length-30)+" more findings; use --json for full details");
  }
  if (result.errorCount || (process.argv.includes("--fail-on-warnings") && result.warningCount))
    process.exitCode=1;
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) main();
