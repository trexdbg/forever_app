import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const analytics=read("assets/analytics.js");
const start=analytics.indexOf("  function classifyAtlasControl(");
const filterAt=analytics.indexOf("  function classifyAtlasFilter(",start);
const end=analytics.indexOf('  document.addEventListener("click"',filterAt);
assert.ok(start>=0&&filterAt>start&&end>filterAt,"isolated atlas categories");
const clickSource=analytics.slice(start,filterAt),changeSource=analytics.slice(filterAt,end);
const classify=(path,classes,inside=true)=>{
 const button={
  matches:selector=>classes.includes(selector),
  closest:selector=>inside&&[ ".rare-app", ".dg-shell" ].includes(selector)?{}:null
 };
 const target={closest:selector=>selector==="button"?button:null};
 const r=runInNewContext(clickSource+"\nclassifyAtlasControl(path,target)",{path,target});
 return r===null?null:[r.module_name,r.control_name,Object.keys(r).sort().join(",")];
};
const filter=(path,id,inside=true,value="private choices")=>{
 const element={id,value,checked:true,closest:selector=>inside&&[ ".rare-app", ".dg-shell" ].includes(selector)?{}:null};
 const r=runInNewContext(changeSource+"\nclassifyAtlasFilter(path,element)",{path,element,Set});
 return r===null?null:[r.module_name,r.control_name,Object.keys(r).sort().join(",")];
};

test("rare and dungeon click interactions use fixed categories only on exact locale paths",()=>{
 assert.doesNotThrow(()=>new Script(analytics));
 const names=[
  [".rare-share","rare-share"],[".rare-row","rare-select"],
  [".rare-coord","rare-select-pin"],[".rare-legend-entry","rare-map-legend"],
  [".rare-set-piece","rare-set-piece"],[".rare-copy","rare-copy-way"],
  ["#rare-zoom-in","rare-zoom-in"],["#rare-zoom-out","rare-zoom-out"],
  ["#rare-zoom-reset","rare-zoom-reset"]
 ];
 const dungeons=[
  [".dg-entry","dungeon-select"],[".dg-boss-navitem","dungeon-select-boss"],
  [".dg-pager","dungeon-boss-pager"],[".dg-way-button","dungeon-copy-way"],
  ["#dg-route","dungeon-map-route"],["#dg-world","dungeon-map-world"],
  ["#dg-zoom-in","dungeon-zoom-in"],["#dg-zoom-out","dungeon-zoom-out"],
  ["#dg-zoom-reset","dungeon-zoom-reset"]
 ];
 for(const path of ["/rare/","/en/rare/"])for(const [selector,name] of names)
  assert.deepEqual(classify(path,[selector]),["rare",name,"control_name,module_name"],path+" "+selector);
 for(const path of ["/donjons/","/en/donjons/"])for(const [selector,name] of dungeons)
  assert.deepEqual(classify(path,[selector]),["donjons",name,"control_name,module_name"],path+" "+selector);
 for(const path of ["/","/rare/private/","/en/metiers/","/en/guides/rare-5831/","/donjons/extra/"]){
  assert.equal(classify(path,[".rare-row"]),null);
  assert.equal(classify(path,[".dg-entry"]),null);
 }
 assert.equal(classify("/rare/",[".rare-row"],false),null,"outside rare app");
 assert.equal(classify("/donjons/",[".dg-entry"],false),null,"outside dungeon app");
 assert.equal(classify("/rare/",[".unrecognised"]),null);
 assert.equal(classify("/donjons/",[".dg-boss-share",".dg-pager"]),null,"no duplicate count for built-in boss share event");
 assert.deepEqual(classify("/rare/",[".rare-share",".rare-copy"]),
   ["rare","rare-share","control_name,module_name"],"share not counted as copy /way");
});

test("filters send only fixed control IDs, never selected values, checked states or typed searches",()=>{
 const rare=["rare-zone","rare-rank","rare-level","rare-verification","rare-loot","rare-tame","rare-mapped"];
 const dungeon=["dg-level","dg-status"];
 for(const path of ["/rare/","/en/rare/"])for(const id of rare)
  assert.deepEqual(filter(path,id),["rare",id,"control_name,module_name"]);
 for(const path of ["/donjons/","/en/donjons/"])for(const id of dungeon)
  assert.deepEqual(filter(path,id),["donjons",id,"control_name,module_name"]);
 for(const path of ["/rare/","/en/rare/"]){
  assert.equal(filter(path,"rare-search"),null,"no private NPC/loot search");
  assert.equal(filter(path,"rare-zone",false),null,"not outside atlas");
  assert.equal(filter(path,"unknown"),null);
 }
 assert.equal(filter("/en/donjons/","dg-search"),null);
 assert.equal(filter("/donjons/","dg-level",false),null);
 assert.equal(filter("/en/guides/rare-5831/","rare-zone"),null);
 assert.deepEqual(filter("/en/rare/","rare-level",true,"Vultros"),["rare","rare-level","control_name,module_name"],"selected value never enters telemetry");
});
test("both classifiers call the existing consent-gated tracker without private payloads",()=>{
 const code=analytics;
 assert.match(code,/const atlasControl = classifyAtlasControl\(location\.pathname, target\)/);
 assert.match(code,/if \(atlasControl\) track\("tool_interaction", atlasControl\)/);
 assert.match(code,/const atlasFilter = classifyAtlasFilter\(location\.pathname, el\)/);
 assert.match(code,/if \(atlasFilter\) track\("tool_interaction", atlasFilter\)/);
 assert.match(code,/if \(choice !== "accepted" \|\| !window\.__foreverothGa4Started\) return/);
 assert.match(code,/if \(eventName !== "module_open" && eventName !== "tool_interaction"\) return/);
 assert.doesNotMatch(clickSource,/location\.search|searchParams|localStorage|sessionStorage|querySelector|selectedBoss|pointIndex|r\.name/);
 const executableChange=changeSource.split("\n").filter(line=>!line.trim().startsWith("//")).join("\n");
 assert.doesNotMatch(executableChange,/\.value\b|\.checked\b|searchParams|localStorage|sessionStorage/);
 assert.ok(read("assets/common.js").includes("analytics.js?v=20261125-atlas-interactions1"));
});

test("click selectors are used by the real atlas scripts and their dynamic buttons",()=>{
 const rare=read("assets/rares.js"),dungeon=read("assets/dungeons.js");
 for(const selector of ["rare-row","rare-coord","rare-legend-entry","rare-set-piece","rare-share","rare-copy"])
  assert.ok(rare.includes(selector),selector);
 for(const selector of ["dg-entry","dg-boss-navitem","dg-pager","dg-way-button","dg-boss-share"])
  assert.ok(dungeon.includes(selector),selector);
 for(const page of ["rare/index.html","en/rare/index.html","donjons/index.html","en/donjons/index.html"]){
  const html=read(page);
  assert.match(html,/data-page=/);
 }
});
