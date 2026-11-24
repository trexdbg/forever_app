import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

function extractFunction(asset,name,next){
 const js=read(asset);
 const start=js.indexOf("function "+name+"(){");
 const end=js.indexOf("\nfunction "+next+"()",start);
 assert.ok(start>=0 && end>start,"Pure navigation helper must exist: "+name);
 return js.slice(start,end);
}

function fakeLink(path){
 return {base:path,href:path,getAttribute(name){assert.equal(name,"href");return this.base}};
}

test("pre-raid class and spec transfer to level 30 without transferring equipment or storage",()=>{
 const source=extractFunction("assets/bis-v2.js","syncLevelingGearLinks","renderAll");
 const en=fakeLink("/en/bis-niveaux/?niveau=30"),fr=fakeLink("/bis-niveaux/?niveau=30");
 vm.runInNewContext(source+"\nsyncLevelingGearLinks()",{
   document:{querySelectorAll(sel){assert.equal(sel,"[data-bis-level-link]");return [en,fr]}},
   location:{origin:"https://foreveroth.com"},chosenClass:"voleur",chosenSpec:"daggers",URL,
 });
 for(const [link,route] of [[en,"/en/bis-niveaux/"],[fr,"/bis-niveaux/"]]){
  const url=new URL(link.href,"https://foreveroth.com");
  assert.equal(url.pathname,route);
  assert.equal(url.searchParams.get("classe"),"voleur");
  assert.equal(url.searchParams.get("spe"),"daggers");
  assert.equal(url.searchParams.get("niveau"),"30");
  assert.equal(url.searchParams.get("equip"),null);
 }
 assert.doesNotMatch(source,/(?:localStorage|sessionStorage)\\s*\\.|searchParams\\.set\\(["\u0027]equip["\u0027]|(?:choices|owned)\\s*\\[/);
 assert.match(read("assets/bis-v2.js"),/renderPicker\(\);syncLevelingGearLinks\(\)/);
});

test("leveling class and spec transfer back to pre-raid without importing leveling filters",()=>{
 const source=extractFunction("assets/bis-niveaux.js","syncPreRaidGearLinks","renderAll");
 const en=fakeLink("/en/bis/"),fr=fakeLink("/bis/");
 vm.runInNewContext(source+"\nsyncPreRaidGearLinks()",{
   document:{querySelectorAll(sel){assert.equal(sel,"[data-bis-preraid-link]");return [en,fr]}},
   location:{origin:"https://foreveroth.com"},classId:"chasseur",specId:"dps",URL,
 });
 for(const [link,route] of [[en,"/en/bis/"],[fr,"/bis/"]]){
  const url=new URL(link.href,"https://foreveroth.com");
  assert.equal(url.pathname,route);
  assert.equal(url.searchParams.get("classe"),"chasseur");
  assert.equal(url.searchParams.get("spe"),"dps");
  assert.equal(url.searchParams.get("niveau"),null);
  assert.equal(url.searchParams.get("origine"),null);
  assert.equal(url.searchParams.get("source"),null);
 }
 assert.match(read("assets/bis-niveaux.js"),/selectionLink\(\);syncPreRaidGearLinks\(\);ensureRemote\(\)/);
});

test("both locale pages expose one early and one footer route and bust changed JS assets",()=>{
 for(const [language,pre,level] of [
   ["en","en/bis/index.html","en/bis-niveaux/index.html"],
   ["fr","bis/index.html","bis-niveaux/index.html"]
 ]){
  const preHtml=read(pre),levelHtml=read(level);
  assert.equal((preHtml.match(/data-bis-level-link/g)||[]).length,2,language+" pre-raid routes");
  assert.equal((levelHtml.match(/data-bis-preraid-link/g)||[]).length,2,language+" leveling routes");
  assert.match(preHtml,/assets\/bis-v2\.js\?v=20261124-class-handoff1/);
  assert.match(levelHtml,/assets\/bis-niveaux\.js\?v=20261124-class-handoff1/);
  assert.match(preHtml,/<nav class="module-links"[^>]*><a data-bis-level-link/);
  assert.match(levelHtml,/<nav class="module-links"[^>]*><a data-bis-preraid-link/);
 }
});
