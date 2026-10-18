# Rare loot icon evidence — 18 October 2026

Scope: **display-only** icon names for existing rare loot, not item stats, rare presence, spawn points, loot rates, drop evidence or gameplay verification. This change does not edit `data/rares.json`; the ongoing Brokespear PR #82 remains independent.

## ID-matched references checked

| Existing rare | Existing item ID | Icon name | Reference | Evidence scope |
| --- | ---: | --- | --- | --- |
| Timber | 1965, White Wolf Gloves | `inv_gauntlets_05` | https://www.wowhead.com/classic-ptr/item=1965/white-wolf-gloves | Wowhead Classic PTR Quick Facts lists this icon for item 1965; not checked as an unchanged icon on a Forever build. |
| Gibblewilt | 10553, Foreman Vest | `inv_shirt_05` | https://www.wowhead.com/mop-classic/item=10553/foreman-vest | Wowhead Mists Classic Quick Facts lists this icon for item 10553; artwork reference only, not a current Forever drop assertion. |

The Classic PTR/Mists pages are used **exclusively for icon identity**; they do not establish Forever item statistics, rare-spawn coordinates or drops. For the remaining records without an ID-attributed icon, retain the neutral placeholder instead of guessing. A future client/Forever screenshot can supersede a Classic icon match if it differs.

## Validation and before/after

- Existing catalog: 114 rare loot links; 30 entries without their own `icon` field.
- Existing display map covers 12 of those 30; after adding two Classic graphic references, 14/30 have a display mapping, leaving 16 without an attributed icon (neutral fallback).
- Both language variants reference the new JavaScript cache key `20261018-loot-icons-2`; stylesheet is unchanged.
- Automated PR quality gate now includes `tests/rare-loot-icon-rendering-20261017.test.mjs`; before this fix the test existed but was not executed in this workflow.
- The regression test asserts exact item IDs/icon names, CDN URLs and the unknown/unsafe-image fallback.
- No sync, deployments, indexing rebuild or data classification changes.

Rollback: revert this PR. Existing `data/rares.json` content and acquisition relations are unaffected.
