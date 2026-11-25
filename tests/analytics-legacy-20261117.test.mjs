import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
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
