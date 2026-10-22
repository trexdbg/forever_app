#!/usr/bin/env node
/*
 * Offline check for the five GSC-priority bilingual guides.
 * Validates structured SEO metadata, reciprocal translations, related links and
 * explicit source uncertainty; it does not attest live WoW Forever availability.
 */
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const origin="https://foreveroth.com";
const pairs=[
  ["guides/boss-forever-city-of-dalaran-atrexis-the-grave-knight/","en/guides/forever-boss-city-of-dalaran-atrexis-the-grave-knight/"],
  ["guides/tube-en-bronze/","en/guides/bronze-tube/"],
  ["guides/maitres-armes/","en/guides/weapon-masters/"],
  ["guides/boss-forever-city-of-dalaran-archmage-s-shade/","en/guides/forever-boss-city-of-dalaran-archmage-s-shade/"],
  ["guides/bis-forever-niveau-30/","en/guides/forever-level-30-bis-gear/"]
];
const capture=(s,re,label,path)=>{
  const match=s.match(re);
  assert.ok(match, `${path}: missing ${label}`);
  return match[1];
};
const decode=s=>s.replace(/&#39;/g,"'").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&nbsp;/g," ").replace(/\s+/g," ").trim();
let checked=0;
for(const [frPath,enPath] of pairs){
  const expected={fr:origin+"/"+frPath,en:origin+"/"+enPath};
  for(const [lang,path] of [["fr",frPath],["en",enPath]]){
    const file=join(root,path,"index.html");
    const html=readFileSync(file,"utf8");
    assert.match(html,new RegExp('<html lang="'+lang+'"'),path+": language mismatch");
    const title=decode(capture(html,/<title>([^<]+)<\/title>/,"title",path));
    const desc=decode(capture(html,/<meta name="description" content="([^"]*)">/,"meta description",path));
    assert.ok(title.length>=35&&title.length<=85, path+": invalid title length");
    assert.ok(desc.length>=90&&desc.length<=185, path+": invalid description length");
    assert.match(title,/Forever/i,path+": title lacks Forever search context");
    assert.match(desc,/Forever/i,path+": description lacks Forever");
    const canonical=capture(html,/<link rel="canonical" href="([^"]+)">/,"canonical",path);
    assert.equal(canonical,expected[lang],path+": wrong canonical");
    for(const locale of ["fr","en"]){
      const alternate=capture(html,new RegExp('<link rel="alternate" hreflang="'+locale+'" href="([^"]+)">'),"hreflang "+locale,path);
      assert.equal(alternate,expected[locale],path+": nonreciprocal hreflang "+locale);
    }
    const h1=decode(capture(html,/<h1>([\s\S]*?)<\/h1>/,"H1",path).replace(/<[^>]*>/g,""));
    const schema=JSON.parse(capture(html,/<script type="application\/ld\+json">([\s\S]*?)<\/script>/,"JSON-LD",path));
    const graph=schema["@graph"]||[schema];
    const article=graph.find(x=>x["@type"]==="Article");
    const webPage=graph.find(x=>x["@type"]==="WebPage");
    assert.ok(article&&webPage,path+": missing Article/WebPage schema");
    assert.equal(article.headline,h1,path+": JSON-LD headline/H1 mismatch");
    assert.equal(article.description,desc,path+": Article/description mismatch");
    assert.equal(webPage.description,desc,path+": WebPage/description mismatch");
    assert.equal(article.inLanguage,lang,path+": Article locale mismatch");
    assert.ok(Array.isArray(article.citation)&&article.citation.length>0,path+": missing evidence citation");
    assert.match(article.dateModified,/^20\d\d-\d\d-\d\d$/,path+": invalid dateModified");
    if(html.includes('property="og:title"')){
      assert.equal(decode(capture(html,/<meta property="og:title" content="([^"]+)">/,"og:title",path)),title,path+": og:title mismatch");
      assert.equal(decode(capture(html,/<meta property="og:description" content="([^"]+)">/,"og:description",path)),desc,path+": og:description mismatch");
    }
    for(const href of ["/"+frPath,"/"+enPath]){
      assert.ok(html.includes('href="'+origin+href+'"')||html.includes('href="'+href+'"'),path+": missing language or internal counterpart "+href);
    }
    const relativeLinks=[...html.matchAll(/<a\b[^>]*href="(\/[^"]+)"/g)].map(x=>x[1].split(/[?#]/)[0]);
    for(const href of relativeLinks){
      if(href.endsWith("/")&&href!="/")assert.ok(existsSync(join(root,href.slice(1),"index.html")),path+": broken internal related link: "+href);
    }
    if(path.includes("bronze")||path.includes("tube-en-bronze")){
      const switcher=capture(html,/(<div class="lang-switch"[\s\S]*?<\/div>)/,"language switch",path);
      assert.ok(switcher.includes("/guides/tube-en-bronze/")&&switcher.includes("/en/guides/bronze-tube/"),path+": broken language switch");
      assert.ok(!switcher.includes("/minage/"),path+": legacy mining link in language switch");
    }
    if(path.includes("bronze-tube")||path.includes("tube-en-bronze")){
      assert.match(html,/4371/,path+": item ID missing");
      assert.match(html,/105/,path+": recipe yellow threshold missing");
      assert.match(html,/wowforevertalents\.com\/professions\/engineering\/parts/,path+": missing recipe source");
      assert.ok(html.includes('href="'+(lang==="en"?"/en/metiers/?craft=4371":"/metiers/?craft=4371")+'"'),path+": missing interactive recipe link");
    }
    if(path.includes("weapon-masters")||path.includes("maitres-armes")){
      assert.ok(/Woo Ping/.test(html)&&/Archibald/.test(html),path+": polearm masters absent");
      assert.match(html,/20/,path+": polearm level reference absent");
      assert.ok(!html.includes('aria-current="page" href="/minage/"')&&!html.includes('aria-current="page" href="/en/minage/"'),path+": unrelated navigation selected");
    }
    if(path.includes("bis-forever")||path.includes("bis-gear")){
      assert.ok(html.includes('archmage-s-shade/')&&html.includes('atrexis-the-grave-knight/'),path+": missing related boss links");
    }
    assert.ok(/unconfirm|non confirm|non certifi|not verified|non vérifi|non garanti|Classic|unverified|à vérifier|pas des captures de drop en jeu|not first-hand/i.test(html),path+": lacks source uncertainty");
    checked++;
  }
}
// Protect crawlable equipment landing-page snippets and links to the high-performing level-30 guide.
for(const [lang,path,guidePath] of [
  ["fr","equipements/index.html","/guides/bis-forever-niveau-30/"],
  ["en","en/equipements/index.html","/en/guides/forever-level-30-bis-gear/"]
]){
  const html=readFileSync(join(root,path),"utf8");
  const title=decode(capture(html,/<title>([^<]+)<\/title>/,"equipment title",path));
  const desc=decode(capture(html,/<meta name="description" content="([^"]+)">/,"equipment description",path));
  assert.ok(title.length>=35&&title.length<=85,path+": equipment title length");
  assert.ok(desc.length>=90&&desc.length<=185,path+": equipment description length");
  assert.match(title,/Forever/i,path+": missing Forever search intent");
  assert.equal(decode(capture(html,/<meta property="og:title" content="([^"]+)">/,"og:title",path)),title);
  assert.equal(decode(capture(html,/<meta property="og:description" content="([^"]+)">/,"og:description",path)),desc);
  const schema=JSON.parse(capture(html,/<script type="application\/ld\+json">([\s\S]*?)<\/script>/,"equipment JSON-LD",path));
  const graph=schema["@graph"]||[schema];
  const page=graph.find(x=>x["@type"]==="WebPage"),app=graph.find(x=>x["@type"]==="WebApplication");
  assert.ok(page&&app,path+": missing WebPage or WebApplication");
  assert.equal(decode(page.name),title,path+": title and WebPage name differ");
  assert.equal(decode(page.description),desc,path+": WebPage description differs");
  assert.equal(decode(app.description),desc,path+": WebApplication description differs");
  assert.equal(page.inLanguage,lang,path+": JSON-LD language mismatch");
  assert.ok(html.includes('href="'+guidePath+'"'),path+": missing level-30 guide");
}
console.log("GSC-priority SEO guides:",checked,"bilingual pages and equipment snippets OK.");
