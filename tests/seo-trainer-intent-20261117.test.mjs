import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const masters=["Ilyenia Moonfire","Bixi Wobblebonk","Buliwyf Stonehand","Woo Ping","Hanashi","Sayoc","Ansekhwa","Archibald"];
test("trainer deep links apply strict option allowlist only after loading selectors",()=>{
 const code=read("assets/npcs.js");
 const at=code.indexOf('const choice=(control,key)=>{');
 assert.ok(at>code.indexOf('store.db=db;makeRecords();filters()'));
 const tail=code.slice(at,at+1200);
 for(const param of ["type","faction","profession","weapon","rank","zone"]){
  assert.ok(tail.includes(',"'+param+'")'),"missing deep link "+param);
 }
 assert.match(tail,/wanted.length<=80/);
 assert.match(tail,/control.options/);
 assert.match(tail,/type.value="weapon";trade.value="all"/);
 assert.match(tail,/updateFilterVisibility\(\)/);
});
test("trainer and weapon guides have genuine actionable deep links in both languages",()=>{
 for(const locale of ["","en/"]){
  const hub=read(locale+"metiers/index.html");
  const guide=read(locale+(locale?"guides/weapon-masters/index.html":"guides/maitres-armes/index.html"));
  assert.match(hub,/<nav class="npc-quick-links"/);
  assert.match(guide,/<nav class="geo-quick-links"/);
  for(const skill of ["Staves","Polearms","One-Handed%20Swords"]){
   assert.ok(hub.includes("weapon="+skill),locale+skill);
   assert.ok(guide.includes("weapon="+skill),locale+skill);
  }
  for(const npc of masters){
   assert.ok(guide.includes("?type=weapon&amp;q="+encodeURIComponent(npc)+"#prof-trainers"),locale+npc);
  }
  assert.match(guide,/(?:not directly verified|ne sont pas confirmés)/i);
  assert.ok(hub.includes("trainer-quick.css"));
  assert.match(guide,/<link rel="canonical"/);
 });
});
