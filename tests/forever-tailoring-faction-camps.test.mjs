import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";
import {BASELINE as pinned} from "./helpers/catalogue-baseline.mjs";

const read=p=>JSON.parse(readFileSync(new URL("../data/"+p,import.meta.url),"utf8"));
const db=read("npcs.json"),index=read("item-acquisition-index.json");
const names=["Flame","Pearly","Pristine","Shadow","Shining","Silky"];
const groups=[
 {slot:"Boots",skill:60,ids:[253894,253898,253890,253896,253900,253892]},
 {slot:"Gloves",skill:75,ids:[253918,253922,253914,253920,253924,253916]},
 {slot:"Sash",skill:85,ids:[253930,253934,253926,253932,253936,253928]},
 {slot:"Circlet",skill:100,ids:[253954,253958,253950,253956,253960,253952]},
 {slot:"Gown",skill:110,ids:[253966,253970,253962,253968,253972,253964]},
 {slot:"Leggings",skill:125,ids:[253992,253996,253988,253994,253998,253990]}
];
const items=groups.flatMap(g=>g.ids.map((id,i)=>({id,name:"Pattern: "+names[i]+" "+g.slot,skill:g.skill})));
const merchants=[
 {name:"Mivin Shadowweave",source:"https://www.wow-professions.com/forever/npc/mivin-shadowweave",faction:"alliance",zone:"redridge"},
 {name:"Jim'bek",source:"https://www.wow-professions.com/forever/npc/jimbek",faction:"horde",zone:"barrens"}
];

