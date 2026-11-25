import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const src=read("assets/dungeons.js");
const db=JSON.parse(read("data/dungeons-forever.json"));
const start=src.indexOf("function bossPermalink(d,index){");
const end=src.indexOf("function updateUrl(){",start);
assert.ok(start>=0&&end>start,"isolated share helper exists");
const pure=src.slice(start,end);
const link=(d,index,en)=>vm.runInNewContext(pure+"\nbossPermalink(d,index)",{
 d,index,en,URL,location:{origin:"https://foreveroth.com"}
});
const pick=id=>{const d=db.dungeons.find(x=>x.id===id);assert.ok(d,id);return d;};

test("copyable boss URL resolves the exact existing dungeon, boss and locale, without user state",()=>{
 for(const en of [true,false])for(const [id,n] of [
  ["hall-of-thanes",1],["ruins-of-lordaeron",3],
  ["excavation-site-wetlands",2],["city-of-dalaran",8]
 ]){
  const d=pick(id);
  assert.ok(d.bosses[n-1],"real boss ordinal for "+id);
  const u=new URL(link(d,n-1,en));
  assert.equal(u.origin,"https://foreveroth.com");
  assert.equal(u.pathname,en?"/en/donjons/":"/donjons/");
  assert.equal(u.searchParams.get("donjon"),id);
  assert.equal(u.searchParams.get("boss"),String(n));
  assert.deepEqual([...u.searchParams.keys()].sort(),["boss","donjon"]);
 }
 assert.doesNotMatch(pure,/location\.href|search\.value|searchParams\.get|localStorage|sessionStorage|loot\b|coordinates|\.note/);
});

test("unknown or unavailable encounter ordinal has a dungeon-only URL",()=>{
 const d=pick("hall-of-thanes");
 const u=new URL(link(d,999,true));
 assert.equal(u.searchParams.get("donjon"),d.id);
 assert.equal(u.searchParams.get("boss"),null);
 assert.deepEqual([...u.searchParams.keys()],["donjon"]);
});

test("UI copy action remains a fixed consent-gated event and gives a selectable fallback",()=>{
 const source=src.slice(src.indexOf('const share=elbtn(t("↗ Copier le lien"'),src.indexOf('actions.append(prev,share,next,fallback)')+45);
 assert.match(source,/const url=bossPermalink\(d,selectedBoss\)/);
 assert.match(source,/await navigator\.clipboard\.writeText\(url\)/);
 assert.match(source,/fallback\.value=url;fallback\.hidden=false;fallback\.focus\(\);fallback\.select\(\)/);
 assert.match(source,/control_name:"dg-boss-share"/);
 assert.match(source,/module_name:"donjons"/);
 assert.doesNotMatch(source,/itemId|dungeonId|bossName|kill_count|drop_count|searchParams/);
 assert.match(source,/share\.id="dg-boss-share"/);
 assert.match(source,/fallback\.readOnly=true;fallback\.hidden=true/);
 assert.match(src,/function chooseBoss\(i,focus=false\)/);
 assert.match(src,/target\.searchParams\.set\("boss",String\(selectedBoss\+1\)\)/);
});

test("both languages ship matching assets and retain map, boss list and original entrance links",()=>{
 for(const path of ["donjons/index.html","en/donjons/index.html"]){
  const html=read(path);
  assert.match(html,/dungeons\.js\?v=20261125-boss-share1/);
  assert.match(html,/dungeons\.css\?v=20261125-boss-share1/);
  assert.match(html,/id="dg-map"/);
  assert.match(html,/id="dg-bosses"/);
  assert.match(html,/id="dg-directory"/);
  assert.match(html,/id="dg-route"/);
  assert.match(html,/donjon=city-of-dalaran/);
  assert.match(html,/donjon=hall-of-thanes/);
 }
 const css=read("assets/dungeons.css");
 assert.match(css,/\.dg-boss-share-fallback\[hidden\]/);
 assert.match(css,/\.dg-boss-share:focus-visible/);
});
