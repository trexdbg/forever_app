import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const src=read("assets/rares.js");
const rares=JSON.parse(read("data/rares.json")).rares;
const start=src.indexOf("function rarePermalink(r,index=0){");
const end=src.indexOf("/* Evidence belongs to an exact coordinate.",start);
assert.ok(start>=0&&end>start,"pure permalink helpers available");
const helpers=src.slice(start,end);
const rare=id=>{
 const item=rares.find(x=>x.id===id);
 assert.ok(item,"known rare "+id);
 return item;
};
const link=(record,index,en)=>vm.runInNewContext(helpers+"\nrarePermalink(record,index)",{
 record,index,en,URL,location:{origin:"https://foreveroth.com"}
});
const readLink=(raw,records=rares)=>vm.runInNewContext(helpers+"\nrequestedRareFromUrl(params,records)",{
 params:new URLSearchParams(raw),records,URL
});

test("rare permalinks share only exact catalogue identity and optional waypoint index in FR/EN",()=>{
 for(const locale of ["fr","en"])for(const [id,point] of [
  ["462",2],["5831",1],["5828",0],["2779",1],
  ["forever-dun-morogh-ghostfang",3],["forever-tirisfal-blightsculler",0]
 ]){
  const r=rare(id);
  const href=link(r,point,locale==="en"),url=new URL(href);
  assert.equal(url.origin,"https://foreveroth.com");
  assert.equal(url.pathname,locale==="en"?"/en/rare/":"/rare/");
  assert.equal(url.searchParams.get("rare"),id);
  assert.equal(url.searchParams.get("level"),"all");
  assert.equal(url.searchParams.get("point"),r.points.length>1?String(point+1):null);
  assert.deepEqual([...url.searchParams.keys()].sort(),r.points.length>1?["level","point","rare"]:["level","rare"]);
  const parsed=readLink(url.search);
  assert.equal(parsed.rare.id,id);
  assert.equal(parsed.pointIndex,point);
 }
 assert.doesNotMatch(helpers,/localStorage|sessionStorage|document\.cookie|search\.value|loot\.checked|selected\?|\.notes\./);
});

test("unknown/malformed rare IDs and invalid point indexes are ignored or clamped",()=>{
 assert.equal(readLink("?rare=does-not-exist&level=all"),null);
 assert.equal(readLink("?rare=__proto__"),null);
 assert.equal(readLink("?rare="+("x".repeat(101))),null);
 for(const bad of ["0","-1","hello","NaN","Infinity","999999","1e5"]){
  const entry=readLink("?rare=462&point="+encodeURIComponent(bad));
  assert.equal(entry.rare.id,"462");
  assert.equal(entry.pointIndex,0,bad);
 }
 for(const bad of [-1,999]){
  const url=new URL(link(rare("462"),bad,true));
  assert.equal(url.searchParams.has("point"),false);
 }
 const fallback=readLink("?rare=2779&point=2&query=private");
 assert.equal(fallback.rare.id,"2779");
 assert.equal(fallback.pointIndex,1);
});

test("incoming exact links select the intended rare after data load without silently inventing pins",()=>{
 assert.match(src,/const requested=requestedRareFromUrl\(qs,rows\)/);
 assert.match(src,/if\(requested\)\{/);
 assert.match(src,/search\.value="";zone\.value="all";type\.value="all";level\.value="all";verification\.value="all"/);
 assert.match(src,/loot\.checked=false;tame\.checked=false;mapped\.checked=false/);
 assert.match(src,/selected=requested\?\.rare\|\|filtered\.find/);
 assert.match(src,/pointIndex=requested\?\.pointIndex\?\?0/);
 assert.match(src,/const requested=requestedRareFromUrl\(qs,rows\);[\s\S]*?filtered=results\(\)/);
 assert.doesNotMatch(helpers,/\.x\b|\.y\b|source_status|evidence_level|seen_forever/);
});

test("selection can be shared by clipboard with accessible fallback without changing rare data",()=>{
 assert.match(src,/share\.id="rare-share"/);
 assert.match(src,/const link=rarePermalink\(r,pointIndex\)/);
 assert.match(src,/await navigator\.clipboard\.writeText\(link\)/);
 assert.match(src,/fallback\.hidden=false;fallback\.focus\(\);fallback\.select\(\)/);
 assert.match(src,/rare-share-fallback/);
 assert.match(src,/out\.append\(foot\)/);
 for(const path of ["rare/index.html","en/rare/index.html"]){
   const html=read(path);
   assert.match(html,/rares\.js\?v=20261125-exact-rare-link1/);
   assert.match(html,/rares\.css\?v=20261125-exact-rare-link1/);
   assert.match(html,/id="rare-canvas"/);
   assert.match(html,/id="rare-detail"/);
 }
 const css=read("assets/rares.css");
 assert.match(css,/\.rare-share-fallback\[hidden\]/);
 assert.match(css,/\.rare-share:focus-visible/);
 // No source, rates or coordinates were changed by this scoped UI work.
 assert.ok(rare("462").points.length>10);
});
