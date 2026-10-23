import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const pairs=[
 ["guides/rare-5831/","en/guides/rare-5831/"],
 ["guides/rare-5828/","en/guides/rare-5828/"],
 ["guides/rares-tarides/","en/guides/barrens-rares/"],
 ["guides/temps-repop-monstres-rares/","en/guides/rare-respawn-times/"]
];
const source="https://www.60.tools/guides/rares",secondary="https://forevercompanion.io/rares";
const unescape=s=>s.replaceAll("&#39;","'").replaceAll("&amp;","&").replaceAll("&quot;",'"');
test("GSC-targeted bilingual rare guides offer consistent, source-linked GEO answers",()=>{
 for(const [fr,en] of pairs){
  for(const [lang,path] of [["fr",fr],["en",en]]){
   const html=read(path+"index.html");
   const meta=unescape(html.match(/<meta name="description" content="([^"]+)"/)?.[1]||"");
   const title=unescape(html.match(/<title>([^<]+)<\/title>/)?.[1]||"");
   const h1=unescape(html.match(/<h1>([^<]+)<\/h1>/)?.[1]||"");
   const ld=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]||"null");
   const graph=ld?.["@graph"]||[];
   const page=graph.find(x=>x["@type"]==="WebPage"),article=graph.find(x=>x["@type"]==="Article");
   assert.ok(title.length>=35&&title.length<=85,path+" title");
   assert.ok(meta.length>=90&&meta.length<=185,path+" description");
   assert.ok(title.includes("Forever"),path+" Forever intent");
   assert.equal(unescape(page?.description||""),meta,path+" WebPage description");
   assert.equal(unescape(article?.description||""),meta,path+" Article description");
   assert.equal(unescape(article?.headline||""),h1,path+" Article/H1");
   assert.equal(article.dateModified,"2026-10-23",path+" last review");
   assert.equal(article.inLanguage,lang,path+" language");
   assert.ok(article.citation.includes(source)&&article.citation.includes(secondary),path+" evidence citations");
   assert.ok(html.includes('rel="canonical" href="https://foreveroth.com/'+path+'"'),path+" canonical");
   for(const [hreflang,target] of [["fr",fr],["en",en]])
    assert.ok(html.includes('hreflang="'+hreflang+'" href="https://foreveroth.com/'+target+'"'),path+" hreflang");
   if(!path.includes("rare-5828/"))assert.match(html,/24–32/,path+" historical Swiftmane time explicitly labelled");
   if(!path.includes("rare-5831/"))assert.match(html,/8–12/,path+" historical Humar time explicitly labelled");
   assert.match(html,/Classic/,path+" Classic distinction");
  }
 }
});
test("Swiftmane and Humar guides expose four distinct documented community waypoint leads, not live confirmations",()=>{
 const expected=[["rare-5831/",["60.4 / 33.0","61.2 / 29.6","61.8 / 36.2"]],
 ["rare-5828/",["61.0 / 35.0"]]];
 for(const [name,coords] of expected){
  for(const prefix of ["guides/","en/guides/"]){
   const html=read(prefix+name+"index.html");
   for(const c of coords)assert.ok(html.includes(c),prefix+name+": "+c);
   assert.ok(html.includes("https://www.60.tools/guides/rares"),prefix+name+" source");
   assert.ok(html.includes("https://forevercompanion.io/rares"),prefix+name+" cross-check");
   assert.ok(html.includes("/rare/?zone=barrens"),prefix+name+" atlas link");
  }
 }
 const db=JSON.parse(read("data/rares.json"));
 for(const [id,coords] of [["5831",3],["5828",1]]){
  const rare=db.rares.find(x=>x.id===id);
  assert.equal(rare.coordinate_status,"mixed_sources");
  assert.equal(rare.seen_forever,false);
  assert.equal(rare.point_evidence[0].evidence_level,"unverified");
  assert.equal(rare.point_evidence.slice(1).length,coords);
  assert.ok(rare.point_evidence.slice(1).every(x=>x.evidence_level==="documented_forever"&&x.observed_build==="unknown"));
 }
});
