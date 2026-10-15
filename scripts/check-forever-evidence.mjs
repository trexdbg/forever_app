#!/usr/bin/env node
/* Offline provenance checks: node scripts/check-forever-evidence.mjs
   No external API and no scheduled GitHub Action minutes. */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const load = path => JSON.parse(readFileSync(new URL("../" + path, import.meta.url), "utf8"));
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const rares = load("data/rares.json");
const vendors = load("data/npcs.json");
const dungeons = load("data/dungeons-forever.json");
const observed = load("data/bis-niveaux-forever-observed.json");
const details = load("data/dungeon-loot-details.json");

const validUrl = url => typeof url === "string" && /^https:\/\/[^\s/]+\//.test(url);
const betaStatuses = new Set(["forever_beta_community", "forever_beta_wowhead", "forever_beta_cache"]);
const dungeonStatuses = new Set([...betaStatuses, "classic_loot_reference"]);
const rareIds = new Set();
for (const rare of rares.rares) {
  assert.ok(rare.id && !rareIds.has(rare.id), "Missing/duplicate rare ID " + rare.id);
  rareIds.add(rare.id);
  assert.ok(rares.zones[rare.zone], "Unknown rare zone: " + rare.zone);
  if (rare.reference === "new_forever_community_documented_not_gameplay_confirmed") {
    assert.equal(rare.seen_forever, false,
      "Forever documentation is not direct game observation: " + rare.id);
    assert.ok(validUrl(rare.source) && rare.coordinate_status === "documented_forever",
      "New Forever rare must have a named documentary source: " + rare.id);
    assert.ok(rare.point_evidence?.length === rare.points.length,
      "Every new Forever point requires an individually attributed source: " + rare.id);
    for (const point of rare.point_evidence) {
      assert.equal(point.evidence_level, "documented_forever");
      assert.equal(point.evidence_kind, "forever_community_page");
      assert.ok(validUrl(point.evidence_url) && validUrl(point.source_url),
        "Documentary rare point needs a concrete evidence link: " + rare.id);
    }
  } else {
    assert.equal(rare.reference, "classic_cmangos_not_forever_verified",
      "Classic-origin rare must not be called Forever-verified: " + rare.id);
  }
  assert.ok(Array.isArray(rare.points) && Array.isArray(rare.loot));
  for (const p of rare.points) {
    assert.ok(Array.isArray(p) && p.length === 2 && p.every(n => Number.isFinite(n) && n >= 0 && n <= 100),
      "Invalid Classic XY waypoint for " + rare.id);
  }
  if (rare.seen_forever) {
    assert.ok(validUrl(rare.source) && /Forever/i.test((rare.notes?.en || "") + " " + (rare.notes?.fr || "")),
      "Forever sighting needs an explicit source and a cautionary note: " + rare.id);
  }
  for (const loot of rare.loot) {
    assert.ok(["classic_reference", "forever_beta"].includes(loot.source_version),
      "Unknown loot provenance: " + rare.id);
    if (loot.source_version === "classic_reference")
      assert.equal(loot.chance_forever_observed_percent, undefined,
        "Classic rare drop percentage cannot become a Forever observation: " + rare.id);
    else assert.ok(validUrl(loot.item_source_url || loot.source_url),
      "Forever rare loot needs an explicit item source: " + rare.id);
  }
}

let offers = 0, documented = 0;
for (const npc of vendors.npcs) {
  if (npc.role !== "merchant") continue;
  const ids = (npc.offers || []).map(String);
  assert.equal(new Set(ids).size, ids.length, "Duplicate offer: " + npc.name);
  for (const id of ids) {
    offers++;
    assert.ok(vendors.items[id], "Vendor offers nonexistent item: " + npc.name + " / " + id);
    const evidence = npc.offer_details?.[id];
    if (evidence?.verification_status === "forever_documented") {
      documented++;
      assert.ok(validUrl(evidence.source), "Forever vendor claim without source: " + npc.name + " / " + id);
    }
  }
  for (const id of Object.keys(npc.offer_details || {}))
    assert.ok(ids.includes(id), "Vendor evidence without an offered item: " + npc.name + " / " + id);
}
assert.equal(offers, vendors.audit.total_vendor_offers, "Vendor audit total is stale");
assert.equal(documented, vendors.audit.forever_documented_offers, "Forever vendor count is stale");
assert.equal(documented, vendors.verification_audit.forever_sale_count, "Historical vendor count is stale");
assert.equal(offers - documented, vendors.audit.classic_unverified_offers, "Classic/unverified count is stale");

