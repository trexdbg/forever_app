/* Manual, offline consistency check. No GitHub Actions minutes required. */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const load = path => JSON.parse(readFileSync(new URL("../" + path, import.meta.url), "utf8"));
const text = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const classic = load("data/bis-niveaux-classic.json");
const observed = load("data/bis-niveaux-forever-observed.json");
const guide = load("data/bis-niveaux-sources.json");
const db = load("data/bis.json");
const js = text("assets/bis-niveaux.js");
const fr = text("bis-niveaux/index.html"), en = text("en/bis-niveaux/index.html");
const match = js.match(/const levels=(\[\[[^;]+\]\]);/);
assert.ok(match, "level brackets should be readable");
const levels = JSON.parse(match[1]);
assert.deepEqual(levels[4], [30,30], "level 30 must be its OWN beta bracket");
assert.equal(levels.length, 9);
assert.ok(levels.every(([min,max],i)=>min>0&&min<=max&&(i===0||min===levels[i-1][1]+1)));
assert.equal(db.classes.length, 9);
assert.equal(db.slots.length, 17);
const validSlots = new Set(db.slots.map(s=>s.id));
function checkIds(name,rows){
 assert.ok(Array.isArray(rows)&&rows.length);
 assert.equal(new Set(rows.map(x=>x.id)).size,rows.length,name+" duplicate IDs");
 for(const i of rows){
  assert.ok(Number.isInteger(i.id)&&i.id>0,name+": invalid ID");
  assert.ok(i.name?.trim()&&(validSlots.has(i.slot)||["finger1","trinket1"].includes(i.slot)),name+": missing name or slot");
  assert.ok(Number.isInteger(i.itemLevel)&&i.itemLevel>0,name+": missing item level");
 }
}
checkIds("Classic",classic.items);
checkIds("Forever observed",observed.items);
assert.ok(classic.items.length>=75);
assert.ok(observed.items.length>=79);
for(const i of classic.items){
 assert.equal(i.source_status,"classic_curated_leveling");
 assert.ok(Number.isInteger(i.requiredLevel)&&i.requiredLevel>=1);
 assert.ok(i.source_url?.startsWith("https://"));
}
for(const i of observed.items){
 assert.equal(i.source_status,"forever_beta_observed");
 assert.ok(i.source_url===`https://foreverchanges.pro/item/${i.id}`);
 assert.ok(["dungeon","quest"].includes(i.acquisition?.kind));
 if(i.acquisition.kind==="dungeon"){
  assert.ok(Number.isInteger(i.requiredLevel)&&i.requiredLevel>=1&&i.requiredLevel<=30);
 }else{
  assert.equal(i.requiredLevel,null,"quest level must not fake an equip requirement");
  assert.ok(i.questLevel>=i.questMinLevel&&i.questLevel<=30);
  assert.ok(["both","alliance","horde"].includes(i.acquisition.faction));
 }
}
assert.ok(guide.sources.length>=13);
for(const item of guide.sources){
 assert.ok(item.name_en&&item.name_fr&&item.zone_en&&item.zone_fr&&item.min&&item.max&&item.url);
}
for(const [name,html] of [["fr",fr],["en",en]]){
 for(const id of ["level-paperdoll","level-picker","level-acquisition","level-farm-list","level-set-guide","level-advanced","level-future","level-bands-future","level-stage"])
  assert.ok(html.includes(`id="${id}"`),name+" missing "+id);
 assert.ok(html.includes("bis-niveaux-forever-observed")===false,"observed references should be loaded by JS");
}
assert.ok(js.includes('renderFarm();')&&js.includes('renderSets();'));
assert.ok(js.includes('futureBox')&&js.includes('activeFilters'),"optional filters and future brackets should be preserved");
/* Cross-module locale regression: the dungeon catalogue is the French naming authority.
 * A beta object-origin label must not regress to the English dungeon title. */
