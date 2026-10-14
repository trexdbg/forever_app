import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {runInNewContext} from "node:vm";
import {ALLOWED,EXCLUDED,checkAlchemy} from "../scripts/check-alchemy-beta.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(resolve(root,p),"utf8");
const data=JSON.parse(read("data/alchemy-chains-beta.json"));
const appJs=read("assets/alchemy-beta.js");
const searchJs=read("assets/global-search.js");
const copy=()=>structuredClone(data);
const codes=d=>checkAlchemy(d).errors.map(x=>x.code);
class Element {
 constructor(tag="div"){this.tag=tag;this.children=[];this.events={};this.attributes={};this.dataset={};this._text="";this.value="";this.open=false;this.hidden=false;this.className="";this.scrolls=[];}
 append(...nodes){this.children.push(...nodes)}
 replaceChildren(...nodes){this._text="";this.children=[...nodes]}
 set textContent(t){this._text=String(t);this.children=[]}
 get textContent(){return this._text+this.children.map(c=>c?.textContent||"").join("")}
 addEventListener(ev,cb){this.events[ev]=cb}
 fire(ev){this.events[ev]?.({target:this,preventDefault(){}})}
 setAttribute(k,v){this.attributes[k]=String(v)}
 scrollIntoView(opts){this.scrolls.push(opts)}
}
const flatten=n=>[n,...n.children.flatMap(flatten)];
const settle=async()=>{await new Promise(setImmediate);await new Promise(setImmediate)};
function ui(lang="fr",url="/metiers/",mobile=false){
 const ids=["alchemy-beta","alchemy-search","alchemy-list","alchemy-detail","alchemy-status","alchemy-count"];
 const els=Object.fromEntries(ids.map(id=>[id,new Element(id==="alchemy-beta"?"details":"div")]));
 let locationUrl=new URL(url,"https://foreveroth.com");
 const location={get href(){return locationUrl.href},get search(){return locationUrl.search},get pathname(){return locationUrl.pathname},get hash(){return locationUrl.hash}};
 const history={pushState(_s,_t,path){locationUrl=new URL(path,locationUrl.href)}};
 const events={},calls=[];let reply=async()=>({ok:true,json:async()=>data});
 runInNewContext(appJs,{document:{documentElement:{lang},getElementById:id=>els[id],createElement:tag=>new Element(tag)},
 location,history,URL,URLSearchParams,fetch:async p=>{calls.push(p);return reply(p)},
 window:{addEventListener:(name,cb)=>events[name]=cb,matchMedia:()=>({matches:mobile})},console:{warn(){}}});
 return {els,events,calls,location,setReply:f=>reply=f,
 list:()=>flatten(els["alchemy-list"]),detail:()=>flatten(els["alchemy-detail"])};
}
test("six distinct audited potions and eight components have a separate research contract",()=>{
 assert.deepEqual(codes(data),[]);
 assert.deepEqual(data.recipes.map(r=>r.output_item_id),ALLOWED);
 assert.equal(data.scope.status,"research_only_not_published");
 assert.equal(data.scope.preview.status,"opt_in_documentary_preview");
 assert.equal(Object.keys(data.items).length,14);
 assert.equal(data.acquisitions.length,0);
});
test("removed Classic alchemy potions are flagged as moved to First Aid, never listed",()=>{
 for(const id of EXCLUDED){assert.ok(data.excluded_alchemy.some(e=>e.item_id===id&&e.reason==="moved_to_first_aid"));assert.ok(!data.recipes.some(r=>r.output_item_id===id))}
 const x=copy();x.recipes[0].output_item_id=118;
 assert.ok(codes(x).includes("RECIPE_SCOPE")||codes(x).includes("MOVED_FIRST_AID"));
});
test("the changed Minor Mana Potion has Forever-only Peacebloom, not Classic Silverleaf",()=>{
 const x=data.recipes.find(r=>r.output_item_id===2455);
 assert.equal(x.spell_id,2331);assert.equal(x.change_status,"changed");
 assert.deepEqual(x.ingredients.map(c=>[c.item_id,c.quantity]),[[785,1],[2447,1],[3371,1]]);
});
test("new Discolored healing potions use Murloc Eye with correct spell IDs",()=>{
 for(const [item,spell,ing] of [[247239,1244645,[3371,2450,730]],[247240,1244646,[3372,2453,730]]]){
  const r=data.recipes.find(r=>r.output_item_id===item);
  assert.equal(r.spell_id,spell);
  assert.equal(r.change_status,"new");
  assert.deepEqual(r.ingredients.map(c=>c.item_id),ing);
 }
});
test("learning skill and yellow threshold are distinct, unknown trainer skills remain null",()=>{
 const fromPlan=data.recipes.find(r=>r.output_item_id===4596);
 assert.equal(fromPlan.skill_required,50);assert.equal(fromPlan.skill_yellow,55);
 assert.equal(fromPlan.recipe_item_id,4597);
 for(const r of data.recipes.filter(r=>r.skill_required===null)){
  assert.equal(r.learning_method,"trainer");
  assert.equal(r.skill_required_status,"trainer_requirement_not_in_client");
 }
});
test("never fabricate live potion yields, character level, vendors or potion effects",()=>{
 for(const r of data.recipes){assert.equal(r.output_quantity,null);assert.equal(r.output_quantity_status,"unverified_live_yield");assert.equal(r.available_in_game,null);assert.equal(r.player_level_required,null)}
 for(const item of Object.values(data.items))assert.equal(item.player_level_required,null);
 const x=copy();x.recipes[0].available_in_game=true;x.recipes[2].output_quantity=1;
 assert.ok(codes(x).includes("UNVERIFIED_AVAILABILITY_OR_YIELD"));
});
test("reject duplicate recipe IDs, missing components and unverified sources",()=>{
 const x=copy();x.recipes[1].spell_id=x.recipes[0].spell_id;
 x.recipes[2].ingredients[0].quantity=0;x.items["3371"].source_url="http://classic.test";
 assert.ok(codes(x).includes("RECIPE_ID"));
 assert.ok(codes(x).includes("COMPONENT_INVALID"));
 assert.ok(codes(x).includes("ITEM_PROVENANCE"));
});
test("allowlist, language labels and Classic exclusions are mandatory",()=>{
 const x=copy();x.scope.preview.recipe_item_ids.push(118);x.items["3371"].name.fr="";
 x.excluded_alchemy=[];x.acquisitions=[{method:"vendor",verified_for_forever:true}];
 for(const code of ["ALLOWLIST_INVALID","ITEM_INVALID","FIRST_AID_EXCLUSION","UNVERIFIED_SOURCES_EXPOSED"])
 assert.ok(codes(x).includes(code),code);
});
test("both real profession pages mount a second, collapsed panel without changing engineering",()=>{
 for(const path of ["metiers/index.html","en/metiers/index.html"]){
  const html=read(path);
  assert.ok(html.includes('id="craft-beta"'));
  assert.ok(html.includes('id="alchemy-beta"'));
  assert.ok(html.includes('id="npcs-app"'));
  assert.ok(html.includes('/assets/alchemy-beta.js'));
  assert.ok(html.includes('/assets/alchemy-beta.css'));
  assert.ok(html.includes('/assets/crafting-beta.js'));
  assert.ok(html.indexOf('id="alchemy-beta"')<html.indexOf('id="prof-trainers"'));
  assert.ok(!html.includes('/assets/professions.js'));
 }
});
test("load is opt-in, bilingual and search works for ID, spell and both names",async()=>{
 for(const [lang,path] of [["fr","/metiers/"],["en","/en/metiers/"]]){
  const app=ui(lang,path),section=app.els["alchemy-beta"];
  assert.equal(app.calls.length,0);
  section.open=true;section.fire("toggle");await settle();
  assert.deepEqual(app.calls,["/data/alchemy-chains-beta.json"]);
  assert.equal(app.list().filter(x=>x.className==="craft-result").length,6);
  for(const [term,id] of [["MINOR MANA POTION",2455],["potion de mana mineure",2455],["2331",2455],["247239",247239]]){
   app.els["alchemy-search"].value=term;app.els["alchemy-search"].fire("input");
   const hits=app.list().filter(x=>x.className==="craft-result");
   assert.equal(hits.length,1,term);
   assert.equal(hits[0].dataset.alchemy,String(id));
  }
 }
});
test("direct French and English links select the exact potion, preserve other params and hash",async()=>{
 for(const [lang,path,id,expected] of [["fr","/metiers/",4596,"Potion de soins décolorée mineure"],["en","/en/metiers/",247239,"Lesser Discolored Healing Potion"]]){
  const app=ui(lang,path+"?type=profession&alchemy="+id+"#prof-trainers");
  await settle();assert.equal(app.els["alchemy-beta"].open,true);
  assert.ok(app.els["alchemy-detail"].textContent.includes(expected));
  assert.ok(app.location.search.includes("type=profession"));
  const entry=app.list().find(x=>x.className==="craft-result"&&x.dataset.alchemy!=="4596");
  entry.fire("click");
  assert.equal(app.location.hash,"#prof-trainers");
  assert.equal(new URLSearchParams(app.location.search).get("alchemy"),entry.dataset.alchemy);
 }
});
test("ingredients are clickable leaves, with no invented supplier or drop rate",async()=>{
 const a=ui("en","/en/metiers/?alchemy=247239");await settle();
 const button=a.detail().find(x=>x.className==="craft-component"&&x.textContent.includes("#730"));
 assert.ok(button);button.fire("click");
 assert.equal(new URLSearchParams(a.location.search).get("alchemy"),"730");
 const rendered=a.els["alchemy-detail"].textContent;
 assert.ok(rendered.includes("Forever creature and drop rate unverified."));
 const links=a.detail().filter(x=>x.tag==="a");
 assert.ok(links.every(x=>x.href.startsWith("https://")&&x.rel==="noopener noreferrer"));
});
test("closing an opt-in panel clears the query and restores six entries in both locales",async()=>{
 for(const lang of ["fr","en"]){
  const a=ui(lang,lang==="fr"?"/metiers/":"/en/metiers/");
  const panel=a.els["alchemy-beta"],field=a.els["alchemy-search"];
  panel.open=true;panel.fire("toggle");await settle();
  field.value="2455";field.fire("input");
  assert.equal(a.list().filter(x=>x.className==="craft-result").length,1);
  panel.open=false;panel.fire("toggle");panel.open=true;panel.fire("toggle");await settle();
  assert.equal(field.value,"");
  assert.equal(a.list().filter(x=>x.className==="craft-result").length,6);
  assert.ok(a.els["alchemy-count"].textContent.startsWith("6 / 6"));
  assert.equal(a.calls.length,1);
 }
});
test("mobile component tapping scrolls to selected ingredient and leaves engineering URL intact",async()=>{
 const a=ui("fr","/metiers/?craft=4389&alchemy=2455",true);await settle();
 const component=a.detail().find(x=>x.className==="craft-component"&&x.textContent.includes("#2447"));
 assert.ok(component);component.fire("click");
 assert.ok(a.location.search.includes("craft=4389"));
 assert.equal(new URLSearchParams(a.location.search).get("alchemy"),"2447");
 assert.equal(a.els["alchemy-detail"].scrolls.at(-1).block,"start");
});
test("failed fetch and invalid schema do not display stale or uncontrolled recipes",async()=>{
 const a=ui("en","/en/metiers/");
 a.setReply(async()=>({ok:false,json:async()=>null}));
 a.els["alchemy-beta"].open=true;a.els["alchemy-beta"].fire("toggle");await settle();
 assert.ok(a.els["alchemy-status"].textContent.includes("Data unavailable"));
 assert.equal(a.list().filter(x=>x.className==="craft-result").length,0);
 assert.ok(!appJs.includes(".innerHTML"));
});
test("homepage search indexes six documented potions via valid direct URLs",()=>{
 assert.ok(searchJs.includes("function alchemyRows(db)"));
 assert.ok(searchJs.includes('["data/alchemy-chains-beta.json",alchemyRows]'));
 assert.ok(searchJs.includes('url("metiers/",{alchemy:r.output_item_id})'));
 for(const id of ALLOWED)for(const p of ["/metiers/","/en/metiers/"])
 assert.equal(new URL(p+"?alchemy="+id,"https://foreveroth.com").searchParams.get("alchemy"),String(id));
});

