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
  assert.ok(i.name?.trim()&&validSlots.has(i.slot)||["finger1","trinket1"].includes(i.slot),name+": missing name or slot");
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
 for(const id of ["level-paperdoll","level-picker","level-acquisition","level-farm-list","level-set-guide"])
  assert.ok(html.includes(`id="${id}"`),name+" missing "+id);
 assert.ok(html.includes("bis-niveaux-forever-observed")===false,"observed references should be loaded by JS");
}
assert.ok(js.includes('renderFarm();')&&js.includes('renderSets();'));
console.log("BiS par niveau OK: "+levels.length+" brackets, "+db.classes.length+" classes, "+classic.items.length+" Classic + "+observed.items.length+" beta-reported references, "+guide.sources.length+" dungeon guides, FR/EN pages.");
