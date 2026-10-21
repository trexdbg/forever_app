import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const db=JSON.parse(read("data/rares.json"));
const idx=JSON.parse(read("data/item-acquisition-index.json"));
const expected=[
 {rare:"teldrassil-uruson",id:18611,en:"Gnarlpine Leggings",fr:"Jambières de Pin-tordu",classicLevel:7,required:2,forever:null},
 {rare:"dun-morogh-gibblewilt",id:10553,en:"Foreman Vest",fr:"Gilet de contremaître",classicLevel:11,required:6,forever:{level:13,required:8,stats:"25 Armor · +3 Strength"}},
 {rare:"elwynn-narg-the-taskmaster",id:1913,en:"Studded Blackjack",fr:"Studded Blackjack",classicLevel:10,required:5,forever:{level:12,required:7,stats:"10–19 Damage · Speed 2.20 · +1 Strength"}}
];

test("three previously empty rare profiles have clearly Classic-only drop relationships",()=>{
 for(const c of expected){
  const rare=db.rares.find(r=>r.id===c.rare);
  assert.ok(rare,c.rare);
  assert.equal(rare.loot.length,1);
  assert.equal(rare.loot_coverage,"classic_reference_only_not_complete");
  assert.equal(rare.seen_forever,false);
  assert.equal(rare.reference,"classic_cmangos_not_forever_verified");
  assert.equal(rare.location_review.location_status,"classic_reference");
  const loot=rare.loot[0];
  assert.equal(loot.item_id,c.id);
  assert.equal(loot.name.en,c.en);
  assert.equal(loot.name.fr,c.fr);
  assert.equal(loot.item_level,c.classicLevel);
  assert.equal(loot.required_level,c.required);
  assert.equal(loot.stats_version,"classic_reference");
  assert.equal(loot.source_version,"classic_reference");
  assert.equal(loot.evidence_level,"classic_reference");
  assert.equal(loot.evidence_kind,"classic_database");
  assert.equal(loot.drop_evidence,"classic_item_database_documented_drop_not_forever_verified");
  assert.equal(loot.chance_classic_percent,null);
  assert.equal(loot.chance_forever_observed_percent,undefined);
  assert.ok(loot.source_url.startsWith("https://www.wowhead.com/classic/item="+c.id));
  assert.equal(loot.item_source_url,loot.source_url);
  assert.equal(loot.evidence_url,loot.source_url);
  assert.match(loot.evidence_note,/not established/);
  assert.equal(loot.observed_at,"2026-10-16");
  assert.equal(rare.loot_reviewed_at,"2026-10-16");
 }
});

test("Forever stats for two items are separate claims and cannot upgrade Classic drop provenance",()=>{
 for(const c of expected){
  const loot=db.rares.find(r=>r.id===c.rare).loot[0];
  const snapshot=loot.forever_item_snapshot;
  if(!c.forever){assert.equal(snapshot,undefined,"Unverified Forever item stats must remain absent");continue}
  assert.ok(snapshot,c.id);
  assert.equal(snapshot.item_level,c.forever.level);
  assert.equal(snapshot.required_level,c.forever.required);
  assert.equal(snapshot.stats.en,c.forever.stats);
  assert.equal(snapshot.evidence_level,"documented_forever");
  assert.equal(snapshot.evidence_kind,"forever_community_page");
  assert.equal(snapshot.observed_build,"unknown");
  assert.equal(snapshot.observed_at,"2026-10-16");
  assert.equal(snapshot.source_url,"https://www.wowhead.com/forever/item="+c.id+(c.id===10553?"/foreman-vest":"/studded-blackjack"));
  assert.equal(snapshot.evidence_url,snapshot.source_url);
  assert.match(snapshot.evidence_note,/does not establish any loot or spawn rate/);
  assert.equal(loot.evidence_level,"classic_reference","A Forever item page cannot upgrade a Classic creature-drop relationship");
 }
});

test("French names have individual Classic attribution without asserting Forever localization",()=>{
 const g=db.rares.find(r=>r.id==="dun-morogh-gibblewilt");
 assert.equal(g.name.fr,"Margouilleur");
 assert.equal(g.name.en,"Gibblewilt");
 assert.equal(g.name_fr_status,"classic_reference");
 assert.match(g.name_fr_source_url,/mop-classic\/fr\/npc=8503/);
 for(const c of expected.filter(x=>x.id!==1913)){
  const loot=db.rares.find(r=>r.id===c.rare).loot[0];
  assert.equal(loot.name_fr_status,"classic_reference");
  assert.match(loot.name_fr_source_url,/https:\/\/www\.wowhead\.com\//);
 }
 const untranslated=db.rares.find(r=>r.id==="elwynn-narg-the-taskmaster").loot[0];
 assert.equal(untranslated.name_fr_status,"unverified_fallback_english");
 assert.equal(untranslated.name.fr,untranslated.name.en);
});

test("index navigation remains reproducible with three Classic fallback links only",()=>{
 assert.deepEqual(idx,buildFromFiles());
 assert.equal(idx.totals.unique_items,739);
 assert.equal(idx.totals.relations,1265);
 assert.equal(idx.totals.by_kind.rare,123);
 assert.equal(idx.totals.by_evidence.documented_forever,470);
 assert.equal(idx.totals.by_evidence.classic_reference,771);
 for(const c of expected){
  const rare=db.rares.find(r=>r.id===c.rare);
  const links=idx.items.find(i=>i.id===c.id)?.sources;
  assert.equal(links?.length,1);
  const link=links[0];
  assert.equal(link.kind,"rare");
  assert.equal(link.evidence_level,"classic_reference");
  assert.equal(link.source_status,"classic_rare_loot_reference");
  assert.equal(link.name_fr,rare.name.fr);
  assert.equal(link.name_en,rare.name.en);
  assert.equal(link.reference_url,rare.loot[0].source_url);
  assert.ok(link.href.startsWith("/rare/?zone="));
 }
});

test("rare interface makes Forever item metadata visible but does not falsely verify the drop",()=>{
 const js=read("assets/rares.js");
 assert.ok(js.includes("item.forever_item_snapshot"));
 assert.ok(js.includes('required_level:snap.required_level??item.required_level'));
 assert.ok(!js.includes('Objet dans Forever (butin non confirmé)'));
 for(const path of ["rare/index.html","en/rare/index.html"]){
  assert.ok(read(path).includes("/assets/rares.js?v=20261018-loot-icons-2"),path);
  assert.ok(read(path).includes("/assets/item-locale.js?v=20261016-rare-fallback"),path);
 }
 const scope=db.rares.filter(r=>r.beta_level30_in_scope);
 assert.equal(scope.length,161);
 assert.equal(scope.filter(r=>r.loot.length).length,83);
 assert.equal(scope.filter(r=>!r.loot.length).length,78);
 for(const path of ["quetes/index.html","en/quetes/index.html"])
  assert.ok(read(path).length>1000,"Classic quests remain available");
});
