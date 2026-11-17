import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const pairs=[["en/guides/quest-rewards-the-wrath-of-rath-mael/index.html","en/guides/bronze-tube/index.html"],["guides/recompenses-quete-the-wrath-of-rath-mael/index.html","guides/tube-en-bronze/index.html"]];
test("quest 92422 has post-launch location, reported chain and honest evidence FR/EN",()=>{
 for(const [path] of pairs){
  const html=read(path);
  assert.match(html,/<section id="quest-route">/);
  assert.match(html,/<section id="quest-rewards">/);
  assert.match(html,/92422/);
  assert.match(html,/Rear Guard Patrol/);
  assert.match(html,/Deathguard Kristof/);
  assert.match(html,/Ruins of Lordaeron|Ruines de Lordaeron/);
  assert.match(html,/2026|17 novembre 2026/);
  assert.match(html,/251533/);
  assert.match(html,/251534/);
  assert.match(html,/quest=92422/);
  assert.match(html,/(?:not independently validated|non confirmé directement|not independently validated by our own gameplay|non confirmé directement par nos soins)/i);
  assert.match(html,/href="#quest-route"/);
  assert.match(html,/href="#quest-rewards"/);
  assert.match(html,/rel="canonical"/);
  assert.match(html,/hreflang="fr"/);
  assert.match(html,/hreflang="en"/);
 }
});
test("Bronze Tube shows direct vendor/craft paths but never asserts Classic availability",()=>{
 for(const [,path] of pairs){
  const html=read(path);
  for(const id of ["tube-nearby","tube-recipe","tube-vendors"]){
   assert.ok(html.includes('href="#'+id+'"')&&html.includes('id="'+id+'"'),path+" "+id);
  }
  assert.match(html,/4371/);
  assert.match(html,/3938/);
  assert.match(html,/2880/);
  assert.match(html,/(?:unconfirmed|inconnu|non vérifi|inconnue)/i);
 }
});
