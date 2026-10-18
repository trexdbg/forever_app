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
  for(const {id,w,stage} of refs(steps)){
   const q=data.catalog[id];assert.ok(q.level<=10);assert.ok(stage.experience>=q.min_level);
   assert.equal(stage.zone,w.zone);assert.ok(w.coords.x>=0&&w.coords.x<=100&&w.coords.y>=0&&w.coords.y<=100);
   assert.ok(Object.values(q.locations).flat().some(p=>p.zone===w.zone&&p.x===w.coords.x&&p.y===w.coords.y));
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
 assert.ok(relics.length>=4);
 const fronds=actions.filter(a=>a.id===99050&&a.kind==='objectives');
 assert.ok(fronds.some(a=>a.w.coords.x===55.3&&a.w.coords.y===57.1));
 assert.ok(fronds.some(a=>a.w.coords.y>70));
 assert.ok(fronds.every(a=>a.w.special.some(n=>n[0].includes('Refreshing Spring Water'))));
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
