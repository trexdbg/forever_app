# Data quality and evidence policy — ForEveroth

Scope: `trexdbg/forever_app` (published JSON and client) and `trexdbg/forever_agent` (collection/import tools). This is a review contract, **not** a database migration or UI feature.

## Record classification (authoritative shared vocabulary)

| `evidence_level` | Meaning | Minimum acceptable evidence | Not implied |
| --- | --- | --- | --- |
| `confirmed_in_game` | Personally observed, or a traceable first-hand capture, in WoW Forever | Build or dated test, who/how, screenshot/video/log or equivalent verifiable report, precise claim and scope | Permanent availability, same behavior on all builds |
| `documented_forever` | Forever-specific announcement/page or attributed third-party Forever report | Exact URL, publisher and ideally publication date/build; quote the *specific* claim supported | Personally verified in-game drop/location |
| `datamined` | Forever-client data/cache/DB2/addon observation | Dataset URL/commit/hash, build, extraction method and mapping | Spawn, obtainable item, vendor sale, drop chance |
| `classic_reference` | Classic/Vanilla or Classic-era source | Source URL, edition/version and context | Same facts on Forever |
| `unverified` | Missing, indirect, conflicting or ambiguous evidence | Keep the record, document gaps, avoid unqualified assertions | That the data is false |

Existing `source_status` values (`classic_reference`, `forever_beta_observed`, `forever_beta_community`, `forever_beta_60tools`, `forever_beta_cache`, `wowhead_forever_reference`, etc.) are **not** replaced in this phase. They are legacy descriptors, not interchangeable proof categories. `forever_beta_observed` from a community sheet is *documented Forever* pending a traceable first-hand capture; client/60.tools rows are *datamined*. Never infer `confirmed_in_game` from `verified: true` (may refer to Classic ID or translation), a Forever URL, a community article, a mapped location, or `seen_forever` without linked observation.

## Provenance contract for new facts

Prefer structured source evidence **per claim**, not a global "source" paragraph:
```json
{
  "evidence_level": "documented_forever",
  "source_kind": "community_guide",
  "source_url": "https://example.org/source-of-this-specific-claim",
  "observed_build": null,
  "observed_at": null,
  "verification_note": "Guide attributes an item to a boss; not verified in-game."
}
```
The URL above is an *illustrative placeholder*, never publish it as factual evidence. Any in-game claim must reference a real capture and identify the tested build/date. Keep location coordinate systems explicit: zone-local Classic percentages differ from Forever client UiMapID coordinates. For stock and respawn, record date, observation method and whether estimates are Classic-only. For translations verify by game/client locale ID; do not invent a French string.

## Automated gate
`node scripts/check-data-quality.mjs` scans key JSON catalogues offline for invalid JSON, missing data files, duplicate item/dungeon/rare IDs, impossible levels/timers/percentage coordinates, item links with mismatched IDs, conflicting Classic/Forever verification labels, missing positions/IDs, uncertain loot attribution and inadequate traceable provenance. `--json` writes a machine-readable issue report. `--fail-on-warnings` is an optional *review escalation*; legacy warnings are deliberately not CI-blocking. Structural errors cause nonzero exit. Test fixtures exercise deliberate bad/good examples.

The PR-only workflow uses minutes only on QA-related changes; no scheduled job and no publishing permissions. This validator is an initial **heuristic audit** (no live server confirmation, no HTTP fetch, and no guarantee every cross-file relation is correct). The categories reflect source type, not a certainty percentage.

## Initial remediation queue (do not edit source catalogues as part of this PR)
1. P0: Resolve misleading Classic-vs-Forever labels and formalize game evidence; ensure item URL `/forever/` does not upgrade Classic records.
2. P1: Investigate the 159/354 rares without map points before claiming map completeness. Keep rare records and flag positions as missing.
3. P1: Resolve 329/357 NPC records with missing numeric IDs where reliable IDs exist. Never guess IDs from names.
4. P1: Attribute individual beta-dungeon loot drops to evidence of **boss attribution**, not merely an item catalogue page; `forever_beta_community` is not game confirmation.
5. P2: Bring imports and translations under consistent provenance reporting; track evidence freshness per beta build.

## Classic quest module preservation
`data/quests/manifest.json` points to `trexdbg/vanilla-questing` (Classic MIT routes). The datasets and public Classic quest journey **must remain intact**. No Forever quest route or UI activation. Testing the provenance manifest must never rewrite it.

Owner acceptance required before merging to `main`, deploying, enabling any new module, bulk migration, or mass deletion.
