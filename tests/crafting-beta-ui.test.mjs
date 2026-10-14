import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {runInNewContext} from "node:vm";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(resolve(root,p),"utf8");
const data=JSON.parse(read("data/crafting-chains-beta.json"));
const script=read("assets/crafting-beta.js"),search=read("assets/global-search.js");
class Element {
 constructor(tag="div"){this.tag=tag;this.children=[];this.events={};this.attributes={};this.dataset={};this._text="";this.value="";this.open=false;this.hidden=false;this.className="";}
 append(...nodes){this.children.push(...nodes)}
 replaceChildren(...nodes){this._text="";this.children=[...nodes]}
 set textContent(t){this._text=String(t);this.children=[]}
 get textContent(){return this._text+this.children.map(c=>c.textContent||"").join("")}
 addEventListener(ev,cb){this.events[ev]=cb}
 fire(ev){this.events[ev]?.({target:this,preventDefault(){}})}
 setAttribute(k,v){this.attributes[k]=String(v)}
 scrollIntoView(options){this.lastScroll=options}
}
const wait=async()=>{await new Promise(setImmediate);await new Promise(setImmediate)};
function app(lang="fr",url="/metiers/",narrow=false){
 const ids=["craft-beta","craft-beta-search","craft-beta-list","craft-beta-detail","craft-beta-status","craft-beta-count"];
 const els=Object.fromEntries(ids.map(x=>[x,new Element(x==="craft-beta"?"details":"div")]));
 let loc=new URL(url,"https://foreveroth.com");
 const location={get href(){return loc.href},get search(){return loc.search},get hash(){return loc.hash},get pathname(){return loc.pathname}};
 const history={pushState(_state,_title,path){loc=new URL(path,loc.href)}};
 const events={},calls=[];
 let reply=async()=>({ok:true,json:async()=>data});
 runInNewContext(script,{document:{documentElement:{lang},getElementById:id=>els[id]||null,createElement:tag=>new Element(tag)},
  location,history,URL,URLSearchParams,window:{addEventListener:(k,f)=>events[k]=f,matchMedia:()=>({matches:narrow})},
  fetch:async url=>{calls.push(url);return reply(url)},console:{warn(){}}});
 const flatten=n=>[n,...n.children.flatMap(flatten)];
 return {els,location,events,calls,setReply:f=>reply=f,list:()=>flatten(els["craft-beta-list"]),detail:()=>flatten(els["craft-beta-detail"])};
}
test("both public profession routes mount the opt-in panel without changing the trainer map",()=>{
 for(const [p,heading] of [["metiers/index.html","Fabrications documentées (bêta)"],["en/metiers/index.html","Documented crafting (beta)"]]){
  const html=read(p);assert.ok(html.includes(heading));
  for(const id of ["craft-beta","craft-beta-search","craft-beta-list","craft-beta-detail","prof-trainers","npcs-app"])
   assert.ok(html.includes('id="'+id+'"'),id);
  assert.ok(html.includes("/assets/crafting-beta.js")&&html.includes("/assets/crafting-beta.css"));
  assert.ok(html.includes('/assets/npcs.js')&&!html.includes('/assets/professions.js'));
 }
});
test("research status and exactly eight opt-in recipes with 21 researched objects are preserved",()=>{
 assert.equal(data.scope.status,"research_only_not_published");
 assert.equal(data.scope.preview.status,"opt_in_documentary_preview");
 assert.equal(data.recipes.length,8);assert.equal(Object.keys(data.items).length,21);
 assert.deepEqual(data.scope.preview.recipe_item_ids,data.recipes.map(r=>r.output_item_id));
});
test("deferred load, bilingual list and accent-insensitive name or ID search",async()=>{
 for(const [lang,route,term] of [["fr","/metiers/","Tube en bronze"],["en","/en/metiers/","Bronze Tube"]]){
  const a=app(lang,route);assert.equal(a.calls.length,0);
  a.els["craft-beta"].open=true;a.els["craft-beta"].fire("toggle");await wait();
  assert.deepEqual(a.calls,["/data/crafting-chains-beta.json"]);
  assert.equal(a.list().filter(n=>n.className==="craft-result").length,8);
  assert.ok(a.list().some(n=>n.textContent.includes(term)));
  for(const [query,id] of [["GYROCHRONATOME",4389],["bronze tube",4371],["batterie en or",10558],["3961",4389],["4371",4371]]){
   a.els["craft-beta-search"].value=query;a.els["craft-beta-search"].fire("input");
   const rows=a.list().filter(x=>x.className==="craft-result");
   assert.equal(rows.length,1,query);assert.equal(rows[0].dataset.craft,String(id));
  }
 }
});
test("direct FR/EN URLs reload correctly, selection updates query and preserves existing hash",async()=>{
 for(const [lang,route,id,title] of [["fr","/metiers/",4371,"Tube en bronze"],["en","/en/metiers/",4389,"Gyrochronatom"]]){
  const a=app(lang,route+"?craft="+id+"&type=profession#prof-trainers");await wait();
  assert.equal(a.els["craft-beta"].open,true);
  assert.ok(a.els["craft-beta-detail"].textContent.includes(title));
  const other=a.list().find(e=>e.className==="craft-result"&&e.dataset.craft!==String(id));
  assert.ok(other);other.fire("click");
  assert.equal(a.location.hash,"#prof-trainers");
  assert.ok(a.location.search.includes("type=profession"));
  assert.equal(new URLSearchParams(a.location.search).get("craft"),other.dataset.craft);
  a.events.popstate();await wait();
  assert.ok(a.els["craft-beta-detail"].textContent.includes(data.items[other.dataset.craft].name[lang]));
 }
});
test("4389 -> 10558 -> 3577 -> 2776 navigates across engineering, smelting and mineral node",async()=>{
 const a=app("fr","/metiers/?craft=4389");await wait();
 for(const [id,word] of [[10558,"12584"],[3577,"Fonte documentée"],[2776,"Filon d\'or"]]){
  const button=a.detail().find(x=>x.className==="craft-component"&&x.textContent.includes("#"+id));
  assert.ok(button,"Must reach "+id);
  button.fire("click");
  assert.equal(new URLSearchParams(a.location.search).get("craft"),String(id));
  assert.ok(a.els["craft-beta-detail"].textContent.includes(word),word);
 }
 assert.equal(a.detail().filter(x=>x.className==="craft-component").length,0);
});
test("claim-level HTTPS links, yellow vs skill, null yields and Classic sellers remain explicit",async()=>{
 const a=app("fr","/metiers/?craft=4361");await wait();
 const text=a.els["craft-beta-detail"].textContent;
 for(const term of ["Compétence requise (documentation)50","Seuil jaune (pas le niveau requis)80","Sources contradictoires","Quantité fabriquée : inconnue"])
  assert.ok(text.includes(term),term);
 const links=a.detail().filter(x=>x.tag==="a");
 assert.ok(links.some(x=>x.href.startsWith("https://wowtbc.gg/warcraftforever/")));
 assert.ok(links.some(x=>x.href.startsWith("https://wowforevertalents.com/")));
 for(const x of links){assert.match(x.href,/^https:\/\//);assert.equal(x.rel,"noopener noreferrer")}
 for(const id of [4371,4389]){
  const b=app("en","/en/metiers/?craft="+id);await wait();
  const rendered=b.els["craft-beta-detail"].textContent;
  assert.ok(rendered.includes("16 Classic-reference candidate vendors"));
  assert.ok(rendered.includes("Forever availability, prices, stock and restock unknown"));
  assert.ok(!rendered.includes("800 copper")&&!rendered.includes("3,000 copper"));
 }
});
test("invalid schema or network failure stays safe, without HTML injection",async()=>{
 const a=app("en","/en/metiers/");
 a.setReply(async()=>({ok:false,json:async()=>null}));
 a.els["craft-beta"].open=true;a.els["craft-beta"].fire("toggle");await wait();
 assert.ok(a.els["craft-beta-status"].textContent.includes("Data unavailable or invalid"));
 a.setReply(async()=>({ok:true,json:async()=>({...data,scope:{...data.scope,preview:{status:"wrong"}}})}));
 a.els["craft-beta"].open=false;a.els["craft-beta"].fire("toggle");
 a.els["craft-beta"].open=true;a.els["craft-beta"].fire("toggle");await wait();
 assert.ok(a.els["craft-beta-status"].textContent.includes("Data unavailable or invalid"));
 assert.ok(!script.includes(".innerHTML"));
});
test("global search results point only to marked documented recipes on true FR/EN routes",()=>{
 for(const term of ["function craftingRows(db)","opt_in_documentary_preview",'url("metiers/",{craft:r.output_item_id})',
  '["data/crafting-chains-beta.json",craftingRows]',"Documented crafting · beta (not confirmed in game)"])
  assert.ok(search.includes(term),term);
 for(const id of [4371,4389,10558])for(const locale of ["fr","en"]){
  const path=(locale==="fr"?"/metiers/":"/en/metiers/")+"?craft="+id;
  assert.equal(new URL(path,"https://foreveroth.com").searchParams.get("craft"),String(id));
 }
});

test("item icons use the known HTTPS WoW icon path, not missing local filenames",async()=>{
 const b=app("fr","/metiers/?craft=4371");await wait();
 const icon=b.detail().find(e=>e.tag==="img");
 assert.ok(icon);
 assert.equal(icon.src,"https://wow.zamimg.com/images/wow/icons/medium/inv_gizmo_pipe_01.jpg");
 icon.fire("error");assert.equal(icon.hidden,true);
});
test("actual global search consumer resolves FR/EN recipe results to selected item deep links",async()=>{
 for(const [locale,route,target] of [["fr","/metiers/","Gyrochronatome"],["en","/en/metiers/","Gyrochronatom"]]){
  const ids=["global-search","global-search-input","global-search-panel","global-search-status",
   "global-search-results","global-search-filters","global-search-more"];
  const els=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
  els["global-search-input"].value=target;
  let loc=new URL("https://foreveroth.com"+(locale==="fr"?"/":"/en/"));
  const doc={documentElement:{lang:locale},getElementById:id=>els[id]||null,
   createElement:tag=>new Element(tag),addEventListener(){}};
  const fetch=async u=>({ok:true,json:async()=>u==="/data/crafting-chains-beta.json"?data:{}});
  runInNewContext(search,{document:doc,location:{origin:loc.origin,href:loc.href},URL,fetch,console:{warn(){}},
   window:{addEventListener(){}}});
  els["global-search-input"].fire("focus");await wait();
  const hits=els["global-search-results"].children.filter(x=>x.tag==="a"&&x.href.includes("craft=4389"));
  assert.ok(hits.length>=1,locale+" must find the exact documented Gyrochronatom recipe");
  assert.equal(hits[0].href,route+"?craft=4389");
  assert.ok(hits[0].textContent.includes(locale==="fr"?"Fabrication documentée":"Documented crafting"));
 }
});

test("filter, close, reopen resets list and count in French and English without a second fetch",async()=>{
 for(const [locale,url,expected] of [
  ["fr","/metiers/","8 / 8 fabrications documentées"],
  ["en","/en/metiers/","8 / 8 documented crafts"]
 ]){
  const a=app(locale,url),section=a.els["craft-beta"],input=a.els["craft-beta-search"];
  section.open=true;section.fire("toggle");await wait();
  assert.equal(a.list().filter(x=>x.className==="craft-result").length,8);
  input.value="4389";input.fire("input");
  assert.equal(a.list().filter(x=>x.className==="craft-result").length,1);
  assert.ok(a.els["craft-beta-count"].textContent.startsWith("1 / 8"));
  section.open=false;section.fire("toggle");
  assert.equal(input.value,"");
  section.open=true;section.fire("toggle");await wait();
  assert.equal(input.value,"");
  assert.equal(a.list().filter(x=>x.className==="craft-result").length,8,locale);
  assert.equal(a.els["craft-beta-count"].textContent,expected,locale);
  assert.deepEqual(a.calls,["/data/crafting-chains-beta.json"],"Cache the already loaded eight recipes");
 }
});

test("mobile deep links and component clicks scroll to the selected card in both locales",async()=>{
 for(const [lang,path,id] of [["fr","/metiers/",4371],["en","/en/metiers/",4389]]){
  const a=app(lang,path+"?craft="+id,true);
  await wait();
  assert.equal(a.els["craft-beta-detail"].lastScroll?.behavior,"instant");
  assert.equal(a.els["craft-beta-detail"].lastScroll?.block,"start");
  const component=a.detail().find(x=>x.className==="craft-component");
  assert.ok(component,lang+" should have an ingredient");
  component.fire("click");
  assert.equal(a.els["craft-beta-detail"].lastScroll?.behavior,"smooth");
  assert.equal(a.els["craft-beta-detail"].lastScroll?.block,"start");
  assert.equal(new URLSearchParams(a.location.search).get("craft"),lang==="en"?"3575":"2841");
 }
});

test("Bronze Tube 4371 leads to Smelt Bronze 2659, Smelt Tin 3304 and mined Tin Ore",async()=>{
 const a=app("fr","/metiers/?craft=4371");await wait();
 for(const [id,needle] of [[2841,"2659"],[3576,"3304"],[2771,"Filon d\'étain"]]){
  const next=a.detail().find(x=>x.className==="craft-component"&&x.textContent.includes("#"+id));
  assert.ok(next,"Expected ingredient "+id);
  next.fire("click");
  assert.equal(new URLSearchParams(a.location.search).get("craft"),String(id));
  assert.ok(a.els["craft-beta-detail"].textContent.includes(needle));
 }
 const detail=a.els["craft-beta-detail"].textContent;
 assert.ok(detail.includes("Guide Minage Forever"));
 assert.ok(detail.includes("Emplacement exact"));
});
test("mining guides and smelting render in both languages with HTTPS proof and no invented totals",async()=>{
 for(const [lang,route,words] of [
  ["fr","/metiers/?craft=3575",["Fonte documentée","3307","Seuil jaune : 130","Compétence d’apprentissage inconnue","Rendement de fonte inconnu"]],
  ["en","/en/metiers/?craft=3575",["Documented Forever smelting","3307","Yellow threshold: 130","Trainer learning requirement unknown","Smelting yield unknown"]]
 ]){
  const a=app(lang,route);await wait();
  const t=a.els["craft-beta-detail"].textContent;
  for(const word of words)assert.ok(t.includes(word),lang+" "+word);
  const links=a.detail().filter(x=>x.tag==="a");
  assert.ok(links.some(x=>x.href.startsWith("https://wowforevertalents.com/professions/mining/")));
  assert.ok(links.some(x=>x.href.startsWith("https://www.wowhead.com/forever/spell=3307")));
  assert.ok(links.every(x=>x.href.startsWith("https://")));
 }
 for(const id of [2770,2835,2771,2836,2772,2776]){
  const a=app("en","/en/metiers/?craft="+id);await wait();
  const t=a.els["craft-beta-detail"].textContent;
  assert.ok(t.includes("Forever Mining guide"),id);
  assert.ok(t.includes("Exact node coordinates"),id);
 }
});
test("unverified Weak Flux vendors and wool loot remain Classic, no fabricated seller details",async()=>{
 for(const [id,needle] of [[2880,"Vendor index labeled Classic"],[2592,"Possible Classic-reference loot"]]){
  const a=app("en","/en/metiers/?craft="+id);await wait();
  assert.ok(a.els["craft-beta-detail"].textContent.includes(needle),id);
  assert.ok(!a.els["craft-beta-detail"].textContent.includes("confirmed in game"));
 }
 for(const [id,text] of [[4371,"16 Classic-reference candidate vendors"],[4389,"16 Classic-reference candidate vendors"]]){
  const a=app("en","/en/metiers/?craft="+id);await wait();
  assert.ok(a.els["craft-beta-detail"].textContent.includes(text));
 }
});
