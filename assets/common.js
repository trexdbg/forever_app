(()=>{"use strict";
const nav=document.querySelector(".nav"),toggle=document.querySelector(".nav-toggle");
const en=document.documentElement.lang==="en",root=en?"/en/":"/";
const current=location.pathname.replace(/\/index\.html$/,"/").replace(/\/$/,"/")||"/";
const tr=en?{
 home:"Home",quests:"Quests",talents:"Talents",gear:"Gear",bis:"Pre-raid BiS",catalog:"Item catalogue",
 professions:"Professions",trainers:"Trainers & weapon masters",mining:"High-level mining",vendors:"Vendors",population:"Population"
}:{
 home:"Accueil",quests:"Quêtes",talents:"Talents",gear:"Équipement",bis:"BiS par classe",catalog:"Catalogue d’objets",
 professions:"Métiers",trainers:"Maîtres de métiers et d’armes",mining:"Minage HL",vendors:"Marchands",population:"Population"
};
const href=slug=>root+(slug?slug+"/":"");
const active=slug=>slug?current===href(slug)||(slug==="talents"&&current.startsWith(href("talents"))):current===root;
const link=(slug,label)=>{const a=document.createElement("a");a.href=href(slug);a.textContent=label;if(active(slug))a.setAttribute("aria-current","page");return a};
const group=(label,children)=>{const details=document.createElement("details");details.className="nav-group";
 const summary=document.createElement("summary");summary.textContent=label;details.append(summary);
 const menu=document.createElement("div");menu.className="nav-submenu";for(const [slug,title] of children)menu.append(link(slug,title));
 details.append(menu);if(children.some(([slug])=>active(slug)))details.classList.add("nav-group--active");
 return details};
if(nav){
 nav.replaceChildren(link("",tr.home),link("quetes",tr.quests),link("talents",tr.talents),
  group(tr.gear,[["bis",tr.bis],["equipements",tr.catalog]]),
  group(tr.professions,[["metiers",tr.trainers],["minage",tr.mining]]),
  link("marchands",tr.vendors),link("population",tr.population));
 const groups=[...nav.querySelectorAll(".nav-group")];
 for(const g of groups){g.addEventListener("toggle",()=>{if(g.open)for(const other of groups)if(other!==g)other.open=false});g.addEventListener("mouseenter",()=>{if(matchMedia("(hover: hover) and (min-width: 981px)").matches)g.open=true});g.addEventListener("mouseleave",()=>{if(matchMedia("(hover: hover) and (min-width: 981px)").matches&&!g.contains(document.activeElement))g.open=false})}
 const close=()=>{for(const g of groups)g.open=false;nav.classList.remove("open");if(toggle){toggle.setAttribute("aria-expanded","false");toggle.textContent="☰"}};
 document.addEventListener("pointerdown",e=>{if(!nav.contains(e.target)&&e.target!==toggle&&!toggle?.contains(e.target))for(const g of groups)g.open=false});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){close();toggle?.focus()}});
 if(toggle)toggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));toggle.textContent=open?"✕":"☰";if(!open)for(const g of groups)g.open=false});
}
const footer=document.querySelector(".footer-grid");
if(footer){const fnav=footer.children[1];if(fnav&&!fnav.querySelector('a[href="/quetes/"],a[href="/en/quetes/"]'))fnav.prepend(link("quetes",tr.quests))}
})();
/* Optional audience measurement. Disabled until configured and consented. */
(()=>{const s=document.createElement("script");s.src="/assets/analytics.js?v=1";document.head.append(s)})();
