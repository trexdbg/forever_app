(function(root){
"use strict";
// Lightweight offline contour generator. These are density-guided areas,
// NOT assertions about WoW server pool memberships or active nodes.
const SIZE=100, MIN_SITES=5, MIN_CELLS=20;
const key=(x,y)=>x+","+y;
function contains(poly,x,y){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];
    if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
function simplify(vertices){
  const v=vertices.slice(0,-1);
  if(v.length<4)return v;
  const cleaned=[];
  for(let i=0;i<v.length;i++){
    const prev=v[(i+v.length-1)%v.length],point=v[i],next=v[(i+1)%v.length];
    const a=(point[0]-prev[0])*(next[1]-point[1])-(point[1]-prev[1])*(next[0]-point[0]);
    if(Math.abs(a)>.0001)cleaned.push(point);
  }
  if(cleaned.length<5)return cleaned;
  let smooth=cleaned;
  for(let round=0;round<2;round++){
    const next=[];
    for(let i=0;i<smooth.length;i++){
      const a=smooth[i],b=smooth[(i+1)%smooth.length];
      next.push([.75*a[0]+.25*b[0],.75*a[1]+.25*b[1]]);
      next.push([.25*a[0]+.75*b[0],.25*a[1]+.75*b[1]]);
    }
    smooth=next;
  }
  if(smooth.length>320){
    const step=Math.ceil(smooth.length/320);
    smooth=smooth.filter((_,i)=>i%step===0);
  }
  return smooth.map(([x,y])=>[Math.max(0,Math.min(100,x)),Math.max(0,Math.min(100,y))]);
}
function outline(cells){
  const occupied=new Set(cells);
  const edges=[],edgeFrom=new Map();
  const has=(x,y)=>x>=0&&y>=0&&x<SIZE&&y<SIZE&&occupied.has(y*SIZE+x);
  const add=(x,y,ex,ey)=>{
    const i=edges.length;edges.push({x,y,ex,ey,used:false});
    const k=key(x,y),a=edgeFrom.get(k)||[];a.push(i);edgeFrom.set(k,a);
  };
  for(const idx of cells){
    const x=idx%SIZE,y=Math.floor(idx/SIZE);
    if(!has(x,y-1))add(x,y,x+1,y);
    if(!has(x+1,y))add(x+1,y,x+1,y+1);
    if(!has(x,y+1))add(x+1,y+1,x,y+1);
    if(!has(x-1,y))add(x,y+1,x,y);
  }
  let best=[],largest=0;
  for(let i=0;i<edges.length;i++){
    if(edges[i].used)continue;
    const points=[],first=edges[i],start=key(first.x,first.y);
    let current=i;
    for(let turn=0;turn<=edges.length;turn++){
      const e=edges[current];
      if(e.used)break;
      e.used=true;points.push([e.x,e.y]);
      const where=key(e.ex,e.ey);
      if(where===start){points.push([first.x,first.y]);break}
      const candidates=(edgeFrom.get(where)||[]).filter(ix=>!edges[ix].used);
      if(!candidates.length)break;
      current=candidates[0];
    }
    if(points.length<5||key(...points.at(-1))!==start)continue;
    let signed=0;
    for(let k=1;k<points.length;k++)signed+=points[k-1][0]*points[k][1]-points[k][0]*points[k-1][1];
    const area=Math.abs(signed/2);
    if(area>largest){largest=area;best=points}
  }
  return largest>MIN_CELLS?simplify(best):[];
}
function uniqueSites(points){
  const seen=new Set(),out=[];
  for(const p of points){
    const x=+p[0],y=+p[1];
    if(!Number.isFinite(x)||!Number.isFinite(y))continue;
    const k=key(Math.round(x*4),Math.round(y*4));
    if(seen.has(k))continue;
    seen.add(k);out.push(p);
  }
  return out;
}
function densityAreas(points){
  const sites=uniqueSites(points);
  if(sites.length<MIN_SITES)return [];
  const signal=new Float32Array(SIZE*SIZE);
  const radius=8,rsq=radius*radius,sigma2=2*3.5*3.5;
  for(const p of sites){
    const minX=Math.max(0,Math.floor(p[0]-radius)),maxX=Math.min(SIZE-1,Math.ceil(p[0]+radius));
    const minY=Math.max(0,Math.floor(p[1]-radius)),maxY=Math.min(SIZE-1,Math.ceil(p[1]+radius));
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const d2=(x+.5-p[0])**2+(y+.5-p[1])**2;
      if(d2<rsq)signal[y*SIZE+x]+=Math.exp(-d2/sigma2);
    }
  }
  const mask=new Uint8Array(SIZE*SIZE);
  for(let i=0;i<signal.length;i++)mask[i]=signal[i]>=1.2?1:0;
  const seen=new Uint8Array(SIZE*SIZE),zones=[];
  for(let i=0;i<mask.length;i++){
    if(!mask[i]||seen[i])continue;
    const cells=[],stack=[i];seen[i]=1;
    while(stack.length){
      const ix=stack.pop();cells.push(ix);
      const x=ix%SIZE,y=(ix-x)/SIZE;
      for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
        if(nx<0||ny<0||nx>=SIZE||ny>=SIZE)continue;
        const at=ny*SIZE+nx;
        if(mask[at]&&!seen[at]){seen[at]=1;stack.push(at)}
      }
    }
    if(cells.length<MIN_CELLS)continue;
    const polygon=outline(cells);
    if(polygon.length<5)continue;
    const members=points.filter(p=>contains(polygon,p[0],p[1]));
    if(uniqueSites(members).length<MIN_SITES)continue;
    zones.push({polygon,points:members,label:"Secteur de prospection",source_kind:"density_estimate"});
  }
  return zones.sort((a,b)=>b.points.length-a.points.length).slice(0,18);
}
function fromCurated(definitions,points){
  const areas=[];
  for(const a of definitions||[]){
    if(!Array.isArray(a.polygon)||a.polygon.length<3)continue;
    const polygon=a.polygon;
    if(polygon.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>typeof v!=="number"||v<0||v>100)))continue;
    const members=points.filter(p=>contains(polygon,p[0],p[1]));
    if(!members.length)continue;
    areas.push({polygon,label:a.label,points:members,source_kind:"contributor_illustrative_boundary"});
  }
  return areas;
}
function center(area){
  const pts=area.points;
  const x=pts.reduce((s,p)=>s+p[0],0)/pts.length,y=pts.reduce((s,p)=>s+p[1],0)/pts.length;
  if(contains(area.polygon,x,y))return {x,y};
  return {x:area.polygon[0][0],y:area.polygon[0][1]};
}
root.MiningSectors={densityAreas,fromCurated,contains,center,uniqueSites};
})(typeof window!=="undefined"?window:globalThis);