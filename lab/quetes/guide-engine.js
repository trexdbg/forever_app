/* ForEveroth curated Classic quest guide. Pure functions, no player log or browser APIs. */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 root.ForeverCuratedGuide=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const ACTION_TYPES=[["starts","accept"],["objectives","objective"],["ends","turnin"],["completed","instant"]];
 const str=v=>String(v===undefined||v===null?"":v);
 const num=v=>v!==""&&v!==null&&v!==undefined&&Number.isFinite(Number(v))?Number(v):null;
 const normalize=v=>str(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
 const cleanTitle=v=>str(v).replace(/(^|\s)([a-z])/g,(_,gap,c)=>gap+c.toUpperCase());
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
 function refDetails(ref,data,levels){
   const original=Array.isArray(ref)?ref[0]:ref;
   const phase=Array.isArray(ref)?str(ref.slice(1).join(" ")):"";
   const raw=data.quest_ids?.[original];
   const match=phase.match(/(?:^|[\s,])p(\d+)/i);
   const rawId=Array.isArray(raw)?raw[clamp(match?Number(match[1])-1:0,0,raw.length-1)]:raw;
   const id=num(rawId);
   const level=num(id===null?null:levels?.[str(id)]);
   return {
     id:id!==null&&id>0?id:null,
     key:id!==null&&id>0?"id:"+id:"name:"+normalize(original)+(phase?":"+phase.replace(/\W+/g,"-"):""),
     original:str(original),fr:str(id!==null?data.translations?.[str(id)]:"")||cleanTitle(original),
     en:cleanTitle(original),level:level!==null&&level>0?level:null,
     dungeon:/\bd\b/i.test(phase)
   };
 }
 function dungeonFor(w,curation){
   const header=normalize(w.header);
   return (curation.dungeons||[]).find(d=>header.includes(normalize(d.pattern)))||null;
 }
 function nearbyClusters(points,radius=9){
   const result=[];
   for(const point of points){
     const last=result[result.length-1];
     const eligible=p=>p.actions.length>0&&p.actions.every(a=>a.kind==="objective");
     if(last&&eligible(point)&&eligible(last)&&distance(last,point)<=radius&&last.members.length<5){
       last.members.push(...point.members);
       const n=last.members.length;
       last.x=last.members.reduce((acc,p)=>acc+p.x,0)/n;
       last.y=last.members.reduce((acc,p)=>acc+p.y,0)/n;
       const existing=new Set(last.actions.map(a=>a.key+":"+a.kind));
       for(const a of point.actions)if(!existing.has(a.key+":"+a.kind)){last.actions.push(a);existing.add(a.key+":"+a.kind);}
       last.notes.push(...point.notes);
       last.clustered=true;
     }else result.push(point);
   }
   for(const point of result){
     if(point.actions.filter(a=>a.kind==="objective").length>=2)point.clustered=true;
     point.notes=Array.from(new Set(point.notes));
   }
   return result;
 }
 function build({data,manifest,levels={},curation={},profile,level=5,mode="solo"}){
   if(!data||!data.routes?.[profile]||!Array.isArray(data.routes.shared))throw Error("Unknown guide profile");
   if(!["solo","essentials"].includes(mode))throw Error("Unknown guide variant");
   if(curation.schema_version!==1)throw Error("Invalid curation");
   const faction=data.faction;
   const playerLevel=clamp(num(level)??5,5,60);
   const stages=[...data.routes[profile],...data.routes.shared].map((stage,index)=>({...stage,index}));
   // Dungeon quests are identified by their source 'd' marker, preserving separate quest-chain phases.
   const dungeonIds=new Set();
   const dungeonKeyToCategory=new Map();
   for(const stage of stages)for(const wp of stage.waypoints||[]){
     const dungeon=dungeonFor(wp,curation);
     for(const [field] of ACTION_TYPES)for(const ref of wp[field]||[]){
       const d=refDetails(ref,data,levels);
       if(d.dungeon)dungeonIds.add(d.key);
       if(dungeon&&d.dungeon)dungeonKeyToCategory.set(d.key,dungeon.id);
     }
   }
   const allowedDungeon=new Set((curation.dungeons||[]).filter(d=>d.faction===faction).map(d=>d.id));
   let excludedOverLevel=0,excludedDungeons=0;
   const range=stages.filter(stage=>{
     const expected=Math.floor(num(stage.experience)??0);
     return expected<=playerLevel&&expected>=playerLevel-1;
   });
   // When an uncommon level has no stage, use the nearest past guide stage instead of a blank page.
   const selectedStages=range.length?range:stages.filter(s=>Math.floor(num(s.experience)??0)<=playerLevel).slice(-2);
   const planned=[];
   for(const stage of selectedStages){
     let points=[];
     for(const wp of stage.waypoints||[]){
       const pointDungeon=dungeonFor(wp,curation);
       let actions=[];
       for(const [field,kind] of ACTION_TYPES)for(const ref of wp[field]||[]){
         const q=refDetails(ref,data,levels);
         const dungeon=q.dungeon||dungeonIds.has(q.key)||Boolean(pointDungeon&&kind==="objective");
         const category=pointDungeon?.id||dungeonKeyToCategory.get(q.key);
         if(dungeon&&(mode==="solo"||!category||!allowedDungeon.has(category))){
           excludedDungeons++;continue;
         }
         if(q.level!==null&&q.level>playerLevel){excludedOverLevel++;continue;}
         actions.push({...q,kind});
       }
       const notes=Array.isArray(wp.special)?wp.special.map(v=>Array.isArray(v)?str(v[0]):str(v)).filter(Boolean):[];
       const xy=wp.coords||{},x=num(xy.x),y=num(xy.y);
       if(x===null||y===null||x<0||y<0||x>100||y>100)continue;
       const isDungeonPoint=Boolean(pointDungeon);
       // A dungeon room is not an outdoor stop when its dungeon quests have been filtered.
       if(isDungeonPoint&&!actions.length)continue;
       // Omit uninformative "placeholder" points and unrelated travel notes.
       if(!actions.length&&!(notes.length&&!isDungeonPoint))continue;
       const actionable=actions.length>0;
       points.push({
         key:"st"+stage.index+"-wp"+points.length,
         header:str(wp.header)||str(stage.zone),
         x,y,zone:stage.zone,kind:wp.type||"quest",notes,
         actions,clustered:false,actionable,
         dungeonId:pointDungeon?.id||null,
         members:[{x,y,header:str(wp.header)}]
       });
     }
     points=nearbyClusters(points,curation.policies?.nearby_objective_radius??9);
     const groupedExamples=(curation.grouped_examples||[]).filter(h=>h.zone===stage.zone&&points.some(p=>{
       const names=new Set(p.actions.map(a=>normalize(a.original)));
       return h.quests.every(q=>names.has(normalize(q)));
     }));
     if(points.length)planned.push({index:stage.index,zone:stage.zone,expected:num(stage.experience),points,hints:groupedExamples});
   }
   const preparations=(curation.preparations||[]).filter(p=>
     p.faction===faction&&(!p.profile||p.profile===profile)&&
     playerLevel>=p.during[0]&&playerLevel<=p.during[1]).sort((a,b)=>a.level-b.level);
   // Preserve purchase/save hints from the original walkthrough without implying that
   // they are verified quest requirements. Discover them a little before the future stop.
   const seenNotes=new Set();
   const alreadyCurated=(note)=>{
     const key=normalize(note).replace(/^buy\s+/,"").replace(/^save\s+/,"").replace(/^\d+x\s+/,"")
       .replace(/^(?:a|an)\s+/,"");
     return (curation.preparations||[]).some(p=>{
       const target=normalize(p.name?.en);
       return target.includes(key)||key.includes(target) ||
         (key.includes("flask of oil")&&p.id==="flask-oil") ||
         (key.includes("skinning knife")&&p.id==="skinning-knife");
     });
   };
   for(const st of stages){
     const when=Math.floor(num(st.experience)??0);
     if(when<playerLevel||when>playerLevel+2)continue;
     for(const wp of st.waypoints||[])for(const raw of wp.special||[]){
       const note=str(Array.isArray(raw)?raw[0]:raw).trim();
       if(!/^(?:buy\b|save\s+\d+x\b)/i.test(note) || /buy (?:greens for selling|any remaining manual pages)/i.test(note))continue;
       const normalized=normalize(note);
       if(seenNotes.has(normalized)||alreadyCurated(note))continue;
       seenNotes.add(normalized);
       const kind=/^save\b/i.test(note)?"gather":"guide";
       preparations.push({
         id:"route-note:"+normalized,kind,fromGuideAuto:true,rawNote:note,level:when,
         quantity:1,faction,source:"guide",
         name:{fr:note,en:note},
         reason:{
           fr:"Note communautaire relevée vers "+(manifest.zones?.[st.zone]||st.zone)+" ; achat ou conservation à confirmer en jeu.",
           en:"Original route note near "+st.zone+"; purchase or item saving not independently verified."
         }
       });
       if(preparations.filter(p=>p.fromGuideAuto).length>=4)break;
     }
     if(preparations.filter(p=>p.fromGuideAuto).length>=4)break;
   }
   preparations.sort((a,b)=>a.level-b.level);
   const dungeons=mode==="essentials"?(curation.dungeons||[]).filter(d=>
     d.faction===faction&&playerLevel>=d.level&&playerLevel<=d.level+d.window
   ):[];
   return {profile,faction,level:playerLevel,mode,stages:planned,preparations,dungeons,
     excludedOverLevel,excludedDungeons,source:data.source_commit,mapBase:manifest.map_base||"",
     zones:manifest.zones||{},strict:true};
 }
 return {build,refDetails,nearbyClusters};
});