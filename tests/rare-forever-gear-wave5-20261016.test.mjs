import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";

const read=name=>JSON.parse(readFileSync(new URL("../data/"+name,import.meta.url),"utf8"));
const db=read("rares.json"),idx=read("item-acquisition-index.json");
const cases=[
 {rare:"teldrassil-threggil",id:18610,en:"Keen Machete",fr:"Machette effilée",ilvl:10,req:5,stats:"5–10 Damage · Speed 1.80 · +1 Stamina",build:"1.60.1.70425"},
 {rare:"teldrassil-fury-shelda",id:18612,en:"Bloody Chain Boots",fr:"Bottes en mailles sanglantes",ilvl:10,req:5,stats:"74 Armor · +1 Stamina",build:"1.60.1.70425"},
 {rare:"dun-morogh-timber",id:1965,en:"White Wolf Gloves",fr:"Gants du loup blanc",ilvl:12,req:7,stats:"39 Armor · +2 Agility",build:"1.60.1.70009"}
];
test("three starter-zone rares gain one uniquely identified, documentary Forever item relation",()=>{
 assert.equal(new Set(cases.map(c=>c.id)).size,3);
 for(const c of cases){
  const r=db.rares.find(x=>x.id===c.rare);
  assert.ok(r,c.rare);
  assert.equal(r.loot.length,1);
  assert.equal(r.loot_coverage,"notable_only_not_complete");
  assert.equal(r.loot_reviewed_at,"2026-10-16");
  const item=r.loot[0];
  assert.equal(item.item_id,c.id);
  assert.equal(item.name.en,c.en);
  assert.equal(item.name.fr,c.fr);
  assert.equal(item.name_fr_status,"classic_reference");
  assert.match(item.name_fr_source_url,new RegExp("^https://www\\.wowhead\\.com/classic/fr/item="+c.id+"(?:/|$)"));
  assert.equal(item.source_version,"forever_beta");
  assert.equal(item.evidence_level,"documented_forever");
  assert.equal(item.evidence_kind,"forever_community_page");
  assert.equal(item.observed_at,"2026-10-16");
  assert.equal(item.observed_build,"unknown");
  assert.equal(item.chance_classic_percent,null);
  assert.equal(item.chance_forever_observed_percent,null);
  assert.equal(item.drop_evidence,"forever_item_database_documented_drop_unconfirmed");
  assert.equal(item.item_source_url,item.source_url);
  assert.equal(item.evidence_url,item.source_url);
  assert.ok(item.source_url.startsWith("https://www.wowhead.com/forever/item="+c.id));
  assert.match(item.evidence_note,/or a stable drop probability/);
  assert.equal(r.seen_forever,false);
  assert.equal(r.reference,"classic_cmangos_not_forever_verified");
  assert.equal(r.location_review.location_status,"classic_reference");
 }
});
test("actual documented Forever stats are separate from Classic item localization and uncertain drops",()=>{
 for(const c of cases){
  const l=db.rares.find(r=>r.id===c.rare).loot[0];
  assert.equal(l.item_level,c.ilvl);
  assert.equal(l.required_level,c.req);
  assert.equal(l.stats.en,c.stats);
  assert.equal(l.stats_evidence_level,"documented_forever");
  assert.equal(l.stats_observed_build,c.build);
  assert.equal(l.stats_source_url,"https://foreverchanges.pro/fr/item/"+c.id);
  assert.ok(l.stats_evidence_note.includes("Classic"));
  assert.match(l.stats_evidence_note,/not evidence of a drop/);
  assert.equal(l.name_fr_status,"classic_reference");
  assert.equal(l.chance_forever_observed_percent,null);
 }
});
test("new items reach source lookup, with deterministic cross-index and unchanged historical links",()=>{
 assert.deepEqual(idx,buildFromFiles());
 assert.equal(idx.totals.unique_items,730);
 assert.equal(idx.totals.relations,1256);
 assert.equal(idx.totals.by_kind.rare,114);
 assert.equal(idx.totals.by_evidence.documented_forever,465);
 assert.equal(idx.totals.by_evidence.classic_reference,767);
 for(const c of cases){
  const r=db.rares.find(x=>x.id===c.rare);
  const item=idx.items.find(x=>x.id===c.id);
  assert.ok(item,c.id);
  assert.equal(item.sources.length,1);
  const source=item.sources[0];
  assert.equal(source.kind,"rare");
  assert.equal(source.name_fr,r.name.fr);
  assert.equal(source.name_en,r.name.en);
  assert.equal(source.source_status,"forever_beta_rare_loot");
  assert.equal(source.evidence_level,"documented_forever");
  assert.equal(source.reference_url,r.loot[0].source_url);
  assert.ok(source.href.startsWith("/rare/?zone="));
 }
});
test("rare coverage rises without removing Classic-only entries or enabling Forever quests",()=>{
 const all=db.rares.filter(r=>r.beta_level30_in_scope);
 const legacy=all.filter(r=>r.reference!=="new_forever_community_documented_not_gameplay_confirmed");
 assert.equal(db.rares.length,378);
 assert.equal(all.length,161);
 assert.equal(legacy.length,150);
 assert.equal(legacy.filter(r=>r.loot.length).length,71);
 assert.equal(all.filter(r=>r.loot.length).length,77);
 assert.equal(all.filter(r=>!r.loot.length).length,84);
 for(const path of ["quetes/index.html","en/quetes/index.html"]){
  const html=readFileSync(new URL("../"+path,import.meta.url),"utf8");
  assert.ok(html.length>1000,"Classic quest module stays publicly available");
 }
});
