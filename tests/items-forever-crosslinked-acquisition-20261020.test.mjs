import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = name => JSON.parse(readFileSync(new URL("../data/"+name, import.meta.url), "utf8"));
const items = read("items-forever.json").items;
const index = read("item-acquisition-index.json").items;
const byItem = new Map(items.map(x => [x.id, x]));
const byIndex = new Map(index.map(x => [x.id, x]));
const ids = [1965,4854,18610,18612,263015,270227,273023,273028,273047,274068,277213,282716,284174,284287,284386,285269,285328,285331,285345,285346,285350,286533,286534,286537,286746,286749,286750,286755];

test("28 1–30 equipment acquisitions reuse only documented, ID-matched catalogue relations", () => {
  assert.equal(ids.length, 28);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    const item = byItem.get(id);
    assert.ok(item, "Missing editorial item "+id);
    assert.ok(Number.isInteger(item.requiredLevel) && item.requiredLevel <= 30, "Outside beta bracket "+id);
    assert.equal(item.verified_forever, false, "Cross-references must not claim in-game confirmation "+id);
    assert.equal(item.acquisition_evidence_level, "documented_forever");
    const source = item.acquisition_sources;
    const refs = byIndex.get(id)?.sources.filter(x => x.evidence_level === "documented_forever" && ["rare","boss"].includes(x.kind)) || [];
    assert.ok(source?.length, "Missing documentary source "+id);
    assert.deepEqual(
      source.map(x => [x.kind, x.name_en, x.evidence_level, x.source_status, x.source_url]),
      refs.map(x => [x.kind, x.name_en, x.evidence_level, x.source_status, x.reference_url]),
      "Source drift or evidence promotion "+id
    );
    for (const linked of source) {
      assert.ok(linked.source_url.startsWith("https://"), "No URL "+id);
      assert.equal(linked.source_catalogue, "data/item-acquisition-index.json");
      assert.equal(linked.evidence_kind, "existing_catalogue_cross_reference");
      assert.equal(linked.reconciled_at, "2026-10-20");
      assert.equal(linked.chance_forever_observed_percent, undefined, "No invented rate "+id);
      assert.match(linked.evidence_note, /does not independently verify a live Forever drop/);
    }
  }
});

test("unverified Brawler's Leather Helm boss relation is never promoted to Forever", () => {
  const item = byItem.get(252512);
  assert.ok(item);
  assert.ok(!item.acquisition_sources?.length);
  const sources = byIndex.get(252512)?.sources || [];
  assert.ok(sources.length);
  assert.ok(sources.every(x => x.evidence_level === "unverified"));
});
