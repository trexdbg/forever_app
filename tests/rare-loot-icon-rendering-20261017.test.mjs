import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const source=read("assets/rares.js");
const data=JSON.parse(read("data/rares.json"));
const start=source.indexOf("const rareLootIconNames=");
const end=source.indexOf("const lootName=",start);
assert.ok(start>0&&end>start,"Display-only icon resolver must be present");

function iconHelpers(locale="fr"){
 const m=(tag,txt,cls)=>({
  tag,textContent:txt??"",className:cls||"",children:[],classList:{values:[],add(x){this.values.push(x)}},
  append(...nodes){this.children.push(...nodes)},
  replaceChildren(...nodes){this.children=nodes}
 });
 return runInNewContext(source.slice(start,end)+";({rareLootIconNames,rareLootIconName,rareLootImage})",{
  m,T:(fr,en)=>locale==="fr"?fr:en
 });
}
const fr=iconHelpers("fr"),en=iconHelpers("en");
const allDrops=data.rares.flatMap(r=>r.loot||[]);
const item=id=>allDrops.find(x=>x.item_id===id);

test("Nightscreech Wisesight Wand displays its correct local icon in FR and EN",()=>{
 const wand=item(286750);
 assert.ok(wand,"Wisesight Wand missing from rare catalogue");
 assert.equal(wand.icon,undefined,"This test covers items with missing icon metadata");
 for(const helpers of [fr,en]){
  assert.equal(helpers.rareLootIconName(wand),"inv_wand_01");
  const frame=helpers.rareLootImage(wand);
  assert.equal(frame.children[0].tag,"img");
  assert.equal(frame.children[0].src,"/assets/icons/inv_wand_01.jpg");
 }
});

test("curated icon names resolve; unknown and unsafe icons have a neutral placeholder",()=>{
 for(const id of [18610,18611,18612,1913,4854,284666,286534,286537,286746,286749,286750,286755]){
  assert.ok(item(id),"Missing loot item "+id);
  assert.match(fr.rareLootIconName(item(id)),/^[a-z0-9_]+$/);
 }
 const noIcon=item(284174);
 assert.ok(noIcon);
 assert.equal(fr.rareLootIconName(noIcon),null);
 const missing=fr.rareLootImage(noIcon);
 assert.ok(missing.classList.values.includes("rare-loot-icon-unavailable"));
 assert.equal(missing.children[0].textContent,"◇");
 assert.ok(!source.includes('item.icon||"inv_misc_questionmark"'));
 assert.equal(fr.rareLootIconName({item_id:999,icon:"../danger"}),null);
});

test("failed icon requests retain the neutral icon slot",()=>{
 const frame=en.rareLootImage(item(18610));
 const img=frame.children[0];
 assert.equal(img.tag,"img");
 assert.ok(img.src.startsWith("https://wow.zamimg.com/"));
 img.onerror();
 assert.equal(frame.children[0].textContent,"◇");
 assert.equal(frame.title,"Item icon not documented");
});

test("FR/EN pages use matching cache-busted versions",()=>{
 for(const path of ["rare/index.html","en/rare/index.html"]){
  const html=read(path);
  assert.ok(html.includes("/assets/rares.js?v=20261017-loot-icons-1"),path);
  assert.ok(html.includes("/assets/rares.css?v=20261017-loot-icons-1"),path);
 }
});
