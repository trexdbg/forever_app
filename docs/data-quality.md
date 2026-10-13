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

## Contrat de provenance par **assertion** (nouvelles données)

Le même schéma s'applique aux nouveaux enregistrements explicitement classifiés dans les deux dépôts :

| Champ | Règle |
| --- | --- |
| `evidence_level` | Une des cinq catégories définies ci-dessus. Ne jamais surclasser automatiquement. |
| `source_url` | URL HTTPS de la publication ou de la source originale, distincte du simple lien de consultation d'un objet. |
| `evidence_url` | URL HTTPS du document, export versionné, journal ou capture qui soutient **l'assertion précise**. Peut égaler `source_url` uniquement si cette page prouve directement cette assertion. |
| `observed_at` | Date calendaire réelle `YYYY-MM-DD`, date de capture / extraction / consultation vérifiée (et **non** date inventée de l'événement). |
| `observed_build` | Version/édition du client concerné. Pour `confirmed_in_game` et `datamined` : build Forever exact, ex. `1.60.1.70291`. Pour `documented_forever`, `unknown` explicite est permis si la publication n'indique pas de version. Pour Classic, noter l'édition/version exacte indiquée par la source. |
| `evidence_kind` | Nature technique de la preuve : vocabulaire contrôlé ci-dessous. |
| `evidence_note` | Décrit **ce qui a réellement été observé et ce qui ne l'a pas été** (objet dans client ≠ objet obtenu, localisation et taux non prouvés, etc.). |

Natures autorisées selon le niveau : `confirmed_in_game` = `gameplay_capture`, `gameplay_log` ; `documented_forever` = `forever_official_page`, `forever_community_page` ; `datamined` = `client_db2`, `addon_snapshot`, `cache_snapshot` ; `classic_reference` = `classic_database`, `classic_guide` ; `unverified` = `unknown` ou absent.

**Validation** : dès qu'un enregistrement possède un `evidence_level` explicite et positif (confirmé / documenté / dataminé / Classic), les six autres champs sont requis, non vides, au format attendu, avec correspondance `evidence_kind`/niveau. `confirmed_in_game` nécessite une preuve directe de gameplay, pas seulement une page communautaire. Pour `unverified`, seul `evidence_note` est obligatoire : les cinq autres champs peuvent manquer, car une preuve inconnue ne doit pas être inventée ; les champs présents doivent néanmoins être cohérents. Les anciens enregistrements **sans** `evidence_level` restent sur leur ancien schéma et ne sont pas massivement migrés. Le validateur JSON vérifie ces règles sur les *items* qu'il parcourt ; les autres types de données ne sont pas encore soumis à ce schéma de provenance.

Exemple illustratif de documentation Forever, **pas une preuve réelle** (URL fictive interdite dans les catalogues de production) :

```json
{
  "evidence_level": "documented_forever",
  "source_url": "https://example.org/forever/guide",
  "evidence_url": "https://example.org/forever/guide",
  "observed_at": "2026-10-13",
  "observed_build": "unknown",
  "evidence_kind": "forever_community_page",
  "evidence_note": "Le guide attribue cet objet au boss ; aucune obtention vérifiée en jeu."
}
```

Les coordonnées Classic sont locales à la zone, différentes des UiMapID du client Forever. Les prix, stocks, temps de repop et traductions exigent leur **propre** preuve. Les URLs d'objets ne confirment aucune attribution de butin.

## Automated gate
`node scripts/check-data-quality.mjs` scans key JSON catalogues offline for invalid JSON, missing data files, duplicate item/dungeon/rare IDs, impossible levels/timers/percentage coordinates, item links with mismatched IDs, conflicting Classic/Forever verification labels, missing positions/IDs, uncertain loot attribution and inadequate traceable provenance. `--json` writes a machine-readable issue report. `--fail-on-warnings` is an optional *review escalation*; legacy warnings are deliberately not CI-blocking. Structural errors cause nonzero exit. Test fixtures exercise deliberate bad/good examples.

The PR-only workflow uses minutes only on QA-related changes; no scheduled job and no publishing permissions. This validator is an initial **heuristic audit** (no live server confirmation, no HTTP fetch, and no guarantee every cross-file relation is correct). The categories reflect source type, not a certainty percentage.

## Couverture exacte du premier audit — **non exhaustif**

Le script `scripts/check-data-quality.mjs` charge **11 fichiers JSON explicitement listés** dans `DATA_FILES`, sans découverte dynamique et sans accès réseau :

- **Catalogues d'objets** : `data/items.json`, `data/items-forever.json`, `data/items-classic-cache.json`, `data/items-forever-cache.json` — vérification partielle du tableau `items[]` : IDs, noms, niveaux, liens d'objets, incohérences Classic/Forever, et champs de provenance **explicites**.
- **BiS** : `data/bis.json`, `data/bis-niveaux-classic.json`, `data/bis-niveaux-forever-observed.json` — uniquement `items[]`. **Non vérifiés dans ces mêmes fichiers** : cohérence des profils/classes/`kits`, hiérarchie des slots, pertinence des recommandations.
- **Donjons** : `data/dungeons-forever.json` — IDs de donjons, intervalles de niveaux, URL générale, coordonnées `bosses[].mapPoint`, contrôles élémentaires sur `bosses[].loot[]` et absence de preuve directe d'attribution. Pas d'audit complet des cartes, tables de chances, quêtes, itinéraires, noms traduits ou cross-références.
- **Rares** : `data/rares.json` — identifiants, coordonnées `points[]`, bornes de repop, taux Classic présents, URL de source. Pas de confirmation des spawns en jeu ni de la complétude des tables de loot.
- **PNJ** : `data/npcs.json` — IDs manquants, position `coordinates`, présence d'URL de source. Pas de contrôle des `offers`, stocks, timers, maîtres enseignés, factions, traduction ni exactitude des points.
- **Quêtes Classic** : `data/quests/manifest.json` — uniquement le nom de la source `vanilla-questing` et le système de coordonnées ; **aucune validation des parcours et traductions**, et aucun changement de module. Le contrôle n'interdit pas les améliorations de Quêtes Classic en PR dédiées.

**Non couverts** par ce premier audit (fichiers JSON existants) : `data/dungeon-loot-details.json`, `data/dungeon-loot-extra.json`, `data/dungeon-weapon-stats.json`, `data/geo-quest-crafting.json`, `data/mining-points.json`, `data/mining-sectors.json`, `data/mining.json`, `data/population.json`, `data/professions.json`, `data/quests/alliance.json`, `data/quests/horde.json`, `data/quests/levels.json`, `data/talents.json`, les JSON du laboratoire `lab/quetes/**`, et les sorties éventuelles `data/items-forever-client.json` (non présentes dans l'inventaire `main` inspecté). Aucun contrôle des images, scripts JS, pages HTML, licences réelles, traductions officielles, de l'existence HTTP des URLs, ni de la vérité en jeu.

**11 fichiers analysés ne signifie ni 11 modules validés ni couverture exhaustive des données Forever**. Tout nouvel ensemble JSON doit être ajouté volontairement avec des assertions et tests appropriés.

## Initial remediation queue (do not edit source catalogues as part of this PR)
1. P0: Resolve misleading Classic-vs-Forever labels and formalize game evidence; ensure item URL `/forever/` does not upgrade Classic records.
2. P1: Investigate the 159/354 rares without map points before claiming map completeness. Keep rare records and flag positions as missing.
3. P1: Resolve 329/357 NPC records with missing numeric IDs where reliable IDs exist. Never guess IDs from names.
4. P1: Attribute individual beta-dungeon loot drops to evidence of **boss attribution**, not merely an item catalogue page; `forever_beta_community` is not game confirmation.
5. P2: Bring imports and translations under consistent provenance reporting; track evidence freshness per beta build.

## Classic quest module preservation
`data/quests/manifest.json` points to `trexdbg/vanilla-questing` (Classic MIT routes). Le module Quêtes Classic doit rester **public, accessible et fonctionnel**, mais n'est pas figé : optimisation des itinéraires, corrections et traductions sont autorisées via des **PR dédiées** avec tests de non-régression. Cette PR ne modifie aucun parcours. No Forever quest route or UI activation. Testing the provenance manifest must never rewrite it.

Owner acceptance required before merging to `main`, deploying, enabling any new module, bulk migration, or mass deletion.

## Audit initial constaté le 13 octobre 2026

Exécution du contrôle hors ligne sur la PR fondatrice, sans édition des sources : **11/11 jeux de données**, **0 erreur structurelle** et **721 avertissements**. Répartition :
- `NPC_ID_UNKNOWN`: 329 (sur 357 PNJ).
- `RARE_LOCATION_UNKNOWN`: 159 (sur 354 rares).
- `LOOT_SOURCE_INDIRECT`: 96 (un lien de catalogue ou de guide ne prouve pas le butin du boss).
- `CLASSIC_WITH_FOREVER_CATALOG_LINK`: 82 (un lien /forever/ n'établit pas la disponibilité en jeu des références Classic).
- `NPC_LOCATION_UNKNOWN`: 54.
- `LOOT_ITEM_ID_UNKNOWN`: 1.

Les avertissements sont des **lacunes de provenance ou de complétude**, pas 721 erreurs factuelles démontrées. Les corrections nécessitent une source précise et parfois une observation en jeu. Prioriser d'abord les ambiguïtés sur l'identité Classic/Forever et les attributions de butin. Ne pas supprimer les références de quêtes Classic.

Risque producteur externe à ce contrôle : `trexdbg/forever_agent/scripts/sync_forever_items.py` contient sur `main` un `\\n` littéral causant un `SyntaxError` et bloquant la suite de tests complète du dépôt agent ; sa correction est hors du périmètre de cette PR documentation/validation. Les scripts de publication directe sur `forever_app/main` doivent aussi être revus dans une mission distincte.
