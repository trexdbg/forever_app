import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";
import {BASELINE as pinned} from "./helpers/catalogue-baseline.mjs";
const read=path=>JSON.parse(readFileSync(new URL("../data/"+path,import.meta.url),"utf8"));
const db=read("npcs.json"),index=read("item-acquisition-index.json");
const cases=[
 {id:251357,en:"Plans: Protector's Boots",fr:"Plans : bottes de protecteur",profession:"Forge",skill:85,
   source:"https://www.wowhead.com/forever/item=251357/plans-protectors-boots",
   frSource:"https://foreverchanges.pro/fr/item/251357",
   vendors:["Stondry Darkhammer","Gor'mak"],price:{amount:30,currency:"merchants_favor"}},
 {id:276964,en:"Pattern: Azure Windraveled Jerkin",fr:"Patron : pourpoint mêle-vent azur",profession:"Travail du cuir",skill:60,
   source:"https://www.wowhead.com/forever/item=276964/pattern-azure-windraveled-jerkin",
   frSource:"https://www.wowhead.com/forever/fr/item=276964/patron-pourpoint-m%C3%AAle-vent-azur",
   vendors:["Vayn Moongaze"],rep:{faction:"Nightclaw Druids",rank:"Honored"}}
];

test("two once-unresolved Forever plans now have exact unique item IDs and bilingual, traced names",()=>{
 const ids=new Set();
 for(const spec of cases){
  assert.ok(!ids.has(spec.id));ids.add(spec.id);
  const item=db.items[String(spec.id)];assert.ok(item);
  assert.equal(item.id,spec.id);
  assert.deepEqual(item.name,{en:spec.en,fr:spec.fr});
  assert.equal(item.profession,spec.profession);
  assert.equal(item.skill,spec.skill);
  assert.equal(item.kind,"recipe");
  assert.equal(item.bind,"pickup");
  assert.equal(item.supply,"unknown_in_forever");
  assert.equal(item.source,spec.source);
  assert.equal(item.item_source_url,spec.source);
  assert.equal(item.name_fr_source_url,spec.frSource);
  assert.ok(["forever_wowhead_localized","forever_client_localized"].includes(item.name_fr_status));
  assert.ok(item.skill_semantics.includes("not_"));
 }
 assert.equal(ids.size,2);
});

test("three documented sales from named Forever merchants are not invented purchases or respawns",()=>{
 for(const spec of cases){
  const row=index.items.find(i=>i.id===spec.id);assert.ok(row,"No index row for "+spec.id);
  assert.equal(row.sources.length,spec.vendors.length);
  for(const vendor of spec.vendors){
   const npc=db.npcs.find(n=>n.role==="merchant"&&n.name===vendor);assert.ok(npc);
   assert.ok(npc.offers.includes(String(spec.id)));
   const sale=npc.offer_details[String(spec.id)];assert.ok(sale);
   assert.equal(sale.evidence_level,"documented_forever");
   assert.equal(sale.verification_status,"forever_documented");
   assert.equal(sale.evidence_kind,"forever_community_page");
   assert.equal(sale.observed_at,"2026-10-15");
   assert.equal(sale.observed_build,"unknown");
   assert.equal(sale.source_url,sale.evidence_url);
   assert.equal(sale.item_source_url,spec.source);
   assert.equal(sale.bind,"pickup");
   assert.ok(sale.evidence_note.includes(vendor));
   assert.ok(sale.evidence_note.includes("item "+spec.id));
   assert.ok(sale.evidence_note.includes("not a dated in-game transaction"));
   assert.equal(sale.restock_minutes,undefined);
   assert.equal(sale.stock_status,"unknown");
   assert.equal(sale.restock_status,"unknown");
   if(spec.price){assert.deepEqual(sale.price,spec.price);assert.equal(sale.reputation,undefined)}
   else {assert.equal(sale.price,undefined);assert.equal(sale.price_status,"coin_price_conflict_or_not_comparable_between_guides");assert.deepEqual(sale.reputation,spec.rep)}
   const link=row.sources.find(s=>s.kind==="merchant"&&s.name_en===vendor);
   assert.equal(link?.evidence_level,"documented_forever");
   assert.equal(link?.source_status,"forever_documented_offer");
   assert.equal(link?.reference_url,sale.source);
  }
 }
});

test("provenance follows each relation, preserves historic wave sizes and Classic fallback",()=>{
 assert.equal(db.audit.total_vendor_offers,923);
 assert.equal(db.audit.forever_documented_offers,346);
 assert.equal(db.audit.forever_documented_items,200);
 assert.equal(db.audit.classic_unverified_offers,577);
 assert.equal(db.verification_audit.forever_sale_count,346);
 assert.equal(db.verification_audit.resolved_vendor_recipe_id_followup.new_vendor_offers,3);
 assert.equal(db.verification_audit.resolved_vendor_recipe_id_followup.confirmed_in_game,0);
 assert.equal(db.verification_audit.blacksmith_lowlevel_camps_wave.added_vendor_links,57);
 assert.equal(db.verification_audit.vayn_zephras_wave.new_links,47);
 assert.equal(db.verification_audit.blacksmith_lowlevel_camps_wave.resolved_followup.item_id,251357);
 assert.equal(db.verification_audit.vayn_zephras_wave.resolved_followup.item_id,276964);
 assert.equal(db.verification_audit.blacksmith_lowlevel_camps_wave.unknown_item,null);
 assert.equal(db.verification_audit.vayn_zephras_wave.unresolved_item,null);
 assert.deepEqual(index,buildFromFiles(),"Published index must be reproducible without source promotion");
 assert.equal(index.totals.unique_items,pinned.index.uniqueItems);
 assert.equal(index.totals.relations,pinned.index.relations);
 assert.equal(index.totals.by_kind.merchant,pinned.index.byKind.merchant);
 assert.equal(index.totals.by_evidence.documented_forever,pinned.index.byEvidence.documented_forever);
 assert.equal(index.totals.by_evidence.classic_reference,pinned.index.byEvidence.classic_reference);
});
