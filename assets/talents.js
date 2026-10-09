import "./talents-fr.js?v=20261009-fr-final";
import "./talents-desc-fr.js?v=20261009-fr-final";
const ROOT="/";
const en=document.documentElement.lang==="en",T=(fr,english)=>en?english:fr;
const TREE_NAMES_FR={
 Warrior:{Arms:"Armes",Fury:"Fureur",Protection:"Protection"},
 Paladin:{Holy:"Sacré",Protection:"Protection",Retribution:"Vindicte"},
 Hunter:{"Beast Mastery":"Maîtrise des bêtes",Marksmanship:"Précision",Survival:"Survie"},
 Rogue:{Assassination:"Assassinat",Combat:"Combat",Subtlety:"Finesse"},
 Priest:{Discipline:"Discipline",Holy:"Sacré",Shadow:"Ombre"},
 Shaman:{Elemental:"Élémentaire",Enhancement:"Amélioration",Restoration:"Restauration"},
 Mage:{Arcane:"Arcanes",Fire:"Feu",Frost:"Givre"},
 Warlock:{Affliction:"Affliction",Demonology:"Démonologie",Destruction:"Destruction"},
 Druid:{Balance:"Équilibre","Feral Combat":"Combat farouche",Restoration:"Restauration"}
};
const localizedTree=(name)=>en?name:(TREE_NAMES_FR[cls]?.[name]||name);
const displayName=name=>en?name:(window.ForeverTalentNamesFR?.[cls]?.[name]||name);
const displayRankDescription=(talent,raw)=>en?{text:raw,translated:true}:(window.ForeverTalentDescFR?.translate(raw,cls,talent.name)||{text:raw,translated:false});
const cls=document.body.dataset.class, slug=document.body.dataset.slug;
const wrap=document.getElementById("talent-trees"), level=document.getElementById("talent-level"), left=document.getElementById("points-left"), version=document.getElementById("talent-version"), source=document.getElementById("talent-source"), message=document.getElementById("talent-message");
let trees=[],ranks=[],selected=[0,0,0],dataVersion="unknown";
const mk=(tag,text,css)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(css)el.className=css;return el};
const value=()=>Number(level.value)-9;
const points=(r=ranks)=>r.reduce((n,t)=>n+t.reduce((a,b)=>a+b,0),0);
const treePoints=(ti,r=ranks)=>r[ti].reduce((a,b)=>a+b,0);
const key=(ti,i)=>trees[ti].talents[i].name;
const reqIndex=(ti,i)=>trees[ti].talents.findIndex(x=>x.name===trees[ti].talents[i].req);
function canLearn(ti,i,r=ranks){const t=trees[ti].talents[i];const lower=trees[ti].talents.reduce((s,x,j)=>s+(Number(x.row)<Number(t.row)?r[ti][j]:0),0);if(lower<(Number(t.row)-1)*5)return false;if(t.req){const j=reqIndex(ti,i);if(j<0||r[ti][j]<Number(trees[ti].talents[j].max))return false}return true}
function legal(r=ranks){if(points(r)>value())return false;for(let ti=0;ti<trees.length;ti++){for(let i=0;i<trees[ti].talents.length;i++){const n=r[ti][i],t=trees[ti].talents[i];if(!Number.isInteger(n)||n<0||n>t.max||(n>0&&!canLearn(ti,i,r)))return false}}return true}
function blank(){return trees.map(t=>t.talents.map(()=>0))}
function say(s){message.textContent=s;clearTimeout(say.timer);if(s)say.timer=setTimeout(()=>{if(message.textContent===s)message.textContent=""},6000)}
function save(){try{localStorage.setItem("forever-atlas:talents:"+cls,JSON.stringify({version:dataVersion,level:Number(level.value),ranks}))}catch{}}
function restore(){try{const x=JSON.parse(localStorage.getItem("forever-atlas:talents:"+cls)||"null");if(x&&x.version===dataVersion&&Array.isArray(x.ranks)&&x.ranks.length===trees.length){level.value=String(x.level);if(!Number.isInteger(Number(level.value))||Number(level.value)<10||Number(level.value)>60)level.value="60";if(x.ranks.every((a,i)=>Array.isArray(a)&&a.length===trees[i].talents.length)){const b=x.ranks.map(a=>a.map(Number));if(legal(b))ranks=b}}}catch{}}
function change(ti,i,delta){const current=ranks[ti][i],t=trees[ti].talents[i],next=current+delta;if(next<0||next>t.max)return;if(delta>0){if(points()>=value()){say(T("Plus de points disponibles à ce niveau.","No talent points left at this level."));return}if(!canLearn(ti,i)){say(T("Palier ou prérequis non rempli pour ","Tier or prerequisite not met for ")+displayName(t.name)+".");return}}const candidate=ranks.map(a=>a.slice());candidate[ti][i]=next;if(!legal(candidate)){say(T("Ce retrait invaliderait d'autres talents déjà choisis.","Removing this point would invalidate other selected talents."));return}ranks=candidate;selected[ti]=i;save();render()}
// A compact Classic-like tree: each prerequisite is a real connection from the source data.
const svgNS="http://www.w3.org/2000/svg";
const classAccents={Warrior:"#c69b6d",Paladin:"#f48cba",Hunter:"#aad372",Rogue:"#fff468",Priest:"#f6f6f6",Shaman:"#63a5f5",Mage:"#3fc7eb",Warlock:"#a5a6ef",Druid:"#ff9d4a"};
document.getElementById("talent-app")?.style.setProperty("--talent-accent",classAccents[cls]||"#d6b678");
function svgElement(tag,attributes={}){const el=document.createElementNS(svgNS,tag);for(const [name,v] of Object.entries(attributes))el.setAttribute(name,String(v));return el}
function treeLinks(ti){
  const svg=svgElement("svg",{class:"talent-links",viewBox:"0 0 400 700",preserveAspectRatio:"none","aria-hidden":"true",focusable:"false"});
  const all=trees[ti].talents;
  for(let i=0;i<all.length;i++){
    const t=all[i];
    if(!t.req)continue;
    const j=reqIndex(ti,i);
    if(j<0)continue;
    const parent=all[j],parentRank=ranks[ti][j];
    const state=parentRank===parent.max?(ranks[ti][i]>0?"is-invested":"is-ready"):parentRank>0?"is-partial":"is-locked";
    const sx=(parent.col-.5)*100,sy=(parent.row-.5)*100,tx=(t.col-.5)*100,ty=(t.row-.5)*100;
    let d,tip;
    if(sy===ty){
      const dir=Math.sign(tx-sx)||1,tipX=tx-dir*38;
      d="M "+(sx+dir*38)+" "+sy+" H "+(tipX-dir*10);
      tip=tipX+","+ty+" "+(tipX-dir*10)+","+(ty-7)+" "+(tipX-dir*10)+","+(ty+7);
    }else{
      const tipY=ty-39;
      if(sx===tx)d="M "+sx+" "+(sy+39)+" V "+(tipY-10);
      else{const elbow=ty-61;d="M "+sx+" "+(sy+39)+" V "+elbow+" H "+tx+" V "+(tipY-10)}
      tip=tx+","+tipY+" "+(tx-8)+","+(tipY-10)+" "+(tx+8)+","+(tipY-10);
    }
    const link=svgElement("g",{class:"talent-link "+state});
    link.append(svgElement("path",{d}),svgElement("polygon",{points:tip}));
    svg.append(link);
  }
  return svg;
}
function detail(ti,i){
  const panel=document.getElementById("tree-detail-"+ti);
  if(!panel||!trees[ti]?.talents[i])return;
  const t=trees[ti].talents[i],n=ranks[ti][i],preview=Math.min(t.max,n+1);
  const description=Array.isArray(t.desc)?(t.desc[preview-1]||T("Description de ce rang non documentée.","No description documented for this rank.")):T("Description non disponible.","Description unavailable.");
  const localizedDescription=displayRankDescription(t,description);
  const known=!t.confirmed||t.confirmed.includes(preview);
  panel.replaceChildren();
  panel.append(mk("strong",displayName(t.name)),mk("small",T("Rang ","Rank ")+n+" / "+t.max+(n===t.max?T(" · Maîtrisé"," · Maxed"):n?T(" · En cours"," · In progress"):T(" · Non appris"," · Not learned"))));
  const rankText=mk("p",localizedDescription.text);
  if(!en&&!localizedDescription.translated)rankText.lang="en";
  panel.append(rankText);
  if(!en&&!localizedDescription.translated){
    panel.append(mk("small","Description originale (anglais) · traduction non disponible","talent-locale-status"));
  }
  if(!known)panel.append(mk("small",T("Rang non confirmé dans l'export de référence.","Rank not confirmed in source data.")));
  if(t.req){
    const j=reqIndex(ti,i),done=j>=0&&ranks[ti][j]===trees[ti].talents[j].max;
    panel.append(mk("small",(done?T("✓ Prérequis validé : ","✓ Prerequisite met: "):T("Prérequis : ","Prerequisite: "))+displayName(t.req)));
  }
  if(!canLearn(ti,i))panel.append(mk("small",T("Débloqué après les points nécessaires dans les paliers précédents et ses prérequis.","Unlock by spending enough points in earlier tiers and meeting prerequisites."),"detail-warning"));
  if(t.classic?.status&&t.classic.status!=="same")panel.append(mk("small",T("Différence Classic : ","Classic difference: ")+(en?t.classic.status:({new:"nouveau",changed:"modifié",moved:"déplacé"}[t.classic.status]||t.classic.status))));
}
function render(){
  left.textContent=String(value()-points());
  wrap.replaceChildren();
  for(let ti=0;ti<trees.length;ti++){
    const tree=trees[ti],card=mk("section",undefined,"tree-card"),header=mk("div",undefined,"tree-head");
    header.append(mk("h2",localizedTree(tree.name)),mk("strong",treePoints(ti)+" pts"));
    card.append(header);
    const grid=mk("div",undefined,"talent-grid");
    grid.setAttribute("aria-label",T("Arbre ","Talent tree ")+localizedTree(tree.name)+T(" : sélection des talents",": talent selection"));
    grid.append(treeLinks(ti));
    for(let i=0;i<tree.talents.length;i++){
      const t=tree.talents[i],rank=ranks[ti][i],locked=!canLearn(ti,i),noPoints=points()>=value();
      const cell=mk("div",undefined,"talent-cell");
      cell.style.setProperty("--row",String(t.row));
      cell.style.setProperty("--col",String(t.col));
      const button=mk("button",undefined,"talent-node"+(rank===t.max?" maxed":"")+(locked?" locked":"")+(rank>0?" learned":"")+(selected[ti]===i?" selected":"")+(noPoints&&rank<t.max?" no-points":""));
      button.type="button";
      // Keep locked nodes accessible by mouse, touch and keyboard for talent details.
      button.setAttribute("aria-disabled",String(rank===t.max||locked||noPoints));
      button.setAttribute("aria-label",displayName(t.name)+T(", rang ",", rank ")+rank+T(" sur "," of ")+t.max+(t.req?T(", prérequis ",", requires ")+displayName(t.req):"")+T(". Cliquer pour consulter ou ajouter un point.",". Select to view details or add a point."));
      button.title=displayName(t.name)+(t.req?T(" — nécessite "," — requires ")+displayName(t.req):"");
      const icon=mk("span",undefined,"icon-wrap");
      const fallback=()=>{icon.replaceChildren(document.createTextNode(displayName(t.name).charAt(0)))};
      if(typeof t.icon==="string"&&/^[a-z0-9_-]{2,65}$/.test(t.icon)){
        const img=document.createElement("img");
        img.alt="";img.loading="lazy";img.decoding="async";img.width=56;img.height=56;
        let remoteFallback=false;
        img.onerror=()=>{if(!remoteFallback){remoteFallback=true;img.src="https://wow.zamimg.com/images/wow/icons/large/"+t.icon+".jpg"}else fallback()};
        img.src=ROOT+"assets/icons/"+t.icon+".jpg";
        icon.append(img);
      }else fallback();
      button.append(icon,mk("span",displayName(t.name),"node-name"),mk("span",rank+"/"+t.max,"rank"+(rank?" points":"")));
      const choose=()=>{selected[ti]=i;grid.querySelectorAll(".talent-node.selected").forEach(node=>node.classList.remove("selected"));button.classList.add("selected");detail(ti,i)};
      button.addEventListener("mouseenter",choose);
      button.addEventListener("focus",choose);
      button.addEventListener("click",()=>{
        choose();
        if(rank>=t.max)return;
        if(locked){say(T("Palier ou prérequis non rempli pour ","Tier or prerequisite not met for ")+displayName(t.name)+".");return}
        if(noPoints){say(T("Plus de points disponibles à ce niveau.","No talent points left at this level."));return}
        change(ti,i,1);
      });
      button.addEventListener("contextmenu",e=>{e.preventDefault();choose();change(ti,i,-1)});
      button.addEventListener("keydown",e=>{if(e.key==="Backspace"||e.key==="Delete"){e.preventDefault();choose();change(ti,i,-1)}});
      cell.append(button);
      if(rank>0){
        const minus=mk("button","−","talent-minus");
        minus.type="button";
        minus.setAttribute("aria-label",T("Retirer un point de ","Remove a point from ")+displayName(t.name));
        minus.title=T("Retirer un point","Remove a point");
        minus.addEventListener("click",()=>change(ti,i,-1));
        cell.append(minus);
      }
      grid.append(cell);
    }
    card.append(grid);
    const d=mk("div",undefined,"talent-details");
    d.id="tree-detail-"+ti;
    d.setAttribute("aria-live","polite");
    card.append(d);
    wrap.append(card);
    detail(ti,Math.min(selected[ti]||0,tree.talents.length-1));
  }
}
function parseHash(){if(!location.hash.startsWith("#b="))return;try{const b=location.hash.slice(3).replace(/-/g,"+").replace(/_/g,"/");const data=JSON.parse(atob(b));if(data.c!==cls||data.v!==dataVersion||!Number.isInteger(data.l)||data.l<10||data.l>60||!Array.isArray(data.p))throw Error(T("Version ou classe non compatible","Incompatible version or class"));const clean=blank();for(const entry of data.p){if(!Array.isArray(entry)||entry.length!==3)throw Error(T("Allocations invalides","Invalid talent allocations"));const [ti,i,n]=entry;if(!Number.isInteger(ti)||!Number.isInteger(i)||!Number.isInteger(n)||ti<0||ti>=trees.length||i<0||i>=trees[ti].talents.length||n<0||n>trees[ti].talents[i].max)throw Error(T("Allocations invalides","Invalid talent allocations"));clean[ti][i]=n}const before=level.value;level.value=String(data.l);if(!legal(clean)){level.value=before;throw Error(T("Allocation non valide","Invalid talent allocation"))}ranks=clean;save();say(T("Build partagé chargé.","Shared build loaded."))}catch(e){say(T("Lien de build incompatible ou invalide : ","Invalid or incompatible build link: ")+e.message)}}
function share(){const picks=[];ranks.forEach((a,ti)=>a.forEach((n,i)=>{if(n)picks.push([ti,i,n])}));const payload={v:dataVersion,c:cls,l:Number(level.value),p:picks},hash=btoa(JSON.stringify(payload)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""),url=location.origin+location.pathname+"#b="+hash;history.replaceState(null,"",url);if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(()=>say(T("Lien copié !","Link copied!"))).catch(()=>say(T("Lien créé dans la barre d'adresse : copiez-le.","Link created in the address bar. Copy it from there.")))}else say(T("Lien créé dans la barre d'adresse : copiez-le.","Link created in the address bar. Copy it from there."))}
async function load(){try{let data;try{const r=await fetch(ROOT+"data/talents.json",{cache:"no-cache"});if(!r.ok)throw Error("not synced");data=await r.json()}catch{const r=await fetch("https://talentsforever.com/data.json",{mode:"cors"});if(!r.ok)throw Error("remote unavailable");data=await r.json();say(T("Mode source directe : configurez l'import quotidien pour les accès hors ligne.","Using remote talent data. Enable daily synchronization for offline access."))}const classes=data.classes||data.talents;if(!classes||!classes[cls]||!Array.isArray(classes[cls].trees)||classes[cls].trees.length!==3)throw Error(T("Classe absente du jeu de données","Class missing from talent data"));const total=Object.values(classes).reduce((s,c)=>s+(c.trees||[]).reduce((n,t)=>n+(t.talents||[]).length,0),0);if(total<400)throw Error(T("Jeu de données incomplet","Incomplete talent data"));trees=classes[cls].trees;for(const t of trees){if(!Array.isArray(t.talents)||!t.talents.length)throw Error(T("Arbre incomplet","Incomplete talent tree"));for(const x of t.talents)if(!x.name||!Number.isInteger(x.max)||x.max<1||x.max>5||!Number.isInteger(x.row)||x.row<1||x.row>7||!Number.isInteger(x.col)||x.col<1||x.col>4)throw Error(T("Position ou rang invalide","Invalid talent position or rank"))}dataVersion=String(data.version||data.generated_at||data.generated||T("snapshot-inconnu","unknown-snapshot"));version.textContent=T("Instantané : ","Snapshot: ")+dataVersion+" · "+total+T(" talents dans les neuf classes."," talents across all nine classes.");source.textContent=T("Données bêta communautaires","Community beta data");ranks=blank();restore();parseHash();document.getElementById("talent-reset").addEventListener("click",()=>{ranks=blank();save();render();say(T("Build réinitialisé.","Build reset."))});document.getElementById("talent-share").addEventListener("click",share);level.addEventListener("change",()=>{if(points()>value()){level.value=String(points()+9);say(T("Niveau minimum pour cette répartition : ","Minimum level for this build: ")+(points()+9))}save();render()});render()}catch(e){source.textContent=T("Données indisponibles","Data unavailable");wrap.replaceChildren();const p=mk("p",T("Le constructeur ne peut pas charger les talents vérifiés : ","Cannot load verified talent data: ")+e.message+T(". Lancez l'action de synchronisation dans le dépôt privé (secret PUBLIC_REPO_TOKEN).",". Run the sync workflow in the private repository (PUBLIC_REPO_TOKEN secret)."),"empty-state");wrap.append(p);left.textContent="—"}}
load();