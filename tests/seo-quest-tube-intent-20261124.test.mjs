import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const examples=[
  {lang:"en",quest:"en/guides/quest-rewards-the-wrath-of-rath-mael/index.html",
   tube:"en/guides/bronze-tube/index.html",root:"/en/"},
  {lang:"fr",quest:"guides/recompenses-quete-the-wrath-of-rath-mael/index.html",
   tube:"guides/tube-en-bronze/index.html",root:"/"}
];

test("quest 92422 links directly to an actual Rath'mael boss, without linking to Classic quest module",()=>{
 const atlas=JSON.parse(read("data/dungeons-forever.json"));
 const dungeon=atlas.dungeons.find(x=>x.id==="ruins-of-lordaeron");
 assert.ok(dungeon);
 assert.equal(dungeon.bosses[4].name.en,"Rath'mael");
 const routes=read("assets/dungeons.js");
 assert.match(routes,/q\.get\("donjon"\)/);
 assert.match(routes,/q\.get\("boss"\)/);
 for(const {lang,quest,root} of examples){
  const html=read(quest);
  const link=root+"donjons/?donjon=ruins-of-lordaeron&amp;boss=5";
  assert.ok(html.includes(link),lang+" boss route");
  assert.ok(html.match(new RegExp(link.replaceAll("?","\\?").replaceAll("&","&"),"g")).length>=2);
  assert.ok(!html.includes(root+"quetes/?"),lang+" must not claim a Forever quest route");
  assert.match(html,/Rear Guard Patrol/);
  assert.match(html,/Deathguard Kristof/);
  assert.match(html,/251533/);
  assert.match(html,/251534/);
  assert.match(html,/not a guarantee|pas d'une garantie/);
  const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
  const h1=html.match(/<h1>([^<]+)<\/h1>/)?.[1];
  const description=html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert.ok(title.includes("92422")&&title.includes("WoW Forever"),lang+" title");
  assert.ok(h1.includes("92422"),lang+" visible heading");
  assert.ok(description.includes("92422")&&description.length>90&&description.length<185);
  const ld=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]);
  const article=ld["@graph"].find(x=>x["@type"]==="Article");
  const page=ld["@graph"].find(x=>x["@type"]==="WebPage");
  assert.equal(article.headline,h1.replaceAll("&#39;","'"));
  assert.equal(page.name,article.headline);
  assert.equal(article.description,description);
  assert.equal(article.dateModified,"2026-11-24");
 }
});

test("Bronze Tube guide exposes direct vendor and recipe CTAs without changing sourced craft facts",()=>{
 const db=JSON.parse(read("data/crafting-chains-beta.json"));
 const recipe=db.recipes.find(x=>x.spell_id===3938);
 assert.equal(recipe.output_item_id,4371);
 assert.equal(recipe.output_quantity,null,"yield remains disputed");
 for(const {lang,tube,root} of examples){
  const html=read(tube);
  const nav=html.match(/<nav class="geo-quick-links"[^>]*>[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav,lang+" quick actions");
  assert.ok(nav.includes('href="'+root+'marchands/?q=4371"'),lang+" vendor CTA");
  assert.ok(nav.includes('href="'+root+'metiers/?craft=4371"'),lang+" recipe CTA");
  for(const anchor of ["tube-nearby","tube-recipe","tube-vendors"]){
    assert.ok(nav.includes('href="#'+anchor+'"')&&html.includes('id="'+anchor+'"'));
  }
  assert.match(html,/Classic/);
  assert.match(html,/4371/);
  assert.match(html,/3938/);
  assert.match(html,/disputed|conflicting|incertaine|uncertain|inconnu/i);
 }
});
