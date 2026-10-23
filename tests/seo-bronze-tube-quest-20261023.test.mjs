import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {existsSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const crafting=JSON.parse(read("data/crafting-chains-beta.json"));
const vendors=JSON.parse(read("data/npcs.json"));
const questUrl="https://www.60.tools/quests/174-look-to-the-stars";
const spellUrl="https://www.wowhead.com/forever/spell=3938/bronze-tube";
const reference="https://wowforevertalents.com/professions/engineering/parts/";
const paths=[
 {lang:"fr",file:"guides/tube-en-bronze/",vendorBase:"/marchands/",recipe:"/metiers/?craft=4371"},
 {lang:"en",file:"en/guides/bronze-tube/",vendorBase:"/en/marchands/",recipe:"/en/metiers/?craft=4371"}
];
const sellers=[
 ["Herble Baubbletump","duskwood",77,48],
 ["Billibub Cogspinner","stormwind",62.5,30.5],
 ["Gearcutter Cogspinner","ironforge",68.2,44.2],
 ["Sovik","orgrimmar",75.6,25.2],
 ["Gagsprocket","barrens",62.6,36.2]
];
const fmt=n=>n.toFixed(1);

test("Bronze Tube has a source-attributed Forever quest use, not a proven completed quest",()=>{
 const item=crafting.items["4371"],r=crafting.recipes.find(x=>x.spell_id===3938);
 assert.equal(item.id,4371);
 assert.equal(item.evidence_level,"datamined");
 assert.equal(item.quest_uses.length,1);
 const q=item.quest_uses[0];
 assert.equal(q.quest_id,174);
 assert.equal(q.item_quantity,1);
 assert.equal(q.faction,"alliance");
 assert.equal(q.quest_level,25);
 assert.equal(q.minimum_character_level,20);
 assert.deepEqual(q.questgiver_waypoint,{x:79.8,y:48});
 assert.equal(q.source_url,questUrl);
 assert.equal(q.observed_build,"1.60.1.70245");
 assert.equal(q.evidence_level,"documented_forever");
 assert.equal(q.evidence_kind,"forever_community_page");
 assert.match(q.status,/not_gameplay_verified/);
 assert.match(q.evidence_note,/does not prove/);
 assert.deepEqual(r.ingredients,[{item_id:2841,quantity:2},{item_id:2880,quantity:1}]);
 assert.equal(r.output_item_id,4371);
 assert.equal(r.skill_required,105);
 assert.equal(r.learning.available_in_game,null);
 assert.equal(r.output_quantity,null);
 assert.equal(r.output_quantity_status,"conflicting_sources");
 assert.deepEqual(r.output_quantity_candidates.map(x=>x.quantity).sort(),[1,2]);
 assert.ok(r.output_quantity_candidates.some(x=>x.source_url===spellUrl));
 assert.ok(r.output_quantity_candidates.some(x=>x.source_url===reference));
});

test("all five highlighted Classic merchants actually exist and sell item 4371 in the source catalogue",()=>{
 const all=vendors.npcs.filter(n=>n.role==="merchant" && n.offers.includes("4371"));
 assert.equal(all.length,16);
 for(const [name,zone,x,y] of sellers){
  const matches=all.filter(n=>n.name===name);
  assert.equal(matches.length,1,name);
  const n=matches[0];
  assert.equal(n.zone.id,zone);
  assert.deepEqual(n.coordinates,{x,y});
  assert.equal(n.coordinate_status,"classic_reference_unverified");
  assert.notEqual(n.offer_details?.["4371"]?.verification_status,"forever_documented");
 }
 assert.equal(vendors.items["4371"].supply,"limited");
 assert.equal(vendors.items["4371"].vendor_stock,2);
 assert.equal(vendors.items["4371"].vendor_price_copper,800);
});

test("both crawlable articles answer quest/vendor/craft searches and keep provenance separated",()=>{
 for(const {lang,file,vendorBase,recipe} of paths){
  assert.ok(existsSync(new URL("../"+file+"index.html",import.meta.url)),file);
  const html=read(file+"index.html");
  const title=html.match(/<title>([^<]+)<\/title>/)?.[1]||"";
  const desc=html.match(/<meta name="description" content="([^"]+)"/)?.[1]||"";
  const h1=html.match(/<h1>([^<]+)<\/h1>/)?.[1]||"";
  const ld=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]||"null");
  const graph=ld["@graph"]||[];
  const article=graph.find(x=>x["@type"]==="Article");
  const page=graph.find(x=>x["@type"]==="WebPage");
  const faq=graph.find(x=>x["@type"]==="FAQPage");
  assert.ok(title.length>=35&&title.length<=85,file+" title");
  assert.ok(desc.length>=90&&desc.length<=185,file+" description");
  assert.match(title,/Forever/,file+" brand intent");
  assert.match(desc,/4371/);
  assert.equal(article.headline,h1);
  assert.equal(article.description,desc);
  assert.equal(page.description,desc);
  assert.equal(article.dateModified,"2026-10-23");
  assert.equal(article.inLanguage,lang);
  assert.ok(article.citation.includes(questUrl));
  assert.ok(article.citation.includes(spellUrl));
  assert.ok(article.citation.includes(reference));
  assert.equal(faq.mainEntity.length,3);
  for(const question of faq.mainEntity){
   assert.ok(html.includes("<h2>"+question.name+"</h2>"),file+" FAQ not visible");
   assert.ok(question.acceptedAnswer.text.length>40);
  }
  assert.ok(html.includes('rel="canonical" href="https://foreveroth.com/'+file+'"'));
  for(const other of paths){
   assert.ok(html.includes('hreflang="'+other.lang+'" href="https://foreveroth.com/'+other.file+'"'));
  }
  assert.ok(html.includes('href="'+recipe+'"'),file+" craft link");
  assert.ok(html.includes('href="'+vendorBase+'?q=4371"'),file+" full seller index");
  assert.ok(html.includes(questUrl));
  assert.ok(html.includes(spellUrl));
  assert.ok(html.includes(reference));
  assert.ok(html.includes("3938")&&html.includes("105")&&html.includes("2841")&&html.includes("2880"));
  assert.ok(html.includes("79.8 / 48.0"),file+" quest giver");
  assert.ok(html.includes("2")&&html.includes("1"),file+" conflicting yields");
  assert.ok(/Classic/.test(html),file+" historical vendor provenance");
  assert.ok(/(?:not verified|unconfirmed|non confirm|n'est pas vérifi|non vérifié|inconnu)/i.test(html));
  const table=html.match(/<table class="geo-table">([\s\S]*?)<\/table>/)?.[1]||"";
  assert.equal((table.match(/<tr><th scope="row">/g)||[]).length,5,file+" vendor rows");
  for(const [name,zone,x,y] of sellers){
   assert.ok(table.includes(name));
   assert.ok(table.includes(fmt(x)+" / "+fmt(y)));
   assert.ok(table.includes("?q="+encodeURIComponent(name)+"&amp;zone="+zone));
  }
 }
});
