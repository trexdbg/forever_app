import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const db=JSON.parse(read("data/npcs.json"));
const acquisition=JSON.parse(read("data/item-acquisition-index.json"));
const vendor=db.npcs.find(n=>n.name==="Fizzlefuse");
const marked=db.npcs.filter(n=>n.role==="merchant"&&n.offers.some(id=>n.offer_details?.[id]?.verification_status==="forever_documented"));
const pairs=[
 ["guides/marchand-fizzlefuse/","en/guides/vendor-fizzlefuse/"],
 ["guides/objet-forever-264203/","en/guides/forever-item-264203/"],
 ["guides/marchands-recettes-forever/","en/guides/forever-recipe-vendors/"]
];

test("existing Horde vendor is now mapped, never duplicated or assigned an invented NPC ID",()=>{
 assert.equal(db.npcs.filter(n=>n.name==="Fizzlefuse").length,1);
 assert.equal(vendor.id,null);
 assert.equal(vendor.role,"merchant");
 assert.equal(vendor.faction,"horde");
 assert.equal(vendor.profession,"Ingénierie");
 assert.equal(vendor.zone.id,"barrens");
 assert.deepEqual(vendor.coordinates,{x:49.8,y:29.6});
 assert.equal(vendor.coordinate_status,"forever_guide_waypoint");
 assert.equal(db.zone_maps.barrens.uiMapID,1413);
 assert.equal(vendor.location_provenance.uiMapID,1413);
 assert.equal(vendor.location_provenance.zone,"barrens");
 assert.equal(vendor.location_provenance.evidence_kind,"forever_community_page");
 assert.equal(vendor.location_provenance.evidence_level,"documented_forever");
 assert.equal(vendor.location_provenance.observed_build,"unknown");
 assert.equal(vendor.location_provenance.observed_at,"2026-10-23");
 assert.equal(vendor.location_provenance.source_url,"https://www.60.tools/guides/merchants-favor");
 assert.equal(vendor.location_provenance.evidence_url,"https://www.wow-professions.com/forever/npc/fizzlefuse");
 assert.match(vendor.location_provenance.evidence_note,/not a timestamped gameplay capture/);
 assert.equal(vendor.offers.length,8);
 assert.ok(vendor.offers.includes("264203"));
 assert.equal(vendor.offer_details["264203"].verification_status,"forever_documented");
 assert.equal(vendor.offer_details["264203"].price.amount,45);
 assert.equal(db.items["264203"].skill,55);
 assert.equal(marked.length,25);
 assert.equal(db.audit.total_vendor_offers,923);
 assert.equal(db.audit.forever_documented_offers,346);
 assert.equal(db.audit.fizzlefuse_20261023.new_merchants,0);
 assert.equal(db.audit.fizzlefuse_20261023.new_offers,0);
});

test("both faction source links were present before the mapping change; item acquisition index is not inflated",()=>{
 const row=acquisition.items.find(x=>x.id===264203);
 const sellers=row.sources.filter(s=>s.kind==="merchant");
 assert.deepEqual(sellers.map(s=>s.name_en).sort(),["Fizzlefuse","Fritz Fizzle"]);
 assert.ok(sellers.every(s=>s.evidence_level==="documented_forever"));
 assert.deepEqual(acquisition,buildFromFiles());
 assert.equal(acquisition.totals.by_kind.merchant,923);
 assert.equal(acquisition.totals.relations,1270);
 const js=read("assets/npcs.js");
 assert.match(js,/Number\.isFinite\(n\.coordinates\?\.x\)/);
 assert.match(js,/n\.zone\.id/);
 assert.match(js,/data\/npcs\.json/);
});

test("three bilingual guide pairs reflect one mapped NPC, eight offers and accurate vendor counts",()=>{
 for(const [fr,en] of pairs)for(const [lang,path] of [["fr",fr],["en",en]]){
  const html=read(path+"index.html");
  const meta=html.match(/<meta name="description" content="([^"]+)"/)?.[1]||"";
  const title=html.match(/<title>([^<]+)<\/title>/)?.[1]||"";
  const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]||"null")["@graph"];
  const article=graph.find(x=>x["@type"]==="Article"),webpage=graph.find(x=>x["@type"]==="WebPage");
  assert.ok(title.length>=35&&title.length<=85,path+" title");
  assert.ok(meta.length>=90&&meta.length<=185,path+" meta description");
  assert.equal(article.description,meta);
  assert.equal(webpage.description,meta);
  assert.equal(article.dateModified,"2026-10-23");
  assert.equal(article.inLanguage,lang);
  assert.ok(html.includes('rel="canonical" href="https://foreveroth.com/'+path+'"'));
  for(const [language,target] of [["fr",fr],["en",en]])assert.ok(html.includes('hreflang="'+language+'" href="https://foreveroth.com/'+target+'"'));
  assert.ok(html.includes("Fizzlefuse"));
  assert.ok(html.includes("49.8 / 29.6"),path+" mapped position");
  assert.ok(article.citation.includes("https://www.60.tools/guides/merchants-favor"));
  assert.ok(article.citation.includes("https://www.wow-professions.com/forever/npc/fizzlefuse"));
  assert.match(html,/(?:source|community|communautaire|documenté)/i);
  if(path.includes("fizzlefuse")){
   for(const id of vendor.offers)assert.ok(html.includes("item="+id),path+" item "+id);
   assert.ok(html.includes(lang==="fr"?"/marchands/?q=Fizzlefuse":"/en/marchands/?q=Fizzlefuse"));
   assert.ok(html.includes("175")&&html.includes("180"));
  }else if(path.includes("264203")){
   assert.ok(html.includes("Fritz Fizzle"));
   assert.ok(html.includes("Fizzlefuse</a>"));
   assert.ok(html.includes("45"));
  }else{
   assert.ok(html.includes("25"),path+" correct catalog merchant count");
   assert.ok(html.includes("Vayn Moongaze")&&html.includes("Jim&#39;bek"),path+" newly reconciled source listings");
  }
 }
});
