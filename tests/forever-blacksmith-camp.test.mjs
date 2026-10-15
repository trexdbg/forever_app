import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";
const load=p=>JSON.parse(readFileSync(new URL("../data/"+p,import.meta.url),"utf8"));
const db=load("npcs.json"),idx=load("item-acquisition-index.json");
const byName=new Map(db.npcs.filter(x=>x.role==="merchant").map(x=>[x.name,x]));
const plans={
45:[251368,251369,251366,251367,251365],
80:[251363,251364,251361,251362,251360],
85:[251358,251359,251356,251357,251355],
95:[251383,251384,251381,251382,251380],
110:[251373,251374,251371,251372,251370],
125:[251378,251379,251376,251377,251375]
};
const ids=Object.values(plans).flat(),vendor=["Stondry Darkhammer","Gor'mak"];
test("30 exact Blacksmithing recipe IDs, with Protector's Boots resolved from Forever",()=>{
 assert.equal(ids.length,30);
 assert.equal(new Set(ids).size,30);
 for(const [skill,group] of Object.entries(plans))for(const id of group){
  const item=db.items[String(id)];
  assert.equal(item?.id,id);
  assert.equal(item?.skill,+skill);
  assert.equal(item?.profession,"Forge");
  assert.match(item?.name?.en,/^Plans: /);
  assert.equal(item?.kind,"recipe");
  assert.ok(item?.source.startsWith("https://www.wowhead.com/forever/item="+id));
 }
 assert.equal(db.verification_audit.blacksmith_lowlevel_camps_wave.unknown_item,null);
 assert.equal(db.verification_audit.blacksmith_lowlevel_camps_wave.resolved_followup.item_id,251357);
 assert.equal(db.verification_audit.blacksmith_lowlevel_camps_wave.verified_id_count,29);
 assert.equal(db.verification_audit.blacksmith_lowlevel_camps_wave.added_vendor_links,57);
});
test("Stondry and Gor'mak document the same starter plans without inventing rep or stock",()=>{
 assert.equal(byName.get("Stondry Darkhammer")?.faction,"alliance");
 assert.equal(byName.get("Gor'mak")?.faction,"horde");
 for(const name of vendor){
  const npc=byName.get(name);
  assert.ok(npc);
  assert.equal(npc.profession,"Forge");
  assert.equal(npc.offers.length,31);
  for(const id of ids){
   const offer=npc.offer_details?.[String(id)];
   assert.ok(npc.offers.includes(String(id)),name+" missing "+id);
   assert.equal(offer?.verification_status,"forever_documented");
   assert.equal(offer?.source_kind,"forever_guide_named_vendor");
   assert.deepEqual(offer?.price,{amount:30,currency:"merchants_favor"});
   if(name==="Stondry Darkhammer"&&id===251368)continue;// historical documented pair, separately preserved
   assert.equal(offer?.evidence_level,"documented_forever");
   assert.equal(offer?.observed_at,"2026-10-15");
   assert.equal(offer?.observed_build,"unknown");
   assert.equal(offer?.evidence_kind,"forever_community_page");
   assert.equal(offer?.source_url,offer?.evidence_url);
   assert.ok(offer?.item_source_url.startsWith("https://www.wowhead.com/forever/item="+id));
   assert.equal(offer?.reputation,undefined);
   assert.equal(offer?.restock_minutes,undefined);
   assert.equal(offer?.stock_status,"unknown");
   assert.match(offer?.evidence_note,/not a dated (confirmed in-game purchase|in-game transaction)/);
   const row=idx.items.find(r=>r.id===id);
   assert.ok(row?.sources.some(s=>s.kind==="merchant"&&s.name_en===name&&s.evidence_level==="documented_forever"));
  }
 }
});
test("the 57 new sales extend the existing source index without promoting Classic fallback",()=>{
 assert.equal(db.npcs.filter(n=>n.role==="merchant").length,206);
 assert.equal(Object.keys(db.items).length,409);
 assert.equal(db.audit.total_vendor_offers,923);
 assert.equal(db.audit.forever_documented_offers,346);
 assert.equal(db.audit.forever_documented_items,200);
 assert.equal(db.audit.classic_unverified_offers,577);
 assert.deepEqual(idx,buildFromFiles());
 assert.equal(idx.totals.unique_items,721);
 assert.equal(idx.totals.relations,1247);
 assert.equal(idx.totals.by_kind.merchant,923);
 assert.equal(idx.totals.by_evidence.documented_forever,483);
 assert.equal(idx.totals.by_evidence.classic_reference,764);
});
