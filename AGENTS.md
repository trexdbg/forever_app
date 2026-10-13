# AGENTS.md — ForEveroth data reliability contract

Applies to **all agents** editing this repository and to collaboration with `trexdbg/forever_agent`. Priority: **reliability over coverage**.

## Non-negotiable rules
1. Do not invent IDs, names, translations, level requirements, coordinates, vendor stock, spawn timers, loot tables, drop rates or evidence. Unknown is not zero and absence in a client dump is not proof of removal.
2. **Classic is not Forever.** A Classic item, quest, NPC or loot reference cannot be presented as verified in WoW Forever. A Forever client row proves client presence only, not that the content is available in game.
3. Preserve `data/quests/**`, its live Classic quest module, links and behavior completely. The **Classic quests module must remain accessible and working**. Do not enable, create links to, or activate a Forever quest module.
4. Never remove an unverified record solely due to missing confirmation; mark/report its uncertainty and open follow-up evidence work.
5. Do not alter design, CSS, layouts, user-facing UI, or live data in a data-quality-only mission.
6. Never commit straight to `main`; use a uniquely named feature branch, run checks, open a PR. Never merge or deploy without explicit owner approval.
7. Do not schedule expensive CI: prefer PR-path-scoped, offline checks; never trigger any sync, publishing, or website deployment from QA.
8. Multi-agent coordination: one change owner per file; inspect existing PRs and recent changes before writing; keep scoped diffs, avoid rewriting or force-pushing others' branches. Cite original evidence and describe uncertainty and conflicts in PRs.

## Shared evidence taxonomy (see docs/data-quality.md)
- `confirmed_in_game`: first-hand, attributable Forever in-game evidence tied to a build/date; not inferred from a database.
- `documented_forever`: identifiable Forever official/community page or directly attributed report; page alone does not prove live availability.
- `datamined`: Forever client DB2, add-on/cache/archive, build-pinned extraction; availability/loot not established.
- `classic_reference`: Classic/Vanilla, including translations and routes; not verified in Forever.
- `unverified`: evidence missing, ambiguous or conflicting; retain the record with caveat.

No category may be automatically promoted to `confirmed_in_game`. Existing `source_status` values are historical and **must not be mass-rewritten**. For newly curated or edited factual records, retain existing contract and, where supported, attach `evidence_level`, `source_url`, `source_kind`, `observed_build`, `observed_at` and notes on method/scope. Do not claim a source checked unless actually reviewed. An item URL is not proof of boss drop, merchant sale, timer or location.

## Before a PR
Run `node scripts/check-data-quality.mjs` and `node --test tests/data-quality.test.mjs`; check existing module-specific tests relevant to changed data. Include a before/after issue count and sample paths, evidence URL/build, impacted files, known gaps and rollback plan. Structural errors block; historical warnings require triage, not silent deletion. The PR workflow runs on selected documentation/validator/data paths only.
