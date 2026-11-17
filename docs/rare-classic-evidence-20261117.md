# Rare loot: explicit Classic evidence classification — 17 November 2026

Scope: `data/rares.json` only. The previous catalogue already declared `source_version: "classic_reference"` on 77 loot records but did not repeat that classification in the separate `evidence_level` field. The catalogue audit therefore listed them as *unclassified*.

This change copies the **existing source category** into `evidence_level: "classic_reference"` for those 77 records. It is **not** new gameplay evidence. It adds no loot relation, item ID, drop percentage, rare location, icon, observed build, or live acquisition claim.

The source URLs and the historical `chance_classic_percent` values remain untouched. They must **never** be relabelled as Forever drop probabilities. Non-Classic links remain `documented_forever` only when their previous documentary evidence already says so.

Verification: run `node --test tests/rare-classic-evidence-20261117.test.mjs` plus `node scripts/check-forever-evidence.mjs`; the private catalogue auditor should show no loot rows left in the *unclassified* bucket for the current subset. It must still correctly count the 65 level-1–30 rares with **no** documented notable loot rows.

For new data, `source_version` tells which client/reference category the item comes from; `evidence_level` tells what the reference actually proves. A source URL alone does **not** prove in-game drop or drop chance.
