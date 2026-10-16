# Issue #59 — Trois équipements de rares de départ (Forever, 16 octobre 2026)

## Nouvelles relations rares → équipements documentées

Les trois associations sont listées dans des fiches **Wowhead Forever** avec IDs exacts. Chaque objet possède séparément une comparaison des **statistiques du client Forever** chez ForeverChanges et une **traduction française Classic** sourcée par ID. Ces trois niveaux de preuve **ne doivent pas être fusionnés** en une affirmation de loot confirmé en jeu.

| Rare, zone | Objet / ID | Statistiques documentées Forever | Version client indiquée |
| --- | --- | --- | --- |
| Threggil, Teldrassil | Keen Machete / **18610** | iLvl 10, requis niveau 5, 5–10 dégâts, vitesse 1,80, +1 Endurance | **1.60.1.70425** |
| Fury Shelda, Teldrassil | Bloody Chain Boots / **18612** | iLvl 10, requis niveau 5, 74 armure, +1 Endurance | **1.60.1.70425** |
| Timber (Grumeux), Dun Morogh | White Wolf Gloves / **1965** | iLvl 12, requis niveau 7, 39 armure, +2 Agilité | **1.60.1.70009** (archive plus ancienne) |

### Sources de chaque **attribution** rare → objet, documentaires uniquement
- Threggil → Machette : https://www.wowhead.com/forever/item=18610/keen-machete
- Fury Shelda → Bottes : https://www.wowhead.com/forever/item=18612/bloody-chain-boots
- Timber → Gants : https://www.wowhead.com/forever/item=1965/white-wolf-gloves

Il s'agit de listes de butin communautaires pour la branche **Forever**, pas de captures horodatées d'un drop réel. Pas de taux confirmé ni de probabilité introduite. Le rare lui-même et ses anciennes coordonnées restent des **références Classic**, sans promotion de statut.

### Sources des **statistiques** du client Forever (distinctes des drops)
- https://foreverchanges.pro/fr/item/18610 — changement signalé : iLvl 6 → 10, dégâts 3–6 → 5–10, +1 Endurance, requis 5.
- https://foreverchanges.pro/fr/item/18612 — changement signalé : iLvl 8 → 10, armure 61 → 74, +1 Endurance, requis 5.
- https://foreverchanges.pro/fr/item/1965 — ancienne comparaison au build 1.60.1.70009 : iLvl 10 → 12, armure 33 → 39, +2 Agilité, requis 7. **Aucune garantie que ce build reflète exactement l'état du jeu au 16 octobre.**

Dans les fichiers : `stats_source_url`, `stats_evidence_level=documented_forever`, `stats_observed_build`, `stats_evidence_note`. La **relation de butin** conserve indépendamment son `evidence_url` Wowhead Forever, `evidence_level=documented_forever`, `observed_at=2026-10-16` et `observed_build=unknown`.

### Sources des **noms français** (Classic uniquement)
- **Machette effilée**, #18610 : https://www.wowhead.com/classic/fr/item=18610/machette-effilee
- **Bottes en mailles sanglantes**, #18612 : https://www.wowhead.com/classic/fr/item=18612/bottes-en-mailles-sanglantes
- **Gants du loup blanc**, #1965 : https://www.wowhead.com/classic/fr/item=1965/gants-du-loup-blanc

`name_fr_status=classic_reference` : aucune affirmation que ces chaînes localisées soient confirmées dans le client Forever. Noms anglais/IDs préservés. Les données Classic restent affichées séparément lorsque des observations Forever manquent.

## Couverture avant/après
| Indicateur | Avant | Après |
| --- | ---: | ---: |
| Rares 1–30 avec au moins un butin | 71 / 161 | **74 / 161** |
| Rares 1–30 sans butin documenté | 90 | **87** |
| Rares historiques (150) avec butin | 65 | **68** |
| Relations rare→objet dans « Où l'obtenir » | 108 | **111** |
| Objets uniques indexés | 724 | **727** |
| Relations d'obtention toutes sources | 1 250 | **1 253** |
| Relations Forever documentaires | 486 | **489** |
| Relations Classic conservées | 764 | **764** |

## Assurance qualité et rollback
- `tests/rare-forever-gear-wave5-20261016.test.mjs` : ID, source de drop précise, niveaux, stats, version du client par objet, provenance linguistique, inconnues et absence de faux taux, index reproductible.
- `scripts/check-item-locales.mjs` : noms officiels Classic vs preuve de disponibilité Forever.
- Ajustement des tests historiques de rares et de l'index pour refléter les +3 nouvelles relations **sans supprimer les anciennes assertions**.
- CI hors ligne `data-quality` + `equipment-bis`. Exécuter `node scripts/check-data-quality.mjs`, `node scripts/check-forever-evidence.mjs`, `node scripts/build-item-acquisition-index.mjs --check` et suites dédiées. Aucun import, aucune sync, aucune édition Quêtes Forever.
- Rollback : revert de la PR. Les sources documentaires peuvent être mises à jour sans toucher aux références Classic et aux coordonnées existantes.
