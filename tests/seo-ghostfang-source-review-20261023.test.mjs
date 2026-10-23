import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const rares=JSON.parse(read("data/rares.json"));
const index=JSON.parse(read("data/item-acquisition-index.json"));
test("Ghostfang correction is tied to its one cross-checked coordinate",()=>{
 const rare=rares.rares.find(x=>x.id==="forever-dun-morogh-ghostfang");
 assert.ok(rare);
 assert.deepEqual(rare.points,[[74.2,63.2],[79.4,42.8],[80.4,46.6],[81.6,55.4]]);
 assert.equal(rare.point_evidence.length,rare.points.length);
 assert.equal(rare.point_evidence[2].observed_at,"2026-10-23");
 assert.equal(rare.point_evidence[2].source_url,"https://www.60.tools/guides/rares");
 assert.deepEqual(rare.point_evidence[2].coordinates,rare.points[2]);
 assert.match(rare.point_evidence[2].evidence_note,/not a guaranteed live spawn/);
 assert.equal(rare.seen_forever,false);
 assert.equal(rare.respawn_min_hours,null);
 assert.equal(rare.respawn_max_hours,null);
 for(const i of [0,1,3])assert.equal(rare.point_evidence[i].observed_at,"2026-10-15");
});
test("conflicting Ghostfang item source is a candidate only, never a documented drop",()=>{
 const r=rares.rares.find(x=>x.id==="forever-dun-morogh-ghostfang");
 assert.deepEqual(r.loot,[]);
 assert.equal(r.loot_coverage,"not_documented");
 assert.equal(r.loot_candidate_review.item_id,286751);
 assert.equal(r.loot_candidate_review.evidence_level,"unverified");
 assert.equal(r.loot_candidate_review.status,"conflicting_documentary_sources_not_confirmed_drop");
 assert.equal(r.loot_candidate_review.item_snapshot.item_level,10);
 assert.equal(r.loot_candidate_review.item_snapshot.required_level,5);
 assert.equal(r.loot_candidate_review.item_snapshot.item_stats_build,"1.60.1.70425");
 assert.match(r.loot_candidate_review.evidence_note,/not a witnessed kill\/drop/);
 assert.equal(index.items.some(item=>item.id===286751&&item.sources.some(s=>s.kind==="rare"&&s.name_en==="Ghostfang")),false);
});
test("Dun Morogh bilingual answers and JSON-LD state exactly what was and was not established",()=>{
 for(const [fr,en] of [["guides/rares-dun-morogh/","en/guides/dun-morogh-rares/"]]){
  for(const [lang,path] of [["fr",fr],["en",en]]){
   const html=read(path+"index.html");
   const title=html.match(/<title>([^<]+)<\/title>/)?.[1]||"";
   const desc=html.match(/<meta name="description" content="([^"]+)"/)?.[1]||"";
   const h1=html.match(/<h1>([^<]+)<\/h1>/)?.[1]||"";
   const ld=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]||"null");
   const graph=ld["@graph"];
   const article=graph.find(x=>x["@type"]==="Article"),page=graph.find(x=>x["@type"]==="WebPage");
   assert.ok(title.length>=35&&title.length<=85);
   assert.ok(desc.length>=90&&desc.length<=185);
   assert.equal(article.description,desc);
   assert.equal(page.description,desc);
   assert.equal(article.headline,h1);
   assert.equal(article.inLanguage,lang);
   assert.equal(article.dateModified,"2026-10-23");
   assert.ok(html.includes('rel="canonical" href="https://foreveroth.com/'+path+'"'));
   for(const [language,target] of [["fr",fr],["en",en]])assert.ok(html.includes('hreflang="'+language+'" href="https://foreveroth.com/'+target+'"'));
   for(const coordinate of ["74.2 / 63.2","79.4 / 42.8","80.4 / 46.6","81.6 / 55.4"])assert.ok(html.includes(coordinate),path+": "+coordinate);
   assert.ok(html.includes("286751"));
   assert.ok(html.includes("https://www.60.tools/guides/rares"));
   assert.ok(html.includes("https://forevercompanion.io/rares"));
   assert.ok(article.citation.includes("https://www.60.tools/items/286751-ghostfangs-steps"));
   assert.ok(html.includes("q=Ghostfang"));
   assert.ok(html.includes("Classic"));
   assert.ok(!html.includes("100% drop"));
  }
 }
});
