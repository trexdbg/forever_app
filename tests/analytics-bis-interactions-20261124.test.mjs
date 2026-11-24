import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script, runInNewContext} from "node:vm";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const analytics=read("assets/analytics.js");
const start=analytics.indexOf("  function classifyBisControl(");
const end=analytics.indexOf('\n  document.addEventListener("click",',start);
assert.ok(start>=0&&end>start,"classification helper not found");
const helper=analytics.slice(start,end);
const boardSelector=".bis-board, .level-bis-board";
const targetFor=(classes,inBoard=true)=>{
 const b={
  matches(selector){return classes.includes(selector);},
  closest(selector){return selector===boardSelector&&inBoard?{}:null}
 };
 return {closest(selector){return selector==="button"?b:null}};
};
const classify=(path,classes,inBoard=true)=>{
 const result=runInNewContext(helper+"\nclassifyBisControl(path,target)",{
  path,target:targetFor(classes,inBoard)
 });
 return result&&{module_name:result.module_name,control_name:result.control_name};
};

test("BiS clicks classify only coarse, fixed action types on exact FR/EN routes",()=>{
 assert.doesNotThrow(()=>new Script(analytics));
 const categories=[
  [".bis-class","bis-class"],[".bis-spec","bis-spec"],
  [".level-bis-band","bis-level-band"],[".level-bis-kind","bis-source-filter"],
  [".bis-v2-slot","bis-equipment-slot"],[".bis-v2-candidate","bis-candidate"],
  [".bis-v2-owned","bis-owned-toggle"],[".bis-v2-clear","bis-clear-slot"],
  [".bis-v2-quality","bis-quality-filter"],[".bis-v2-more","bis-load-more"],
  [".bis-v2-info-button","bis-item-details"]
 ];
 for(const path of ["/bis/","/en/bis/","/bis-niveaux/","/en/bis-niveaux/"]){
  const module_name=path.includes("bis-niveaux")?"bis-niveaux":"bis";
  for(const [selector,control_name] of categories){
   assert.deepEqual(classify(path,[selector]),{module_name,control_name});
  }
  assert.equal(classify(path,[".private-item-273047"]),null);
  assert.equal(classify(path,[".bis-v2-candidate"],false),null);
 }
 for(const path of ["/","/en/","/en/metiers/","/en/guides/weapon-masters/",
                    "/bis/?q=private","/bis/extra/","/en/bis-niveaux/other/"]){
  assert.equal(classify(path,[".bis-v2-candidate"]),null,path);
 }
});

test("BiS tracking uses the existing consent-gated event and does not transmit character builds",()=>{
 assert.match(analytics,/const bisControl = classifyBisControl\(location\.pathname, target\)/);
 assert.match(analytics,/if \(bisControl\) track\("tool_interaction", bisControl\)/);
 assert.match(analytics,/if \(choice !== "accepted" \|\| !window\.__foreverothGa4Started\) return/);
 assert.match(analytics,/if \(eventName !== "module_open" && eventName !== "tool_interaction"\) return/);
 assert.doesNotMatch(helper,/searchParams|item\.id|querySelector|localStorage|sessionStorage|\.dataset|selectedClass|chosenClass|classId|specId/);
 assert.doesNotMatch(helper,/location\.search|user_id|gear_id/);
 assert.match(read("assets/common.js"),/analytics\.js\?v=20261124-bis-interactions1/);
});

test("the measured controls exist on both BiS pages but are not confused with search terms",()=>{
 for(const path of ["bis/index.html","en/bis/index.html"]){
  const html=read(path);
  assert.match(html,/class="bis-board"/);
  assert.match(html,/id="bis-classes"/);
  assert.match(html,/id="bis-specs"/);
  assert.match(html,/id="bis-paperdoll"/);
 }
 for(const path of ["bis-niveaux/index.html","en/bis-niveaux/index.html"]){
  const html=read(path);
  assert.match(html,/class="level-bis-board"/);
  assert.match(html,/id="level-classes"/);
  assert.match(html,/id="level-specs"/);
  assert.match(html,/id="level-bands"/);
 }
 const classic=read("assets/bis-v2.js"),leveling=read("assets/bis-niveaux.js");
 for(const cls of ["bis-class","bis-spec","bis-v2-slot","bis-v2-candidate"]){
  assert.ok(classic.includes(cls),cls);
  assert.ok(leveling.includes(cls),cls);
 }
 for(const cls of ["level-bis-band","level-bis-kind"])assert.ok(leveling.includes(cls),cls);
});
