import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
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
 assert.equal(r.summary.positionedNpcs,350); // 303 original mapped NPCs + 47 Forever guide waypoints (#51)
 assert.equal(r.summary.merchantOffers,672);
 assert.equal(r.summary.foreverDocumentedOffers,95);
 assert.equal(r.summary.classicOrUnverifiedOffers,577);
 assert.equal(r.summary.distinctItems,260);
 assert.equal(r.summary.recipeItems,244);
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

test("Aza'bek and Nina Surefire have ten exact, documented vendor-item sales",()=>{
 const data=load("data/npcs.json");
 const expected=[
  {vendor:"Aza'bek",id:249885,name:"Recipe: Venomous Smoothie",cost:30},
  {vendor:"Aza'bek",id:249886,name:"Recipe: Slimy Smoothie",cost:30},
  {vendor:"Aza'bek",id:249887,name:"Recipe: Mrrggl Smrrthle",cost:30},
  {vendor:"Aza'bek",id:249888,name:"Recipe: Calcified Smoothie",cost:60,rank:"Friendly",faction:"Durotar Supply and Logistics"},
  {vendor:"Aza'bek",id:249889,name:"Recipe: Spicy Smoothie",cost:60,rank:"Friendly",faction:"Durotar Supply and Logistics"},
  {vendor:"Aza'bek",id:249890,name:"Recipe: Wicked Smoothie",cost:90,rank:"Honored",faction:"Durotar Supply and Logistics"},
  {vendor:"Nina Surefire",id:250381,name:"Recipe: Elixir of Lesser Spirit",cost:45},
  {vendor:"Nina Surefire",id:250376,name:"Recipe: Lesser Mageblood Elixir",cost:45},
  {vendor:"Nina Surefire",id:250388,name:"Recipe: Elixir of Lesser Intellect",cost:45},
  {vendor:"Nina Surefire",id:250990,name:"Recipe: Mender's Potion",cost:45}
 ];
 const urls={"Aza'bek":"https://www.wow-professions.com/forever/npc/azabek",
             "Nina Surefire":"https://www.wow-professions.com/forever/npc/nina-surefire"};
 for(const e of expected){
  const merchant=data.npcs.find(n=>n.name===e.vendor);
  assert.ok(merchant,"Missing NPC "+e.vendor);
  assert.ok(merchant.offers.includes(String(e.id)),e.vendor+" does not offer "+e.id);
  const item=data.items[String(e.id)],offer=merchant.offer_details?.[e.id];
  assert.equal(item?.id,e.id);
  assert.equal(item?.name?.en,e.name,e.vendor+" item "+e.id);
  assert.equal(offer?.verification_status,"forever_documented");
  assert.deepEqual(offer?.price,{amount:e.cost,currency:"merchants_favor"});
  assert.equal(offer?.reputation?.rank??null,e.rank??null);
  assert.equal(offer?.reputation?.faction??null,e.faction??null);
  assert.equal(offer?.evidence_level,"documented_forever");
  assert.equal(offer?.source_url,urls[e.vendor]);
  assert.equal(offer?.evidence_url,urls[e.vendor]);
  assert.equal(offer?.evidence_kind,"forever_community_page");
  assert.equal(offer?.observed_at,"2026-10-13");
  assert.equal(offer?.observed_build,"unknown");
  assert.match(offer.evidence_note,/ni stock actuel ni capture directe en jeu confirmés/);
 }
 const actual=data.npcs.flatMap(n=>Object.values(n.offer_details||{})).filter(o=>o.evidence_level==="documented_forever");
 assert.equal(actual.length,expected.length+41,"Original documented associations remain individually pinned, plus 41 new relations validated in the vendor wave-2 test");
});
test("sale URL prioritizes precise evidence with safe legacy fallback; FR and EN labels",()=>{
 const code=readFileSync(resolve(root,"assets/npcs.js"),"utf8");
 const source=code.match(/^const offerSourceUrl=.*;$/m)?.[0];
 const label=code.match(/^const offerSourceLabel=.*;$/m)?.[0];
 assert.ok(source&&label,"Actual frontend must retain testable sale-link helpers");
 const {offerSourceUrl,offerSourceLabel}=runInNewContext(
  source+"\n"+label+"\n({offerSourceUrl,offerSourceLabel})",
  {});
 const full={evidence_url:"https://example.org/direct-evidence",source_url:"https://example.org/source",source:"https://example.org/legacy"};
 assert.equal(offerSourceUrl(full),"https://example.org/direct-evidence");
 assert.equal(offerSourceUrl({...full,evidence_url:"not-a-valid-url"}),"https://example.org/source");
 assert.equal(offerSourceUrl({source:"https://www.wowhead.com/classic/guide/legacy"}),"https://www.wowhead.com/classic/guide/legacy");
 assert.equal(offerSourceUrl({source:"javascript:alert(1)"}),null);
 assert.equal(offerSourceUrl(null),null);
 assert.equal(offerSourceLabel(false),"Source de cette vente ↗");
 assert.equal(offerSourceLabel(true),"Source for this sale ↗");
 assert.ok(code.includes("const saleProof=offerSourceUrl(purchase);"),"Frontend must actually use the helper");
 assert.ok(code.includes("link(cite,offerSourceLabel(en),saleProof)"),"Rendered link must use bilingual label and prioritized href");
});
test("malformed item / profession root records are reported without crashing",()=>{
 const r=check({items:{"4371":null,"999":false},npcs:[npc()]},{professions:[null,42]});
 for(const code of ["ITEM_RECORD_INVALID","PROFESSION_RECORD_INVALID"])assert.ok(codes(r).includes(code),code);
 assert.ok(r.errorCount>0);
});
test("malformed masters, recipes, components and historical evidence are errors, not exceptions",()=>{
 const r=check({
  npcs:[npc({offers:["4371"],offer_details:{"4371":null}})],
  evidence:[null,"bad report",{
   vendor_name:"Example merchant",item:"4371",url:"https://example.org/notes",
   min_minutes:12,max_minutes:15
  }]
 },{
  professions:[profession({trainers:[null,"bad trainer"],recipes:[
    null,42,{id:23,name:{fr:"Recette",en:"Recipe"},output_item_id:3,
     output_quantity:1,components:[null,"broken",{id:2,quantity:1}]}
  ]})]
 });
 for(const code of ["OFFER_DETAIL_INVALID","WAIT_RECORD_INVALID","TRAINER_RECORD_INVALID",
                     "RECIPE_RECORD_INVALID","RECIPE_COMPONENT_INVALID"])
  assert.ok(codes(r).includes(code),code);
 assert.ok(r.errorCount>0);
});
test("null root catalogues yield structural error reports, not runtime exceptions",()=>{
 const r=auditNpcProfessions(null,null);
 for(const code of ["ITEMS_NOT_OBJECT","NPCS_NOT_ARRAY","PROFESSIONS_NOT_ARRAY"])
  assert.ok(codes(r).includes(code),code);
 assert.equal(r.errorCount,3);
});
