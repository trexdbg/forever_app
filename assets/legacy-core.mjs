export function spent(build){return Object.values(build).reduce((n,x)=>n+x,0);}
export function inTree(data,build,tree,exclude){return data.perks.filter(p=>p.tree===tree&&p.id!==exclude).reduce((n,p)=>n+(build[p.id]||0),0);}
export function emptyBuild(data){return Object.fromEntries(data.perks.map(p=>[p.id,0]));}
export function valid(data,build){
 if(!build||typeof build!=="object"||Array.isArray(build)||spent(build)>data.seasonal_cap)return false;
 const known=new Set(data.perks.map(p=>p.id));
 if(Object.keys(build).some(k=>!known.has(k)))return false;
 return data.perks.every(p=>{
  const rank=build[p.id]??0;
  if(!Number.isInteger(rank)||rank<0||rank>p.max)return false;
  if(!rank)return true;
  if(inTree(data,build,p.tree,p.id)<p.gate)return false;
  return !p.requires||(build[p.requires.id]||0)>=p.requires.rank;
 });
}
export function add(data,build,id){const p=data.perks.find(p=>p.id===id);if(!p||build[id]>=p.max)return null;const next={...build,[id]:(build[id]||0)+1};return valid(data,next)?next:null;}
export function remove(data,build,id){if(!data.perks.some(p=>p.id===id)||!(build[id]>0))return null;const next={...build,[id]:build[id]-1};return valid(data,next)?next:null;}
export function encode(data,build){if(!valid(data,build))return null;return data.perks.map(p=>(build[p.id]||0).toString(36)).join("");}
export function decode(data,token){if(typeof token!=="string"||token.length!==data.perks.length||!/^[0-9a-z]+$/.test(token))return null;const build=Object.fromEntries(data.perks.map((p,i)=>[p.id,parseInt(token[i],36)]));return valid(data,build)?build:null;}
