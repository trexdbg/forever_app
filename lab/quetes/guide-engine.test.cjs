/* Test locally: node lab/quetes/guide-engine.test.cjs — no network / npm / Actions */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const guide=require("./guide-engine.js");
const base=path.resolve(__dirname,"../..");
const read=p=>JSON.parse(fs.readFileSync(path.join(base,p),"utf8"));
const manifest=read("data/quests/manifest.json");
const curation=read("lab/quetes/curation.json");
const levels=read("data/quests/levels.json").levels;
const alliance=read("data/quests/alliance.json");
const horde=read("data/quests/horde.json");
const profiles=[["alliance","human",alliance],["alliance","gnorf",alliance],["alliance","nelf",alliance],
 ["horde","trorc",horde],["horde","undead",horde],["horde","tauren",horde]];
let checks=0,groupCount=0,filtered=0;
const build=(data,profile,level,mode)=>guide.build({data,manifest,levels,curation,profile,level,mode});
function test(name,fn){fn();checks++;console.log("✓ "+name);}
test("curation schema and source constraints",()=>{
 assert.equal(curation.schema_version,1);
 assert.equal(curation.policies.max_quest_level_delta,0);
 assert.equal(curation.game,"classic");
 assert.equal(curation.dungeons.length,5);
 assert(!JSON.stringify(curation).includes("turtle-wow"));
});
for(const [faction,profile,data] of profiles){
 test(profile+" — every level 5–60 respects strict quest cap in both variants",()=>{
  for(let level=5;level<=60;level++)for(const mode of ["solo","essentials"]){
   const result=build(data,profile,level,mode);
   assert(result.stages.length>=0);
   assert.equal(result.level,level);
   assert(result.stages.every(s=>s.points.every(p=>p.actions.every(q=>q.level===null||q.level<=level))));
   assert(result.stages.every(s=>s.points.every(p=>p.members.every(m=>m.x>=0&&m.x<=100&&m.y>=0&&m.y<=100))));
   assert(result.preparations.every(p=>p.faction===faction));
   assert(result.dungeons.every(d=>d.faction===faction));
   if(mode==="solo"){
    assert.equal(result.dungeons.length,0);
    assert(result.stages.every(s=>s.points.every(p=>p.actions.every(q=>q.dungeon===false))));
   }
   filtered+=result.excludedOverLevel;
   groupCount+=result.stages.flatMap(s=>s.points).filter(p=>p.clustered).length;
  }
 });
}
test("lower level may drop higher quest yet retain nearby doable objectives",()=>{
 const route=build(alliance,"nelf",8,"solo");
 assert(!route.stages.some(s=>s.points.some(p=>p.actions.some(q=>q.level===12))));
 assert(route.stages.length>0);
});
test("mode solo omits explicit Classic instance objectives",()=>{
 const solo=build(horde,"trorc",17,"solo");
 assert(!solo.stages.flatMap(s=>s.points).some(p=>/ragefire chasm/i.test(p.header)));
});
test("recommended mode only exposes curated low-level instances",()=>{
 const h17=build(horde,"trorc",17,"essentials");
 assert.deepEqual(h17.dungeons.map(d=>d.id),["ragefire"]);
 const a22=build(alliance,"human",22,"essentials");
 assert.deepEqual(a22.dungeons.map(d=>d.id),["deadmines"]);
 assert(a22.stages.some(s=>s.dungeonId==="deadmines"&&s.points.some(p=>p.actions.some(q=>q.en==="The Defias Brotherhood"))));
 const h26=build(horde,"undead",26,"essentials");
 assert(!h26.dungeons.some(d=>d.id==="stockades"||d.id==="gnomeregan"));
});
test("anticipate verified Bronze Tube and Seasoning Herbs",()=>{
 const preps=build(alliance,"human",22,"solo").preparations;
 assert(preps.some(p=>p.id==="bronze-tube"&&p.quest_id===174));
 assert(preps.some(p=>p.id==="seasoning-herbs"&&p.quest_id===90));
});
test("Dry Times purchase pack also alerts for Hops",()=>{
 const preps=build(alliance,"gnorf",17,"solo").preparations;
 assert(preps.some(p=>p.id==="dry-times"&&p.quest_id===116));
 assert(preps.some(p=>p.id==="westfall-save"&&p.quantity===5));
});
test("shadowfang dungeon chapter is only suggested when its quest bundle is level-safe",()=>{
 const earlier=build(horde,"undead",24,"essentials");
 assert(!earlier.dungeons.some(d=>d.id==="shadowfang"));
 const recommended=build(horde,"undead",27,"essentials");
 assert(recommended.stages.some(s=>s.dungeonId==="shadowfang"&&s.points[0].actions.length>=3));
});
test("Horde equipment quest purchase is distinct",()=>{
 const preps=build(horde,"tauren",26,"solo").preparations;
 assert(preps.some(p=>p.id==="deadly-blunderbuss"&&p.quest_id===6581));
 assert(!preps.some(p=>p.faction==="alliance"));
});
test("nearby cluster preserves individual objective positions",()=>{
 const route=build(alliance,"nelf",8,"solo");
 const grouped=route.stages.flatMap(s=>s.points).find(p=>p.clustered);
 assert(grouped);
 assert(grouped.members.length>=1);
 assert(grouped.actions.length>=2||grouped.members.length>1);
});
test("unknown profiles/modes are not silently accepted",()=>{
 assert.throws(()=>build(alliance,"wrong",8,"solo"),/profile/i);
 assert.throws(()=>build(alliance,"nelf",8,"other"),/variant/i);
});
console.log("\n"+checks+" guide invariants passed; "+
 filtered+" over-level actions excluded across the matrix, "+
 groupCount+" grouped sector occurrences.");