const bossItems = new Map();
for (const dungeon of dungeons.dungeons) for (const boss of dungeon.bosses) {
  for (const loot of boss.loot || []) {
    assert.ok(dungeonStatuses.has(loot.source_status),
      "Missing loot provenance: " + dungeon.id + " / " + boss.name.en);
    if (Number.isSafeInteger(loot.id)) {
      const previous = bossItems.get(loot.id);
      if (previous) {
        // One item may drop from multiple bosses; its equipment level still must agree.
        for (const field of ["itemLevel", "requiredLevel"]) {
          if (previous[field] != null && loot[field] != null)
            assert.equal(loot[field], previous[field], "Conflicting dungeon " + field + " for item " + loot.id);
        }
      } else bossItems.set(loot.id, loot);
    }
  }
}
const byDetails = new Map(details.items.filter(x => Number.isInteger(x.id)).map(x => [x.id, x]));
for (const item of observed.items) {
  assert.equal(item.source_status, "forever_beta_observed", "Mislabelled observed Forever item " + item.id);
  assert.ok(validUrl(item.source_url), "Observed item without source " + item.id);
  for (const record of [byDetails.get(item.id), bossItems.get(item.id)]) {
    if (!record) continue;
    for (const field of ["itemLevel", "requiredLevel"])
      if (item[field] != null && record[field] != null)
        assert.equal(item[field], record[field], "Conflicting " + field + " for Forever item " + item.id);
  }
}

// Protect landing pages against stale/fabricated names after the underlying data changes.
const guideBosses = [
  ["city-of-dalaran", "atrexis-the-grave-knight", "Atrexis the Grave Knight"],
  ["city-of-dalaran", "arcane-anomaly", "Arcane Anomaly"],
  ["city-of-dalaran", "archmage-s-shade", "Archmage's Shade"],
  ["city-of-dalaran", "lyn-the-unheeded", "Lyn the Unheeded"],
  ["ruins-of-lordaeron", "bjork", "Bjork"],
  ["ruins-of-lordaeron", "rath-mael", "Rath'mael"],
  ["ruins-of-lordaeron", "the-baron", "The Baron"],
];
for (const [dungeonId, slug, bossName] of guideBosses) {
  const boss = dungeons.dungeons.find(x => x.id === dungeonId)?.bosses
    .find(x => x.name.en === bossName);
  assert.ok(boss && boss.loot.length, "Missing boss in beta dataset: " + bossName);
  for (const [lang, path] of [
    ["en", "en/guides/forever-boss-" + dungeonId + "-" + slug + "/index.html"],
    ["fr", "guides/boss-forever-" + dungeonId + "-" + slug + "/index.html"],
  ]) {
    const html = read(path);
    const body = html.match(/<table class="geo-table">[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/)?.[1];
    assert.ok(body, "Missing loot table in " + path);
    assert.equal((body.match(/<tr>/g) || []).length, boss.loot.length,
      "SEO guide roster differs from the dungeon: " + path);
    for (const item of boss.loot) {
      const name = item[lang];
      assert.ok(body.includes(name) || body.includes(name.replaceAll("'", "&#39;")),
        "Incorrect beta loot name in " + path + ": " + name);
      if (item.id) assert.ok(body.includes(String(item.id)),
        "SEO guide is missing verified item ID " + item.id + " in " + path);
      if (item.requiredLevel != null)
        assert.ok(body.includes(String(item.requiredLevel)),
          "SEO guide missing documented required level " + item.id + " in " + path);
    }
  }
}
for (const path of ["rare/index.html", "en/rare/index.html"])
  assert.ok(read(path).includes('id="rare-verification"'), "Missing reliable-source filter on " + path);
assert.ok(read("assets/rares.js").includes('verification.value'), "Rare evidence filter disconnected");

console.log("Forever evidence OK:",
  rares.rares.length, "Classic-origin rare references (", rares.rares.filter(x => x.seen_forever).length, "Forever-reported ),",
  documented, "/", offers, "Forever-documented vendor offers,",
  observed.items.length, "beta-reported item records; loot requirements and landing pages consistent.");