test("actual homepage search consumer opens the correct FR/EN alchemy deep link",async()=>{
 for(const [lang,path,name] of [
  ["fr","/metiers/","Potion de soins décolorée inférieure"],
  ["en","/en/metiers/","Lesser Discolored Healing Potion"]
 ]){
  const ids=["global-search","global-search-input","global-search-panel","global-search-status","global-search-results","global-search-filters","global-search-more"];
  const els=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
  els["global-search-input"].value=name;
  const home="https://foreveroth.com"+(lang==="fr"?"/":"/en/");
  runInNewContext(searchJs,{document:{documentElement:{lang},getElementById:id=>els[id]||null,createElement:tag=>new Element(tag),addEventListener(){}},
   location:{origin:"https://foreveroth.com",href:home},URL,
   fetch:async path=>({ok:true,json:async()=>path==="/data/alchemy-chains-beta.json"?data:{}}),
   console:{warn(){}},window:{addEventListener(){}}});
  els["global-search-input"].fire("focus");await settle();
  const found=els["global-search-results"].children.filter(x=>x.tag==="a"&&x.href.includes("alchemy=247239"));
  assert.ok(found.length>=1,lang+" must find an indexed alchemy potion");
  assert.equal(found[0].href,path+"?alchemy=247239");
  assert.ok(found[0].textContent.includes(lang==="fr"?"Alchimie documentée":"Documented alchemy"));
 }
});
