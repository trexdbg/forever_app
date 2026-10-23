import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";
import {BASELINE as pinned} from "./helpers/catalogue-baseline.mjs";
const read=path=>JSON.parse(readFileSync(new URL("../data/"+path,import.meta.url),"utf8"));
const db=read("npcs.json"),index=read("item-acquisition-index.json");
const rows=[
 [60,["Brawler's Leather Belt",252765],["Defender's Leather Belt",252767],["Stormrider's Leather Belt",252769],["Totemic Leather Belt",252768],["Trapper's Leather Belt",252766],["Wisdom's Leather Belt",252770]],
 [75,["Brawler's Leather Gloves",252777],["Defender's Leather Gloves",252779],["Stormrider's Leather Gloves",252781],["Totemic Leather Gloves",252780],["Trapper's Leather Gloves",252778],["Wisdom's Leather Gloves",252782]],
 [85,["Brawler's Leather Boots",252786],["Defender's Leather Boots",252788],["Stormrider's Leather Boots",252790],["Totemic Leather Boots",252789],["Trapper's Leather Boots",252787],["Wisdom's Leather Boots",252791]],
 [100,["Brawler's Leather Hood",252798],["Defender's Leather Hood",252800],["Stormrider's Leather Hood",252802],["Totemic Leather Hood",252801],["Trapper's Leather Hood",252799],["Wisdom's Leather Hood",252803]],
 [110,["Brawler's Leather Tunic",252805],["Defender's Leather Tunic",252807],["Stormrider's Leather Tunic",252809],["Totemic Leather Tunic",252808],["Trapper's Leather Tunic",252806],["Wisdom's Leather Tunic",252810]],
 [125,["Brawler's Leather Legguards",252820],["Defender's Leather Kilt",252822],["Stormrider's Leather Kilt",252824],["Totemic Leather Leggings",252823],["Trapper's Leather Legguards",252821],["Wisdom's Leather Leggings",252825]]
].flatMap(([skill,...items])=>items.map(([name,id])=>({skill,name,id})));
const vendors=[
 {name:"Daniel Stitchsong",url:"https://www.wow-professions.com/forever/npc/daniel-stitchsong",zone:"redridge",faction:"alliance"},
 {name:"Pawani",url:"https://www.wow-professions.com/forever/npc/pawani",zone:"barrens",faction:"horde"}
];
test("36 independently documented Forever item IDs and distinct six-skill groups",()=>{
 assert.equal(rows.length,36);
 assert.equal(new Set(rows.map(r=>r.id)).size,36);
 for(const {skill,name,id} of rows){
  const item=db.items[String(id)];
  assert.ok(item,"Missing recipe "+id);
  assert.equal(item.id,id);
  assert.equal(item.name.en,"Pattern: "+name);
  assert.equal(item.name.fr,item.name.en);
  assert.equal(item.name_fr_status,"unverified_fallback_english");
  assert.equal(item.profession,"Travail du cuir");
  assert.equal(item.kind,"recipe");
  assert.equal(item.skill,skill);
  assert.equal(item.skill_semantics,"source_profession_requirement_not_live_learning_threshold");
  assert.equal(item.bind,"pickup");
  assert.equal(item.supply,"unknown_in_forever");
  assert.equal(item.icon_status,"category_fallback");
  assert.equal(item.source,"https://www.wowhead.com/forever/item="+id);
  assert.equal(item.reference_status,"forever_item_and_vendor_documented");
 }
});
test("both Horde and Alliance named sellers expose 36 low-level recipes with individual documentary evidence",()=>{
 for(const {name,url,zone,faction} of vendors){
  const npc=db.npcs.find(n=>n.role==="merchant"&&n.name===name);
  assert.ok(npc,name+" missing");
  assert.equal(npc.zone.id,zone);
  assert.equal(npc.faction,faction);
  assert.equal(npc.profession,"Travail du cuir");
  assert.equal(npc.offers.length,37,"36 new patterns plus one historic certification");
  assert.equal(new Set(npc.offers).size,37);
  for(const {skill,name:recipeName,id} of rows){
   assert.ok(npc.offers.includes(String(id)),name+" "+id);
   const relation=npc.offer_details[String(id)];assert.ok(relation);
   assert.equal(relation.source,url);
   assert.equal(relation.source_url,url);
   assert.equal(relation.evidence_url,url);
   assert.equal(relation.verification_status,"forever_documented");
   assert.equal(relation.evidence_level,"documented_forever");
   assert.equal(relation.evidence_kind,"forever_community_page");
   assert.equal(relation.observed_at,"2026-10-15");
   assert.equal(relation.observed_build,"unknown");
   assert.equal(relation.price.amount,30);
   assert.equal(relation.price.currency,"merchants_favor");
   assert.equal(relation.bind,"pickup");
   assert.equal(relation.reputation,undefined,"no reputation was listed for these 36");
   assert.equal(relation.restock_minutes,undefined);
   assert.equal(relation.stock_status,"unknown");
   assert.equal(relation.restock_status,"unknown");
   assert.equal(relation.item_source_url,"https://www.wowhead.com/forever/item="+id);
   assert.ok(relation.evidence_note.includes(npc.name));
   assert.ok(relation.evidence_note.includes(recipeName));
   assert.ok(relation.evidence_note.includes("item "+id));
   assert.ok(relation.evidence_note.includes("no dated purchase capture"));
   const row=index.items.find(i=>i.id===id);assert.ok(row);
   assert.equal(row.sources.length,2);
   const source=row.sources.find(s=>s.name_en===npc.name&&s.kind==="merchant");
   assert.equal(source?.evidence_level,"documented_forever");
   assert.equal(source?.source_status,"forever_documented_offer");
   assert.equal(source?.reference_url,url);
  }
 }
});
test("72 named Forever sales are new; legacy Classic source count is unchanged and derived index reproducible",()=>{
 assert.equal(db.npcs.filter(n=>n.role==="merchant").length,206);
 assert.equal(Object.keys(db.items).length,409);
 assert.equal(db.audit.total_vendor_offers,923);
 assert.equal(db.audit.forever_documented_offers,346);
 assert.equal(db.audit.forever_documented_items,200);
 assert.equal(db.audit.classic_unverified_offers,577);
 assert.equal(db.verification_audit.leatherworking_early_faction_camps_20261015.new_items,36);
 assert.equal(db.verification_audit.leatherworking_early_faction_camps_20261015.new_seller_item_links,72);
 assert.equal(db.verification_audit.leatherworking_early_faction_camps_20261015.confirmed_in_game,0);
 assert.deepEqual(index,buildFromFiles(),"Published index must equal an offline rebuild");
 assert.equal(index.totals.unique_items,pinned.index.uniqueItems);
 assert.equal(index.totals.relations,pinned.index.relations);
 assert.equal(index.totals.by_kind.merchant,pinned.index.byKind.merchant);
 assert.equal(index.totals.by_evidence.documented_forever,pinned.index.byEvidence.documented_forever);
 assert.equal(index.totals.by_evidence.classic_reference,pinned.index.byEvidence.classic_reference);
});
