import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const target=[
 ["hall-of-thanes",13,18],
 ["ruins-of-lordaeron",15,20],
 ["excavation-site-wetlands",26,31],
 ["city-of-dalaran",28,33]
];

test("four quick routes correspond exactly to distinct, populated Forever dungeon records",()=>{
 const data=JSON.parse(read("data/dungeons-forever.json"));
 const byId=new Map(data.dungeons.map(x=>[x.id,x]));
 assert.equal(new Set(target.map(x=>x[0])).size,4);
 for(const [id,min,max] of target){
  const d=byId.get(id);
  assert.ok(d,id);
  assert.equal(d.type,"forever",id+" is not an unverified Classic dungeon");
  assert.deepEqual(d.level,[min,max]);
  assert.ok(d.bosses.length>0,id+" must have documented boss list");
 }
 const js=read("assets/dungeons.js");
 assert.match(js,/all\.find\(x=>x\.id===q\.get\("donjon"\)\)/);
 assert.match(js,/const planned=/);
});

test("bilingual map shortcuts land in the existing module without inventing loot or status",()=>{
 for(const [file,root] of [["donjons/index.html","/donjons/"],["en/donjons/index.html","/en/donjons/"]]){
  const html=read(file),nav=html.match(/<nav class="dg-shortcuts"[^>]*>[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav,file+" missing quick map nav");
  const links=[...nav.matchAll(/<a href="([^"]+)">([^<]+)<small>([^<]+)<\/small><\/a>/g)];
  assert.equal(links.length,4,file+" quick route count");
  assert.deepEqual(links.map(x=>new URL(x[1],"https://foreveroth.com").searchParams.get("donjon")),target.map(x=>x[0]));
  for(let i=0;i<links.length;i++){
   assert.ok(links[i][1].startsWith(root+"?donjon="));
   assert.equal(links[i][3],target[i][1]+"–"+target[i][2]);
  }
  assert.match(html,/dungeons\.css\?v=20261125-boss-share1/);
  assert.ok(html.indexOf('class="dg-shortcuts"')<html.indexOf('class="dg-controls"'),"shortcuts above filters");
  assert.ok(!/Boss loot confirmed|Butin confirmé/.test(nav));
 }
 const css=read("assets/dungeons.css");
 assert.match(css,/\.dg-shortcuts>a:focus-visible/);
 assert.match(css,/@media\(max-width:650px\)/);
});
