/* Offline behavioral regression: tests real BiS eligibility and planner.
 * No network, sync, DOM implementation or publication.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const observed = JSON.parse(read("data/bis-niveaux-forever-observed.json")).items;
const db = JSON.parse(read("data/bis.json"));
const source = read("assets/bis-niveaux.js");
const insertion = source.lastIndexOf("\n(async()=>{");
assert.ok(insertion > 0, "BiS bootstrap location changed: update behavioral harness");
const instrumented = source.slice(0, insertion) + "\n" + [
 'db=globalThis.__fixtureDb;',
 'all=globalThis.__fixtureItems;',
 'classId="mage"; specId="dps"; band=2;',
 'origin="forever"; sourceKind="all";',
 'globalThis.__bisAudit={',
 '  eligible,plan,uncertainReferences,uncertainCatalogueLink,',
 '  setBand(v){band=v;},',
 '  setRows(v){all=v;},',
 '  setOrigin(v){origin=v;},',
 '  setSource(v){sourceKind=v;}',
 '};',
 '})();'
].join("\n");
const compatible = (a,b)=>a===b||
 (["finger1","finger2"].includes(a)&&["finger1","finger2"].includes(b))||
 (["trinket1","trinket2"].includes(a)&&["trinket1","trinket2"].includes(b));
function inspect(lang){
 const context={
  window:{ForeverGearData:{LABELS:{},compatible}},
  document:{documentElement:{lang},getElementById:id=>id==="level-bis"?{}:null},
  URLSearchParams,location:{search:"",href:"https://foreveroth.com/bis-niveaux/",origin:"https://foreveroth.com"},
  localStorage:{getItem:()=>null},__fixtureDb:db,__fixtureItems:observed,
  console
 };
 vm.createContext(context);
 vm.runInContext(read("assets/equipment-rules.js"),context,{filename:"assets/equipment-rules.js"});
 vm.runInContext(instrumented,context,{filename:"assets/bis-niveaux.js"});
 assert.ok(context.__bisAudit,"BiS runtime regression hook not installed");
 return context.__bisAudit;
}
const quest = observed.find(i=>i.id===279865);
const dungeon = observed.find(i=>i.id===271096);
assert.ok(quest&&dungeon);
assert.equal(quest.questLevel,21);
assert.equal(quest.requiredLevel,null);
assert.equal(dungeon.requiredLevel,13);
const expectedUnknown=observed.filter(i=>i.acquisition?.kind==="quest"&&i.requiredLevel===null)
 .map(i=>i.id).sort((a,b)=>a-b);
assert.equal(expectedUnknown.length,11);
for(const lang of ["fr","en"]){
 const bis=inspect(lang);
 assert.equal(bis.eligible(quest),false,lang+": quest 21 with unknown equip level cannot be eligible at 20-24");
 assert.equal(bis.eligible(dungeon),true,lang+": documented level-13 wrist item must remain eligible for mage");
 bis.setRows([quest,dungeon]);
 const plan=bis.plan();
 assert.equal(plan.selected.get("back"),null,lang+": unknown-level quest must not occupy a recommended slot");
 assert.equal(plan.selected.get("wrist")?.id,271096,lang+": documented dungeon wrist should be auto-selected");
 bis.setRows(observed);
 bis.setBand(4);
 const visible=[...new Set(db.slots.flatMap(s=>bis.uncertainReferences(s.id).map(i=>i.id)))]
  .sort((a,b)=>a-b);
 assert.deepEqual(visible,expectedUnknown,lang+": all 11 uncertain quest rewards stay visible in the read-only picker");
 for(const id of visible){
  const href=bis.uncertainCatalogueLink({id});
  assert.equal(href,(lang==="en"?"/en/equipements/?q=":"/equipements/?q=")+id,
   lang+": uncertain reference must link to the catalogue, never a gear-selection action");
 }
 bis.setSource("dungeon");
 assert.equal(db.slots.flatMap(s=>bis.uncertainReferences(s.id)).length,0,
  lang+": quest references must respect acquisition filters");
 bis.setSource("all");bis.setOrigin("classic");
 assert.equal(db.slots.flatMap(s=>bis.uncertainReferences(s.id)).length,0,
  lang+": Classic-only filter must not show uncertain Forever rewards");
}
const catalogue=read("assets/items-v3.js");
assert.match(catalogue,/get\("q"\)/,"Catalogue must support ?q= ID links");
assert.match(catalogue,/if\(linkedQuery\)\{status="all"/,"Catalogue must show linked unknown-level items");
assert.match(source,/results\.append\(refs\)/,"Read-only references must be rendered in BiS picker");
console.log("BiS behavior OK: quest excluded, documented dungeon selected, 11 uncertain references linked in FR/EN.");
