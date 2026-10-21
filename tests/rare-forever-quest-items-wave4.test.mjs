import test from "node:test";
import {BASELINE as current} from "./helpers/catalogue-baseline.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";

const load=name=>JSON.parse(readFileSync(new URL("../data/"+name,import.meta.url),"utf8"));
const db=load("rares.json"),idx=load("item-acquisition-index.json");
const cases=[
  {rare:"elwynn-mother-fang",id:248004,level:1,req:null,quest:"Quest Item"},
  {rare:"teldrassil-blackmoss-the-fetid",id:5179,level:5,req:5,quest:"Quest-starting item"},
  {rare:"3056",id:4854,level:11,req:6,quest:"Back · Cloak"}
];
test("three previously empty rare loot entries have one independent Forever item source each",()=>{
  assert.equal(new Set(cases.map(c=>c.id)).size,3);
  for(const c of cases){
    const rare=db.rares.find(r=>r.id===c.rare);
    assert.ok(rare,c.rare);
    assert.equal(rare.loot.length,1);
    assert.equal(rare.loot_coverage,"notable_only_not_complete");
    assert.equal(rare.loot_reviewed_at,"2026-10-15");
    const item=rare.loot[0];
    assert.equal(item.item_id,c.id);
    assert.equal(item.item_level,c.level);
    assert.equal(item.required_level,c.req);
    assert.equal(item.slot.en,c.quest);
    const classicFrNames={4854:"Cape griffée par les démons",5179:"Cœur moussu"};
    if(Object.hasOwn(classicFrNames,c.id)){
      assert.equal(item.name_fr_status,"classic_reference");
      assert.equal(item.name.fr,classicFrNames[c.id]);
      assert.match(item.name_fr_source_url,new RegExp("/classic/fr/item="+c.id+"(?:/|$)"));
    }else{
      assert.equal(item.name_fr_status,"unverified_fallback_english");
      assert.equal(item.name.fr,item.name.en);
    }
    assert.equal(item.source_version,"forever_beta");
    assert.equal(item.evidence_level,"documented_forever");
    assert.equal(item.evidence_kind,"forever_community_page");
    assert.equal(item.observed_build,"unknown");
    assert.equal(item.observed_at,"2026-10-15");
    assert.equal(item.chance_classic_percent,null);
    assert.equal(item.chance_forever_observed_percent,null);
    assert.equal(item.drop_evidence,"forever_item_database_documented_drop_unconfirmed");
    assert.match(item.source_url,new RegExp("^https://www\\.wowhead\\.com/forever/item="+c.id+"(?:/|$)"));
    assert.equal(item.evidence_url,item.source_url);
    assert.equal(item.item_source_url,item.source_url);
    assert.ok(item.evidence_note.includes("not") && item.evidence_note.length>100);
    assert.equal(rare.seen_forever,false,"No in-game sighting was observed");
    assert.equal(rare.reference,"classic_cmangos_not_forever_verified","Do not promote legacy locations");
    assert.equal(rare.location_review.location_status,"classic_reference");
  }
});
test("quest item documentation does not turn the Classic quest module into Forever",()=>{
  const [mother,blackmoss,howl]=cases.map(c=>db.rares.find(r=>r.id===c.rare).loot[0]);
  assert.match(mother.evidence_note,/NEW in Forever/);
  assert.match(blackmoss.stats.en,/Begins a quest/);
  assert.match(howl.stats.fr,/Lance une quête/);
  assert.ok(![mother,blackmoss,howl].some(l=>l.evidence_level==="confirmed_in_game"));
  for(const path of ["quetes/index.html","en/quetes/index.html"]){
    const html=readFileSync(new URL("../"+path,import.meta.url),"utf8");
    assert.ok(html.length>1000,"Classic quests stay available");
  }
});
test("three source links are discoverable and the derived index stays reproducible",()=>{
  assert.deepEqual(idx,buildFromFiles());
  assert.equal(idx.totals.unique_items,current.index.uniqueItems);
  assert.equal(idx.totals.relations,current.index.relations);
  assert.equal(idx.totals.by_kind.rare,current.index.byKind.rare);
  assert.equal(idx.totals.by_evidence.documented_forever,current.index.byEvidence.documented_forever);
  for(const c of cases){
    const rare=db.rares.find(r=>r.id===c.rare);
    const source=idx.items.find(i=>i.id===c.id)?.sources.find(s=>s.kind==="rare");
    assert.ok(source,c.id);
    assert.equal(source.name_en,rare.name.en);
    assert.equal(source.evidence_level,"documented_forever");
    assert.equal(source.source_status,"forever_beta_rare_loot");
    assert.equal(source.reference_url,rare.loot[0].source_url);
    assert.ok(source.href.startsWith("/rare/?zone="),"Source must navigate to the rare catalogue");
  }
});
test("no unrelated rare records were erased by the evidence-only change",()=>{
 const scoped=db.rares.filter(r=>r.beta_level30_in_scope);
 const old=scoped.filter(r=>r.reference!=="new_forever_community_documented_not_gameplay_confirmed");
 assert.equal(db.rares.length,current.rares.records);
 assert.equal(old.length,current.rares.legacyScope);
 assert.equal(old.filter(r=>r.loot.length).length,current.rares.legacyWithLoot);
 assert.equal(scoped.length,current.rares.betaScope);
 assert.equal(scoped.filter(r=>r.loot.length).length,current.rares.betaWithLoot);
 assert.equal(scoped.filter(r=>!r.loot.length).length,current.rares.betaWithoutLoot);
});
