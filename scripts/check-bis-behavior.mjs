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
 '  eligible,plan,uncertainReferences,uncertainCatalogueLink,emptySlotReason,',
 '  setBand(v){band=v;},',
 '  setClass(id,role){classId=id;specId=role;},',
 '  computePlan(){currentPlan=plan();return currentPlan;},',
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
 // One available unique item may target only one of the two trinket slots.
 // The second slot must explain reuse instead of pretending no references exist.
 const testTrinket={id:990001,name:"Test trinket",slot:"trinket1",
  requiredLevel:18,itemLevel:23,quality:"rare",source_status:"forever_beta_observed",
  tooltip:["Requires Level 18"]};
 bis.setClass("voleur","swords");bis.setBand(1);bis.setOrigin("forever");bis.setSource("all");
 bis.setRows([testTrinket]);
 const trinketPlan=bis.computePlan();
 assert.equal(trinketPlan.selected.get("trinket1")?.id,990001,lang+": trinket 1 eligible");
 assert.equal(trinketPlan.selected.get("trinket2"),null,lang+": same reference cannot be reused");
 assert.match(bis.emptySlotReason("trinket2",false),
  lang==="en"?/already suggested/:/déjà proposées/,
  lang+": second trinket explains that existing candidate is used elsewhere");
 assert.match(bis.emptySlotReason("head",false),
  lang==="en"?/No compatible reference/:/Aucune référence compatible/,
  lang+": empty head slot explains why no suggestion is displayed");
 bis.setSource("all");bis.setOrigin("classic");
 assert.equal(db.slots.flatMap(s=>bis.uncertainReferences(s.id)).length,0,
  lang+": Classic-only filter must not show uncertain Forever rewards");
}
const catalogue=read("assets/items-v3.js");
assert.match(catalogue,/get\("q"\)/,"Catalogue must support ?q= ID links");
assert.match(catalogue,/if\(linkedQuery\)\{status="all"/,"Catalogue must show linked unknown-level items");
assert.match(source,/results\.append\(refs\)/,"Read-only references must be rendered in BiS picker");

/* The live catalogue badge must distinguish beta quest rewards from dungeon loot.
 * Evaluate the actual production helper with the same Forever records as the BiS page.
 */
const badgeStart=catalogue.indexOf("function sourceType(item)");
const badgeEnd=catalogue.indexOf("function betaLevel30(item)",badgeStart);
assert.ok(badgeStart>=0&&badgeEnd>badgeStart,"Catalogue badge helper not found");
assert.match(catalogue,/tag\.textContent=provenanceBadge\(i\)/,
 "Visible catalogue badge must use the checked helper");
const badgeCode=catalogue.slice(badgeStart,badgeEnd);
for(const lang of ["fr","en"]){
 const label=item=>vm.runInNewContext(badgeCode+"\nprovenanceBadge(item);",
  {en:lang==="en",item},{filename:"assets/items-v3.js"});
 const expectedQuest="Forever";
 const expectedLoot="Forever";
 const expectedClassic="Classic";
 const expectedClient="Forever";
 for(const item of observed.filter(i=>i.acquisition?.kind==="quest")){
  assert.equal(label(item),expectedQuest,lang+": beta quest reward "+item.id+" must not be labelled loot");
 }
 assert.equal(label(dungeon),expectedLoot,lang+": dungeon drop keeps reported-loot badge");
 assert.equal(label({id:5191,source_status:"classic_curated_leveling"}),expectedClassic,
  lang+": Classic provenance must be unchanged");
 assert.equal(label({id:249234,source_status:"forever_beta_60tools"}),expectedClient,
  lang+": datamined Forever reference keeps beta-client badge");
}

console.log("BiS behavior OK: quest excluded, documented dungeon selected, 11 uncertain references linked in FR/EN.");
