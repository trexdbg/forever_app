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
 }
});

test("popular trainer routes resolve to actual mapped NPCs and preserve faction context",()=>{
 const db=JSON.parse(read("data/npcs.json"));
 const npc=db.npcs.filter(n=>n.role==="trainer");
 const weapons=["Staves","Two-Handed Swords","Bows","Crossbows","Guns"];
 for(const skill of weapons){
  assert.ok(npc.some(n=>n.trainer_kind==="weapon"&&(n.weapon_skills||[]).includes(skill)),skill+" must exist");
 }
 for(const faction of ["alliance","horde"]){
  assert.ok(npc.some(n=>n.trainer_kind==="weapon"&&n.faction===faction&&(n.weapon_skills||[]).includes("Staves")),faction+" staves");
  assert.ok(npc.some(n=>n.trainer_kind==="weapon"&&n.faction===faction&&(n.weapon_skills||[]).includes("Two-Handed Swords")),faction+" two-handed swords");
 }
 for(const profession of ["Forge","Couture","Secourisme"]){
  assert.ok(npc.some(n=>n.trainer_kind!=="weapon"&&n.profession===profession),profession+" trainer");
 }
 for(const prefix of ["","en/"]){
  const hub=read(prefix+"metiers/index.html");
  const guide=read(prefix+(prefix?"guides/weapon-masters/index.html":"guides/maitres-armes/index.html"));
  assert.match(hub,/<details class="npc-quick-more"><summary>/);
  assert.match(hub,/<nav class="npc-quick-links" aria-label=/);
  for(const skill of ["Two-Handed%20Swords","Bows","Crossbows","Guns"]){
   assert.ok(hub.includes("weapon="+skill+"#prof-trainers"),prefix+skill);
  }
  for(const skill of ["Forge","Couture","Secourisme"]){
   assert.ok(hub.includes("profession="+skill+"#prof-trainers"),prefix+skill);
  }
  for(const faction of ["alliance","horde"]){
   assert.ok(hub.includes("weapon=Staves&amp;faction="+faction+"#prof-trainers"),prefix+faction+" staves");
   assert.ok(guide.includes("weapon=Two-Handed%20Swords&amp;faction="+faction+"#prof-trainers"),prefix+faction+" swords");
  }
  assert.ok(guide.includes("q=Woo%20Ping#prof-trainers"),prefix+" Woo Ping");
  assert.ok(guide.includes("q=Sayoc#prof-trainers"),prefix+" Sayoc");
  assert.match(guide,/(?:Classic reference|références Classic)/i);
 }
 const english=read("en/guides/weapon-masters/index.html");
 assert.match(english,/<title>WoW Forever Weapon Trainer Locations: Staff & Swords<\/title>/);
 assert.match(english,/"dateModified":"2026-11-24"/);
 const css=read("assets/trainer-quick.css");
 assert.match(css,/\.npc-quick-more\[open\]/);
});
