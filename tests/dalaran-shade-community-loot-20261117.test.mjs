import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const db=JSON.parse(read("data/dungeons-forever.json"));
const b=db.dungeons.find(x=>x.name?.en==="City of Dalaran")?.bosses.find(x=>x.name?.en==="Archmage's Shade");
const counts=new Map([[251961,[1399,41]],[273049,[1193,35]],[273052,[1078,31]],[273051,[1025,30]],[273103,[234,7]]]);
const source="https://www.wowhead.com/forever/npc=246020/shade-of-the-archmage";

test("every Shade of Archmage item has documented explicit boss-pair evidence, not a guaranteed rate",()=>{
 assert.ok(b,"Shade of Archmage boss present");
 assert.equal(b.loot.length,5);
 assert.deepEqual(new Set(b.loot.map(x=>x.id)),new Set(counts.keys()));
 for(const i of b.loot){
  assert.equal(i.evidence_level,"documented_forever");
  assert.equal(i.live_observation.kill_count,3425);
  assert.equal(i.live_observation.drop_count,counts.get(i.id)[0]);
  assert.equal(i.live_observation.observed_percent_rounded,counts.get(i.id)[1]);
  assert.equal(i.live_observation.observed_at,"2026-11-17");
  assert.equal(i.live_observation.source_url,source);
  assert.match(i.live_observation.note,/not a guaranteed|Not a guarantee|not guaranteed/i);
  assert.equal(i.chance_forever_observed_percent,undefined,"never reinterpret community report as certified rate");
  assert.ok(i.source_url?.startsWith("https://"));
  assert.ok(i.evidence_url?.startsWith("https://"));
 }
 const quest=b.loot.find(x=>x.id===251961);
 assert.equal(quest.fr,"Arcane Mote");
 assert.match(quest.slot,/Quest item/);
 assert.equal(quest.evidence_kind,"forever_community_page");
 for(const id of [273103,251961]){
  const i=b.loot.find(x=>x.id===id);
  assert.ok(i.evidence_note.includes("Archmage's Shade"));
  assert.ok(i.evidence_note.includes(i.en));
  assert.equal(i.loot_attribution_status,"boss_item_pair_documented_forever");
 }
 assert.ok(b.loot.find(x=>x.id===273051).chanceReported>0,
   "old beta estimate is retained separately from new sample");
});

test("acquisition index preserves real boss/item evidence and remains deterministic",()=>{
 const index=JSON.parse(read("data/item-acquisition-index.json"));
 for(const id of [273103,251961]){
  const sources=index.items.find(x=>x.id===id)?.sources || [];
  const boss=sources.find(x=>x.name_en==="Archmage's Shade");
  assert.ok(boss,"boss reference "+id);
  assert.equal(boss.evidence_level,"documented_forever");
  assert.equal(boss.source_status,"forever_documented_boss_loot");
  assert.equal(boss.reference_url,source);
 }
 assert.equal(index.totals.unique_items,759);
 assert.equal(index.totals.relations,1285);
 assert.equal(index.totals.by_evidence.unverified,20);
});

test("read-only client labels community sample and beta guide estimates separately",()=>{
 const js=read("assets/dungeons.js");
 assert.doesNotThrow(()=>new Script(js));
 assert.match(js,/const liveSample=item=>/);
 assert.match(js,/Player reports:/);
 assert.match(js,/Beta estimate:/);
 assert.match(js,/not a guaranteed drop chance/);
 assert.match(js,/observed\.drop_count/);
 assert.match(js,/observed\.kill_count/);
 assert.match(js,/observed\?observed.source_url:item.evidence_url/);
});

test("FR and EN shade guide answer the search with 5 items and evidence transparency",()=>{
 const paths=[
  "guides/boss-forever-city-of-dalaran-archmage-s-shade/index.html",
  "en/guides/forever-boss-city-of-dalaran-archmage-s-shade/index.html"
 ];
 for(const path of paths){
  const html=read(path);
  assert.match(html,/3,425|3 425/);
  assert.match(html,/17 novembre 2026|17 November 2026/i);
  assert.match(html,/5 butins|5 documented WoW Forever drops/i);
  assert.match(html,/<table class="geo-table">/);
  assert.match(html,/248\d{3}|273103/);
  assert.match(html,/251961/);
  assert.match(html,/273049/);
  assert.match(html,/273051/);
  assert.match(html,/273052/);
  assert.match(html,/3,425 · 41%/);
  assert.ok(html.includes(source));
  assert.match(html,/href="\/en\/donjons\/\?donjon=city-of-dalaran&amp;boss=8"|href="\/donjons\/\?donjon=city-of-dalaran&amp;boss=8"/);
  assert.match(html,/non garanti|not guaranteed|ne garantissent/i);
  assert.doesNotMatch(html,/3 \/ 4|1 association remains unverified|1 attribution reste à vérifier/);
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
  assert.equal(schema["@graph"].find(x=>x["@type"]==="Article")?.dateModified,"2026-11-17");
  assert.match(html,/hreflang="fr"/);
  assert.match(html,/hreflang="en"/);
 }
});
