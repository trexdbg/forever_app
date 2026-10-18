const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {build}=require('./route-engine.js');
const data=JSON.parse(fs.readFileSync(__dirname+'/nightelf.json','utf8'));
const refs=steps=>steps.flatMap(s=>s.waypoints.flatMap(w=>['ends','starts','objectives'].flatMap(kind=>(w[kind]||[]).map(ref=>({id:Number(ref.slice(1)),kind,w,stage:s})))));
test('variants keep full starter chains, level range and sourced zone coordinates',()=>{
 for(const variant of ['direct','complete']){
  const steps=build(data,{variant,active:[87288,99046]});
  assert.ok(steps.length>8);
  for(const {id,kind,w,stage} of refs(steps)){
   const q=data.catalog[id];assert.ok(q.level<=10);assert.ok(stage.experience>=q.min_level);
   assert.equal(stage.zone,w.zone);assert.ok(w.coords.x>=0&&w.coords.x<=100&&w.coords.y>=0&&w.coords.y<=100);
   const members=w.members?w.members.filter(m=>(m[kind]||[]).includes('q'+id)):[w];
   assert.ok(members.length);
   for(const member of members){
    if(member.navigation_only){assert.equal(member.zone,'teldrassil');continue;}
    assert.ok(Object.values(q.locations).flat().some(p=>p.zone===member.zone&&p.x===member.coords.x&&p.y===member.coords.y),String(id));
   }
  }
  const turned=refs(steps).filter(a=>a.kind==='ends').map(a=>a.id);
  for(const id of [456,457,458,459,916,917,920,921,928,929,3521,3522])assert.ok(turned.includes(id),String(id));
 }
});
test('every new chain is ordered; missing pickup stays conditional',()=>{
 const empty=refs(build(data));assert.ok(!empty.some(a=>[87288,99046,99047,99050].includes(a.id)));
 const actions=refs(build(data,{active:[87288,99046]}));
 const position=id=>actions.findIndex(a=>a.id===id&&a.kind==='ends');
 assert.ok(position(99046)<position(99047)&&position(99047)<position(99050));
 assert.ok(!actions.some(a=>[87288,99046].includes(a.id)&&a.kind==='starts'));
 assert.deepEqual(data.catalog[99047].requires,[99046]);assert.deepEqual(data.catalog[99050].requires,[99047]);
 assert.ok(!data.catalog[97977]);
});
test('completed quests disappear and unlock documented followups',()=>{
 const before=JSON.stringify(data);
 const list=refs(build(data,{done:[99046,99047],active:[]}));
 assert.ok(!list.some(a=>[99046,99047].includes(a.id)));
 assert.ok(list.some(a=>a.id===99050&&a.kind==='starts'));
 assert.equal(JSON.stringify(data),before);
});
test('detours prune their pickups in direct variant',()=>{
 const direct=refs(build(data)),complete=refs(build(data,{variant:'complete'}));
 for(const id of [483,2541,2561,933,922,923,2498,2499]){
  assert.ok(!direct.some(a=>a.id===id),String(id));assert.ok(complete.some(a=>a.id===id&&a.kind==='ends'),String(id));
 }
});
test('timed delivery stays adjacent and item objectives preserve all targets',()=>{
 const actions=refs(build(data,{active:[99046]}));
 const i=actions.findIndex(a=>a.id===3522&&a.kind==='starts');assert.equal(actions[i+1].id,3522);assert.equal(actions[i+1].kind,'ends');
 const relics=refs(build(data,{variant:'complete'})).filter(a=>a.id===483&&a.kind==='objectives');
 assert.equal(new Set(relics.flatMap(a=>(a.w.members||[a.w]).map(m=>m.coords.x+':'+m.coords.y))).size,4);
 const fronds=actions.filter(a=>a.id===99050&&a.kind==='objectives');
 assert.ok(fronds.some(a=>a.w.coords.x===55.3&&a.w.coords.y===57.1));
 assert.ok(fronds.some(a=>a.w.coords.y>70));
 assert.ok(fronds[0].w.special.some(n=>n[0].includes('Refreshing Spring Water')));
 assert.ok(!fronds[1].w.special.some(n=>n[0].includes('Empty Vial')));
});
test('sources remain documentation and preserve exact Forever corrections',()=>{
 assert.equal(data.catalog[87288].locations.ends[0].x,55.4);
 assert.equal(data.catalog[99046].locations.ends[0].x,37.6);
 assert.equal(data.catalog[932].level,8);
 for(const q of Object.values(data.catalog)){
  assert.equal(q.evidence_level,'documented_forever');
  assert.match(q.evidence_url,/^https:\/\/foreverdb.net\/quest\//);
  assert.ok(q.observed_at&&q.observed_build&&q.evidence_note);
 }
});

test('Iverron ingredients are accepted before spider farming; three quests share northern work',()=>{
 const steps=build(data),actions=refs(steps);
 const pos=(id,kind)=>actions.findIndex(a=>a.id===id&&a.kind===kind);
 assert.ok(pos(3521,'starts')<pos(916,'objectives'));
 assert.ok(pos(916,'ends')<pos(917,'starts'));
 const triple=steps.flatMap(s=>s.waypoints).find(w=>[457,459,3521].every(id=>(w.objectives||[]).includes('q'+id)));
 assert.ok(triple);assert.ok(triple.members.length>=4);
 for(const a of triple.members)for(const b of triple.members)assert.ok(Math.hypot(a.coords.x-b.coords.x,a.coords.y-b.coords.y)<=5);
 const spider=steps.flatMap(s=>s.waypoints).find(w=>[916,3521].every(id=>(w.objectives||[]).includes('q'+id)));
 assert.ok(spider);assert.equal(spider.coords.x,56.4);assert.equal(spider.coords.y,30.3);
 assert.ok(spider.special.every(n=>!n[0].includes('Moonpetal')&&!n[0].includes('Hyacinth')));
});
test('map-area observations cannot become item drops or water vendors',()=>{
 assert.deepEqual(data.catalog[99050].targets[2].locations,[]);
 assert.deepEqual(data.catalog[483].targets[3].locations.map(p=>[p.x,p.y]),[[44.4,60.7]]);
 const relics=build(data,{variant:'complete'}).flatMap(s=>s.waypoints).flatMap(w=>w.members||[w]).filter(w=>(w.objectives||[]).includes('q483'));
 const rune=relics.find(w=>w.special.some(n=>n[0].includes('Rune of Nesting')));
 assert.deepEqual(rune.coords,{x:44.4,y:60.7});
 const shaman=build(data,{variant:'complete'}).flatMap(s=>s.waypoints).find(w=>(w.objectives||[]).includes('q2541'));
 assert.ok(shaman.navigation_only);assert.deepEqual(shaman.coords,{x:43,y:58});assert.match(shaman.header,/entrée/);
});
test('nearby seeds and sprouts share a sector, without losing their separate source points',()=>{
 const lake=build(data).flatMap(s=>s.waypoints).find(w=>[918,919].every(id=>(w.objectives||[]).includes('q'+id)));
 assert.ok(lake);assert.equal(lake.members.length,2);assert.notDeepEqual(lake.members[0].coords,lake.members[1].coords);
});
test('Zenn target choice reduces the former west/east detour and preserves all three components',()=>{
 const w=build(data).flatMap(s=>s.waypoints).filter(w=>(w.objectives||[]).includes('q488'));
 const points=w.flatMap(w=>w.members||[w]);assert.equal(points.length,3);
 const path=[{x:60.5,y:56.3},...points.map(p=>p.coords),{x:60.5,y:56.3}];
 const length=path.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-path[i].x,p.y-path[i].y),0);
 const old=[{x:60.5,y:56.3},{x:65.6,y:53.5},{x:53.5,y:59.4},{x:69.5,y:57.2},{x:60.5,y:56.3}];
 const before=old.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-old[i].x,p.y-old[i].y),0);
 assert.ok(length<before*.75); // map-percent heuristic, not pathfinding or elapsed-time claim
});
