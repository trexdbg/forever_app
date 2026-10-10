/* ForEveroth / Atlas des donjons Classic et Forever · interface en harmonie avec Rare */
(()=>{"use strict";
const root=document.getElementById("dungeon-app");if(!root)return;
const en=document.documentElement.lang==="en",t=(fr,eng)=>en?eng:fr,$=s=>document.getElementById(s);
const endpoint="/data/dungeons-forever.json",q=new URLSearchParams(location.search);
const cvs=$("dg-map"),ctx=cvs.getContext("2d"),W=1002,H=620;
const modes={route:"route",world:"world"};
let db=null,selected=null,selectedBoss=0,view="route",scale=1,offsetX=0,offsetY=0,drag=null,points=[],worldImage=null,worldToken=0,floorImage=null,floorToken=0,floorFit=null,floorFailed=false;
const result=$("dg-directory-list"),bossRoot=$("dg-bosses"),tooltip=$("dg-tooltip");
const routeButton=$("dg-route"),worldButton=$("dg-world"),search=$("dg-search"),level=$("dg-level"),status=$("dg-status");
const m=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt!==undefined&&txt!==null)n.textContent=String(txt);if(cls)n.className=cls;return n};
const str=v=>typeof v==="string"?v:"";
const name=obj=>str(obj?.[en?"en":"fr"]||obj?.en||obj?.fr);
const esc=x=>String(x??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const statusText=d=>d.type==="classic"?t("Classic · référence","Classic · reference"):d.beta==="observed"?t("Bêta documentée","Beta documented"):t("Annoncé","Announced");
function count(d){return d.bosses.reduce((n,b)=>n+(b.loot?.length||0),0)}
function elbtn(text,cls,fn){const b=m("button",text,cls);b.type="button";b.addEventListener("click",fn);return b}
function smallchip(s,cls=""){return m("span",s,"dg-chip "+cls)}
function updateUrl(){const u=new URL(location.href);u.searchParams.set("donjon",selected.id);if(selected.bosses.length)u.searchParams.set("boss",String(selectedBoss+1));else u.searchParams.delete("boss");history.replaceState(null,"",u.pathname+u.search+u.hash)}
function visibleList(){if(!db)return[];const txt=esc(search.value.trim()),mode=status.value,levelN=Number(level.value);
 return db.dungeons.filter(d=>(!txt||esc([name(d.name),d.name.en,d.name.fr,d.zone.en,d.zone.fr,...d.bosses.flatMap(b=>[b.name.en,b.name.fr,...(b.loot||[]).flatMap(i=>[i.en,i.fr])])].join(" ")).includes(txt))&&(mode==="all"||d.beta===mode||(mode==="classic"&&d.type==="classic")||(mode==="forever"&&d.type==="forever")||(mode==="mapped"&&!!d.floorMap)||(mode==="accessible"&&d.level[0]<=30))&&(!levelN||(d.level[0]<=levelN&&d.level[1]>=levelN)));
}
function renderDirectory(){if(!db)return;const rows=visibleList(),scroll=result.scrollTop;result.replaceChildren();$("dg-count").textContent=rows.length+" / "+db.dungeons.length;
 for(const d of rows){const b=elbtn(null,"dg-entry"+(selected?.id===d.id?" active":""),()=>select(d));
 b.setAttribute("aria-current",selected?.id===d.id?"true":"false");
 const top=m("span",null,"dg-entry-top");top.append(m("strong",name(d.name)),m("span",d.level.join("–"),"dg-level"));b.append(top);
 b.append(m("small",name(d.zone)));
 const line=m("span",null,"dg-chips");line.append(smallchip(statusText(d),d.beta==="observed"?"live":"pending"));
 if(d.floorMap)line.append(smallchip(t("Plan réel","Real map"),"live"));if(d.bosses.length)line.append(smallchip(d.bosses.length+" "+t("boss","bosses")));if(count(d))line.append(smallchip(count(d)+" "+t("butins","drops")));
 b.append(line);result.append(b);
 }if(!rows.length)result.append(m("p",t("Aucun donjon avec ces filtres.","No dungeons match these filters."),"dg-empty"));result.scrollTop=scroll;
}
function select(d,focus=false){if(!d)return;selected=d;selectedBoss=0;view=d.floorMap?"route":"world";resetCamera();worldToken++;worldImage=null;floorToken++;floorImage=null;floorFailed=false;updateUrl();renderDirectory();renderDetail();loadWorld();loadFloor();paint();if(focus)document.getElementById("dg-map-title").scrollIntoView({block:"nearest",behavior:"smooth"})}
function chooseBoss(i,focus=false){if(!selected?.bosses[i])return;selectedBoss=i;updateUrl();renderBosses();paint();if(focus)document.getElementById("dg-boss-selected").scrollIntoView({block:"nearest",behavior:"smooth"})}
function makeLootCard(item,boss){const card=m("div",null,"dg-drop");card.tabIndex=0;card.setAttribute("role","group");card.setAttribute("aria-label",name(item)+" · "+item.slot);
 const icon=m("img");icon.width=34;icon.height=34;icon.loading="lazy";icon.alt="";
 const slot=(item.slot||"").toLowerCase();
 let ico=/recette|recipe/.test(slot)?"inv_scroll_07":/tête|head/.test(slot)?"inv_helmet_22":/épaules|shoulders/.test(slot)?"inv_shoulder_09":/arme|main|hand|two-hand|distance|ranged|bâton|dagger/.test(slot)?"inv_sword_04":/tissu|chest|torse|robe/.test(slot)?"inv_scroll_07":"inv_scroll_07";
 icon.src=item.icon&&/^[a-z0-9_]+$/.test(item.icon)?"https://wow.zamimg.com/images/wow/icons/medium/"+item.icon+".jpg":"/assets/icons/"+ico+".jpg";icon.onerror=()=>{icon.onerror=null;icon.src="/assets/icons/inv_scroll_07.jpg"};card.append(icon);
 const text=m("span");text.append(m("strong",name(item)),m("small",t("Emplacement : ","Slot: ")+item.slot));
 if(Number.isFinite(item.chanceReported))text.append(m("small",t("Taux indicatif du guide : ","Guide-reported chance: ")+String(item.chanceReported).replace(".",",")+" %"));
 if(item.isNew)text.append(m("small",t("Changement Forever signalé","Reported Forever change")));if(item.itemLevel)text.append(m("small",t("Niveau d’objet ","Item level ")+item.itemLevel+(item.requiredLevel?" · "+t("Niveau requis ","Required level ")+item.requiredLevel:"")));
 if(item.source_status==="classic_loot_reference")text.append(m("small",t("Provenance Classic à vérifier","Classic origin · unverified"),"dg-loot-provenance"));card.append(text);
 if(item.itemUrl){const link=m("a","↗","dg-item-page");link.href=item.itemUrl;link.target="_blank";link.rel="noopener noreferrer";link.title=t("Ouvrir la fiche de l’objet","Open item details");link.setAttribute("aria-label",t("Fiche d’objet : ","Item page: ")+name(item));card.append(link)}

 const show=e=>{tooltip.replaceChildren();tooltip.append(m("strong",name(item)),m("span",(item.source_status==="classic_loot_reference"?t("Butin Classic de référence : ","Classic reference drop: "):t("Butin signalé : ","Reported drop: "))+name(boss.name)),m("span",item.slot));
 if(item.tooltip?.length)item.tooltip.forEach(line=>tooltip.append(m("span",line)));
 if(Number.isFinite(item.chanceReported))tooltip.append(m("span",t("Taux mentionné par le guide : ","Guide-reported chance: ")+item.chanceReported+" %"));
 tooltip.append(m("small",item.source_status==="classic_loot_reference"?t("Provenance du butin : Classic · NON confirmée pour Forever. Statistiques du client bêta possibles.","Loot source: Classic · NOT confirmed on Forever. Client beta item stats may be available."):t("Relevé de bêta communautaire · taux non garanti.","Community beta report · drop chance not guaranteed.")));tooltip.hidden=false;const x=Math.max(8,Math.min(window.innerWidth-355,Math.max(8,(e.clientX||card.getBoundingClientRect().left)+12)));const y=Math.max(8,Math.min(window.innerHeight-185,Math.max(8,(e.clientY||card.getBoundingClientRect().top)+12)));tooltip.style.left=x+"px";tooltip.style.top=y+"px"};
 if(item.id&&Array.isArray(item.tooltip)&&item.tooltip.length&&window.ForeverItemTooltip){
 window.ForeverItemTooltip.bind(card,{id:item.id,name:name(item),name_en:item.en,name_fr:item.fr,quality:item.quality||"rare",source_status:"forever_beta_community",itemLevel:item.itemLevel,requiredLevel:item.requiredLevel,tooltip:item.tooltip||[],icon:item.icon,origin:t("Butin signalé · Donjon Forever","Reported drop · Forever dungeon"),url:item.itemUrl||selected?.source});
 }else{card.addEventListener("mouseenter",show);card.addEventListener("mousemove",e=>{if(!tooltip.hidden)show(e)});card.addEventListener("mouseleave",()=>tooltip.hidden=true);card.addEventListener("focus",show);card.addEventListener("blur",()=>tooltip.hidden=true)}

 return card;
}
function renderDetail(){const d=selected;if(!d)return;
 $("dg-map-title").textContent=name(d.name);$("dg-map-subtitle").textContent=name(d.zone)+" · "+d.level.join("–")+" · "+d.bosses.length+" "+t("rencontres","encounters");
 $("dg-info-title").textContent=name(d.name);$("dg-boss-count").textContent=d.bosses.length+" "+t("rencontres","encounters");
 const chips=$("dg-tags");chips.replaceChildren();chips.append(smallchip(t("Niveaux ","Levels ")+d.level.join("–")));
 chips.append(smallchip(statusText(d),d.type==="classic"?"":"live"));
 if(d.quests)chips.append(smallchip(d.quests+" "+t("quêtes","quests")));
 const positions=d.bosses.filter(b=>Array.isArray(b.mapPoint)).length;
 if(d.floorMap)chips.append(smallchip(d.floorMap.kind==="client_minimap_mosaic"?t("Carte du client Forever","Forever client map"):t("Plan Classic annoté","Annotated Classic map"),"live"));
 if(positions)chips.append(smallchip(positions+"/"+d.bosses.length+" "+t("repères de boss","boss markers")));
 $("dg-access").textContent=name(d.access);
 $("dg-description").textContent=name(d.note)||t("Seules les données vérifiables sont affichées.","Only documented data is shown.");
 $("dg-main-source").href=d.source||db.listSource;
 $("dg-main-source").textContent=t("Guide du donjon ↗","Dungeon guide ↗");
 const a=$("dg-map-source");a.href=d.floorMap?.source||d.mapSource||d.source||db.listSource;
 const full=$("dg-open-map");if(full){full.hidden=!d.floorMap?.url;if(d.floorMap?.url)full.href=d.floorMap.url}
 for(const l of document.querySelectorAll(".lang-switch a")){const target=new URL(l.href,location.origin);target.searchParams.set("donjon",d.id);if(d.bosses.length)target.searchParams.set("boss",String(selectedBoss+1));l.href=target.pathname+target.search}

 a.textContent=d.floorMap?t("Source de la carte ↗","Map source ↗"):t("Guide source ↗","Source guide ↗");
 routeButton.disabled=!d.floorMap;routeButton.title=d.floorMap?"":t("Aucun plan intérieur publié","No interior map documented");
 routeButton.classList.toggle("active",view==="route");worldButton.classList.toggle("active",view==="world");
 routeButton.setAttribute("aria-pressed",String(view==="route"));worldButton.setAttribute("aria-pressed",String(view==="world"));
 $("dg-map-caption").textContent=view==="route"?(d.floorMap?.kind==="client_minimap_mosaic"?t("CARTE RÉELLE DU CLIENT FOREVER","REAL FOREVER CLIENT MAP"):t("PLAN CLASSIC ANNOTÉ · NON VÉRIFIÉ SUR FOREVER","ANNOTATED CLASSIC MAP · NOT VERIFIED ON FOREVER")):(d.entry?t("Carte de région · point d'accès signalé","Zone map · reported access point"):t("Carte de région · entrée précise à documenter","Zone map · exact portal undocumented"));
 const changes=$("dg-changes");if(changes){changes.replaceChildren();
 if(positions&&d.type==="classic")changes.append(m("p",t("Les repères sont repositionnés d'après les plans Classic annotés ; leur précision dans Forever reste à confirmer.","Markers are transcribed from Classic annotated plans; their Forever positions remain unverified."),"dg-source-note"));
 for(const ch of d.changes||[]){const p=m("p",null,"dg-change");p.append(smallchip(ch.status==="observed_beta"?t("Bêta","Beta"):ch.status==="new_forever"?t("Nouveau","New"):t("À vérifier","Check"),ch.status==="observed_beta"?"live":"pending"),m("span",name(ch)));changes.append(p)}
 }
 renderBosses();
}
function renderBosses(){
 const d=selected;if(!d)return;const oldScroll=bossRoot.querySelector(".dg-boss-nav")?.scrollTop||0;bossRoot.replaceChildren();
 if(!d.bosses.length){
  const empty=m("div",null,"dg-zero");
  empty.append(m("strong",t("Rencontres à documenter","Encounters need documentation")),m("p",d.type==="classic"?t("Le plan Classic est disponible ; la table des boss Forever est encore en cours de vérification.","Classic floor map available; the Forever boss list has not been validated yet."):t("Pas encore de position de boss ni de butin confirmé.","No boss position or verified loot yet.")));
  const source=m("a",t("Consulter la source ↗","Check source ↗"));source.href=d.source||db.listSource;source.target="_blank";source.rel="noopener noreferrer";empty.append(source);bossRoot.append(empty);return;
 }
 const nav=m("nav",null,"dg-boss-nav");nav.setAttribute("aria-label",t("Sélection d’un boss","Choose boss"));
 d.bosses.forEach((b,i)=>{const button=elbtn(null,"dg-boss-navitem"+(i===selectedBoss?" active":""),()=>chooseBoss(i,true));
 button.setAttribute("aria-pressed",String(i===selectedBoss));const n=m("span",String(i+1).padStart(2,"0"),"dg-boss-n");button.append(n,m("span",name(b.name),"dg-boss-navname"));if(b.rare)button.append(m("span",t("Rare","Rare"),"dg-nav-rare"));nav.append(button)});
 bossRoot.append(nav);nav.scrollTop=oldScroll;
 const b=d.bosses[selectedBoss]||d.bosses[0];
 const panel=m("article",null,"dg-selected-boss");panel.id="dg-boss-selected";
 const heading=m("div",null,"dg-selected-heading");heading.append(m("span",String(selectedBoss+1).padStart(2,"0"),"dg-selected-index"));const title=m("div");title.append(m("small",t("BOSS SÉLECTIONNÉ","SELECTED BOSS")),m("h3",name(b.name)));heading.append(title);panel.append(heading);
 const badges=m("div",null,"dg-chips");if(b.level)badges.append(smallchip(t("Niveau ","Level ")+b.level));if(b.rare)badges.append(smallchip(t("Apparition rare","Rare spawn"),"pending"));
 if(d.id==="city-of-dalaran")badges.append(smallchip(b.floor==="city"?t("Ville","City"):t("Égouts","Sewers")));if(b.mapPoint)badges.append(smallchip(t("Localisé sur le plan","Marked on map"),"live"));panel.append(badges);
 if(b.note&&name(b.note))panel.append(m("p",name(b.note),"dg-selected-note"));
 const cap=m("div",null,"dg-loot-heading");cap.append(m("strong",t("Butin du boss","Boss loot")),m("span",String(b.loot?.length||0)));panel.append(cap);
 const drops=m("div",null,"dg-drops");if(!b.loot?.length)drops.append(m("p",t("Pas de table de butin fiable dans les sources consultées.","No sufficiently reliable loot list available."),"dg-empty"));else b.loot.forEach(it=>drops.append(makeLootCard(it,b)));panel.append(drops);
 panel.append(m("p",d.type==="classic"?t("Provenance Classic : disponibilité et taux sur Forever à confirmer.","Classic reference: Forever drop origin and rates are not confirmed."):t("Relevés de bêta : disponibilité et taux susceptibles de changer.","Beta reports: loot availability and rates may change."),"dg-panel-disclaimer"));
 const actions=m("div",null,"dg-boss-actions");
 const prev=elbtn(t("← Précédent","← Previous"),"dg-pager",()=>chooseBoss((selectedBoss+d.bosses.length-1)%d.bosses.length));const next=elbtn(t("Suivant →","Next →"),"dg-pager",()=>chooseBoss((selectedBoss+1)%d.bosses.length));
 actions.append(prev,next);panel.append(actions);bossRoot.append(panel);
 if(d.trashLoot?.length||d.questLoot?.length){const extra=m("details",null,"dg-extra-loot");extra.append(m("summary",t("Autres butins : ennemis et quêtes","Other drops: trash and quests")));
 for(const [k,title,bossName] of [["trashLoot",t("Butin des ennemis","Trash mob drops"),{name:{fr:"Ennemis du donjon",en:"Dungeon enemies"}}],["questLoot",t("Objets de quête","Quest items"),{name:{fr:"Quête",en:"Quest"}}]])if(d[k]?.length){extra.append(m("h4",title));const cards=m("div",null,"dg-drops");d[k].forEach(it=>cards.append(makeLootCard(it,bossName)));extra.append(cards)}
 bossRoot.append(extra);}
}
function resetCamera(){scale=1;offsetX=0;offsetY=0;$("dg-zoom-label").textContent="100 %"}
function setZoom(next,mx=W/2,my=H/2){const n=Math.min(4.2,Math.max(1,next));offsetX=mx-(mx-offsetX)*(n/scale);offsetY=my-(my-offsetY)*(n/scale);scale=n;if(scale===1){offsetX=0;offsetY=0}clamp();$("dg-zoom-label").textContent=Math.round(scale*100)+" %";paint()}
function clamp(){const limx=W*(scale-1),limy=H*(scale-1);offsetX=Math.max(-limx,Math.min(0,offsetX));offsetY=Math.max(-limy,Math.min(0,offsetY))}
function circle(x,y,r,col){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill()}
function outlineText(str,x,y,size=14,col="#e2d2af"){ctx.font=size+"px Trebuchet MS, sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineWidth=4;ctx.strokeStyle="#07140ede";ctx.strokeText(str,x,y);ctx.fillStyle=col;ctx.fillText(str,x,y)}
function cutText(s,n){return s.length>n?s.slice(0,n-1)+"…":s}
function loadFloor(){const d=selected,token=++floorToken;floorImage=null;floorFit=null;floorFailed=false;paint();if(!d?.floorMap?.url)return;
 const img=new Image();img.onload=()=>{if(token!==floorToken)return;floorImage=img;paint()};img.onerror=()=>{if(token!==floorToken)return;floorImage=null;floorFailed=true;paint()};img.src=d.floorMap.url;
}
function drawRoute(d){ctx.fillStyle="#0e1a13";ctx.fillRect(0,0,W,H);points=[];floorFit=null;
 if(!d.floorMap){outlineText(t("Plan intérieur non vérifié","No verified interior map"),W/2,H/2-14,20);outlineText(t("Consultez le guide source. Aucune carte inventée.","Open the source guide. No fabricated floor plans."),W/2,H/2+26,13);return}
 if(!floorImage){outlineText(floorFailed?t("Image indisponible chez la source","Map image unavailable from source"):t("Chargement du plan réel…","Loading real dungeon map…"),W/2,H/2,19);if(floorFailed)outlineText(t("Ouvrez le plan dans le guide original ↗","Open the original map source guide ↗"),W/2,H/2+40,13);return}
 const ratio=Math.min((W-32)/floorImage.width,(H-32)/floorImage.height),dw=floorImage.width*ratio,dh=floorImage.height*ratio;
 const dx=(W-dw)/2,dy=(H-dh)/2;floorFit={dx,dy,dw,dh};ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.drawImage(floorImage,dx,dy,dw,dh);
 for(let i=0;i<d.bosses.length;i++){const p=d.bosses[i].mapPoint;if(!Array.isArray(p)||p.length!==2)continue;
 const x=dx+(Number(p[0])/100)*dw,y=dy+(Number(p[1])/100)*dh;if(!Number.isFinite(x)||!Number.isFinite(y))continue;
 points.push({x,y,i});const active=i===selectedBoss;circle(x,y,active?20:16,"#071b15df");circle(x,y,active?15:12,active?"#f1ca84":"#4a9b7c");outlineText(String(i+1),x,y,12,active?"#132118":"#f4edde");
 }
}
function drawWorld(d){ctx.fillStyle="#14261d";ctx.fillRect(0,0,W,H);
 if(worldImage){ctx.drawImage(worldImage,0,0,W,H)}else{const gr=ctx.createRadialGradient(W/2,H/2,20,W/2,H/2,650);gr.addColorStop(0,"#35513d");gr.addColorStop(1,"#102017");ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
 ctx.strokeStyle="#a0b99b22";for(let i=0;i<11;i++){ctx.beginPath();ctx.moveTo(i*100,0);ctx.lineTo(i*100,H);ctx.stroke()}for(let j=0;j<7;j++){ctx.beginPath();ctx.moveTo(0,j*100);ctx.lineTo(W,j*100);ctx.stroke()}}
 points=[];if(d.entry?.x!=null){const x=d.entry.x*W/100,y=d.entry.y*H/100;points.push({x,y,i:-1});circle(x,y,28,"#07160db9");circle(x,y,17,"#dfbc74");circle(x,y,8,"#2b3e2b");outlineText(t("Accès signalé","Reported access"),x,Math.max(24,y-39),13)}
 else{outlineText(t("Coordonnées du portail non confirmées","Portal coordinates not confirmed"),W/2,H-55,16)}
}
function paint(){if(!db||!selected)return;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);ctx.save();ctx.setTransform(scale,0,0,scale,offsetX,offsetY);if(view==="world")drawWorld(selected);else drawRoute(selected);ctx.restore()}
function loadWorld(){const d=selected,token=++worldToken;worldImage=null;if(!d?.zone?.uiMapID){paint();return}
 const sources=[db.mapImageBase+d.zone.uiMapID+".webp"];const locals={azshara:"azshara",ungoro:"ungoro",tirisfal:"tirisfal"};if(locals[d.zone.id])sources.push("/assets/maps/"+locals[d.zone.id]+".jpg");
 let n=0;const next=()=>{if(token!==worldToken)return;if(n>=sources.length){worldImage=null;paint();return}const im=new Image();im.onload=()=>{if(token!==worldToken)return;worldImage=im;paint()};im.onerror=next;im.src=sources[n++]};next();
}
function switchView(v){if(!selected)return;view=v;resetCamera();renderDetail();paint()}
function canvasPoint(e){const rect=cvs.getBoundingClientRect();return{x:(e.clientX-rect.left)*W/rect.width,y:(e.clientY-rect.top)*H/rect.height}}
function hit(x,y){const px=(x-offsetX)/scale,py=(y-offsetY)/scale;return points.map(p=>({p,dist:Math.hypot(p.x-px,p.y-py)})).filter(x=>x.dist<32).sort((a,b)=>a.dist-b.dist)[0]?.p||null}
routeButton.addEventListener("click",()=>switchView("route"));worldButton.addEventListener("click",()=>switchView("world"));
$("dg-zoom-in").addEventListener("click",()=>setZoom(scale*1.35));
$("dg-zoom-out").addEventListener("click",()=>setZoom(scale/1.35));
$("dg-zoom-reset").addEventListener("click",()=>{resetCamera();paint()});
cvs.addEventListener("wheel",e=>{e.preventDefault();const p=canvasPoint(e);setZoom(scale*(e.deltaY<0?1.16:1/1.16),p.x,p.y)},{passive:false});
cvs.addEventListener("pointerdown",e=>{const p=canvasPoint(e);drag={x:p.x,y:p.y,ox:offsetX,oy:offsetY,moved:false};cvs.setPointerCapture(e.pointerId)});
cvs.addEventListener("pointermove",e=>{const p=canvasPoint(e);if(!drag){const pin=view==="route"?hit(p.x,p.y):null;cvs.style.cursor=pin?"pointer":"grab";
 const hover=$("dg-map-hover");if(hover){hover.hidden=!pin;if(pin&&selected?.bosses?.[pin.i]){hover.textContent=(pin.i+1)+" · "+name(selected.bosses[pin.i].name);const rect=cvs.getBoundingClientRect();hover.style.left=Math.min(rect.width-160,Math.max(7,e.clientX-rect.left+15))+"px";hover.style.top=Math.min(rect.height-42,Math.max(7,e.clientY-rect.top+12))+"px"}}return}if(Math.abs(drag.x-p.x)+Math.abs(drag.y-p.y)>6)drag.moved=true;if(drag.moved){offsetX=drag.ox+(p.x-drag.x);offsetY=drag.oy+(p.y-drag.y);clamp();paint()}});
cvs.addEventListener("pointerup",e=>{if(!drag)return;const p=canvasPoint(e);if(!drag.moved&&view==="route"){const pin=hit(p.x,p.y);if(pin?.i>=0)chooseBoss(pin.i,true)}drag=null});
cvs.addEventListener("pointercancel",()=>drag=null);cvs.addEventListener("pointerleave",()=>{const h=$("dg-map-hover");if(h)h.hidden=true});
cvs.addEventListener("keydown",e=>{if(!selected?.bosses.length)return;if(e.key==="ArrowRight"||e.key==="ArrowDown"){e.preventDefault();chooseBoss((selectedBoss+1)%selected.bosses.length)}if(e.key==="ArrowLeft"||e.key==="ArrowUp"){e.preventDefault();chooseBoss((selectedBoss+selected.bosses.length-1)%selected.bosses.length)}});
[search,level,status].forEach(e=>e.addEventListener(e.tagName==="INPUT"?"input":"change",()=>{renderDirectory()}));
fetch(endpoint,{cache:"no-cache"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(d=>{if(!Array.isArray(d.dungeons))throw Error("Invalid data");db=d;
 const all=d.dungeons;all.sort((a,b)=>a.level[0]-b.level[0]||(a.type==="forever"?-1:1));const planned=all.find(x=>x.id===q.get("donjon"))||all.find(x=>x.id==="hall-of-thanes")||all[0];select(planned);
 const bossIndex=Number(q.get("boss"));if(bossIndex>1&&bossIndex<=planned.bosses.length)chooseBoss(bossIndex-1);
 $("dg-total").textContent=String(all.filter(x=>x.type==="forever").length);$("dg-observed").textContent=String(all.filter(x=>x.type==="classic").length);$("dg-loot-total").textContent=String(all.reduce((n,x)=>n+count(x),0));
}).catch(err=>{result.replaceChildren(m("p",t("Chargement des données impossible. Réessayez après actualisation.","Unable to load dungeon data. Refresh and retry."),"dg-empty"));console.error("Dungeon atlas:",err)});
})();