import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("analytics javascript parses and requires production https + consent",()=>{
 const script=read("assets/analytics.js");
 assert.doesNotThrow(()=>new Script(script));
 assert.match(script,/location.protocol === "https:"/);
 assert.match(script,/location.hostname === "foreveroth.com"/);
 assert.match(script,/if \(choice !== "accepted"/);
 assert.match(script,/page_location: location.origin \+ location.pathname/);
 assert.match(script,/analytics_storage: "denied"/);
 assert.match(script,/if \(value === "accepted"\) start\(\)/);
});
test("Legacy events use only fixed non-sensitive categories",()=>{
 const analytics=read("assets/analytics.js");
 const legacy=read("assets/legacy.js");
 assert.ok(analytics.includes('"legacy-reset", "legacy-share"'));
 assert.ok(analytics.includes('"npc-favorite-toggle", "npc-favorite-open"'));
 for(const route of ['"/talents/heritage/"','"/en/talents/heritage/"'])assert.ok(analytics.includes(route));
 for(const category of ['"rare"','"donjons"','"bis"','"bis-niveaux"'])assert.ok(analytics.includes(category));
 const event=legacy.slice(legacy.indexOf('window.ForEverothAnalytics?.track("tool_interaction"'),legacy.indexOf('window.ForEverothAnalytics?.track("tool_interaction"')+210);
 assert.ok(event.includes('module_name:"legacy"'));
 assert.ok(event.includes('"legacy-point-add"')&&event.includes('"legacy-point-remove"'));
 assert.doesNotMatch(event,/build|talent\.id|encode|searchParams|rank/);
 assert.match(analytics,/if \(eventName !== "module_open" && eventName !== "tool_interaction"\) return/);
});

test("consent-gated module link tracking includes direct map and gear navigation without tracking search text",()=>{
 const analytics=read("assets/analytics.js");
 const common=read("assets/common.js");
 for(const cls of [".module-links",".npc-quick-links",".geo-quick-links"]){
  assert.ok(analytics.includes(cls),cls);
 }
 assert.match(analytics,/anchor\.closest\("/);
 assert.match(analytics,/moduleNames\.has\(moduleName\)/);
 assert.match(analytics,/track\("module_open", \{ module_name: moduleName \}\)/);
 assert.match(analytics,/const dest = new URL\(anchor\.href, location\.href\)/);
 assert.ok(!analytics.includes("query_string:"));
 assert.ok(!analytics.includes("search_term:"));
 assert.match(common,/assets\/analytics\.js\?v=20261125-atlas-interactions1/);
});

test("shared class talent links stay current after editing, reset and level changes",()=>{
 const source=read("assets/talents.js");
 const code=source.slice(source.indexOf("function buildHash()"),source.indexOf("function share()"));
 const location={href:"https://foreveroth.com/en/talents/paladin/?fo_dev=off#b=old",hash:"#b=old"};
 let result;
 const context={ranks:[[1,0],[0],[2]],dataVersion:"test",cls:"Paladin",level:{value:"30"},URL,
  btoa:s=>Buffer.from(s,"binary").toString("base64"),location,history:{replaceState(_a,_b,path){result=path}}};
 runInNewContext(code+"\nsyncSharedHash()",context);
 const url=new URL(result,location.href);
 assert.equal(url.searchParams.get("fo_dev"),"off");
 const unpack=hash=>JSON.parse(Buffer.from(hash.slice(3),"base64url").toString("utf8"));
 assert.deepEqual(unpack(url.hash),{v:"test",c:"Paladin",l:30,p:[[0,0,1],[2,0,2]]});
 context.ranks=[[0,0],[0],[0]];context.level.value="20";
 runInNewContext(code+"\nsyncSharedHash()",context);
 assert.deepEqual(unpack(new URL(result,location.href).hash),{v:"test",c:"Paladin",l:20,p:[]});
 location.hash="#contenu";result=null;
 runInNewContext(code+"\nsyncSharedHash()",context);
 assert.equal(result,null);
 context.history.replaceState=()=>{throw Error("blocked")};location.hash="#b=old";
 assert.doesNotThrow(()=>runInNewContext(code+"\nsyncSharedHash()",context));
 assert.match(source,/ranks=candidate;selected\[ti\]=i;save\(\);syncSharedHash\(\);render\(\)/);
 assert.match(source,/ranks=blank\(\);save\(\);syncSharedHash\(\);render\(\)/);
 assert.match(source,/\+\(points\(\)\+9\)\)\}save\(\);syncSharedHash\(\);render\(\)/);
});
