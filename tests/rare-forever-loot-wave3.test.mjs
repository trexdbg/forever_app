import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=p=>JSON.parse(readFileSync(new URL("../data/"+p,import.meta.url),"utf8"));
const db=read("rares.json");
const index=read("item-acquisition-index.json");
const expected=[
 {id:"forever-tirisfal-the-condemned-one",itemId:286755,itemLevel:11,requiredLevel:6,zone:"tirisfal"},
 {id:"classic-stonetalon-sister-rathtalon",itemId:285345,itemLevel:21,requiredLevel:16,zone:"stonetalon"},
 {id:"hillsbrad-scargil",itemId:282716,itemLevel:32,requiredLevel:27,zone:"hillsbrad"},
 {id:"ashenvale-mist-howler",itemId:284666,itemLevel:24,requiredLevel:19,zone:"ashenvale"}
];

test("vague 3: four distinct Forever item-to-rare claims, not invented game evidence",()=>{
 assert.equal(new Set(expected.map(x=>x.itemId)).size,4);
 for(const e of expected){
  const rare=db.rares.find(r=>r.id===e.id);
  assert.ok(rare,"Unknown rare "+e.id);
  assert.equal(rare.zone,e.zone);
  assert.equal(rare.loot_coverage,"notable_only_not_complete");
  assert.equal(rare.loot.filter(x=>x.item_id===e.itemId).length,1);
  const loot=rare.loot.find(x=>x.item_id===e.itemId);
  assert.equal(loot.item_level,e.itemLevel);
  assert.equal(loot.required_level,e.requiredLevel);
  assert.equal(loot.source_version,"forever_beta");
  assert.equal(loot.evidence_level,"documented_forever");
  assert.equal(loot.evidence_kind,"forever_community_page");
  assert.equal(loot.observed_at,"2026-10-15");
  assert.equal(loot.observed_build,"unknown");
  assert.equal(loot.drop_evidence,"forever_item_database_documented_drop_unconfirmed");
  assert.equal(loot.chance_classic_percent,null);
  assert.equal(loot.chance_forever_observed_percent,null);
  assert.equal(loot.name_fr_status,"unverified_fallback_english");
  assert.equal(loot.name.fr,loot.name.en);
  assert.ok(loot.stats?.en && loot.stats?.fr && loot.slot?.en && loot.slot?.fr);
  assert.ok(loot.evidence_note.length>120);
  for(const k of ["source_url","item_source_url","evidence_url"]){
   assert.match(loot[k],/^https:\/\/www\.wowhead\.com\/forever\/item=\d+/);
   assert.match(loot[k],new RegExp("item="+e.itemId+"(?:\\b|$|/)"));
  }
  assert.equal(rare.seen_forever,false);
  assert.notEqual(rare.location_review?.location_status,"confirmed_in_game");
 }
});

test("Sister Rathtalon's map conflict is still unresolved: loot source does not resolve coordinates",()=>{
 const r=db.rares.find(x=>x.id==="classic-stonetalon-sister-rathtalon");
 assert.equal(r.location_review.location_status,"zone_only_unverified");
 assert.match(r.location_review.conflict,/Stonetalon.*Barrens/);
 assert.deepEqual(r.points,[]);
 assert.equal(r.reference,"classic_cmangos_not_forever_verified");
});

test("four Forever rare relations are traversable through the item acquisition index",()=>{
 assert.equal(index.totals.unique_items,556);
 assert.equal(index.totals.relations,955);
 assert.equal(index.totals.by_kind.rare,105);
 assert.equal(index.totals.by_evidence.documented_forever,191);
 for(const e of expected){
  const row=index.items.find(i=>i.id===e.itemId);
  assert.ok(row,"Unindexed item "+e.itemId);
  assert.equal(row.sources.length,1);
  const s=row.sources[0];
  assert.equal(s.kind,"rare");
  assert.equal(s.evidence_level,"documented_forever");
  assert.equal(s.source_status,"forever_beta_rare_loot");
  assert.match(s.href,/^\/rare\/\?zone=/);
  assert.equal(s.reference_url,db.rares.find(r=>r.id===e.id).loot.find(l=>l.item_id===e.itemId).source_url);
 }
});

test("count cumulative additions without rewriting the historic 150 rare baseline",()=>{
 const scoped=db.rares.filter(r=>r.beta_level30_in_scope);
 const legacy=scoped.filter(r=>r.reference!=="new_forever_community_documented_not_gameplay_confirmed");
 assert.equal(scoped.length,161);
 assert.equal(legacy.length,150);
 assert.equal(legacy.filter(r=>r.loot.length).length,62);
 assert.equal(scoped.filter(r=>r.loot.length).length,68);
 assert.equal(scoped.filter(r=>!r.loot.length).length,93);
});

test("four preexisting Forever rare-set and Duskstalker drops now have individualized evidence",()=>{
 const historical=new Map([["5828",285331],["5842",285329],["5831",285330],["14430",284165]]);
 const snapshots=new Map([["5828",1.23],["5842",4.09],["5831",4.68],["14430",0.85]]);
 for(const [id,itemId] of historical){
  const rare=db.rares.find(r=>r.id===id);
  assert.ok(rare);
  const item=rare.loot.find(l=>l.item_id===itemId);
  assert.ok(item);
  assert.equal(item.evidence_level,"documented_forever");
  assert.equal(item.evidence_kind,"forever_community_page");
  assert.equal(item.observed_at,"2026-10-15");
  assert.equal(item.observed_build,"unknown");
  assert.match(item.evidence_url,/^https:\/\//);
  assert.ok(item.evidence_note.length>90);
  assert.equal(item.chance_forever_observed_percent,null,
   "No time-limited sample should masquerade as today's Forever rate");
  assert.equal(item.historical_drop_sample.percent,snapshots.get(id));
  assert.equal(item.historical_drop_sample.reviewed_at,"2026-10-11");
  assert.match(item.historical_drop_sample.source_url,/^https:\/\/www\.wowhead\.com\/forever\//);
  assert.equal(rare.seen_forever,false,
    "Loot documentation must not certify the creature's location or gameplay presence");
  assert.equal(rare.location_review.location_status,"classic_reference");
 }
});
