/* ForEveroth home atlas: mining routes and beta-zone NPC maps.
   NPC coordinates are historical Classic references, not verified Forever spawns. */
(()=>{
  "use strict";
  const root=document.querySelector("[data-atlas-home]");
  if(!root)return;
  const en=document.documentElement.lang==="en";
  const T=(fr,english)=>en?english:fr;
  const prefix=en?"/en/":"/";
  // Automatically cycle all three atlases; only previous/next arrows navigate manually.
  const slides=[
    {id:"winterspring",kind:"mining",fr:"Berceau-de-l’Hiver",en:"Winterspring"},
    {id:"orgrimmar",kind:"merchant",fr:"Orgrimmar",en:"Orgrimmar"},
    {id:"ironforge",kind:"trainer",fr:"Forgefer",en:"Ironforge"},
    {id:"silithus",kind:"mining",fr:"Silithus",en:"Silithus"},
    {id:"stranglethorn",kind:"merchant",fr:"Vallée de Strangleronce",en:"Stranglethorn Vale"},
    {id:"stormwind",kind:"trainer",fr:"Hurlevent",en:"Stormwind"},
    {id:"azshara",kind:"mining",fr:"Azshara",en:"Azshara"}
  ];
  const title=root.querySelector("[data-atlas-name]");
  const count=root.querySelector("[data-atlas-count]");
  const eyebrow=root.querySelector(".atlas-live-eyebrow");
  const image=root.querySelector("[data-atlas-image]");
  const markers=root.querySelector("[data-atlas-markers]");
  const map=root.querySelector("[data-atlas-map]");
  const cta=root.querySelector("[data-atlas-open]");
  const related=root.querySelector(".atlas-live-related");
  const disclaimer=root.querySelector(".atlas-live-disclaimer");
  const mapLabel=root.querySelector(".atlas-live-map-label");
  const number=root.querySelector("[data-atlas-index]");
  const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)");
  const mapUnavailable=document.createElement("span");
  mapUnavailable.className="atlas-live-map-error";
  mapUnavailable.textContent=T("Carte momentanément indisponible","Map temporarily unavailable");
  mapUnavailable.hidden=true;
  map.append(mapUnavailable);
  let index=0,miningData=null,npcData=null,timer=null,visible=true;
  function setLinkLabel(link,label){
    // Retain the existing arrow span and its styling.
    const arrow=link.querySelector("span");
    if(link.firstChild?.nodeType===Node.TEXT_NODE)link.firstChild.nodeValue=label+" ";
    else link.prepend(document.createTextNode(label+" "));
    if(arrow)arrow.setAttribute("aria-hidden","true");
  }
  function pointsFor(slide){
    if(slide.kind==="mining"){
      const zone=miningData?.zones?.find(z=>z.id===slide.id);
      return {total:zone?.points?.length??null,points:zone?.points||[]};
    }
    const npcs=npcData?.npcs?.filter(n=>n.role===slide.kind&&n.zone?.id===slide.id&&Number.isFinite(n.coordinates?.x)&&Number.isFinite(n.coordinates?.y));
    return {total:npcs?.length??null,points:npcs?.map(n=>[n.coordinates.x,n.coordinates.y])||[]};
  }
  function drawMarkers(slide,points){
    markers.replaceChildren();
    markers.dataset.atlasKind=slide.kind;
    const valid=points.filter(p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&p[0]>=0&&p[0]<=100&&p[1]>=0&&p[1]<=100);
    const selected=[];
    const max=slide.kind==="mining"?14:18;
    const spacing=slide.kind==="mining"?9:2.5;
    const step=Math.max(1,Math.floor(valid.length/(slide.kind==="mining"?40:max)));
    for(let i=0;i<valid.length&&selected.length<max;i+=step){
      const p=valid[i];
      if(selected.every(q=>Math.hypot(q[0]-p[0],q[1]-p[1])>spacing))selected.push(p);
    }
    for(const p of selected){
      const dot=document.createElement("span");
      dot.className="atlas-live-marker";
      dot.style.left=p[0]+"%";
      dot.style.top=p[1]+"%";
      markers.append(dot);
    }
  }
  function mapImage(slide){
    if(slide.kind==="mining")return "/assets/maps/"+slide.id+".jpg";
    const mapId=npcData?.zone_maps?.[slide.id]?.uiMapID;
    return mapId?(npcData.zone_map_base||"https://wowforever-media.fly.storage.tigris.dev/maps/1.60.1.69893/zones/")+mapId+".webp":null;
  }
  function adjustImage(){
    const slide=slides[index];
    // Mining JPGs sometimes contain the unused 1024×768 texture margin.
    const legacy=slide.kind==="mining"&&image.naturalWidth>0&&image.naturalHeight>0&&image.naturalWidth/image.naturalHeight<1.42;
    image.style.width=legacy?(100*1024/1002)+"%":"100%";
    image.style.height=legacy?(100*768/668)+"%":"100%";
  }
  image.addEventListener("load",()=>{
    image.hidden=false;
    mapUnavailable.hidden=true;
    markers.hidden=false;
    adjustImage();
  });
  image.addEventListener("error",()=>{
    image.hidden=true;
    markers.hidden=true;
    mapUnavailable.hidden=false;
  });
  function show(next,manual=false){
    index=(next+slides.length)%slides.length;
    const s=slides[index];
    const name=s[en?"en":"fr"];
    const mining=s.kind==="mining",merchant=s.kind==="merchant";
    const section=mining?"minage/":merchant?"marchands/":"metiers/";
    const href=prefix+section+(mining?"?zone="+encodeURIComponent(s.id):"?zone="+encodeURIComponent(s.id)+(merchant?"":"#prof-trainers"));
    title.textContent=name;
    eyebrow.textContent=mining?T("CARTES INTERACTIVES / MINAGE","INTERACTIVE MAPS / MINING"):
      merchant?T("CARTES PNJ / MARCHANDS","NPC MAPS / VENDORS"):T("CARTES PNJ / MAÎTRES DE MÉTIERS","NPC MAPS / PROFESSION TRAINERS");
    const result=pointsFor(s);
    count.textContent=result.total===null?
      (mining?T("Positions cartographiées","Mapped reference points"):merchant?T("Marchands de la zone","Vendors in this zone"):T("Maîtres de la zone","Trainers in this zone")):
      result.total+" "+(mining?T("positions référencées","mapped reference points"):merchant?T("marchands référencés","referenced vendors"):T("maîtres référencés","referenced trainers"));
    setLinkLabel(cta,mining?T("Explorer cette carte","Explore this map"):merchant?T("Voir les marchands","Explore vendors"):T("Voir les maîtres","Explore trainers"));
    cta.href=href;
    map.href=href;
    map.setAttribute("aria-label",mining?T("Ouvrir la carte de minage de ","Open the mining map of ")+name:
      (merchant?T("Voir les marchands de ","View vendors in "):T("Voir les maîtres de métiers de ","View profession trainers in "))+name);
    related.href=prefix+(mining?"quetes/":merchant?"metiers/#prof-trainers":"marchands/");
    setLinkLabel(related,mining?T("Guides de quêtes","Quest guides"):merchant?T("Maîtres de métiers","Profession trainers"):T("Marchands d’objets","Item vendors"));
    disclaimer.textContent=mining?T("Repères communautaires · Apparitions non garanties","Community reference points · Spawns not guaranteed"):
      T("Carte Forever bêta · Coordonnées Classic non vérifiées","Forever beta map · Unverified Classic coordinates");
    mapLabel.lastChild.nodeValue=" "+(mining?T("CARTE DE ZONE / X·Y","ZONE MAP / X·Y"):T("CARTE PNJ / X·Y","NPC MAP / X·Y"));
    number.textContent=String(index+1).padStart(2,"0")+" / "+String(slides.length).padStart(2,"0");
    drawMarkers(s,result.points);
    markers.hidden=true;
    const src=mapImage(s);
    if(src){
      image.hidden=false;
      mapUnavailable.hidden=true;
      if(image.getAttribute("src")!==src)image.src=src;
      else if(image.complete&&image.naturalWidth){markers.hidden=false;adjustImage();}
      else if(image.complete){image.hidden=true;mapUnavailable.hidden=false;}
    }else{
      image.hidden=true;
      mapUnavailable.hidden=false;
    }
    if(manual)resetTimer();
  }
  function resetTimer(){
    if(timer!==null)window.clearInterval(timer);
    timer=null;
    if(reduced?.matches)return;
    timer=window.setInterval(()=>{
      if(!document.hidden&&visible)show(index+1);
    },6500);
  }
  root.querySelector("[data-atlas-prev]").addEventListener("click",()=>show(index-1,true));
  root.querySelector("[data-atlas-next]").addEventListener("click",()=>show(index+1,true));
  if("IntersectionObserver" in window){
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting},{threshold:.1});
    observer.observe(root);
  }
  if(reduced?.addEventListener)reduced.addEventListener("change",resetTimer);
  fetch("/data/mining-points.json",{cache:"default"})
    .then(r=>{if(!r.ok)throw Error("Mining references unavailable");return r.json()})
    .then(j=>{if(j.coordinate_system==="wow_ui_map_normalized_percent"&&Array.isArray(j.zones)){miningData=j;show(index)}})
    .catch(()=>{/* Static mining image and links remain usable. */});
  fetch("/data/npcs.json",{cache:"default"})
    .then(r=>{if(!r.ok)throw Error("NPC references unavailable");return r.json()})
    .then(j=>{if(j.schema_version===1&&Array.isArray(j.npcs)&&j.zone_maps){npcData=j;show(index)}})
    .catch(()=>{/* NPC slides retain their direct directory links if the dataset is offline. */});
  show(0);
  resetTimer();
})();
