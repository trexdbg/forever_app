/* Run locally: node lab/quetes/engine.test.cjs
   No network/dependencies/GitHub Actions required. */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const base=path.join(__dirname,"../..");
const json=p=>JSON.parse(fs.readFileSync(path.join(base,p),"utf8"));
const engine=require("./engine.js");
const manifest=json("data/quests/manifest.json");
const levels=json("data/quests/levels.json").levels;
const fixtures={
 alliance:json("data/quests/alliance.json"),
 horde:json("data/quests/horde.json")
};
function catalog(faction,profile,overlay){
 return engine.buildCatalog({manifest,data:fixtures[faction],levels,profile,overlay});
}
let checks=0;
function test(name,fn){fn();checks++;console.log("✓ "+name);}
for(const [faction,profile,zone] of [
 ["alliance","human","elwynn"],
 ["alliance","gnorf","morogh"],
 ["alliance","nelf","teldrassil"],
 ["horde","trorc","durotar"],
 ["horde","undead","tirisfal"],
 ["horde","tauren","mulgore"]
]){
 const c=catalog(faction,profile);
 const state=engine.normalizeState({level:5,zone},c);
 test(profile+": first route has valid stops",()=>{
  const r=engine.calculate(c,state);
  assert(r.itinerary.length>0);
  assert(r.itinerary.every(p=>p.x>=0&&p.x<=100&&p.y>=0&&p.y<=100));
 });
 test(profile+": no high-level quest at player level 8",()=>{
  const r=engine.calculate(c,{...state,level:8});
  assert(r.itinerary.every(p=>p.actions.every(a=>{
   const q=c.quests[a.questKey];
   return a.kind!=="accept"&&a.kind!=="instant"||q.level===null||q.level<=9;
  })));
 });
 test(profile+": status changes remove invalid actions",()=>{
  const first=engine.calculate(c,state).itinerary.flatMap(p=>p.actions.map(a=>({...a,stage:p.stage}))).find(a=>a.kind==="accept");
  assert(first);
  const active=engine.setStatus(state,first.questKey,"active",c);
  assert.equal(engine.getStatus(active,first.questKey),"active");
  assert(!engine.calculate(c,active).itinerary.some(p=>p.actions.some(a=>a.questKey===first.questKey&&a.kind==="accept")));
  const ready=engine.setStatus(active,first.questKey,"ready",c);
  assert.equal(engine.getStatus(ready,first.questKey),"ready");
  const done=engine.setStatus(ready,first.questKey,"done",c);
  assert.equal(engine.getStatus(done,first.questKey),"done");
  const undone=engine.setStatus(done,first.questKey,"available",c);
  assert.equal(engine.getStatus(undone,first.questKey),"available");
 });
}
const c=catalog("alliance","nelf",{
 schema_version:1,edition:"forever",
 quests:{"928":{removed:true},"929":{requires:[928],min_level:12}},
 waypoints:[{
  zone:"teldrassil",level:7,faction:"alliance",profiles:["nelf"],
  waypoints:[{coords:{x:55,y:57},header:"Future Forever quest giver",starts:[{id:999999,name:"Future quest"}]}]
 }]
});
test("overlay: new quests placed in the appropriate level stages",()=>{
 const p=c.points.find(p=>p.header==="Future Forever quest giver");
 assert(p);assert(p.stage<20);
 assert.equal(c.quests["id:999999"].en,"Future Quest");
 assert(engine.calculate(c,{level:7,zone:"teldrassil"}).itinerary.some(p=>p.actions.some(a=>a.questKey==="id:999999")));
});
test("overlay: removed quest is not recommended",()=>{
 assert.equal(c.quests["id:928"].removed,true);
 assert(!engine.calculate(c,{level:7,zone:"teldrassil"}).itinerary.some(p=>p.actions.some(a=>a.questKey==="id:928")));
});
test("overlay: known requirements and minimum level are enforced",()=>{
 assert.deepEqual(c.quests["id:929"].requires,["id:928"]);
 assert.equal(engine.canOffer(c.quests["id:929"],{level:7,questStates:{}},{}).reason,"prerequisites");
 const done={level:7,questStates:{"id:928":"done"}};
 assert.equal(engine.canOffer(c.quests["id:929"],done,{}).reason,"minimum");
 assert(engine.canOffer(c.quests["id:929"],{...done,level:12},{}).ok);
});
test("overlay: faction/profile restriction prevents cross-faction injection",()=>{
 const other=catalog("horde","tauren",{
  schema_version:1,edition:"forever",waypoints:[{zone:"teldrassil",level:7,faction:"alliance",profiles:["nelf"],waypoints:[{coords:{x:50,y:50},starts:[{id:999999,name:"Future quest"}]}]}]
 });
 assert(!other.quests["id:999999"]);
});
test("cursor: leveling advances beyond an old saved step",()=>{
 const c=catalog("alliance","nelf");
 const fresh=engine.calculate(c,{level:16,zone:"westfall"});
 const stale=engine.calculate(c,{level:16,zone:"westfall",cursor:0});
 assert.equal(fresh.anchor,stale.anchor);
});
test("metadata-only prerequisites are exposed to manual state editing",()=>{
 const c=catalog("alliance","nelf",{schema_version:1,quests:{"999990":{name_fr:"Prerequis fictif",requires:[]}}});
 assert(c.quests["id:999990"]);
 assert.equal(c.quests["id:999990"].fr,"Prerequis fictif");
 assert(!c.points.some(p=>p.actions.some(a=>a.questKey==="id:999990")));
});
test("itinerary does not repeat the same acceptance/turn-in action",()=>{
 const c=catalog("alliance","nelf");
 const route=engine.calculate(c,{level:8,zone:"teldrassil"});
 const seen=new Set();
 for(const p of route.itinerary)for(const a of p.actions){
  if(a.kind==="objective")continue;
  assert(!seen.has(a.questKey));
  seen.add(a.questKey);
 }
});
test("invalid overlay versions are rejected",()=>{
 assert.throws(()=>catalog("alliance","nelf",{schema_version:2}),/incompatible/i);
});
console.log("\n"+checks+" Quest Lab tests passed.");
