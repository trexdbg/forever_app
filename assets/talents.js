const ROOT="/forever_app/";
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
function change(ti,i,delta){const current=ranks[ti][i],t=trees[ti].talents[i],next=current+delta;if(next<0||next>t.max)return;if(delta>0){if(points()>=value()){say("Plus de points disponibles à ce niveau.");return}if(!canLearn(ti,i)){say("Palier ou prérequis non rempli pour "+t.name+".");return}}const candidate=ranks.map(a=>a.slice());candidate[ti][i]=next;if(!legal(candidate)){say("Ce retrait invaliderait d'autres talents déjà choisis.");return}ranks=candidate;selected[ti]=i;save();render()}
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
  const description=Array.isArray(t.desc)?(t.desc[preview-1]||"Description de ce rang non documentée."):"Description non disponible.";
  const known=!t.confirmed||t.confirmed.includes(preview);
  panel.replaceChildren();
  panel.append(mk("strong",t.name),mk("small","Rang "+n+" / "+t.max+(n===t.max?" · Maîtrisé":n?" · En cours":" · Non appris")));
  panel.append(mk("p",description));
  if(!known)panel.append(mk("small","Rang non confirmé dans l'export de référence."));
  if(t.req){
    const j=reqIndex(ti,i),done=j>=0&&ranks[ti][j]===trees[ti].talents[j].max;
    panel.append(mk("small",(done?"✓ Prérequis validé : ":"Prérequis : ")+t.req));
  }
  if(!canLearn(ti,i))panel.append(mk("small","Débloqué après les points nécessaires dans les paliers précédents et ses prérequis.","detail-warning"));
  if(t.classic?.status&&t.classic.status!=="same")panel.append(mk("small","Différence Classic : "+t.classic.status));
}
function render(){
  left.textContent=String(value()-points());
  wrap.replaceChildren();
  for(let ti=0;ti<trees.length;ti++){
    const tree=trees[ti],card=mk("section",undefined,"tree-card"),header=mk("div",undefined,"tree-head");
    header.append(mk("h2",tree.name),mk("strong",treePoints(ti)+" pts"));
    card.append(header);
    const grid=mk("div",undefined,"talent-grid");
    grid.setAttribute("aria-label","Arbre "+tree.name+" : sélection des talents");
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
      button.setAttribute("aria-label",t.name+", rang "+rank+" sur "+t.max+(t.req?", prérequis "+t.req:"")+". Cliquer pour consulter ou ajouter un point.");
      button.title=t.name+(t.req?" — nécessite "+t.req:"");
      const icon=mk("span",undefined,"icon-wrap");
      const fallback=()=>{icon.replaceChildren(document.createTextNode(t.name.charAt(0)))};
      if(typeof t.icon==="string"&&/^[a-z0-9_-]{2,65}$/.test(t.icon)){
        const img=document.createElement("img");
        img.alt="";img.loading="lazy";img.decoding="async";img.width=56;img.height=56;
        let remoteFallback=false;
        img.onerror=()=>{if(!remoteFallback){remoteFallback=true;img.src="https://wow.zamimg.com/images/wow/icons/large/"+t.icon+".jpg"}else fallback()};
        img.src=ROOT+"assets/icons/"+t.icon+".jpg";
        icon.append(img);
      }else fallback();
      button.append(icon,mk("span",t.name,"node-name"),mk("span",rank+"/"+t.max,"rank"+(rank?" points":"")));
      const choose=()=>{selected[ti]=i;grid.querySelectorAll(".talent-node.selected").forEach(node=>node.classList.remove("selected"));button.classList.add("selected");detail(ti,i)};
      button.addEventListener("mouseenter",choose);
      button.addEventListener("focus",choose);
      button.addEventListener("click",()=>{
        choose();
        if(rank>=t.max)return;
        if(locked){say("Palier ou prérequis non rempli pour "+t.name+".");return}
        if(noPoints){say("Plus de points disponibles à ce niveau.");return}
        change(ti,i,1);
      });
      button.addEventListener("contextmenu",e=>{e.preventDefault();choose();change(ti,i,-1)});
      button.addEventListener("keydown",e=>{if(e.key==="Backspace"||e.key==="Delete"){e.preventDefault();choose();change(ti,i,-1)}});
      cell.append(button);
      if(rank>0){
        const minus=mk("button","−","talent-minus");
        minus.type="button";
        minus.setAttribute("aria-label","Retirer un point de "+t.name);
        minus.title="Retirer un point";
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
function parseHash(){if(!location.hash.startsWith("#b="))return;try{const b=location.hash.slice(3).replace(/-/g,"+").replace(/_/g,"/");const data=JSON.parse(atob(b));if(data.c!==cls||data.v!==dataVersion||!Number.isInteger(data.l)||data.l<10||data.l>60||!Array.isArray(data.p))throw Error("Version ou classe non compatible");const clean=blank();for(const entry of data.p){if(!Array.isArray(entry)||entry.length!==3)throw Error("Allocations invalides");const [ti,i,n]=entry;if(!Number.isInteger(ti)||!Number.isInteger(i)||!Number.isInteger(n)||ti<0||ti>=trees.length||i<0||i>=trees[ti].talents.length||n<0||n>trees[ti].talents[i].max)throw Error("Allocations invalides");clean[ti][i]=n}const before=level.value;level.value=String(data.l);if(!legal(clean)){level.value=before;throw Error("Allocation non valide")}ranks=clean;save();say("Build partagé chargé.")}catch(e){say("Lien de build incompatible ou invalide : "+e.message)}}
function share(){const picks=[];ranks.forEach((a,ti)=>a.forEach((n,i)=>{if(n)picks.push([ti,i,n])}));const payload={v:dataVersion,c:cls,l:Number(level.value),p:picks},hash=btoa(JSON.stringify(payload)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""),url=location.origin+location.pathname+"#b="+hash;history.replaceState(null,"",url);if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(()=>say("Lien copié !")).catch(()=>say("Lien créé dans la barre d'adresse : copiez-le."))}else say("Lien créé dans la barre d'adresse : copiez-le.")}
async function load(){try{let data;try{const r=await fetch(ROOT+"data/talents.json",{cache:"no-cache"});if(!r.ok)throw Error("not synced");data=await r.json()}catch{const r=await fetch("https://talentsforever.com/data.json",{mode:"cors"});if(!r.ok)throw Error("remote unavailable");data=await r.json();say("Mode source directe : configurez l'import quotidien pour les accès hors ligne.")}const classes=data.classes||data.talents;if(!classes||!classes[cls]||!Array.isArray(classes[cls].trees)||classes[cls].trees.length!==3)throw Error("Classe absente du jeu de données");const total=Object.values(classes).reduce((s,c)=>s+(c.trees||[]).reduce((n,t)=>n+(t.talents||[]).length,0),0);if(total<400)throw Error("Jeu de données incomplet");trees=classes[cls].trees;for(const t of trees){if(!Array.isArray(t.talents)||!t.talents.length)throw Error("Arbre incomplet");for(const x of t.talents)if(!x.name||!Number.isInteger(x.max)||x.max<1||x.max>5||!Number.isInteger(x.row)||x.row<1||x.row>7||!Number.isInteger(x.col)||x.col<1||x.col>4)throw Error("Position ou rang invalide")}dataVersion=String(data.version||data.generated_at||data.generated||"snapshot-inconnu");version.textContent="Instantané : "+dataVersion+" · "+total+" talents dans les neuf classes.";source.textContent="Données bêta communautaires";ranks=blank();restore();parseHash();document.getElementById("talent-reset").addEventListener("click",()=>{ranks=blank();save();render();say("Build réinitialisé.")});document.getElementById("talent-share").addEventListener("click",share);level.addEventListener("change",()=>{if(points()>value()){level.value=String(points()+9);say("Niveau minimum pour cette répartition : "+(points()+9))}save();render()});render()}catch(e){source.textContent="Données indisponibles";wrap.replaceChildren();const p=mk("p","Le constructeur ne peut pas charger les talents vérifiés : "+e.message+". Lancez l'action de synchronisation dans le dépôt privé (secret PUBLIC_REPO_TOKEN).","empty-state");wrap.append(p);left.textContent="—"}}
load();