import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {auditNpcProfessions} from "../scripts/check-npc-professions.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const load=p=>JSON.parse(readFileSync(resolve(root,p),"utf8"));
const codes=r=>r.issues.filter(x=>x.severity==="error").map(x=>x.code);
const proof={
 evidence_level:"documented_forever",
 source_url:"https://www.wow-professions.com/forever/npc/example",
 evidence_url:"https://www.wow-professions.com/forever/npc/example",
 observed_at:"2026-10-13",
 observed_build:"unknown",
 evidence_kind:"forever_community_page",
 evidence_note:"Named vendor-item sale listed in a beta guide; not verified in the live client."
};
const item=(other={})=>({id:4371,name:{fr:"Tube en bronze",en:"Bronze Tube"},skill:0,kind:"component",...other});
const npc=(other={})=>({
 id:3133,name:"Example merchant",role:"merchant",profession:"Ingénierie",
 zone:{id:"duskwood",fr:"Bois de la Pénombre",en:"Duskwood"},
 coordinates:{x:52,y:46},faction:"alliance",
 offers:["4371"],source:"https://www.wowhead.com/classic/guide/engineering-vendor-recipes-wow-classic",
 offer_details:{"4371":{source:"https://www.wow-professions.com/forever/npc/example",source_kind:"forever_guide_named_vendor",
 verification_status:"forever_documented",price:{amount:30,currency:"merchants_favor"},...proof}},...other
});
const profession=(other={})=>({id:202,slug:"engineering",name:{fr:"Ingénierie",en:"Engineering"},count:123,
 trainers:[{name:"Example",zone:{fr:"Hurlevent",en:"Stormwind"},tier:"apprentice",faction:"alliance"}],...other});
const check=(n={},p={})=>auditNpcProfessions({items:{"4371":item()},npcs:[npc()],evidence:[],...n},{professions:[profession()],...p});

test("current vendor and profession datasets remain structurally valid",()=>{
 const r=auditNpcProfessions(load("data/npcs.json"),load("data/professions.json"));
 assert.deepEqual(codes(r),[]);
 assert.equal(r.summary.npcs,357);
 assert.equal(r.summary.knownNpcIds,28);
 assert.equal(r.summary.positionedNpcs,303);
 assert.equal(r.summary.merchantOffers,631);
 assert.equal(r.summary.foreverDocumentedOffers,54);
 assert.equal(r.summary.classicOrUnverifiedOffers,577);
 assert.equal(r.summary.distinctItems,244);
 assert.equal(r.summary.recipeItems,228);
 assert.equal(r.summary.componentItems,10);
 assert.equal(r.summary.professions,12);
 assert.equal(r.summary.detailedRecipes,0); // no invented ingredient-level recipe coverage
 assert.ok(r.issues.some(i=>i.code==="NPC_ID_UNKNOWN"));
 assert.ok(r.issues.some(i=>i.code==="NPC_POSITION_UNKNOWN"));
});
test("documented beta sale stays documented, not confirmed in-game",()=>{
 const r=check();
 assert.equal(r.errorCount,0);
 assert.equal(r.summary.foreverDocumentedOffers,1);
 assert.equal(r.summary.classicOrUnverifiedOffers,0);
});
test("broken item link, orphan detail and duplicate NPC ID are rejected",()=>{
 const r=check({npcs:[
  npc({offers:["4371","99999"],offer_details:{"4371":npc().offer_details["4371"],"123":{}}}),
  npc({name:"Second merchant",offers:[],offer_details:{}})
 ]});
 for(const code of ["OFFER_ITEM_MISSING","ORPHAN_OFFER_DETAIL","NPC_ID_DUPLICATE"])assert.ok(codes(r).includes(code),code);
});
test("wrong French/English names and impossible map positions are errors",()=>{
 const r=check({items:{"4371":item({name:{fr:"",en:"Bronze Tube"}})},npcs:[npc({coordinates:{x:105,y:25}})]});
 for(const code of ["ITEM_LOCALE_MISSING","NPC_COORDINATES_INVALID"])assert.ok(codes(r).includes(code),code);
});
test("Forever labels cannot be backed by a Classic guide",()=>{
 const wrong={...npc().offer_details["4371"],source:"https://www.wowhead.com/classic/guide/vendors"};
 assert.ok(codes(check({npcs:[npc({offer_details:{"4371":wrong}})]})).includes("FOREVER_OFFER_SOURCE_CONFLICT"));
});
test("positive provenance requires exact evidence metadata",()=>{
 const bad={...npc().offer_details["4371"],evidence_url:undefined};
 assert.ok(codes(check({npcs:[npc({offer_details:{"4371":bad}})]})).includes("PROVENANCE_FIELD_MISSING"));
});
test("prices and timers must be documented, not fabricated as facts",()=>{
 const wrong={...npc().offer_details["4371"],price:{amount:-2,currency:"merchants_favor"},restock_minutes:20};
 const r=check({npcs:[npc({offer_details:{"4371":wrong}})]});
 for(const code of ["OFFER_PRICE_INVALID","RESTOCK_UNVERIFIED"])assert.ok(codes(r).includes(code),code);
});
test("reported wait ranges cannot run backward",()=>{
 const r=check({evidence:[{vendor_name:"Example merchant",item:"4371",min_minutes:120,max_minutes:10,url:"https://www.wowhead.com/classic/item=4371#comments"}]});
 assert.ok(codes(r).includes("WAIT_RANGE_INVALID"));
});
test("recipe ingredient quantities and bilingual trainers receive validation",()=>{
 const r=check({},{professions:[profession({
  trainers:[{name:"Trainer",zone:{fr:"",en:"Stormwind"},tier:"apprentice",faction:"alliance"}],
  recipes:[{id:99,name:{fr:"R",en:"R"},output_item_id:4389,output_quantity:1,components:[{id:4371,quantity:-4}]}]
 })]});
 assert.ok(codes(r).includes("RECIPE_COMPONENT_INVALID"));
 assert.ok(codes(r).includes("TRAINER_INVALID"));
});
test("Classic records with unknown IDs/positions remain inspectable warnings",()=>{
 const r=check({npcs:[npc({id:null,coordinates:null,offer_details:{}})]});
 assert.equal(r.errorCount,0);
 assert.equal(r.summary.classicOrUnverifiedOffers,1);
 assert.ok(r.issues.some(i=>i.code==="NPC_ID_UNKNOWN"));
});

test("unknown vendor stock is null, never invented as zero",()=>{
 assert.equal(check({items:{"4371":item({vendor_stock:null,vendor_price_copper:800})}}).errorCount,0);
 const r=check({items:{"4371":item({vendor_stock:-2})}});
 assert.ok(codes(r).includes("ITEM_STOCK_INVALID"));
});
