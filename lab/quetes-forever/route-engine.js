/* Ordered quest chains; only explicitly declared objective batches may be clustered. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.ForeverNightelfRoute=api;})(globalThis,function(){
'use strict';
const kinds=['ends','starts','objectives'];
const distance=(p,a)=>Math.hypot(p.x-a[0],p.y-a[1]);
const key=p=>p.zone+':'+p.x+':'+p.y;
function pick(points,anchor){
 const sorted=[...points].sort((a,b)=>distance(a,anchor)-distance(b,anchor));
 if(!sorted.length)return null;
 // A documented entity position wins over nearby Classic alternatives, not over a distant route sector.
 return sorted.find(p=>p.basis==='documented_forever'&&distance(p,anchor)<=distance(sorted[0],anchor)+0.8)||sorted[0];
}
function selectTargets(targets,anchor,finish){
 let beam=[{remaining:targets.map((_,i)=>i),chosen:[],point:{x:anchor[0],y:anchor[1]},cost:0}];
 const count=targets.filter(t=>t.locations.length).length;
 beam[0].remaining=beam[0].remaining.filter(i=>targets[i].locations.length);
 for(let depth=0;depth<count;depth++){
  const next=[];
  for(const state of beam)for(const i of state.remaining)for(const point of targets[i].locations){
   if(point.zone!=='teldrassil')continue;
   next.push({remaining:state.remaining.filter(j=>j!==i),chosen:[...state.chosen,{target:targets[i],point}],point,cost:state.cost+distance(point,[state.point.x,state.point.y])});
  }
  beam=next.sort((a,b)=>(a.cost+distance(a.point,finish))-(b.cost+distance(b.point,finish))).slice(0,128);
 }
 return beam.sort((a,b)=>(a.cost+distance(a.point,finish))-(b.cost+distance(b.point,finish)))[0]?.chosen||[];
}
function combine(entries){
 const output=[];
 for(let i=0;i<entries.length;){
  const entry=entries[i];
  if(!entry.batch){output.push(entry);i++;continue;}
  const batch=[];while(i<entries.length&&entries[i].batch===entry.batch)batch.push(entries[i++]);
  const groups=[];
  for(const point of batch){
   // Complete-link bound: no chain of nearby points may grow into an entire zone.
   const group=groups.find(g=>!point.navigation_only&&g.every(p=>!p.navigation_only&&p.zone===point.zone&&distance(p.coords,[point.coords.x,point.coords.y])<=Math.min(p.radius,point.radius)));
   if(group)group.push(point);else groups.push([point]);
  }
  for(const group of groups){
   if(group.length===1){output.push(group[0]);continue;}
   const first=group[0],objectives=[...new Set(group.flatMap(p=>p.objectives))];
   const members=group.map(p=>({coords:p.coords,zone:p.zone,header:p.header,source:p.source,basis:p.basis,objectives:p.objectives,special:p.special,navigation_only:p.navigation_only||false}));
   const positions=new Set(members.map(p=>key({...p,...p.coords})));
   output.push({...first,objectives,members,sources:[...new Set(group.map(p=>p.source))],
    header:[`Combined objectives · ${objectives.length} quests`,`Objectifs groupés · ${objectives.length} quêtes`],
    special:[...new Map(group.flatMap(p=>p.special).map(n=>[JSON.stringify(n),n])).values()],
    grouped:true,area:positions.size>1});
  }
 }
 return output;
}
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
   if(q.requires.some(id=>!planned.has(id)))continue;
   if(event.kind==='starts')accepted.add(q.id);
   if(event.kind!=='starts'&&!accepted.has(q.id))continue;
   const tasks=[];
   if(event.navigation_point){tasks.push({point:event.navigation_point,notes:event.note?[event.note]:[],navigation_only:true});}
   else if(event.kind==='objectives'&&q.targets.length){
    const targets=event.target_indices?event.target_indices.map(i=>q.targets[i]):q.targets;
    const missing=targets.filter(t=>!t.locations.length).map(t=>[t.label,t.label]);
    const choices=event.optimize_targets?selectTargets(targets,event.anchor||[55,55],event.return_anchor||event.anchor||[55,55]):targets.map(target=>({target,point:pick(target.locations,event.anchor||[55,55])}));
    for(const {target,point} of choices){
     if(point){const label=point.label?point.label+' — '+target.label:target.label;tasks.push({point,notes:[[label,label],...(event.note?[event.note]:[])]});}
    }
    // Unknown item sources become preparation notes at the known supply stop; never fake coordinates.
    if(!tasks.length){const point=pick(q.locations.objectives.filter(p=>p.source_url||q.targets.length===1),event.anchor||[55,55]);if(point)tasks.push({point,notes:[],navigation_only:!point.source_url});}
    if(tasks.length)tasks[0].notes.push(...missing);
   }else{
    let points=q.locations[event.kind];
    if(event.kind==='objectives')points=[pick(points,event.anchor||[55,55])].filter(Boolean);
    for(const point of points)tasks.push({point,notes:event.note?[event.note]:[]});
   }
   if(!tasks.length)throw Error('Missing sourced location for '+q.id+' '+event.kind);
   const unique=new Map();
   for(const task of tasks){const k=key(task.point);if(unique.has(k))unique.get(k).notes.push(...task.notes);else unique.set(k,task);}
   for(const {point:p,notes,navigation_only} of unique.values()){
    const entry={coords:{x:p.x,y:p.y},zone:p.zone,type:event.kind==='objectives'?'objective':'quest',header:p.label||[q.en,q.fr],[event.kind]:['q'+q.id],special:notes,source:p.source_url||q.source_url,basis:p.basis,quest_id:q.id,navigation_only:!!navigation_only,batch:event.batch||null,radius:event.group_radius||5};
    const last=waypoints[waypoints.length-1];
    // Hubs never join an objective batch, even when the coordinates happen to match.
    if(!entry.batch&&last&&!last.batch&&last.zone===entry.zone&&distance(last.coords,[p.x,p.y])<0.001){
     last[event.kind]=[...new Set([...(last[event.kind]||[]),'q'+q.id])];last.special.push(...notes);last.sources=[...new Set([...(last.sources||[last.source]),entry.source])];
    }else waypoints.push(entry);
   }
   if(event.kind==='ends'){planned.add(q.id);accepted.delete(q.id);}
  }
  for(const w of combine(waypoints)){
   let stage=steps[steps.length-1];
   if(!stage||stage.chapter!==chapter.en||stage.zone!==w.zone){stage={zone:w.zone,experience:chapter.level,chapter:chapter.en,title:[chapter.en,chapter.fr],waypoints:[]};steps.push(stage);}
   stage.waypoints.push(w);
  }
 }
 return steps;
}
return {build,combine,pick,selectTargets};
});
