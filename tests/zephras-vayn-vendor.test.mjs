import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";
const read=p=>JSON.parse(readFileSync(new URL("../data/"+p,import.meta.url),"utf8"));
const db=read("npcs.json"), index=read("item-acquisition-index.json");
const v=db.npcs.find(n=>n.id===254151), url="https://www.wow-professions.com/forever/npc/vayn-moongaze";
const recipes={
 "Forge":{
 50:[276955,276953,276931,276929],
 55:[276954,276957,276930,276933],
 60:[276952,276956,276928,276932]
 },
 "Travail du cuir":{
 50:[276961,276959,276965,276967,276937,276935,276941,276943],
 55:[276963,276960,276969,276966,276939,276936,276945,276942],
 60:[276958,276962,276964,276968,276934,276938,276940,276944]
 },
 "Couture":{
 50:[276973,276971,276949,276947],
 55:[276972,276975,276948,276951],
 60:[276974,276970,276950,276946]
 }
};
const all=Object.entries(recipes).flatMap(([profession,levels])=>Object.entries(levels).flatMap(([skill,ids])=>ids.map(id=>({id,profession,skill:Number(skill)}))));
test("one new exact Forever NPC on Zephras Isle, with documented but not confirmed waypoint",()=>{
 assert.ok(v,"Vayn Moongaze NPC 254151 missing");
 assert.equal(v.name,"Vayn Moongaze");
 assert.equal(v.role,"merchant");
 assert.equal(v.profession,"Artisanat");
 assert.deepEqual(v.professions,["Forge","Travail du cuir","Couture"]);
 assert.equal(v.faction,"neutral");
 assert.equal(v.zone.id,"zephras-isle");
 assert.equal(v.zone.fr,"Île de Zéphras");
 assert.equal(db.zone_maps[v.zone.id].uiMapID,2521);
 assert.deepEqual(v.coordinates,{x:63.8,y:36});
 assert.equal(v.coordinate_status,"forever_guide_waypoint");
 assert.equal(v.coordinate_source,"https://www.60.tools/quests/93459-more-alaketh-ears");
 assert.equal(v.location_evidence.evidence_level,"documented_forever");
 assert.equal(v.location_evidence.observed_build,"unknown");
 assert.equal(v.location_evidence.ui_map_id,2521);
 assert.match(v.location_evidence.evidence_note,/no timestamped gameplay capture/);
 assert.equal(db.npcs.filter(n=>n.role==="merchant").length,205);
 assert.equal(db.npcs.filter(n=>n.role==="trainer").length,153);
 assert.equal(db.npcs.length,358);
});
test("48 named, exact-item-ID and profession-skill-verified Vayn recipe sales",()=>{
 assert.equal(all.length,48);
 assert.equal(new Set(all.map(x=>x.id)).size,48);
 assert.equal(v.offers.length,48);
 assert.equal(new Set(v.offers).size,48);
 for(const {id,profession,skill} of all){
  assert.ok(v.offers.includes(String(id)),"Missing Vayn item "+id);
  const item=db.items[String(id)],sale=v.offer_details[String(id)];
  assert.equal(item?.id,id);
  assert.equal(item?.profession,profession);
  assert.equal(item?.skill,skill);
  assert.equal(item?.skill_semantics,"source_profession_requirement_not_live_learning_threshold");
  assert.ok(/^(Plans|Pattern): /.test(item?.name.en));
  if(id===276964){
   assert.equal(item?.name.fr,"Patron : pourpoint mêle-vent azur");
   assert.equal(item?.name_fr_status,"forever_wowhead_localized");
  }else assert.equal(item?.name.fr,item?.name.en);
  if(id!==276964)assert.equal(item?.name_fr_status,"unverified_fallback_english");
  assert.equal(item?.kind,"recipe");
  assert.equal(item?.supply,"unknown_in_forever");
  assert.ok(item?.source.startsWith("https://www.wowhead.com/forever/item="+id));
  assert.equal(sale.source,url);
  assert.equal(sale.source_url,url);
  assert.equal(sale.evidence_url,url);
  assert.equal(sale.verification_status,"forever_documented");
  assert.equal(sale.evidence_level,"documented_forever");
  assert.equal(sale.evidence_kind,"forever_community_page");
  assert.equal(sale.observed_at,"2026-10-15");
  assert.equal(sale.observed_build,"unknown");
  assert.equal(sale.item_source_url,item.source);
  assert.deepEqual(sale.reputation,{faction:"Nightclaw Druids",rank:skill===60?"Honored":"Friendly"});
  assert.equal(sale.price,undefined,"Price not proved due to conflicting guide amounts");
  assert.equal(sale.price_status,"coin_price_conflict_or_not_comparable_between_guides");
  assert.equal(sale.restock_minutes,undefined);
  assert.equal(sale.stock_status,"unknown");
  assert.equal(sale.bind,id===276964?"pickup":undefined);
  assert.ok(sale.evidence_note.includes(item.name.en));
  assert.ok(sale.evidence_note.includes("item "+id));
  const linked=index.items.find(row=>row.id===id);
  assert.ok(linked,"Missing acquisition index for "+id);
  assert.ok(linked.sources.some(s=>s.kind==="merchant"&&s.name_en===v.name&&s.evidence_level==="documented_forever"&&s.reference_url===url));
 }
});
test("resolved pattern #276964 is linked, original Vayn wave history and Classic fallback are preserved",()=>{
 assert.ok(v.offers.includes("276964"));
 assert.equal(db.verification_audit.vayn_zephras_wave.unresolved_item,null);
 assert.equal(db.verification_audit.vayn_zephras_wave.resolved_followup.item_id,276964);
 assert.equal(db.verification_audit.vayn_zephras_wave.new_links,47);
 assert.equal(db.audit.total_vendor_offers,851);
 assert.equal(db.audit.forever_documented_offers,274);
 assert.equal(db.audit.classic_unverified_offers,577);
 assert.equal(db.audit.forever_documented_items,164);
 assert.equal(Object.keys(db.items).length,373);
 assert.deepEqual(index,buildFromFiles(),"Object-to-vendor lookup must remain reproducible");
 assert.equal(index.totals.unique_items,685);
 assert.equal(index.totals.relations,1175);
 assert.equal(index.totals.by_kind.merchant,851);
 assert.equal(index.totals.by_evidence.documented_forever,411);
 assert.equal(index.totals.by_evidence.classic_reference,764);
});
test("mixed-profession vendor label is bilingual without fabricating recipe translations",()=>{
 const js=readFileSync(new URL("../assets/npcs.js",import.meta.url),"utf8");
 assert.match(js,/Artisanat:S\("Artisanat","Crafting"\)/);
 assert.match(js,/item\?\.profession\|\|n\.profession/);
});
