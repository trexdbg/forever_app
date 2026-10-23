import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const pairs=[
 ["guides/objet-forever-264203/","en/guides/forever-item-264203/"],
 ["guides/marchands-recettes-forever/","en/guides/forever-recipe-vendors/"]
];
test("faction Favor guides give documented Alliance and Horde leads without silently enlarging local index",()=>{
 for(const [fr,en] of pairs){
  for(const [lang,p] of [["fr",fr],["en",en]]){
   const html=read(p+"index.html");
   const title=html.match(/<title>([^<]+)<\/title>/)?.[1]||"";
   const desc=html.match(/<meta name="description" content="([^"]+)"/)?.[1]||"";
   const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]||"null")["@graph"];
   const article=graph.find(x=>x["@type"]==="Article"),page=graph.find(x=>x["@type"]==="WebPage");
   assert.ok(title.length>=35&&title.length<=85,p+" title");
   assert.ok(desc.length>=90&&desc.length<=185,p+" description");
   assert.equal(article.description,desc);
   assert.equal(page.description,desc);
   assert.equal(article.dateModified,"2026-10-23");
   assert.equal(article.inLanguage,lang);
   assert.ok(html.includes('rel="canonical" href="https://foreveroth.com/'+p+'"'));
   for(const [loc,target] of [["fr",fr],["en",en]])assert.ok(html.includes('hreflang="'+loc+'" href="https://foreveroth.com/'+target+'"'));
   for(const name of ["Fritz Fizzle","Fizzlefuse","Marcy Baker","Dokimi"])assert.ok(html.includes(name),p+" missing "+name);
   assert.ok(html.includes("49.8 / 29.6"),p+" Horde zone percent waypoint");
   assert.ok(html.includes("45"),p+" favor price");
   assert.ok(html.includes("55"),p+" engineering skill");
   assert.ok(html.includes("https://www.60.tools/guides/merchants-favor"));
   assert.ok(article.citation.includes("https://foreverchanges.pro/item/264203"));
   assert.ok(html.includes(lang==="fr"?"/guides/objet-forever-264203/":"/en/guides/forever-item-264203/"));
   assert.match(html,/(?:beta|bêta)/i);
  }
 }
});
test("local seller count is not rewritten as two verified or directly indexed vendors",()=>{
 for(const p of ["guides/objet-forever-264203/","en/guides/forever-item-264203/"]){
  const html=read(p+"index.html");
  assert.ok(/(?:1 linked sellers|1 marchand|un marchand|un vendeur|1 vendeur)/i.test(html),p+" existing single catalog seller kept");
  assert.ok(/(?:not yet indexed|encore absente)/i.test(html),p+" external lead marked distinct");
 }
 for(const p of ["guides/marchands-recettes-forever/","en/guides/forever-recipe-vendors/"]){
  const html=read(p+"index.html");
  assert.ok(html.includes("23"),p+" local catalogue count unchanged");
 }
});
