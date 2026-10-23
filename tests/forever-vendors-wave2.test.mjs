import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";
import {BASELINE as pinned} from "./helpers/catalogue-baseline.mjs";
const load=p=>JSON.parse(readFileSync(new URL("../data/"+p,import.meta.url),"utf8"));
const db=load("npcs.json"),index=load("item-acquisition-index.json");
const groups=[
 {names:["Fritz Fizzle","Fizzlefuse"],ids:[264202,264201,264203,285285,264204,264205,264206],profession:"Ingénierie"},
 {names:["Nina Surefire","Apothecary Durelle"],ids:[250381,250376,250388,250367,250378,250990,250978,250984],profession:"Alchimie"},
 {names:["Alynsia","Beneris"],ids:[249476,249478,249477,249479,249480,249481,249482,249484,249485,249483],profession:"Enchantement"},
 {names:["Aza'bek"],ids:[21099,21219],profession:"Cuisine"}
];
const byName=new Map(db.npcs.filter(n=>n.role==="merchant").map(n=>[n.name,n]));
test("41 new Forever-source vendor relationships retained alongside the 631 historical offers",()=>{
 assert.equal(db.npcs.filter(n=>n.role==="merchant").length,206);
 assert.equal(db.npcs.filter(n=>n.role==="trainer").length,153);
 assert.equal(Object.keys(db.items).length,409);
 assert.equal(db.npcs.filter(n=>n.role==="merchant").reduce((sum,n)=>sum+n.offers.length,0),923);
 assert.deepEqual(index,buildFromFiles(),"The object acquisition index must remain derivable from the authoritative catalogues");
 // Rolling index totals include later rare/dungeon work; seller offers in this test are unchanged.
 assert.equal(index.totals.unique_items,pinned.index.uniqueItems);
 assert.equal(index.totals.relations,pinned.index.relations);
 assert.equal(index.totals.by_kind.merchant,pinned.index.byKind.merchant);
 assert.equal(index.totals.by_evidence.documented_forever,pinned.index.byEvidence.documented_forever);
});
test("each target camp merchant has the exact catalogued recipe IDs and proof of each seller-item relationship",()=>{
 let sales=0;
 for(const group of groups)for(const name of group.names){
  const merchant=byName.get(name);assert.ok(merchant,name);
  assert.equal(merchant.profession,group.profession);
  assert.equal(new Set(merchant.offers).size,merchant.offers.length,"Duplicate offer "+name);
  for(const id of group.ids){
   assert.ok(merchant.offers.includes(String(id)),name+" missing "+id);
   const row=merchant.offer_details?.[String(id)];
   assert.equal(row.verification_status,"forever_documented",name+"/"+id);
   assert.equal(row.source_kind,"forever_guide_named_vendor");
   assert.match(row.source,/^https:\/\/[^\s/]+\/forever\//);
   const item=db.items[String(id)];
   assert.ok(item?.name?.fr&&item?.name?.en,item?.name?.en||String(id));
   assert.equal(item.id,id);
   assert.equal(item.profession,group.profession);
   const inIndex=index.items.find(x=>x.id===id);
   assert.ok(inIndex?.sources.some(s=>s.kind==="merchant"&&s.name_en===name&&s.evidence_level==="documented_forever"),name+" not indexed: "+id);
   sales++;
  }
 }
 assert.equal(sales,52,"Total documented low-level seller-item combinations; some are pre-existing");
});
test("new additions have per-relation source, build, price, language fallbacks and no invented gameplay confirmation",()=>{
 let fresh=0;
 for(const group of groups)for(const name of group.names){
  const npc=byName.get(name);
  for(const id of group.ids){
   const r=npc.offer_details[String(id)];
   if(r.observed_at!=="2026-10-15")continue;
   fresh++;
   assert.equal(r.evidence_level,"documented_forever");
   assert.equal(r.evidence_kind,"forever_community_page");
   assert.equal(r.observed_build,"unknown");
   assert.equal(r.source_url,r.evidence_url);
   assert.equal(r.source,r.evidence_url);
   assert.equal(r.item_source_url,"https://www.wowhead.com/forever/item="+id);
   assert.ok(r.evidence_note.includes(npc.name)&&r.evidence_note.includes("#"+id));
   assert.ok(/not a dated in-game purchase/.test(r.evidence_note));
   assert.equal(r.restock_minutes,undefined);
   assert.equal(r.stock,null===r.stock?null:undefined,"No fabricated stock");
   if(group.profession==="Cuisine"){assert.equal(r.price,undefined);assert.equal(r.price_status,"listed_coins_units_not_independently_validated")}
   else assert.deepEqual(r.price,{amount:45,currency:"merchants_favor"});
  }
 }
 assert.equal(fresh,41);
});
test("unproven French translations and bind-on-pickup are not invented",()=>{
 const newIds=[285285,264204,264205,264206,250367,250378,250978,250984,249478,249479,249480,249481,249482,249483,249484,249485];
 for(const id of newIds){
  const item=db.items[String(id)];
  assert.equal(item.name_fr_status,"unverified_fallback_english");
  assert.equal(item.name.fr,item.name.en);
  assert.equal(item.skill_semantics,"vendor_guide_profession_value_not_proof_of_game_learning_level");
  assert.equal(item.supply,"unknown_in_forever");
  assert.ok(item.skill>0&&item.skill<=150);
 }
 for(const name of ["Fritz Fizzle","Fizzlefuse"]){
  const npc=byName.get(name);
  for(const id of [264201,264202,264203,264204,264205,264206]){
   const detail=npc.offer_details[String(id)];
   if(detail.observed_at==="2026-10-15")assert.equal(detail.bind,undefined,"BoP not proved for "+id);
  }
 }
});
