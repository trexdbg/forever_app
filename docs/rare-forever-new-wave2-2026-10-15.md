# Module Rares — vague 2 : 24 rencontres nouvelles spécifiques à Forever
15 octobre 2026 · issue #59 · branche de développement uniquement.

## Résultat et périmètre
- Avant : 354 créatures référencées, dont 150 dans le contrôle historique des rares niveaux 1–30 ; 317 points parmi ces 150.
- Après cette branche : **378 créatures référencées (+24)** et **44 nouveaux points documentaires**, dont huit nouveaux rares de **Zephras Isle** (nouvelle zone). 
- **11 nouvelles fiches possèdent un niveau individuel documenté, 13 restent avec `level: null`**, sans estimation inventée. Le périmètre de validation strict des niveaux numériques 1–30 passe à **161 entrées et 345 points**, dont 36 points documentés Forever (contre 8 auparavant).
- Huit nouvelles associations créature → butin spécifique Forever, par identifiant d'objet exact ; les 16 autres nouvelles fiches conservent `loot: []`. `loot: []` signifie « aucun butin notable documenté ici », pas « ne lâche rien ».
- Aucune preuve personnelle de jeu, taux de drop, timer, faction ou traduction officielle FR non retrouvée n'a été fabriquée. Le statut des anciennes coordonnées Classic n'a pas été promu.

## Huit créatures de l'Île de Zéphras
Snapbeak the Quick, Den'dralass, Fernfeather, Galemender Delanea, Mystmane, Slydris, Tel'daeor the Stormspeaker, The Lost One.

Carte propre au client Forever : `uiMapID 2521` déjà documenté dans `data/npcs.json`, client `1.60.1.69893`, source https://warcraftforever.games/maps/zephras-isle ; points zone en pourcentages tirés de https://wowseer.gg/guides/rare-spawns et corroborés par https://www.stillsixty.com/rares . Aucun recours à des coordonnées mondiales non converties.

## Seize autres rencontres de zones de départ
- **Elwynn** : Elmpaw (élite spéciale, non présentée comme « rare »), Elder Finseer, Matriarch Bristlefur.
- **Carmines** : Dro'zem the Blasphemous.
- **Dun Morogh** : Ghostfang.
- **Durotar** : Dustwind Eggtender et Shal'ma.
- **Mulgore** : Snarlsnout, Stormherald Ukta, Thornstarter Igleg.
- **Teldrassil** : Nightscreech et Wrathvine.
- **Tirisfal** : Blightsculler, Coldrasp, Decrepit Harvester, The Condemned One.

## Relations documentaires Forever → butin
| Rare / rencontre | Objet | ID | Référence factuelle |
| --- | --- | ---: | --- |
| Snapbeak the Quick | Thendal Watcher's Boots | 285269 | https://www.wowhead.com/forever/item=285269/thendal-watchers-boots |
| Tel'daeor the Stormspeaker | Skyseer's Pants | 263015 | https://www.wowhead.com/forever/item=263015/skyseers-pants |
| Elmpaw | Elmpaw's Head (démarre une quête) | 247862 | https://www.wowhead.com/forever/item=247862/elmpaws-head |
| Dro'zem the Blasphemous | Dro'zem's Tunic | 277213 | https://www.wowhead.com/forever/item=277213/drozems-tunic |
| Decrepit Harvester | Golem Isospring (possible, non garanti) | 255007 | https://wowseer.gg/guides/rare-spawns ; https://www.wowhead.com/forever/item=255007/golem-isospring |
| Shal'ma | Shal'ma's Shawl | 286746 | https://www.wowhead.com/forever/item=286746/shalmas-shawl |
| Wrathvine | Wrathroot | 286749 | https://www.wowhead.com/forever/item=286749/wrathroot |
| Nightscreech | Wisesight Wand | 286750 | https://www.wowhead.com/forever/item=286750/wisesight-wand |

Toutes ces relations sont étiquetées **documented_forever** (source documentaire de la bêta, pas de certitude d'obtention dans toute version du jeu). Taux `chance_forever_observed_percent: null`, même si la base communautaire affiche des échantillons, car leurs statistiques ne garantissent aucun taux stable.

## Lieux et niveaux inconnus
- Une position est `documented_forever` uniquement lorsqu'un guide Forever publie le nom **et ce point exact** ; `point_evidence` identifie chaque coordonnée, la date de revue et le build `unknown` pour une source communautaire.
- **13 niveaux individuels restent inconnus**, mais la référence de zone de départ est documentée. Ces fiches ne gonflent **pas** le compte strict des 161 créatures à niveau exact 1–30 ; l'interface les présente explicitement comme « Niveau inconnu · zone de départ » et les laisse consultables avec le filtre bas niveau.
- Les 11 niveaux documentés ont leurs références individualisées `level_source_url`; une page Forever du PNJ, un guide spécialisé ou une table Wowhead qui nomme le niveau concerné.
- Les noms français non corroborés restent identiques à l'anglais et disposent de `name_fr_status=unverified_fallback_english`. Aucune traduction officielle FR présumée.
- Les déclarations de présence `seen_forever` restent à `false` : guide et coordonnées communautaires ≠ capture de gameplay confirmée.
- Élites spéciales, dont Elmpaw, ne sont **pas** classées « rare » sans preuve. Nouveau filtre « Élite / spéciale ».

## Interface, traduction et carte
- Ajout de la zone Forever Zéphras au sélecteur et à la carte, map ID de client issu du catalogue PNJ.
- Filtres de niveau : les niveaux inconnus de zones de départ apparaissent dans la sélection basse avec un « ? », sans valeur 0 ou fausse valeur exacte.
- Filtres FR/EN et option élite ; icônes absentes retirées au chargement plutôt que remplacées par un parchemin erroné.
- La disponibilité de la mosaïque distante 2521.webp n'a pas pu être vérifiée depuis l'environnement d'auteur ; l'application conserve sa grille de coordonnées de repli. QA navigateur à réaliser avant fusion.

## Validation et coordination
```sh
node scripts/check-data-quality.mjs
node --test tests/data-quality.test.mjs
node --test tests/rare-locations.test.mjs
node --test tests/rare-forever-new-wave2.test.mjs
node scripts/validate-rare-locations.mjs
node --check assets/rares.js
```

Tests ajoutés à l'action PR-scoped `data-quality.yml`. Aucun script de synchronisation ou publication exécuté. Les PR #61 et #62 sont ouvertes et non fusionnées à la création de ce lot ; #62 touche le même fichier `data/rares.json`. Les fusionner l'une après l'autre exige la réconciliation de leurs ajouts, le contrôle des niveaux et le recalcul de l'index dérivé de #61. **Ne fusionner ni publier avant revue et autorisation du propriétaire.**

## Suite
Compléter des vrais IDs PNJ Wowhead pour les nouveaux rares sans ID client identifié, la traduction FR officielle, les horaires d'apparition seulement si capturés, les autres nouvelles rencontres (Baron Marinous, Lordaeron Captain, etc.) avec cartographie spéciale ou carte de donjon dédiée.
