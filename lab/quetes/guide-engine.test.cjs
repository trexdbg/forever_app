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
const xpData=read("lab/quetes/xp-classic.json");
const playbook=read("lab/quetes/playbook-nelf-5-10.json");
const alliance=read("data/quests/alliance.json");
const horde=read("data/quests/horde.json");
const profiles=[["alliance","human",alliance],["alliance","gnorf",alliance],["alliance","nelf",alliance],
 ["horde","trorc",horde],["horde","undead",horde],["horde","tauren",horde]];
let checks=0,groupCount=0,filtered=0;
const build=(data,profile,level,mode)=>guide.build({data,manifest,levels,curation,xpData,playbook,profile,level,mode});
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
test("XP table is Classic-only and level 5 to 6 takes 2800 XP",()=>{
 assert.equal(xpData.edition,"classic");
 assert.equal(build(alliance,"nelf",5,"solo").xpToNext,2800);
 assert.equal(build(alliance,"nelf",6,"solo").xpToNext,3600);
 assert.equal(build(alliance,"nelf",60,"solo").xpToNext,null);
});
test("sourced reward XP is attached to specific classic quests",()=>{
 const result=build(alliance,"nelf",7,"solo");
 const actions=result.stages.flatMap(s=>s.points.flatMap(p=>p.actions));
 const quest=actions.find(a=>a.id===918);
 assert(quest);
 assert.equal(quest.rewardXp,625);
 assert.equal(quest.rewardXpSource,"https://wowforever.wclbox.com/en/renwu/918");
 assert.equal(xpData.quest_rewards["919"].xp,800);
 assert(!xpData.quest_rewards["2159"]); // never invent a missing value
});
test("stage XP subtotal only counts turn-ins and avoids double counting repeated ID",()=>{
 const result=build(alliance,"nelf",7,"solo");
 for(const stage of result.stages){
  const found=new Map();
  for(const point of stage.points)for(const action of point.actions)
   if((action.kind==="turnin"||action.kind==="instant")&&action.rewardXp!==null)
    found.set(action.id,action.rewardXp);
  assert.equal(stage.rewardXpKnown,[...found.values()].reduce((total,x)=>total+x,0));
  assert.equal(stage.rewardXpKnownCount,found.size);
 }
});
test("nelf 5–10 playbook stays level-safe and uses both selectable modes",()=>{
 assert.equal(playbook.schema_version,1);
 for(let level=5;level<=10;level++)for(const mode of ["solo","essentials"]){
  const result=build(alliance,"nelf",level,mode);
  assert.equal(result.curatedRange,"nelf-5-10");
  assert(result.stages.length>=3);
  assert(result.stages.every(s=>s.level<=level));
  assert(result.stages.every(s=>s.points.every(p=>p.actions.every(a=>a.level<=level))));
  assert(result.stages.every(s=>s.points.every(p=>p.members.every(m=>m.x>=0&&m.x<=100&&m.y>=0&&m.y<=100))));
  assert(result.stages.every(s=>!s.dungeonId));
 }
 assert(!build(alliance,"human",8,"solo").playbook);
 assert(!build(alliance,"nelf",11,"solo").playbook);
});
test("nelf playbook actions form a walkable accept-objective-turnin chain",()=>{
 const active=new Set(),done=new Set([921]); // Crown chain 1–4 happens before this guide begins.
 const visited=[];
 for(const chapter of playbook.chapters)for(const point of chapter.steps){
  assert.equal(chapter.zone==="teldrassil"||chapter.zone==="darnassus",true);
  assert(point.coords.x>=0&&point.coords.x<=100&&point.coords.y>=0&&point.coords.y<=100);
  for(const action of point.actions){
   const rule=playbook.requirements[String(action.id)];
   assert(rule);
   const questLevel=levels[String(action.id)];
   assert(questLevel!==undefined);
   assert(questLevel<=chapter.level);
   if(action.kind==="accept"){
    assert(!active.has(action.id));
    assert(!done.has(action.id));
    if(rule.previous_id)assert(done.has(rule.previous_id));
    assert(rule.min_level<=chapter.level);
    active.add(action.id);
   }else if(action.kind==="objective"){
    assert(active.has(action.id));
   }else if(action.kind==="turnin"){
    assert(active.has(action.id));
    active.delete(action.id);done.add(action.id);
   }else throw Error("Unsupported step action "+action.kind);
   visited.push({id:action.id,kind:action.kind});
  }
 }
 assert.equal(active.size,1); // Flight to Auberdine continues across the zone boundary.
 assert(active.has(6342));
 assert(done.has(918)&&done.has(919)&&done.has(2541)&&done.has(2561));
});
test("nelf pairs sylvains and avoids repeating the dangerous den",()=>{
 const result=build(alliance,"nelf",10,"solo");
 const lake=result.stages.find(s=>s.name?.en?.includes("Timberlings"));
 assert(lake);
 assert(lake.points.some(p=>p.clustered&&
   p.actions.some(a=>a.id===918&&a.kind==="objective")&&
   p.actions.some(a=>a.id===919&&a.kind==="objective")));
 const dens=result.stages.filter(s=>s.name?.en?.includes("Barrow Den"));
 assert.equal(dens.length,1);
 for(const id of [483,2541,2561])assert(dens[0].points.some(p=>p.actions.some(a=>a.id===id)));
 assert.equal(dens[0].points.length,1); // no six overlaid map pins at the same cave entrance
 assert.equal(dens[0].points[0].actions.length,7);
 assert(!build(alliance,"nelf",9,"solo").stages.some(s=>s.points.some(p=>p.actions.some(a=>a.id===2561))));
});
test("night elf Dolanaar profession purchase is optional, never a quest material",()=>{
 const prep=build(alliance,"nelf",5,"solo").preparations.find(p=>p.id==="nelf-skinning-knife-optional");
 assert(prep);
 assert.equal(prep.kind,"guide");
 assert(!prep.quest_id);
 assert(!build(horde,"trorc",5,"solo").preparations.some(p=>p.id===prep.id));
});
test("nelf prerequisites are checked and quest 12 is never recommended at player level 8",()=>{
 assert.equal(playbook.requirements["489"].previous_id,488);
 assert.equal(playbook.requirements["476"].previous_id,475);
 assert.equal(playbook.requirements["483"].previous_id,476);
 assert.equal(playbook.requirements["922"].previous_id,918);
 assert.equal(playbook.requirements["2561"].previous_id,2541);
 const r=build(alliance,"nelf",8,"solo");
 assert(r.stages.every(s=>s.points.every(p=>p.actions.every(a=>a.level<=8))));
});
console.log("\n"+checks+" guide invariants passed; "+
 filtered+" over-level actions excluded across the matrix, "+
 groupCount+" grouped sector occurrences.");
