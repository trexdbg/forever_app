import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const script=readFileSync(resolve(root,"assets/npcs.js"),"utf8");
const css=readFileSync(resolve(root,"assets/npcs.css"),"utf8");
const map=readFileSync(resolve(root,"assets/npc-map.js"),"utf8");

test("all eight named weapon masters have Classic model previews with safe fallback",()=>{
 const match=script.match(/const weaponPortraits=(\{[^;]+\});/);
 assert.ok(match,"missing named NPC model mapping");
 assert.deepEqual(JSON.parse(match[1]),{
  "Ilyenia Moonfire":11802,"Bixi Wobblebonk":12992,
  "Buliwyf Stonehand":11806,"Woo Ping":11804,
  "Hanashi":12989,"Sayoc":11801,
  "Ansekhwa":11803,"Archibald":11805
 });
 assert.match(script,/octowow\.st\/db\/images\/models\//);
 assert.match(script,/img\.addEventListener\("error",\(\)=>img\.remove\(\)\)/);
 assert.match(script,/npc-master-initials/);
 assert.match(script,/npc-master-portrait-origin/,"visible Classic origin marker required");
 assert.match(script,/Portrait Classic · source ↗/,"player-facing source required");
 assert.match(css,/\.npc-master-portrait\.has-portrait \.npc-master-portrait-origin\{display:block\}/);
});

test("weapon master name comes before a compact label-only skill list",()=>{
 assert.match(script,/const trainerTitle=n=>trainerType\(n\)==="weapon"\?n\.name:/);
 assert.match(script,/trainerSkillSummary\(n\),"npc-trainer-skill-summary"/);
 assert.match(script,/append\(skills,"span",weaponLabels\[skill\]\|\|skill,"npc-weapon-teaching-skill"\)/);
 assert.doesNotMatch(script,/chip\.append\(wowIcon\(weaponIcons\[skill\]/);
 assert.match(map,/n\.trainer_kind==="weapon"\?n\.name:en\?/);
 assert.match(css,/\.npc-master-portrait\.has-portrait \.npc-master-initials\{display:none\}/);
 assert.match(css,/\.npc-trainer-skill-summary/);
});
