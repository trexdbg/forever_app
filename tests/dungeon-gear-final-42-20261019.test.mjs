import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const audit=JSON.parse(read("data/dungeon-gear-audit-20261019.json"));
const all=audit.items;
const legacy=all.filter(x=>x.source_status==="forever_beta_server_reported");
const fresh=all.filter(x=>x.source_status==="forever_beta_community_item_page");
const ids=[2280,2816,3078,5194,6318,6472,6679,6681,6682,6685,6686,6690,6696,6697,6902,6903,6905,6906,6907,6908,6909,6911,7230,7682,7683,7684,7687,7688,7690,7691,7708,7709,9444,9445,9450,9452,9453,9455,9459,11121,11982,274291];
const byId=new Map(all.map(x=>[x.id,x]));
const sources=all.flatMap(x=>x.acquisition_sources||[]);
test("all 82 audited dungeon item IDs have distinct evidence; 42 new profiles and no metadata gaps",()=>{
 assert.equal(audit.counts.original_reference_rows,83);
 assert.equal(audit.counts.unique_item_ids,82);
 assert.equal(all.length,82);
 assert.equal(legacy.length,40);
 assert.equal(fresh.length,42);
 assert.equal(new Set(ids).size,42);
 assert.equal(new Set(all.map(x=>x.id)).size,82);
 assert.deepEqual(fresh.map(x=>x.id).sort((a,b)=>a-b),[...ids].sort((a,b)=>a-b));
 assert.equal(audit.counts.metadata_vetted,82);
 assert.equal(audit.counts.metadata_pending,0);
 assert.ok(all.every(x=>x.audit_status==="ready_for_catalogue"));
});
test("individual ForeverChanges pages support exactly the item's metadata, not proof of live drop",()=>{
 for(const x of fresh){
  assert.equal(x.source_url,"https://foreverchanges.pro/item/"+x.id);
  assert.equal(x.evidence_url,x.source_url);
  assert.equal(x.url,x.source_url);
  assert.equal(x.evidence_level,"documented_forever");
  assert.equal(x.evidence_kind,"forever_community_page");
  assert.equal(x.verified_forever,false);
  assert.equal(x.audited_at,"2026-10-19");
  assert.equal(x.reviewed_at,"2026-10-19");
  assert.equal(x.observed_at,"2026-10-19");
  assert.match(x.observed_build,/^1\.60\.1\.70\d+$/);
  assert.match(x.evidence_note,/does not independently prove a live server drop or chance/);
  assert.equal(typeof x.name,"string");
  assert.ok(x.name.trim());
  assert.ok(["rare","uncommon","common"].includes(x.quality));
  assert.ok(["head","shoulders","back","chest","wrist","hands","waist","legs","feet","mainhand","offhand","ranged","finger1"].includes(x.slot));
  assert.ok([null,"cloth","leather","mail","plate"].includes(x.armorType));
  assert.ok(Number.isInteger(x.itemLevel)&&x.itemLevel>0);
  assert.ok(Number.isInteger(x.requiredLevel)&&x.requiredLevel>0&&x.itemLevel>=x.requiredLevel);
  assert.ok(x.origin_fr&&x.origin_en&&x.dungeon_id);
  assert.ok(!Object.hasOwn(x,"chance_forever_percent"));
 }
 const quality={};for(const x of all)quality[x.quality]=(quality[x.quality]||0)+1;
 assert.deepEqual(quality,{rare:79,uncommon:2,common:1});
 for(const id of [6679,11982])assert.equal(byId.get(id).quality,"uncommon");
 assert.equal(byId.get(9444).quality,"common");
 assert.equal(byId.get(274291).requiredLevel,31);
});
test("all quoted percentages carry an explicit source type; no number is an asserted Forever probability",()=>{
 const classic=sources.filter(s=>Number.isFinite(s.classic_drop_chance_percent));
 const community=sources.filter(s=>Number.isFinite(s.community_reported_chance_percent));
 assert.equal(classic.length,43);
 assert.equal(community.length,30);
 assert.equal(audit.counts.classic_1_12_odds_documented,43);
 assert.equal(audit.counts.community_indicative_odds_documented,30);
 for(const s of sources){
  assert.equal(s.kind,"boss");
  assert.match(s.source_url,/^https:\/\//);
  assert.equal(s.source_url,s.evidence_url);
  assert.ok(Number.isFinite(s.classic_drop_chance_percent)!==Number.isFinite(s.community_reported_chance_percent));
  assert.ok(!Object.hasOwn(s,"chance_forever_percent"));
  assert.ok(!Object.hasOwn(s,"drop_chance_percent"));
  assert.match(s.evidence_note,/NOT a verified Forever drop|not a verified Forever drop|not independently validated for WoW Forever/i);
 }
 for(const s of community){
  assert.equal(s.evidence_level,"documented_forever");
  assert.match(s.evidence_note,/no statistical sample size is provided/);
 }
 for(const s of classic)assert.equal(s.evidence_level,"classic_reference");
 const skull=byId.get(274291);
 assert.equal(skull.acquisition_sources[0].community_reported_chance_percent,34);
 assert.equal(skull.acquisition_sources[0].classic_drop_chance_percent,undefined);
});
test("unsupported Cookie drop and conflicting Ghamoo-ra percentages are not shown as established chances",()=>{
 const band=byId.get(11982),tortoise=byId.get(6907);
 assert.equal(band.suppress_indexed_source,true);
 assert.equal(band.acquisition_sources,undefined);
 assert.match(band.source_discrepancy_fr,/Cookie/);
 assert.match(band.source_discrepancy_en,/Cookie/);
 assert.ok(tortoise.rate_conflict);
 assert.equal(tortoise.acquisition_sources,undefined);
 assert.match(tortoise.rate_conflict.note_fr,/37.*40/);
 assert.match(tortoise.rate_conflict.note_en,/37.*40/);
 assert.equal(audit.counts.unresolved_source_discrepancies,2);
});
test("FR/EN interface distinguishes Classic, indicative community sources and unsupported boss leads",()=>{
 const code=read("assets/items-v3.js");
 assert.match(code,/function indexedSources\(item\)/);
 assert.match(code,/if\(item\.suppress_indexed_source\)return \[\]/);
 assert.match(code,/item\.suppress_indexed_source\?\[\]/);
 assert.match(code,/community_reported_chance_percent/);
 assert.match(code,/const sourceRate=source=>classicRate\(source\)\|\|communityRate\(source\)/);
 assert.match(code,/if\(disputedRate\|\|disputedSource\)/);
 assert.match(code,/20261019-all82/);
 assert.match(code,/i\.source_status==="forever_beta_community_item_page"/);
 assert.match(code,/i\.source_status==="forever_beta_server_reported"/);
 assert.match(code,/\["common","uncommon","rare"\]/);
 for(const path of ["equipements/index.html","en/equipements/index.html"]){
  assert.ok(read(path).includes("items-v3.js?v=20261019-acquisition-unknown"),path);
 }
});
