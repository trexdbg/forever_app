/* Ordered editorial route + sourced Forever overrides; no game-client access. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.ForeverNightelfRoute=api;})(globalThis,function(){
'use strict';
const kinds=['ends','starts','objectives'];
const distance=(p,a)=>Math.hypot(p.x-a[0],p.y-a[1]);
function build(data,{variant='direct',done=[],active=[]}={}){
 if(data.schema_version!==1||data.edition!=='forever')throw Error('Unsupported Forever route');
 const completed=new Set(done.map(Number)),accepted=new Set(active.map(Number));
 const planned=new Set(completed),steps=[];
 const chapters=data.chapters.filter(c=>variant==='complete'||!c.optional||c.events.some(e=>[99046,99050].includes(e.id)));
 const selected=new Set(chapters.flatMap(c=>c.events.filter(e=>e.kind==='ends').map(e=>e.id)));
 for(const chapter of chapters){
  const waypoints=[];
  for(const event of chapter.events){
   const q=data.catalog[event.id];if(!q||!kinds.includes(event.kind))throw Error('Unknown route action');
   if(q.level>10||completed.has(q.id)||!selected.has(q.id))continue;
   if(q.min_level!==null&&q.min_level>chapter.level)continue;
   if(event.conditional&&!accepted.has(q.id))continue;
   // Dependencies may be completed earlier in this itinerary or in the saved journal.
   if(q.requires.some(id=>!planned.has(id)))continue;
   if(event.kind==='starts')accepted.add(q.id);
   if(event.kind!=='starts'&&!accepted.has(q.id))continue;
   let points=q.locations[event.kind];
   const notes=event.note?[event.note]:[];
   if(event.kind==='objectives'&&q.targets.length){
    points=[];
    for(const target of q.targets){
     notes.push([target.label,target.label]);
     if(target.locations.length)points.push([...target.locations].sort((a,b)=>distance(a,event.anchor||[55,55])-distance(b,event.anchor||[55,55]))[0]);
    }
    // Unknown item locations remain a shopping/collection note, never an invented map pin.
    if(!points.length)points=q.locations.objectives;
   }
   if(event.kind==='objectives'&&!q.targets.length&&points.length)points=[[...points].sort((a,b)=>distance(a,event.anchor||[55,55])-distance(b,event.anchor||[55,55]))[0]];
   if(!points.length)throw Error('Missing sourced location for '+q.id+' '+event.kind);
   const unique=new Map(points.map(p=>[p.zone+':'+p.x+':'+p.y,p]));
   for(const p of unique.values()){
    const entry={coords:{x:p.x,y:p.y},zone:p.zone,type:event.kind==='objectives'?'objective':'quest',header:[q.en,q.fr],[event.kind]:['q'+q.id],special:notes,source:p.source_url||q.source_url,basis:p.basis,quest_id:q.id};
    const last=waypoints[waypoints.length-1];
    // Merge only adjacent actions at the same location, never reorder a chain.
    if(last&&last.zone===entry.zone&&Math.hypot(last.coords.x-p.x,last.coords.y-p.y)<0.001){
     last[event.kind]=[...new Set([...(last[event.kind]||[]),'q'+q.id])];
     last.special.push(...notes);last.sources=[...new Set([...(last.sources||[last.source]),q.source_url])];
    }else waypoints.push(entry);
   }
   if(event.kind==='ends'){planned.add(q.id);accepted.delete(q.id);}
  }
  // Split at zone transitions so each map uses its own coordinate space.
  for(const w of waypoints){
   let stage=steps[steps.length-1];
   if(!stage||stage.chapter!==chapter.en||stage.zone!==w.zone){stage={zone:w.zone,experience:chapter.level,chapter:chapter.en,title:[chapter.en,chapter.fr],waypoints:[]};steps.push(stage);}
   stage.waypoints.push(w);
  }
 }
 return steps;
}
return {build};
});
