import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const db=JSON.parse(read("data/npcs.json"));
const masters=db.npcs.filter(x=>x.role==="trainer"&&x.trainer_kind==="weapon");
const pairs=[
 ["Woo Ping","alliance","Staves"],["Woo Ping","alliance","Polearms"],
 ["Woo Ping","alliance","One-Handed Swords"],["Woo Ping","alliance","Crossbows"],
 ["Ilyenia Moonfire","alliance","Staves"],["Bixi Wobblebonk","alliance","Crossbows"],
 ["Buliwyf Stonehand","alliance","Guns"],["Buliwyf Stonehand","alliance","One-Handed Maces"],
 ["Sayoc","horde","Staves"],["Hanashi","horde","Staves"],
 ["Ansekhwa","horde","Staves"],["Ansekhwa","horde","Two-Handed Maces"],
 ["Ansekhwa","horde","Guns"],["Archibald","horde","Polearms"],
 ["Archibald","horde","One-Handed Swords"],["Archibald","horde","Crossbows"]
];
test("weapon quick answers are grounded in the eight catalogue weapon masters",()=>{
 assert.equal(masters.length,8);
 for(const [name,faction,skill] of pairs){
   const n=masters.find(x=>x.name===name);
   assert.ok(n,"catalogue master "+name);
   assert.equal(n.faction,faction,name);
   assert.ok(n.weapon_skills?.includes(skill),name+" / "+skill);
   assert.ok(n.zone?.id,"map zone "+name);
   assert.ok(n.coordinates&&Number.isFinite(n.coordinates.x)&&Number.isFinite(n.coordinates.y),name+" waypoint");
 }
});

test("FR/EN guide answers high-intent skills with actionable filter links and genuine sourced rules",()=>{
 for(const [path,locale] of [
  ["en/guides/weapon-masters/index.html","en"],
  ["guides/maitres-armes/index.html","fr"]
 ]){
  const html=read(path);
  assert.equal((html.match(/id="weapon-fast-lookup"/g)||[]).length,1,path);
  const section=html.match(/<section id="weapon-fast-lookup">([\s\S]+?)<\/section>/)?.[1];
  assert.ok(section,"quick lookup block "+path);
  for(const master of ["Woo Ping","Ilyenia Moonfire","Sayoc","Hanashi","Ansekhwa","Bixi Wobblebonk","Buliwyf Stonehand","Archibald"])
    assert.ok(section.includes(master),locale+" "+master);
  for(const skill of ["Staves","Polearms","One-Handed%20Swords"])
    assert.ok(section.includes("weapon="+skill),locale+" "+skill+" filter");
  for(const faction of ["alliance","horde"])
    assert.ok(section.includes("faction="+faction),locale+" "+faction);
  assert.match(section,/wowhead\.com\/forever\/guide\/classes\/weapon-trainer-skill-locations/);
  assert.match(section,/level 20|niveau 20/i);
  assert.match(section,/1 gold|1 pièce d’or/);
  assert.match(section,/level 10|niveau 10/i);
  assert.match(section,/not first-hand|pas une vérification directe/);
  for(const anchor of section.matchAll(/href="([^"]+)"/g)){
    const href=anchor[1].replaceAll("&amp;","&");
    if(!href.startsWith("/"))continue;
    const url=new URL(href,"https://foreveroth.com");
    assert.equal(url.pathname,locale==="en"?"/en/metiers/":"/metiers/");
    assert.equal(url.searchParams.get("type"),"weapon");
    assert.equal(url.hash,"#prof-trainers");
    for(const key of url.searchParams.keys())
      assert.ok(["type","weapon","q","faction"].includes(key),"no stale or private params "+key);
  }
  assert.ok(html.includes('href="https://www.wowhead.com/forever/guide/classes/weapon-trainer-skill-locations"'));
  assert.match(html,/Druids can train polearms|les druides peuvent apprendre les armes d’hast/);
  assert.match(html,/"dateModified":"2026-11-25"/);
  assert.match(html,/Sources reviewed: 25 November 2026|Sources consultées : 25 novembre 2026/);
  assert.match(html,/href="https:\/\/foreveroth\.com\/en\/guides\/weapon-masters\/"|href="https:\/\/foreveroth\.com\/guides\/maitres-armes\/" /);
  assert.match(html,/ne sont pas confirmés directement|not directly verified/);
  const json=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/)[1]);
  const page=json["@graph"].find(x=>x["@type"]==="WebPage");
  const article=json["@graph"].find(x=>x["@type"]==="Article");
  assert.equal(page.inLanguage,locale);
  assert.equal(article.dateModified,"2026-11-25");
  assert.ok(article.citation.includes("https://www.wowhead.com/forever/guide/classes/weapon-trainer-skill-locations"));
  const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert.ok(title&&title.length>45&&title.length<80);
 }
});
