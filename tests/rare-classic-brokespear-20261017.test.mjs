import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";

const read=path=>JSON.parse(readFileSync(new URL("../data/"+path,import.meta.url),"utf8"));
const rares=read("rares.json"),idx=read("item-acquisition-index.json");

test("Brokespear Classic identity, French translation and singular equipment drop have exact IDs",()=>{
 const rare=rares.rares.find(r=>r.id==="barrens-brokespear");
 assert.ok(rare);
 assert.equal(rare.name.en,"Brokespear");
 assert.equal(rare.name.fr,"Brise-épieu");
 assert.equal(rare.name_fr_status,"classic_reference");
 assert.equal(rare.location_review.classic_numeric_id_reference,5838);
 assert.equal(rare.location_review.identity_status,"classic_numeric_id_reference_only");
 assert.equal(rare.loot.length,1);
 assert.equal(rare.loot_coverage,"notable_only_not_complete");
 const item=rare.loot[0];
 assert.equal(item.item_id,7559);
 assert.equal(item.name.fr,"Canne runique");
 assert.equal(item.name.en,"Runic Cane");
 assert.equal(item.item_level,17);
 assert.equal(item.required_level,12);
 assert.equal(item.stats.en,"+3 Stamina");
 assert.equal(item.source_version,"classic_reference");
 assert.equal(item.evidence_level,"classic_reference");
 assert.equal(item.evidence_kind,"classic_database");
 assert.match(item.source_url,/wowhead\.com\/classic\/item=7559/);
 assert.match(item.name_fr_source_url,/wowhead\.com\/classic\/fr\/items/);
 assert.equal(item.chance_classic_percent,null);
 assert.equal(item.chance_forever_observed_percent,undefined);
 assert.equal(rare.seen_forever,false);
 assert.equal(rare.location_review.location_status,"classic_reference");
});

test("Classic Brokespear reference is searchable but never classified as documented Forever",()=>{
 assert.deepEqual(idx,buildFromFiles());
 const entry=idx.items.find(i=>i.id===7559);
 assert.ok(entry);
 assert.equal(entry.sources.length,1);
 assert.equal(entry.sources[0].kind,"rare");
 assert.equal(entry.sources[0].name_fr,"Brise-épieu");
 assert.equal(entry.sources[0].evidence_level,"classic_reference");
 assert.equal(entry.sources[0].source_status,"classic_rare_loot_reference");
 assert.equal(entry.sources[0].href,"/rare/?zone=barrens&q=Brokespear&level=all");
 assert.equal(idx.totals.unique_items,731);
 assert.equal(idx.totals.by_kind.rare,115);
 assert.equal(idx.totals.by_evidence.classic_reference,768);
});
