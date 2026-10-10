/* ForEveroth dungeon atlas · WoW Forever new instances only */
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
const statusText=d=>d.type==="classic"?t("Classic / Forever","Classic / Forever"):d.beta==="observed"?t("Bêta documentée","Beta documented"):t("Annoncé","Announced");
function count(d){return d.bosses.reduce((n,b)=>n+(b.loot?.length||0),0)}
function elbtn(text,cls,fn){const b=m("button",text,cls);b.type="button";b.addEventListener("click",fn);return b}
function smallchip(s,cls=""){return m("span",s,"dg-chip "+cls)}
function updateUrl(){const u=new URL(location.href);u.searchParams.set("donjon",selected.id);if(selected.bosses.length)u.searchParams.set("boss",String(selectedBoss+1));else u.searchParams.delete("boss");history.replaceState(null,"",u.pathname+u.search+u.hash)}
function visibleList(){if(!db)return[];const txt=esc(search.value.trim()),mode=status.value,levelN=Number(level.value);
 return db.dungeons.filter(d=>(!txt||esc([name(d.name),d.name.en,d.name.fr,d.zone.en,d.zone.fr,...d.bosses.flatMap(b=>[b.name.en,b.name.fr])].join(" ")).includes(txt))&&(mode==="all"||d.beta===mode||(mode==="classic"&&d.type==="classic")||(mode==="forever"&&d.type==="forever")||(mode==="mapped"&&!!d.floorMap)||(mode==="accessible"&&d.level[0]<=30))&&(!levelN||(d.level[0]<=levelN&&d.level[1]>=levelN)));
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
function chooseBoss(i,focus=false){if(!selected?.bosses[i])return;selectedBoss=i;updateUrl();renderDetail();paint();if(focus)document.getElementById("dg-info-title").scrollIntoView({block:"nearest",behavior:"smooth"})}
function makeLootCard(item,boss){const card=m("div",null,"dg-drop");card.tabIndex=0;card.setAttribute("role","group");card.setAttribute("aria-label",name(item)+" · "+item.slot);
 const icon=m("img");icon.width=34;icon.height=34;icon.loading="lazy";icon.alt="";
 const slot=(item.slot||"").toLowerCase();
 let ico=/recette|recipe/.test(slot)?"inv_scroll_07":/tête|head/.test(slot)?"inv_helmet_22":/épaules|shoulders/.test(slot)?"inv_shoulder_09":/arme|main|hand|two-hand|distance|ranged|bâton|dagger/.test(slot)?"inv_sword_04":/tissu|chest|torse|robe/.test(slot)?"inv_scroll_07":"inv_scroll_07";
 icon.src=item.icon&&/^[a-z0-9_]+$/.test(item.icon)?"https://wow.zamimg.com/images/wow/icons/medium/"+item.icon+".jpg":"/assets/icons/"+ico+".jpg";icon.onerror=()=>{icon.onerror=null;icon.src="/assets/icons/inv_scroll_07.jpg"};card.append(icon);
 const text=m("span");text.append(m("strong",name(item)),m("small",t("Emplacement : ","Slot: ")+item.slot));
 if(Number.isFinite(item.chanceReported))text.append(m("small",t("Taux signalé en bêta : ","Beta-reported chance: ")+String(item.chanceReported).replace(".",",")+" %"));
 if(item.isNew)text.append(m("small",t("Nouveau Forever / à vérifier","New in Forever / verify")));if(item.itemLevel)text.append(m("small",t("Niveau d’objet ","Item level ")+item.itemLevel+(item.requiredLevel?" · "+t("Niveau requis ","Required level ")+item.requiredLevel:"")));
 card.append(text);
 if(item.itemUrl){const link=m("a","↗","dg-item-page");link.href=item.itemUrl;link.target="_blank";link.rel="noopener noreferrer";link.title=t("Ouvrir la fiche de l’objet","Open item details");link.setAttribute("aria-label",t("Fiche d’objet : ","Item page: ")+name(item));card.append(link)}

 const show=e=>{tooltip.replaceChildren();tooltip.append(m("strong",name(item)),m("span",t("Butin possible : ","Possible drop: ")+name(boss.name)),m("span",item.slot));
 if(item.tooltip?.length)item.tooltip.forEach(line=>tooltip.append(m("span",line)));
 if(Number.isFinite(item.chanceReported))tooltip.append(m("span",t("Taux relevé en bêta : ","Reported beta rate: ")+item.chanceReported+" %"));
 tooltip.append(m("small",t("Butin signalé en bêta · taux non garanti. Les noms anglais non officiels sont indicatifs.","Beta-reported drop · chance not guaranteed. Unofficial English names are indicative.")));tooltip.hidden=false;const x=Math.max(8,Math.min(window.innerWidth-355,Math.max(8,(e.clientX||card.getBoundingClientRect().left)+12)));const y=Math.max(8,Math.min(window.innerHeight-185,Math.max(8,(e.clientY||card.getBoundingClientRect().top)+12)));tooltip.style.left=x+"px";tooltip.style.top=y+"px"};
 if(item.id&&window.ForeverItemTooltip){
 window.ForeverItemTooltip.bind(card,{id:item.id,name:name(item),name_en:item.en,name_fr:item.fr,quality:item.quality||"rare",source_status:"forever_beta_community",itemLevel:item.itemLevel,requiredLevel:item.requiredLevel,tooltip:item.tooltip||[],icon:item.icon,origin:t("Butin signalé · Donjon Forever","Reported drop · Forever dungeon"),url:item.itemUrl||selected?.source});
 }else{card.addEventListener("mouseenter",show);card.addEventListener("mousemove",e=>{if(!tooltip.hidden)show(e)});card.addEventListener("mouseleave",()=>tooltip.hidden=true);card.addEventListener("focus",show);card.addEventListener("blur",()=>tooltip.hidden=true)}

 return card;
}
function renderDetail(){const d=selected;if(!d)return;const boss=d.bosses[selectedBoss];
 $("dg-map-title").textContent=name(d.name);$("dg-map-subtitle").textContent=name(d.zone)+" · "+d.level.join("–")+" · "+d.bosses.length+" "+t("rencontres","encounters");
 $("dg-info-title").textContent=name(d.name);$("dg-boss-count").textContent=d.bosses.length+" "+t("rencontres","encounters");
 const chips=$("dg-tags");chips.replaceChildren();chips.append(smallchip(t("Niveaux ","Levels ")+d.level.join("–")));chips.append(smallchip(statusText(d),d.beta==="observed"?"live":"pending"));if(d.quests)chips.append(smallchip(d.quests+" "+t("quêtes relevées","reported quests")));if(d.floorMap)chips.append(smallchip(d.floorMap.kind==="client_minimap_mosaic"?t("Carte client Forever","Forever client map"):t("Carte Classic annotée","Annotated Classic map"),"live"));if(count(d))chips.append(smallchip(count(d)+" "+t("butins relevés","reported drops")));
 $("dg-access").textContent=name(d.access);
 $("dg-description").textContent=name(d.note)|| (d.bosses.length?t("Boss documentés par des guides indépendants de la bêta.","Boss encounters documented by independent beta guides."):t("Leurs boss, plans intérieurs et objets ne sont pas encore documentés de façon suffisamment fiable.","Bosses, floor maps and drops are not yet reliably documented."));
 $("dg-main-source").href=d.source||db.listSource;
 $("dg-main-source").textContent=t("Guide, boss et butin ↗","Guide, bosses & loot ↗");
 const a=$("dg-map-source");a.href=d.floorMap?.source||d.mapSource||d.source||db.listSource;
 a.textContent=d.floorMap?t("Source du plan réel ↗","Original map source ↗"):t("Chercher un plan vérifié ↗","Find a verified floor map ↗");
 routeButton.disabled=!d.floorMap;routeButton.title=d.floorMap?"":t("Plan intérieur non disponible dans nos sources","Interior map not available in our sources");
 routeButton.classList.toggle("active",view==="route");worldButton.classList.toggle("active",view==="world");
 routeButton.setAttribute("aria-pressed",String(view==="route"));worldButton.setAttribute("aria-pressed",String(view==="world"));
 $("dg-map-caption").textContent=view==="route"?(d.floorMap?.kind==="client_minimap_mosaic"?t("PLAN INTÉRIEUR RÉEL · mosaïque du minimap du client Forever","REAL INTERIOR MAP · Forever client minimap mosaic"):t("PLAN DE DONJON CLASSIC ANNOTÉ · source externe","ANNOTATED CLASSIC DUNGEON MAP · external source")):(d.entry?t("Carte du client Forever · accès reporté","Forever client zone map · reported entrance"):t("Carte de région · entrée exacte non confirmée","Zone map · exact entrance unconfirmed"));
 const noteBox=$("dg-changes");if(noteBox){noteBox.replaceChildren();if(d.mapMarkerPrecision==="annotated_map_approx")noteBox.append(m("p",t("Repères de boss approximatifs reportés depuis une carte annotée, à ajuster en jeu.","Approximate boss markers transcribed from an annotated map; in-game precision unverified."),"dg-source-note"));for(const ch of d.changes||[]){const p=m("p",null,"dg-change");p.append(smallchip(ch.status==="observed_beta"?t("Relevé bêta","Beta observed"):ch.status==="new_forever"?t("Forever inédit","New in Forever"):t("Forever / à contrôler","Forever / verify"),ch.status==="observed_beta"?"live":"pending"),m("span",name(ch)));noteBox.append(p)}}

 bossRoot.replaceChildren();
 if(!d.bosses.length){bossRoot.append(m("p",d.type==="classic"?t("Ce donjon Classic est référencé. La liste détaillée des boss et butins Forever reste à compléter : ouvrir le guide source.","This returning Classic dungeon is indexed. Detailed Forever bosses and drops remain to be added: open the source guide."):t("Boss et butins encore insuffisamment documentés pour cette nouvelle instance.","Boss and loot tables are not reliably documented for this new instance yet."),"dg-empty"));return}
 d.bosses.forEach((b,i)=>{const row=m("section",null,"dg-boss-row");row.id="dg-boss-"+(i+1);
 const sum=m("div",null,"dg-boss-summary");sum.append(elbtn(null,"dg-boss-button"+(selectedBoss===i?" active":""),()=>chooseBoss(i)));
 const button=sum.firstElementChild;button.append(m("span",i+1,"dg-index"),m("span",name(b.name)));
 if(b.rare)sum.append(smallchip(t("Rare","Rare"),"pending"));if(b.level)sum.append(smallchip(t("Niveau ","Level ")+b.level));if(d.id==="city-of-dalaran")sum.append(smallchip(b.floor==="city"?t("Ville","City"):t("Égouts","Sewers")));sum.append(smallchip((b.loot||[]).length+" "+t("butins","drops")));row.append(sum);
 if(b.note?.[en?"en":"fr"])row.append(m("p",name(b.note),"dg-boss-note"));
 const drops=m("div",null,"dg-drops");if(!b.loot.length)drops.append(m("span",t("Table d’équipement inconnue · pas de butin inventé.","Gear loot table unknown · no fabricated drops."),"dg-empty"));else b.loot.forEach(it=>drops.append(makeLootCard(it,b)));row.append(drops);
 bossRoot.append(row);
 });
 if(d.trashLoot?.length){const box=m("section",null,"dg-boss-row");box.append(m("h3",t("Butins des ennemis ordinaires","Regular enemy drops"),"dg-other-title"));const cards=m("div",null,"dg-drops");d.trashLoot.forEach(it=>cards.append(makeLootCard(it,{name:{fr:"Ennemis du donjon",en:"Dungeon enemies"}})));box.append(cards);bossRoot.append(box)}
 if(d.questLoot?.length){const box=m("section",null,"dg-boss-row");box.append(m("h3",t("Objets de quête (hors équipement)","Quest items (not gear)"),"dg-other-title"));const cards=m("div",null,"dg-drops");d.questLoot.forEach(it=>cards.append(makeLootCard(it,{name:{fr:it.boss,en:it.boss}})));box.append(cards);bossRoot.append(box)}
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
function hit(x,y){const px=(x-offsetX)/scale,py=(y-offsetY)/scale;return points.find(p=>Math.hypot(p.x-px,p.y-py)<36)}
routeButton.addEventListener("click",()=>switchView("route"));worldButton.addEventListener("click",()=>switchView("world"));
$("dg-zoom-in").addEventListener("click",()=>setZoom(scale*1.35));
$("dg-zoom-out").addEventListener("click",()=>setZoom(scale/1.35));
$("dg-zoom-reset").addEventListener("click",()=>{resetCamera();paint()});
cvs.addEventListener("wheel",e=>{e.preventDefault();const p=canvasPoint(e);setZoom(scale*(e.deltaY<0?1.16:1/1.16),p.x,p.y)},{passive:false});
cvs.addEventListener("pointerdown",e=>{const p=canvasPoint(e);drag={x:p.x,y:p.y,ox:offsetX,oy:offsetY,moved:false};cvs.setPointerCapture(e.pointerId)});
cvs.addEventListener("pointermove",e=>{const p=canvasPoint(e);if(!drag){cvs.style.cursor=hit(p.x,p.y)?"pointer":"grab";return}if(Math.abs(drag.x-p.x)+Math.abs(drag.y-p.y)>6)drag.moved=true;if(drag.moved){offsetX=drag.ox+(p.x-drag.x);offsetY=drag.oy+(p.y-drag.y);clamp();paint()}});
cvs.addEventListener("pointerup",e=>{if(!drag)return;const p=canvasPoint(e);if(!drag.moved&&view==="route"){const pin=hit(p.x,p.y);if(pin?.i>=0)chooseBoss(pin.i)}drag=null});
cvs.addEventListener("pointercancel",()=>drag=null);
cvs.addEventListener("keydown",e=>{if(!selected?.bosses.length)return;if(e.key==="ArrowRight"||e.key==="ArrowDown"){e.preventDefault();chooseBoss((selectedBoss+1)%selected.bosses.length)}if(e.key==="ArrowLeft"||e.key==="ArrowUp"){e.preventDefault();chooseBoss((selectedBoss+selected.bosses.length-1)%selected.bosses.length)}});
[search,level,status].forEach(e=>e.addEventListener(e.tagName==="INPUT"?"input":"change",()=>{renderDirectory()}));
fetch(endpoint,{cache:"no-cache"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).then(d=>{if(!Array.isArray(d.dungeons))throw Error("Invalid data");db=d;
 const all=d.dungeons;all.sort((a,b)=>a.level[0]-b.level[0]||(a.type==="forever"?-1:1));const planned=all.find(x=>x.id===q.get("donjon"))||all[0];select(planned);
 const bossIndex=Number(q.get("boss"));if(bossIndex>1&&bossIndex<=planned.bosses.length)chooseBoss(bossIndex-1);
 $("dg-total").textContent=String(all.filter(x=>x.type==="forever").length);$("dg-observed").textContent=String(all.filter(x=>x.type==="classic").length);$("dg-loot-total").textContent=String(all.reduce((n,x)=>n+count(x),0));
}).catch(err=>{result.replaceChildren(m("p",t("Chargement des données impossible. Réessayez après actualisation.","Unable to load dungeon data. Refresh and retry."),"dg-empty"));console.error("Dungeon atlas:",err)});
})();