test("36 distinct client-backed Forever Tailoring patterns are individually identified",()=>{
 assert.equal(items.length,36);
 assert.equal(new Set(items.map(x=>x.id)).size,36);
 for(const e of items){
  const item=db.items[String(e.id)];
  assert.ok(item,"No record for "+e.id);
  assert.equal(item.id,e.id);
  assert.equal(item.name.en,e.name);
  assert.equal(item.name.fr,item.name.en);
  assert.equal(item.name_fr_status,"unverified_fallback_english");
  assert.equal(item.profession,"Couture");
  assert.equal(item.skill,e.skill);
  assert.equal(item.skill_semantics,"source_profession_requirement_not_live_learning_threshold");
  assert.equal(item.kind,"recipe");
  assert.equal(item.bind,"pickup");
  assert.equal(item.supply,"unknown_in_forever");
  assert.equal(item.icon_status,"category_fallback");
  assert.equal(item.source,"https://www.wowhead.com/forever/item="+e.id);
  assert.equal(item.reference_status,"forever_item_and_vendor_documented");
 }
});
test("Mivin and new Jim'bek each supply all 36 plans with individual documentary links",()=>{
 for(const merchant of merchants){
  const npc=db.npcs.find(n=>n.role==="merchant"&&n.name===merchant.name);
  assert.ok(npc);
  assert.equal(npc.zone.id,merchant.zone);
  assert.equal(npc.faction,merchant.faction);
  assert.equal(npc.profession,"Couture");
  assert.equal(npc.offers.length,merchant.name==="Mivin Shadowweave"?37:36);
  assert.equal(new Set(npc.offers).size,npc.offers.length);
  for(const e of items){
   assert.ok(npc.offers.includes(String(e.id)),npc.name+" missing "+e.id);
   const v=npc.offer_details[String(e.id)];
   assert.equal(v?.source,merchant.source);
   assert.equal(v?.source_url,merchant.source);
   assert.equal(v?.evidence_url,merchant.source);
   assert.equal(v?.verification_status,"forever_documented");
   assert.equal(v?.evidence_level,"documented_forever");
   assert.equal(v?.evidence_kind,"forever_community_page");
   assert.equal(v?.observed_at,"2026-10-15");
   assert.equal(v?.observed_build,"unknown");
   assert.deepEqual(v?.price,{amount:30,currency:"merchants_favor"});
   assert.equal(v?.bind,"pickup");
   assert.equal(v?.stock_status,"unknown");
   assert.equal(v?.restock_status,"unknown");
   assert.equal(v?.restock_minutes,undefined);
   assert.equal(v?.reputation,undefined,"no rank needed for this first-tier set");
   assert.equal(v?.item_source_url,"https://www.wowhead.com/forever/item="+e.id);
   assert.ok(v.evidence_note.includes(npc.name));
   assert.ok(v.evidence_note.includes(e.name));
   assert.ok(v.evidence_note.includes("item "+e.id));
   assert.ok(v.evidence_note.includes("not a dated in-game purchase"));
   const row=index.items.find(x=>x.id===e.id);
   assert.equal(row?.sources.length,2);
   const source=row.sources.find(s=>s.kind==="merchant"&&s.name_en===merchant.name);
   assert.equal(source?.reference_url,merchant.source);
   assert.equal(source?.evidence_level,"documented_forever");
   assert.equal(source?.source_status,"forever_documented_offer");
  }
 }
});
test("Jim'bek is a specific NPC with two-location-source documentary waypoint, not verified gameplay",()=>{
 const jim=db.npcs.find(n=>n.id===248202);
 assert.ok(jim);
 assert.equal(jim.name,"Jim'bek");
 assert.deepEqual(jim.coordinates,{x:49.6,y:29.4});
 assert.equal(jim.coordinate_status,"forever_guide_waypoint");
 assert.equal(jim.location_evidence.evidence_level,"documented_forever");
 assert.equal(jim.location_evidence.observed_build,"unknown");
 assert.equal(jim.location_evidence.observed_at,"2026-10-15");
 assert.equal(jim.location_evidence.zone_id,"barrens");
 assert.equal(jim.location_evidence.ui_map_id,1413);
 assert.equal(jim.location_evidence.coordinate_system,"zone_percent_0_100");
 assert.match(jim.location_evidence.source_url,/mobalytics.gg\/wow-forever/);
 assert.match(jim.location_evidence.evidence_url,/endgametools.com\/fr\/wow-forever/);
 assert.ok(jim.location_evidence.evidence_note.includes("Documentary map point"));
});
test("72 new sales and one NPC do not upgrade Classic or invent direct in-game confirmation",()=>{
 assert.equal(db.npcs.length,359);
 assert.equal(db.npcs.filter(n=>n.role==="merchant").length,206);
 assert.equal(db.npcs.filter(n=>n.role==="trainer").length,153);
 assert.equal(db.verification_audit.tailoring_early_faction_camps_20261015.new_merchants,1);
 assert.equal(db.verification_audit.tailoring_early_faction_camps_20261015.npc_id,248202);
 assert.equal(db.verification_audit.tailoring_early_faction_camps_20261015.new_items,36);
 assert.equal(db.verification_audit.tailoring_early_faction_camps_20261015.new_seller_item_links,72);
 assert.equal(db.verification_audit.tailoring_early_faction_camps_20261015.confirmed_in_game,0);
 assert.equal(Object.keys(db.items).length,409);
 assert.equal(db.audit.total_vendor_offers,923);
 assert.equal(db.audit.forever_documented_offers,346);
 assert.equal(db.audit.forever_documented_items,200);
 assert.equal(db.audit.classic_unverified_offers,577);
 assert.deepEqual(index,buildFromFiles(),"Published acquisition index must be exactly reproducible");
 assert.equal(index.totals.unique_items,pinned.index.uniqueItems);
 assert.equal(index.totals.relations,pinned.index.relations);
 assert.equal(index.totals.by_kind.merchant,pinned.index.byKind.merchant);
 assert.equal(index.totals.by_evidence.documented_forever,pinned.index.byEvidence.documented_forever);
 assert.equal(index.totals.by_evidence.classic_reference,pinned.index.byEvidence.classic_reference);
});
