import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("trainer favorites are explicit, local, bounded and restore an exact NPC",()=>{
 const code=read("assets/npcs.js");
 assert.doesNotThrow(()=>new Script(code));
 assert.match(code,/FAVORITES_KEY="foreveroth.trainer.favorites.v1"/);
 assert.match(code,/localStorage.getItem\(FAVORITES_KEY\)/);
 assert.match(code,/localStorage.setItem\(FAVORITES_KEY,JSON.stringify\(favorites\)\)/);
 assert.match(code,/\.slice\(0,12\)/);
 assert.match(code,/fav.setAttribute\("aria-pressed",String\(picked\)\)/);
 assert.match(code,/store.filtered.find\(r=>favoriteKey\(r.npc\)===favoriteKey\(n\)\)/);
 assert.match(code,/trainerTitle\(n\)\+" · "\+side\(n\)/);
 assert.match(code,/window.ForEverothAnalytics\?\.track\("tool_interaction",\{module_name:"metiers",control_name:"npc-favorite-open"\}\)/);
});
test("favorite UI remains hidden by default and is bilingual",()=>{
 for(const p of ["metiers/index.html","en/metiers/index.html"]){
  const html=read(p);
  assert.match(html,/<section class="npc-favorites" id="npc-favorites"[^>]* hidden>/);
  assert.match(html,/id="npc-favorites-links"/);
  assert.match(html,/id="npc-type"/);
  assert.match(html,/id="npc-map-canvas"/);
 }
 const css=read("assets/trainer-quick.css");
 assert.match(css,/\.npc-favorites\[hidden\]/);
 assert.match(css,/\.npc-favorite-toggle\[aria-pressed="true"\]/);
});
test("no favorite ID, coordinates or search text are sent to analytics",()=>{
 const a=read("assets/analytics.js");
 assert.ok(a.includes('"npc-favorite-toggle", "npc-favorite-open"'));
 const script=read("assets/npcs.js");
 const start=script.indexOf('window.ForEverothAnalytics?.track("tool_interaction"');
 assert.ok(start>0);
 const payload=script.slice(start).split("\n")[0];
 assert.equal(payload,'window.ForEverothAnalytics?.track("tool_interaction",{module_name:"metiers",control_name:"npc-favorite-open"});');
});
