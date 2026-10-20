# Brokespear / Brise-épieu — Classic fallback (17 October 2026)

Scope: rare catalogue and the read-only item acquisition index; no Forever quest activation, no sync or change to spawn locations.

## Reviewed evidence
- Classic English item #7559: https://www.wowhead.com/classic/item=7559/runic-cane — Runic Cane, item level 17, requires level 12, +3 Stamina, held off-hand. Classic page explicitly lists Brokespear as the drop source.
- Classic French NPC #5838: https://www.wowhead.com/classic/fr/npc=5838/brise-%C3%A9pieu — French name **Brise-épieu** for Brokespear, rather than former unsourced **Lance-brisée**.
- Classic French off-hand item list: https://www.wowhead.com/classic/fr/items/armor/off-hand-frills/min-req-level:1/max-req-level:20 — **Canne runique**, level 17 / required level 12.

## Scope and uncertainty
The Brokespear → Runic Cane loot attribution, Classic FR localization, map coordinate and historical item statistics are **Classic reference only**. A separate **Forever-documented server-sent item snapshot** (ilvl 19, required 14, +3 Stamina) comes from Forever Codex (beta build 1.60.1.70245; https://forever-codex.com/items/?id=7559) and is independently corroborated by The Forever Era (server beta build 70058, 30 September 2026; https://theforeverera.com/en/items/7559/). Neither source verifies the drop from Brokespear on Forever, the creature location or availability in current gameplay. Classic percentage remains null; Forever percentage is omitted and the Classic coordinate is untouched. Retail and other expansions display different item statistics and must not be substituted for Classic / Forever.

## Counts
Before: 378 rare records; 161 in beta level-30 scope, 77 with loot, 84 without. Index: 730 unique item IDs, 1,256 relations, including 114 rare relations.
After: unchanged 378 total and 161 in beta scope; **78 with loot, 83 without**, plus one Classic-only ID 7559; index **731 IDs / 1,257 relations / 115 rare relations**. Existing documented Forever relations unchanged.

Check: `node scripts/build-item-acquisition-index.mjs --check`, `node --test tests/rare-classic-brokespear-20261017.test.mjs tests/item-acquisition-index.test.mjs tests/rare-forever-gear-wave5-20261016.test.mjs`, `node scripts/check-data-quality.mjs`, `node --test tests/data-quality.test.mjs`. Rollback: revert the PR; the index is reproducible.
