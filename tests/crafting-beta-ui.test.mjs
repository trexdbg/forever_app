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
 scrollIntoView(){}
}
const wait=async()=>{await new Promise(setImmediate);await new Promise(setImmediate)};
function app(lang="fr",url="/metiers/"){
 const ids=["craft-beta","craft-beta-search","craft-beta-list","craft-beta-detail","craft-beta-status","craft-beta-count"];
 const els=Object.fromEntries(ids.map(x=>[x,new Element(x==="craft-beta"?"details":"div")]));
 let loc=new URL(url,"https://foreveroth.com");
 const location={get href(){return loc.href},get search(){return loc.search},get hash(){return loc.hash},get pathname(){return loc.pathname}};
 const history={pushState(_state,_title,path){loc=new URL(path,loc.href)}};
 const events={},calls=[];
 let reply=async()=>({ok:true,json:async()=>data});
 runInNewContext(script,{document:{documentElement:{lang},getElementById:id=>els[id]||null,createElement:tag=>new Element(tag)},
  location,history,URL,URLSearchParams,window:{addEventListener:(k,f)=>events[k]=f},
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
test("research status and exactly eight opt-in recipes with sixteen items are preserved",()=>{
 assert.equal(data.scope.status,"research_only_not_published");
 assert.equal(data.scope.preview.status,"opt_in_documentary_preview");
 assert.equal(data.recipes.length,8);assert.equal(Object.keys(data.items).length,16);
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
test("4389 -> 10558 -> 3577 navigates a sub-recipe and ends at a leaf",async()=>{
 const a=app("fr","/metiers/?craft=4389");await wait();
 let button=a.detail().find(x=>x.className==="craft-component"&&x.textContent.includes("#10558"));
 assert.ok(button);button.fire("click");
 assert.equal(new URLSearchParams(a.location.search).get("craft"),"10558");
 assert.ok(a.els["craft-beta-detail"].textContent.includes("12584"));
 button=a.detail().find(x=>x.className==="craft-component"&&x.textContent.includes("#3577"));
 assert.ok(button);button.fire("click");
 assert.equal(new URLSearchParams(a.location.search).get("craft"),"3577");
 assert.ok(a.els["craft-beta-detail"].textContent.includes("Aucune sous-recette vérifiée"));
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
