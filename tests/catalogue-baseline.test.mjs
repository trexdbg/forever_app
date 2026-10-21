import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildFromFiles} from "../scripts/build-item-acquisition-index.mjs";
import {BASELINE as expected} from "./helpers/catalogue-baseline.mjs";

const read = name => JSON.parse(readFileSync(new URL("../data/"+name, import.meta.url), "utf8"));

test("a single deliberately pinned source of truth protects current catalogue counts", () => {
 const rareRows=read("rares.json").rares;
 const items=read("items-forever.json").items;
 const index=read("item-acquisition-index.json");
 const scoped=rareRows.filter(r=>r.beta_level30_in_scope === true);
 const legacy=scoped.filter(r=>r.reference!=="new_forever_community_documented_not_gameplay_confirmed");
 const allLinks=index.items.flatMap(row=>row.sources.map(s=>({id:row.id,...s})));
 assert.equal(rareRows.length,expected.rares.records);
 assert.equal(items.length,expected.editorialItems);
 assert.equal(scoped.length,expected.rares.betaScope);
 assert.equal(scoped.filter(r=>r.loot?.length).length,expected.rares.betaWithLoot);
 assert.equal(scoped.filter(r=>!r.loot?.length).length,expected.rares.betaWithoutLoot);
 assert.equal(legacy.length,expected.rares.legacyScope);
 assert.equal(legacy.filter(r=>r.loot?.length).length,expected.rares.legacyWithLoot);
 assert.equal(legacy.filter(r=>!r.loot?.length).length,expected.rares.legacyWithoutLoot);
 assert.equal(rareRows.reduce((total,r)=>total+(r.loot||[]).length,0),expected.rares.allLootRows);
 assert.equal(index.items.length,expected.index.uniqueItems);
 assert.equal(allLinks.length,expected.index.relations);
 assert.deepEqual(index.totals.by_kind,expected.index.byKind);
 assert.deepEqual(index.totals.by_evidence,expected.index.byEvidence);
 assert.deepEqual(index,buildFromFiles(),"Acquisition index must match its generator exactly");
 const itemIds=new Set([
  ...read("items.json").items.map(i=>i.id),
  ...read("items-classic-cache.json").items.map(i=>i.id),
  ...read("items-forever.json").items.map(i=>i.id),
  ...read("items-forever-cache.json").items.map(i=>i.id),
  ...read("bis-niveaux-forever-observed.json").items.map(i=>i.id),
  ...read("bis-niveaux-classic.json").items.map(i=>i.id)
 ]);
 const evidenceCount=[...itemIds].filter(id=>index.items.some(row=>row.id===id&&row.sources.some(s=>s.evidence_level!=="unverified"))).length;
 assert.equal(evidenceCount,expected.index.itemIdsWithEvidenceInEquipment);
 assert.equal(expected.rares.betaWithLoot+expected.rares.betaWithoutLoot,expected.rares.betaScope);
 assert.equal(Object.values(expected.index.byKind).reduce((a,b)=>a+b,0),expected.index.relations);
 assert.equal(Object.values(expected.index.byEvidence).reduce((a,b)=>a+b,0),expected.index.relations);
});