const dungeonList=load("data/dungeons-forever.json").dungeons;
const hall=dungeonList.find(x=>x.id==="hall-of-thanes");
assert.deepEqual(hall.name,{fr:"La salle des Thanes",en:"Hall of Thanes"});
const hallItems=observed.items.filter(x=>x.origin_fr?.includes("Hall of Thanes"));
assert.equal(hallItems.length,12,"Expected scope of affected Forever items changed");
assert.ok(js.includes('"Hall of Thanes":"La salle des Thanes"'),"BiS French origin must use the same dungeon name as Donjons");
assert.ok(fr.includes("/assets/bis-niveaux.js?v=20261016-dungeon-origin-fr"));
assert.ok(en.includes("/assets/bis-niveaux.js?v=20261016-dungeon-origin-fr"));


/* Agent 02 (levels 1–30): reviewed Forever source assertions and unknown requirements. */
const betaArchive=load("data/items-forever-cache.json");
const observedByID=new Map(observed.items.map(i=>[i.id,i]));
const cacheByID=new Map(betaArchive.items.map(i=>[i.id,i]));
for(const [id,expected,armor] of [
 [271096,["+30 Armor","Equip: +3 Spell Power"],"15 Armor"],
 [271097,["+3 Agility","+4 Spirit"],"17 Armor"],
 [279865,["+3 Stamina","+3 Strength"],"18 Armor"]
]){
 const item=observedByID.get(id);
 assert.ok(item,"Missing reviewed Forever item "+id);
 for(const line of [...expected,armor])assert.ok(item.tooltip.includes(line),id+" missing documented stat "+line);
 assert.equal(item.evidence_level,"documented_forever");
 assert.equal(item.source_url,"https://foreverchanges.pro/item/"+id);
 assert.equal(item.evidence_url,item.source_url);
 assert.equal(item.evidence_kind,"forever_community_page");
 assert.equal(item.observed_at,"2026-10-13");
 assert.ok(item.observed_build&&item.evidence_note);
 if(id!==271096){
  const archived=cacheByID.get(id);
  assert.ok(archived,"Missing cached item "+id);
  for(const line of [...expected,armor])assert.ok(archived.tooltip.includes(line),id+" stale archive "+line);
  assert.equal(archived.evidence_level,"documented_forever");
  assert.equal(archived.evidence_url,item.evidence_url);
  assert.equal(archived.evidence_kind,"forever_community_page");
  assert.ok(archived.observed_at&&archived.observed_build&&archived.evidence_note);
 }
}
assert.ok(!cacheByID.get(271097).tooltip.includes("+4 Agility"),"Stale agility bonus");
assert.ok(!cacheByID.get(279865).tooltip.includes("+5 Stamina"),"Stale stamina bonus");
const uncertainQuestRewards=observed.items.filter(i=>i.acquisition?.kind==="quest"&&i.requiredLevel===null);
assert.equal(uncertainQuestRewards.length,11,"Missing explicitly unknown equip-level quest rewards");
assert.ok(uncertainQuestRewards.every(i=>!i.tooltip.some(t=>/^Requires Level \d+$/.test(t))),
 "Quest level must not be mistaken for item requirement");
assert.ok(js.includes("const req=required(i),max=levels[band][1]"),
 "Automatic BiS candidates must require an explicit equipment level");
assert.ok(!js.includes("const req=progressionLevel(i),max=levels[band][1]"),
 "Quest level cannot substitute for equipment requirement in recommendations");
for(const [needle] of [["Reported in beta · not independently verified"],["Signalé en bêta · non vérifié directement"]])
 assert.ok(js.includes(needle),"FR/EN beta provenance label must be cautious");

console.log("BiS par niveau OK: "+levels.length+" brackets, "+db.classes.length+" classes, "+classic.items.length+" Classic + "+observed.items.length+" beta-reported references, "+guide.sources.length+" dungeon guides, FR/EN pages.");
