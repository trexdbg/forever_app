import {spent,inTree,emptyBuild,valid,add,remove,encode,decode} from "./legacy-core.mjs";
const en=document.documentElement.lang==="en",lang=en?"en":"fr";
const t=(fr,eng)=>en?eng:fr;
const root=document.getElementById("legacy-trees");
const msg=document.getElementById("legacy-feedback");
const counter=document.getElementById("legacy-spent");
const remaining=document.getElementById("legacy-left");
let data,build;
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const localKey="foreveroth-legacy-v1";
function inform(value){msg.textContent=value;}
function rankEffect(p,count){
 const idx=Math.max(0,Math.min(p.max-1,(count||1)-1));
 return p.effect[lang].replaceAll("{v}",String(p.values[idx])).replaceAll("{v5}",String(p.values[idx]*5));
}
function storageRead(){try{return localStorage.getItem(localKey)}catch{return null}}
function storageWrite(value){try{localStorage.setItem(localKey,value)}catch{}}
function linkFor(value){const url=new URL(location.href);url.searchParams.set("build",value);return url.toString();}
function persist(){
 const token=encode(data,build);
 storageWrite(token);
 const url=new URL(location.href);
 url.searchParams.set("build",token);
 history.replaceState(null,"",url.pathname+url.search+url.hash);
}
function node(p){
 const rank=build[p.id]||0,canPlus=Boolean(add(data,build,p.id)),canMinus=Boolean(remove(data,build,p.id));
 const dependency=p.requires?data.perks.find(x=>x.id===p.requires.id):null;
 let reason="";
 if(rank<p.max&&!canPlus){
  if(spent(build)>=data.seasonal_cap)reason=t("Plafond de 16 points atteint","16-point cap reached");
  else if(dependency&&(build[dependency.id]||0)<p.requires.rank)reason=t("Prérequis : ","Requires: ")+dependency.name[lang]+" "+p.requires.rank+"/"+dependency.max;
  else if(inTree(data,build,p.tree,p.id)<p.gate)reason=t("Débloqué à ","Unlocks after ")+p.gate+t(" autres points dans cet arbre"," other points in this tree");
 }
 const gateText=p.gate?t("Seuil : ","Gate: ")+p.gate+" "+t("points","points"):"";
 const preText=dependency?t("Dépend de ","Prerequisite: ")+dependency.name[lang]+" "+p.requires.rank+"/"+dependency.max:"";
 const info=[gateText,preText].filter(Boolean).join(" · ");
 return '<article class="legacy-node '+(rank?"is-picked ":"")+(canPlus||rank?"":"is-locked")+'">'+
  '<div class="legacy-node-top"><span class="legacy-token" aria-hidden="true">'+escape(p.name[lang].slice(0,2).toUpperCase())+'</span><span class="legacy-node-title">'+escape(p.name[lang])+'</span><strong class="legacy-rank">'+rank+'/'+p.max+'</strong></div>'+
  '<div class="legacy-rank-track" aria-hidden="true"><span style="width:'+(rank/p.max*100)+'%"></span></div>'+
  '<p>'+escape(rankEffect(p,rank))+'</p>'+
  (info?'<div class="legacy-requires">'+escape(info)+'</div>':'')+
  (reason?'<div class="legacy-requires">'+escape(reason)+'</div>':'')+
  '<div class="legacy-actions"><button type="button" data-action="remove" data-id="'+p.id+'" '+(!canMinus?"disabled":"")+' aria-label="'+escape(t("Retirer un point de ","Remove a point from ")+p.name[lang])+'">−</button>'+
  '<button type="button" data-action="add" data-id="'+p.id+'" '+(!canPlus?"disabled":"")+' aria-label="'+escape(t("Ajouter un point à ","Add a point to ")+p.name[lang])+'">+</button>'+
  '<span>'+escape(t(rank?"Rang actuel":"Prochain rang",rank?"Current rank":"Next rank"))+'</span></div></article>';
}
function tree(tree){
 const perks=data.perks.filter(p=>p.tree===tree.id);
 const current=inTree(data,build,tree.id,null);
 const tiers=[0,5,10].map(gate=>{
  const nodes=perks.filter(p=>p.gate===gate);
  return nodes.length?'<div class="legacy-gate">'+escape(gate===0?t("Accessible immédiatement","Starting perks"):t("Après "+gate+" points","After "+gate+" points"))+'</div><div class="legacy-nodes">'+nodes.map(node).join("")+'</div>':"";
 }).join("");
 return '<section class="legacy-tree" aria-label="'+escape(tree.name[lang])+'"><div class="legacy-head"><span class="legacy-emblem" aria-hidden="true">'+escape(tree.symbol)+'</span><h2>'+escape(tree.name[lang])+'</h2><span class="legacy-tree-points">'+current+' '+t("pts","pts")+'</span></div>'+tiers+'</section>';
}
function render(){counter.textContent=spent(build);remaining.textContent=data.seasonal_cap-spent(build);root.innerHTML=data.trees.map(tree).join("");}
function edit(id,action){const next=action==="add"?add(data,build,id):remove(data,build,id);if(!next){inform(t("Action bloquée par le plafond ou les prérequis.","Blocked by the cap or prerequisites."));return;}build=next;persist();render();inform("");}
root.addEventListener("click",event=>{const btn=event.target.closest("button[data-action]");if(btn)edit(btn.dataset.id,btn.dataset.action);});
document.getElementById("legacy-reset").addEventListener("click",()=>{build=emptyBuild(data);persist();render();inform(t("Répartition réinitialisée.","Allocation reset."));});
document.getElementById("legacy-share").addEventListener("click",async()=>{
 const url=linkFor(encode(data,build));
 try{await navigator.clipboard.writeText(url);inform(t("Lien copié !","Link copied!"))}
 catch{const input=document.createElement("input");input.value=url;input.style.position="absolute";input.style.left="-9999px";document.body.append(input);input.select();const ok=document.execCommand("copy");input.remove();inform(ok?t("Lien copié !","Link copied!"):t("Copiez cette adresse : ","Copy this URL: ")+url)}
});
try{
 const response=await fetch("/data/legacy-talents.json",{cache:"no-cache"});
 if(!response.ok)throw Error("HTTP "+response.status);
 data=await response.json();
 if(data.perks.length!==21||data.seasonal_cap!==16)throw Error("Data invalid");
 const query=new URL(location.href).searchParams.get("build");
 build=query!==null?decode(data,query):decode(data,storageRead());
 if(!build){build=emptyBuild(data);if(query!==null)inform(t("Lien non valide : arbre remis à zéro.","Invalid link: allocation reset."));}
 if(!valid(data,build))build=emptyBuild(data);
 render();
}catch(error){root.textContent=t("Impossible de charger les données d'Héritage. Réessayez plus tard.","Unable to load Legacy data. Please try again.");inform(String(error.message||error));}
