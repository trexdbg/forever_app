import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const rares=JSON.parse(read("data/rares.json"));
const idx=JSON.parse(read("data/item-acquisition-index.json"));
const expectedNpcs=[
 {id:"dun-morogh-timber",name:"Timber",fr:"Grumeux",classic:1132},
 {id:"3056",name:"Ghost Howl",fr:"Hurleur fantomatique",classic:3056},
 {id:"teldrassil-blackmoss-the-fetid",name:"Blackmoss the Fetid",fr:"Noiremousse le Fétide",classic:3535}
];
const expectedItems=[
 {rare:"3056",id:4854,en:"Demon Scarred Cloak",fr:"Cape griffée par les démons"},
 {rare:"teldrassil-blackmoss-the-fetid",id:5179,en:"Moss-twined Heart",fr:"Cœur moussu"}
];

test("three localized low-level rares use source-attributed Classic frFR without certifying Forever",()=>{
 for(const c of expectedNpcs){
  const r=rares.rares.find(x=>x.id===c.id);
  assert.ok(r,"Missing rare "+c.id);
  assert.equal(r.name.en,c.name);
  assert.equal(r.name.fr,c.fr);
  assert.equal(r.name_fr_status,"classic_reference");
  assert.equal(r.name_fr_source_url,"https://www.wowhead.com/classic/fr/npc="+c.classic+(c.classic===3535?"/noiremousse-le-fetide":c.classic===3056?"/hurleur-fantomatique":"/grumeux"));
  assert.match(r.name_fr_evidence_note,/not verified against the WoW Forever client/);
  assert.equal(r.reference,"classic_cmangos_not_forever_verified");
  assert.equal(r.seen_forever,false);
  assert.equal(r.location_review.location_status,"classic_reference");
 }
});
test("two Forever-documented quest drops use localized Classic FR names with separate source provenance",()=>{
 for(const c of expectedItems){
  const r=rares.rares.find(x=>x.id===c.rare);
  const drop=r.loot.find(x=>x.item_id===c.id);
  assert.ok(drop);
  assert.equal(drop.name.en,c.en);
  assert.equal(drop.name.fr,c.fr);
  assert.equal(drop.name_fr_status,"classic_reference");
  assert.ok(drop.name_fr_source_url.startsWith("https://www.wowhead.com/classic/fr/item="+c.id));
  assert.match(drop.name_fr_evidence_note,/not an attested separate Forever translation/);
  assert.equal(drop.source_version,"forever_beta");
  assert.equal(drop.evidence_level,"documented_forever");
  assert.equal(drop.evidence_kind,"forever_community_page");
  assert.equal(drop.observed_build,"unknown");
  assert.ok(drop.evidence_url.startsWith("https://www.wowhead.com/forever/item="+c.id));
  assert.equal(drop.chance_forever_observed_percent,null);
  const source=idx.items.find(x=>x.id===c.id)?.sources.find(x=>x.kind==="rare");
  assert.ok(source);
  assert.equal(source.name_fr,r.name.fr);
  assert.equal(source.name_en,r.name.en);
  assert.equal(source.evidence_level,"documented_forever");
 }
 assert.deepEqual(idx,buildFromFiles(),"Cross-catalogue index must stay reproducible");
});
test("the UI does not mistake all Forever-referenced drops for new items or official translations",()=>{
 const js=read("assets/rares.js");
 assert.ok(js.includes('T("Butins","Loot")'));
 assert.ok(!js.includes("Objets ajoutés dans Forever"));
 assert.ok(!js.includes("Forever-specific items"));
 assert.ok(js.includes("const lootName=item=>"));
 assert.ok(js.includes("window.ForeverItemLocale?.name"));
 assert.ok(!js.includes("Nom FR · référence Classic"));
 for(const path of ["rare/index.html","en/rare/index.html"]){
  const html=read(path);
  assert.ok(html.includes("/assets/item-locale.js?v=20261016-rare-fallback"),path);
  assert.ok(html.includes("/assets/rares.js?v=20261017-clean-1"),path);
 }
});
test("Classic quests stay online, new Forever quest module stays inactive and all 161 scoped rares remain",()=>{
 const inScope=rares.rares.filter(x=>x.beta_level30_in_scope);
 assert.equal(inScope.length,161);
 assert.equal(inScope.filter(r=>r.loot.length).length,77);
 assert.equal(inScope.filter(r=>!r.loot.length).length,84);
 assert.equal(idx.totals.relations,1256);
 for(const path of ["quetes/index.html","en/quetes/index.html"])assert.ok(read(path).length>1000);
});
