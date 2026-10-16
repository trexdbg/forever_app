# Issue #60 — Audit documentaire des butins de boss (16 octobre 2026)

**Périmètre :** 10 pages Forever à listes *boss → objets* sur WoW Source ; 96 lignes de butins non-Classic déjà présentes dans le module Donjons. Ce travail **ne crée pas 71 nouveaux butins** : il apporte une preuve spécifique aux **71 relations préexistantes** pour lesquelles une source directe a été identifiée et signale 25 relations non résolues.

## Motivation

Le moteur « Où l'obtenir » traitait historiquement **toute** entrée donjon avec `source_status` différent de `classic_loot_reference` comme `documented_forever`, y compris les entrées provenant seulement d'une fiche d'objet ou d'un cache. Une fiche d'objet ne documente **pas** automatiquement son attribution au boss. Cela mélangeait présence dans le client, provenance de l'objet et attribution du drop.

Le nouveau moteur exige une source documentaire **associant directement le boss et l'objet** : `evidence_level= documenté`, HTTPS `source_url` et `evidence_url` de table non limitée à une fiche d'objet, `observed_at`, `observed_build`, `evidence_kind` autorisé, note contenant les noms anglais exacts du boss et de l'objet. L'absence de preuve donne `unverified` pour **la relation**, sans supprimer l'entrée. Les références Classic restent `classic_reference` et tous les `source_status` historiques du catalogue Donjons sont conservés.

## Sources examinées et résultats

Les pages sont communautaires **spécifiques à Forever**, non des observations personnellement vérifiées en jeu. Dates des pages variables et builds non précisés : `observed_at=2026-10-16` (date de revue) et `observed_build=unknown` pour chaque relation documentaire. Pas de taux de drop transféré ou créé.

| Page source examinée | Relations directes documentées | Relations en attente |
| --- | ---: | ---: |
| https://wowsrc.com/loot/hall-of-thanes/ | 12 | 0 |
| https://wowsrc.com/loot/ruins-of-lordaeron/ | 15 | 7 |
| https://wowsrc.com/loot/excavation-site-wetlands/ | 9 | 2 |
| https://wowsrc.com/loot/city-of-dalaran/ | 15 | 11 |
| https://wowsrc.com/loot/ragefire-chasm/ | 6 | 0 |
| https://wowsrc.com/loot/wailing-caverns/ | 1 | 0 |
| https://wowsrc.com/loot/the-stockade/ | 4 | 0 |
| https://wowsrc.com/loot/gnomeregan/ | 2 | 2 |
| https://wowsrc.com/loot/razorfen-kraul/ | 5 | 1 |
| https://wowsrc.com/loot/scarlet-monastery-graveyard/ | 2 | 2 |
| **TOTAL** | **71** | **25** |

Pour les 71 associations, la source directe `wowsrc.com/loot/<donjon>/` apparaît en lien distinct dans la fiche Donjon, tandis que la fiche **d'objet** et ses stats continuent d'utiliser les anciennes références Wowhead/ForeverChanges. La mention est « Butin Forever documenté · non confirmé en jeu » et non « observé en jeu ». Aucune absence dans WoW Source n'est utilisée pour déduire la disparition de l'objet dans Forever.

### Conflits et preuves manquantes documentés sans suppression

- **Ruins of Lordaeron** : le catalogue utilise « The Forsaken » là où la liste WoW Source utilise « The Abandoned » pour le même ensemble de trois objets. L'identité exacte du boss n'a pas été vérifiée, donc les trois relations restent **unverified** ; idem « Lordaeron Captain » vs « Deathsworn Captain » pour #6641 et #6642. Deux plans chez Rath'mael (#273085 et Plans: Arcane Recycler sans ID vérifié) ne sont pas dans la liste directe.
- **Excavation Site: Wetlands** : les objets spéciaux Blueprint: Greenhouse #273106 et Titan Relic #270865 ne sont pas dans la liste de butin comparée, donc **unverified** ; les neuf pièces d'équipement sont documentées.
- **City of Dalaran** : noms de boss discordants « Lyn the Unheeded » / « Lyn the Ignored », « Fel-Touched Ancient » / « Fel Ancient », « Archmage's Shade » / « Shade of the Archmage » ; neuf liens en attente de comparaison des NPC IDs, plus les deux plans de l'Unstable Sentinel / Shade (11 relations en attente au total).
- **Gnomeregan** : Skullduggery Belt #274042 et Schematic: 9-60 Battery Pack #274049 manquent dans les données directes comparées ; Grubbis → Irradiated Shield et Crowd Pummeler → Thermaplugg Medal of Honor sont documentés.
- **Razorfen Kraul** : Brawler's Leather Helm #252512 sous Aggem Thorncurse, non reproduit dans la table boss.
- **Scarlet Monastery Graveyard** : Defender's Leather Helm #252455 sous Interrogator Vishas et Brawler's Leather Helm #252512 sous Azshir the Sleepless restent en attente ; Painwalker Buckler et Polished Skullcap sont documentés.

Aucun nom non confirmé n'est traduit ou renommé sur la base de ces rapprochements. Les statuts `unverified` signalent seulement une **preuve d'attribution insuffisante**, pas une impossibilité de drop.

## Impact contrôlé sur les compteurs

| Compteur de l'index transversal | Avant | Après |
| --- | ---: | ---: |
| Objets uniques | 730 | **730** |
| Relations au total | 1 256 | **1 256** |
| Liens de donjon au total | 205 | **205** |
| Sources `documented_forever`, tous modules | 489 | **465** |
| Sources `classic_reference`, tous modules | 767 | **767** |
| Sources `unverified`, tous modules | 0 | **24** |
| Sources de butin de boss directement documentées | non contrôlées | **71** |
| Entrées de butin de boss en attente | non distinguées | **25** |

Le décalage 25 entrées en attente / 24 liens d'index est attendu : **Plans: Arcane Recycler** reste sans identifiant numérique prouvé et n'entre donc pas dans l'index d'objets. Le total des sources d'objets **n'a pas diminué** ; la baisse de « Forever documenté » corrige une surestimation historique, pas une perte d'informations.

## Validation, limites et rollback

- `tests/dungeon-boss-loot-provenance-20261016.test.mjs` : 10 sources, 96 relations et 110 Classic intactes, 71 / 25, 9 exemples de conflits, URLs par dungeon, absence de preuve d'objet seule, provenance de l'index, badges FR/EN et maintien des pages Quêtes Classic.
- `tests/item-acquisition-index.test.mjs` et suites cumulatives Rares : total 1 256 stable, index reproductible ; `node scripts/build-item-acquisition-index.mjs --check`.
- `node --check assets/dungeons.js`, `node scripts/check-data-quality.mjs`, exécution des CI Data Quality et Equipment/BiS. Pas de nouvelle synchronisation, changement de carte ni modification des quêtes.
- **Limites** : WoW Source est un site communautaire ; ses tables ne prouvent pas une capture de butin attribuable ni des taux pour un build connu. D'autres sites peuvent documenter des relations non reproduites dans cet audit. Un autre agent pourra ensuite compléter les **25 attributions** avec captures, IDs de NPC, journal de butin ou publication boss-spécifique.
- **Retour arrière** : revert de la PR, sans migration ni suppression de données de gameplay.

Suivi : [Issue #60](https://github.com/trexdbg/forever_app/issues/60).
