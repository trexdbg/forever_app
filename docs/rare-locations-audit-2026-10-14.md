# Issue #52 — audit des positions des monstres rares WoW Forever (palier 1–30)
_Rapport préparé le 14 octobre 2026 — branche de travail, **non publié**, sans test personnel en jeu._

## Périmètre et méthode
Catalogue `data/rares.json` sur `main` après PR #50. Ce document contient **les 150 rares préexistants** sélectionnés par `beta_level30_in_scope=true` — **pas une preuve** que chacun apparaît dans la bêta. Le niveau, l’identité et la zone sont hérités de Classic sauf preuve distincte. Numéro de créature connu dans Classic ≠ présence confirmée sur Forever. Les données Turtle et les autres serveurs privés n'ont pas servi de preuve.

Méthode :
1. Inventorier le catalogue initial sans suppression, distinguer cartes extérieures/instances, préserver les points Classic.
2. Examiner les fiches ForeverDB qui **étiquettent explicitement leurs coordonnées Classic/CMaNGOS**, vérifier les pages Wowhead Classic et les pages communautaires spécifiquement Forever.
3. Pour chaque point conservé ou ajouté, renseigner `point_evidence[i]`, strictement aligné à `points[i]` (zone, `uiMapID`, coordonnées, source, date, build, nature, portée exacte). Ne pas dériver la preuve d'un lien d'objet ou de `seen_forever`.
4. Soumettre un contrôle hors ligne avec erreurs bloquantes sur liens de preuve manquants, coordonnées hors 0–100, mauvaise zone, absence de carte d'instance, mauvais ID et promotion de preuve.

## Bilan avant / après

| Indicateur (palier 1–30) | Avant | Après |
| --- | ---: | ---: |
| Rares marqués dans le catalogue | 150 | 150 |
| Rares avec au moins un point | 125 | 144 |
| Rares sans aucun point | 25 | 6 |
| Points présents (total) | 292 | 317 |
| Points Forever **confirmés en jeu** avec capture/build | 0 | 0 |
| Points documentés **Forever**, source communautaire (non confirmés en jeu) | 0 | 8 |
| Points Classic avec source individuelle consultée | 0 | 17 |
| Points Classic hérités sans preuve individuelle vérifiée | 292 | 292 |
| Entrées sans point : carte d'instance requise | 4 | 4 |
| Entrées extérieures sans point : conflit de zone / source | 0 catégorisée | 2 |

Les 292 anciens points ne sont **pas** considérés comme factuellement validés, même lorsque leurs `zone` et `uiMapID` passent les contrôles de structure. Leur origine reste Classic et leur preuve ponctuelle est `unverified`. La couverture 144/150 ne signifie pas 144 spawns Forever vérifiés.

**Divergence de périmètre :** ForeverDB peut afficher 149 rares niveau 30 sur un catalogue à jour ; le fichier importé en conserve 150. Aucun des 150 n'a été soustrait automatiquement : contrôler l'éligibilité individually par build avant tout retrait.

## Recherche des 25 initialement sans coordonnées

| Rare (EN) | Nom FR (catalogue) | Zone initiale | Identifiant Classic | Nouveaux points X/Y | Statut après audit | Preuve / point de départ |
| --- | --- | --- | --- | --- | --- | --- |
| Bruegal Ironknuckle | Bruegal Poing-de-fer | stockade | 1720 | — | Carte d’instance nécessaire | — |
| Hannah Bladeleaf | Hannah Bladeleaf | barrens | 5799 | 49, 80 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/5799) |
| Heggin Stonewhisker | Heggin Stonewhisker | barrens | 5847 | 47, 84 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/5847) |
| Marcus Bel | Marcus Bel | barrens | 5800 | 49, 80 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/5800) |
| Aean Swiftriver | Aean Swiftriver | barrens | 5797 | 49, 80 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/5797) |
| Malgin Barleybrew | Malgin Barleybrew | barrens | 5848 | 50, 84 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/5848) |
| Thora Feathermoon | Thora Feathermoon | barrens | 5798 | 49, 80 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/5798) |
| Sister Rathtalon | Sœur Rancune-serre | stonetalon | 5830 | — | Zone seule · position inconnue | [Fiche](https://foreverdb.net/rare/5830) |
| Taskmaster Whipfang | Sous-chef Fouet-croc | stonetalon | 5932 | 63, 53 ; 61.4, 50 ; 64.2, 57 ; 61.2, 55.8 | Documenté Forever (communautaire) | [Fiche](https://www.stillsixty.com/rare/taskmaster-whipfang-stonetalon-mountains) |
| Foreman Rigger | Contremaître Rigger | stonetalon | 5931 | 65.2, 52.8 ; 65, 46.8 ; 67.6, 45.2 ; 68.2, 51.4 | Documenté Forever (communautaire) | [Fiche](https://www.stillsixty.com/rare/foreman-rigger-stonetalon-mountains) |
| Sentinel Amarassan | Sentinelle Amarassan | stonetalon | 5916 | 35, 15 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/5916) |
| Sorrow Wing | Aile-de-chagrin | stonetalon | 5928 | 49, 36 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/5928) |
| Sister Riven | Sœur Riven | stonetalon | 5930 | 30, 69 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/5930) |
| Nal'taszar | Nal'taszar | stonetalon | 4066 | 26, 12 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/4066) |
| Deviate Faerie Dragon | Dragon féerique déviant | wailing-caverns | 5912 | — | Carte d’instance nécessaire | — |
| Rorgish Jowl | Rorgish Jowl | ashenvale | 10639 | 36, 37 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/10639) |
| Akkrilus | Akkrilus | ashenvale | 3773 | — | Zone seule · position inconnue | [Fiche](https://www.wowhead.com/classic/npc=3773/akkrilus) |
| Eck'alom | Eck'alom | ashenvale | 10642 | 53, 70 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/10642) |
| Oakpaw | Patte-de-chêne | ashenvale | 10640 | 56, 63 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/10640) |
| Rot Hide Bruiser | Cogneur Poil-putride | alterac | 1944 | 2, 26 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/1944) |
| Jimmy the Bleeder | Jimmy le Saigneur | alterac | 14281 | 59, 69 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/14281) |
| Snarlmane | Crinière-grognante | alterac | 1948 | 2, 29 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/1948) |
| Deathsworn Captain | Capitaine lige-mort | shadowfang-keep | — | — | Carte d’instance nécessaire | — |
| Gibblesnik | Gibblesnik | thousand-needles | 14427 | 56, 50 | Indicatif Classic | [Fiche](https://foreverdb.net/rare/14427) |
| Razorfen Spearhide | Lancepeau tranchebauge | razorfen-kraul | 4438 | — | Carte d’instance nécessaire | — |

- **17 points Classic** ont été ajoutés depuis les fiches de rare ForeverDB explicitement étiquetées « Classic data / CMaNGOS ». Dates des consultations : 2026-10-14. Version : **Classic 1.12 / CMaNGOS**, et *non* build client Forever. Une fiche reproduisant des données Classic ne confirme pas leur maintien dans Forever. Les quatre Outrunners peuvent afficher exactement le même repère arrondi, car il s'agit d'un groupe/patrouille dans ces références ; le point n'implique pas des spawns autonomes.
- **8 points Forever documentés** : quatre pour Taskmaster Whipfang (63.0/53.0, 61.4/50.0, 64.2/57.0, 61.2/55.8) et quatre pour Foreman Rigger (65.2/52.8, 65.0/46.8, 67.6/45.2, 68.2/51.4) ; sources [Stillsixty / Whipfang](https://www.stillsixty.com/rare/taskmaster-whipfang-stonetalon-mountains) et [Stillsixty / Rigger](https://www.stillsixty.com/rare/foreman-rigger-stonetalon-mountains). Consultées le 2026-10-14 ; **build de l'observation inconnu**. Les fiches donnent ces points pour Forever, mais n'identifient pas une capture jouable et attribuable ; classement `documented_forever`, jamais `confirmed_in_game`. [RareNet](https://www.curseforge.com/wow/addons/rarenet) annonce lui aussi des positions modifiées pour ces deux créatures, **sans fournir dans cette annonce les huit coordonnées individuellement**.
- **2 conflits non résolus :** Sister Rathtalon ([ForeverDB: Stonetalon 96/75](https://foreverdb.net/rare/5830) contre [Wowhead Classic : The Barrens](https://www.wowhead.com/classic/npc=5830/sister-rathtalon)) ; Akkrilus ([Wowhead Classic / commentaires historiques : Ashenvale](https://www.wowhead.com/forever/fr/npc=3773/akkrilus) contre [The Forever Era : Stonetalon](https://theforeverera.com/en/rares/3773/)). Leur zone et position réelles dans Forever restent inconnues : **aucun point n'a été ajouté**.
- **4 rares d'instance sans carte d'étage propre** : Bruegal Ironknuckle (Stockade), Deviate Faerie Dragon (Wailing Caverns), Deathsworn Captain (Shadowfang Keep) et Razorfen Spearhide (Razorfen Kraul). Ne pas détourner leurs coordonnées vers une carte extérieure.

## Inventaire individuel des 150 entrées

La colonne « qualité du point » concerne **la coordonnée uniquement**. La table ne prouve ni l'identité en jeu, ni le niveau actuel, la faction, les drops, ni les repops de Forever. `uiMapID` doit correspondre au référentiel local du catalogue ; l'ID `instance` indique absence de carte extérieure. Le champ `location_review` explicite la raison historique d'inclusion, le statut d'identité, de faction (inconnue par défaut, sauf attribution historique sourcée des Outrunners) et de présence, la nature de la carte et les conflits ; `point_evidence[]` donne l'attestation par couple (créature, point).

| ID du catalogue | Nom EN | Nom FR | Zone | uiMapID | Niv. Classic | Pins | État | Qualité du point | ID Classic |
| --- | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- |
| classic-alterac-rot-hide-bruiser | Rot Hide Bruiser | Cogneur Poil-putride | alterac | 1416 | 22 | 1 | Indicatif Classic | Classic sourcé | 1944 |
| classic-alterac-jimmy-the-bleeder | Jimmy the Bleeder | Jimmy le Saigneur | alterac | 1416 | 23 | 1 | Indicatif Classic | Classic sourcé | 14281 |
| classic-alterac-snarlmane | Snarlmane | Crinière-grognante | alterac | 1416 | 23 | 1 | Indicatif Classic | Classic sourcé | 1948 |
| ashenvale-apothecary-falthis | Apothecary Falthis | Apothicaire Falthis | ashenvale | 1440 | 22 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| ashenvale-lady-vespia | Lady Vespia | Dame Vespia | ashenvale | 1440 | 22 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| ashenvale-mist-howler | Mist Howler | Hurlebrume | ashenvale | 1440 | 22 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| 10643 | Mugglefin | Mugglefin | ashenvale | 1440 | 23 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 10643 |
| ashenvale-branch-snapper | Branch Snapper | Brise-branche | ashenvale | 1440 | 25 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| classic-ashenvale-rorgish-jowl | Rorgish Jowl | Rorgish Jowl | ashenvale | 1440 | 25 | 1 | Indicatif Classic | Classic sourcé | 10639 |
| classic-ashenvale-akkrilus | Akkrilus | Akkrilus | ashenvale | 1440 | 26 | 0 | Zone seule · position inconnue | Classic hérité, preuve directe manquante | 3773 |
| classic-ashenvale-eck-alom | Eck'alom | Eck'alom | ashenvale | 1440 | 27 | 1 | Indicatif Classic | Classic sourcé | 10642 |
| classic-ashenvale-oakpaw | Oakpaw | Patte-de-chêne | ashenvale | 1440 | 27 | 1 | Indicatif Classic | Classic sourcé | 10640 |
| 3270 | Elder Mystic Razorsnout | Ancien mystique Tranchegroin | barrens | 1413 | 15 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 3270 |
| 5837 | Stonearm | Bras-de-pierre | barrens | 1413 | 15 | 2 | Indicatif Classic | Classic hérité, preuve directe manquante | 5837 |
| barrens-brokespear | Brokespear | Lance-brisée | barrens | 1413 | 17 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| 5841 | Rocklance | Lance-de-pierre | barrens | 1413 | 17 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5841 |
| barrens-snort-the-heckler | Snort the Heckler | Snort la Moqueuse | barrens | 1413 | 17 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| 5836 | Engineer Whirleygig | Ingénieur Tournevis | barrens | 1413 | 19 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5836 |
| 5835 | Foreman Grills | Contremaître Grills | barrens | 1413 | 19 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5835 |
| 3295 | Sludge Beast | Bête de vase | barrens | 1413 | 19 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 3295 |
| 5842 | Takk the Leaper | Takk le Bondisseur | barrens | 1413 | 19 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5842 |
| 3652 | Trigore the Lasher | Trigore le Flagelleur | barrens | 1413 | 19 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 3652 |
| 3672 | Boahn | Boahn | barrens | 1413 | 20 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 3672 |
| 3398 | Gesharahan | Gesharahan | barrens | 1413 | 20 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 3398 |
| 5831 | Swiftmane | Vif-crins | barrens | 1413 | 21 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5831 |
| 5828 | Humar the Pridelord | Humar le Fier | barrens | 1413 | 23 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5828 |
| 5849 | Digger Flameforge | Terrassier Forgeflamme | barrens | 1413 | 24 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5849 |
| classic-barrens-hannah-bladeleaf | Hannah Bladeleaf | Hannah Bladeleaf | barrens | 1413 | 24 | 1 | Indicatif Classic | Classic sourcé | 5799 |
| classic-barrens-heggin-stonewhisker | Heggin Stonewhisker | Heggin Stonewhisker | barrens | 1413 | 24 | 1 | Indicatif Classic | Classic sourcé | 5847 |
| classic-barrens-marcus-bel | Marcus Bel | Marcus Bel | barrens | 1413 | 24 | 1 | Indicatif Classic | Classic sourcé | 5800 |
| 3253 | Silithid Harvester | Moissonneur silithide | barrens | 1413 | 24 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 3253 |
| 5832 | Thunderstomp | Piétine-tonnerre | barrens | 1413 | 24 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5832 |
| classic-barrens-aean-swiftriver | Aean Swiftriver | Aean Swiftriver | barrens | 1413 | 25 | 1 | Indicatif Classic | Classic sourcé | 5797 |
| 5834 | Azzere the Skyblade | Azzere la Lame céleste | barrens | 1413 | 25 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5834 |
| classic-barrens-malgin-barleybrew | Malgin Barleybrew | Malgin Barleybrew | barrens | 1413 | 25 | 1 | Indicatif Classic | Classic sourcé | 5848 |
| classic-barrens-thora-feathermoon | Thora Feathermoon | Thora Feathermoon | barrens | 1413 | 25 | 1 | Indicatif Classic | Classic sourcé | 5798 |
| 5859 | Hagg Taurenbane | Hagg Fléau-des-taurens | barrens | 1413 | 26 | 3 | Indicatif Classic | Classic hérité, preuve directe manquante | 5859 |
| 5827 | Brontus | Brontus | barrens | 1413 | 27 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5827 |
| 5851 | Captain Gerogg Hammertoe | Capitaine Gerogg Marteau-d'orteil | barrens | 1413 | 27 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5851 |
| 14426 | Harb Foulmountain | Harb Montagne-fétide | barrens | 1413 | 27 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 14426 |
| darkshore-shadowclaw | Shadowclaw | Griffe-de-l'ombre | darkshore | 1439 | 13 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| darkshore-licillin | Licillin | Licillin | darkshore | 1439 | 14 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| 7017 | Lord Sinslayer | Seigneur Tue-péchés | darkshore | 1439 | 15 | 2 | Indicatif Classic | Classic hérité, preuve directe manquante | 7017 |
| darkshore-carnivous-the-breaker | Carnivous the Breaker | Carnivous le Briseur | darkshore | 1439 | 16 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| 7015 | Flagglemurk the Cruel | Flagglemurk le Cruel | darkshore | 1439 | 16 | 2 | Indicatif Classic | Classic hérité, preuve directe manquante | 7015 |
| darkshore-lady-moongazer | Lady Moongazer | Dame Luneglace | darkshore | 1439 | 17 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| 2192 | Firecaller Radison | Radison l'Invocateur de feu | darkshore | 1439 | 19 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 2192 |
| 2172 | Strider Clutchmother | Matriarche trotteuse | darkshore | 1439 | 20 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 2172 |
| 7016 | Lady Vespira | Dame Vespira | darkshore | 1439 | 22 | 7 | Indicatif Classic | Classic hérité, preuve directe manquante | 7016 |
| dun-morogh-edan-the-howler | Edan the Howler | Edan le Hurleur | dun-morogh | 1426 | 9 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| dun-morogh-timber | Timber | Timber | dun-morogh | 1426 | 10 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| dun-morogh-gibblewilt | Gibblewilt | Gibblewilt | dun-morogh | 1426 | 11 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| 1260 | Great Father Arctikus | Grand-père Arctikus | dun-morogh | 1426 | 11 | 6 | Indicatif Classic | Classic hérité, preuve directe manquante | 1260 |
| 1130 | Bjarn | Bjarn | dun-morogh | 1426 | 12 | 4 | Indicatif Classic | Classic hérité, preuve directe manquante | 1130 |
| 1119 | Hammerspine | Marteau-d'échine | dun-morogh | 1426 | 12 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 1119 |
| 5826 | Geolord Mottle | Géoseigneur Mottle | durotar | 1411 | 9 | 3 | Indicatif Classic | Classic hérité, preuve directe manquante | 5826 |
| 5808 | Warlord Kolkanis | Seigneur de guerre Kolkanis | durotar | 1411 | 9 | 3 | Indicatif Classic | Classic hérité, preuve directe manquante | 5808 |
| 5809 | Watch Commander Zalaphil | Commandant de garde Zalaphil | durotar | 1411 | 9 | 2 | Indicatif Classic | Classic hérité, preuve directe manquante | 5809 |
| 5824 | Captain Flat Tusk | Capitaine Défense-plate | durotar | 1411 | 11 | 3 | Indicatif Classic | Classic hérité, preuve directe manquante | 5824 |
| 5823 | Death Flayer | Écorcheur mortel | durotar | 1411 | 11 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5823 |
| 5822 | Felweaver Scornn | Scornn Tisse-corruption | durotar | 1411 | 11 | 3 | Indicatif Classic | Classic hérité, preuve directe manquante | 5822 |
| 5865 | Dishu | Dishu | durotar | 1411 | 13 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5865 |
| 3470 | Rathorian | Rathorian | durotar | 1411 | 15 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 3470 |
| 574 | Naraxis | Naraxis | duskwood | 1431 | 27 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 574 |
| elwynn-morgaine-the-sly | Morgaine the Sly | Morgaine la Rusée | elwynn | 1429 | 10 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| elwynn-mother-fang | Mother Fang | Mère Croc | elwynn | 1429 | 10 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| elwynn-narg-the-taskmaster | Narg the Taskmaster | Narg le Sous-chef | elwynn | 1429 | 10 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| elwynn-thuros-lightfingers | Thuros Lightfingers | Thuros Doigts-agiles | elwynn | 1429 | 11 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| elwynn-fedfennel | Fedfennel | Fedfennel | elwynn | 1429 | 12 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| 100 | Gruff Swiftbite | Gruff Morsure-vive | elwynn | 1429 | 12 | 5 | Indicatif Classic | Classic hérité, preuve directe manquante | 100 |
| 521 | Lupos | Lupos | elwynn | 1429 | 23 | 12 | Indicatif Classic | Classic hérité, preuve directe manquante | 521 |
| hillsbrad-creepthess | Creepthess | Rampante | hillsbrad | 1424 | 24 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| 14280 | Big Samras | Grand Samras | hillsbrad | 1424 | 27 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 14280 |
| classic-hillsbrad-ro-bark | Ro'Bark | Ro'Bark | hillsbrad | 1424 | 28 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| 14275 | Tamra Stormpike | Tamra Foudrepique | hillsbrad | 1424 | 28 | 3 | Indicatif Classic | Classic hérité, preuve directe manquante | 14275 |
| hillsbrad-scargil | Scargil | Scargil | hillsbrad | 1424 | 30 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| loch-modan-grizlak | Grizlak | Grizlak | loch-modan | 1432 | 15 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| loch-modan-lord-condar | Lord Condar | Seigneur Condar | loch-modan | 1432 | 16 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| 14267 | Emogg the Crusher | Emogg l'Écraseur | loch-modan | 1432 | 19 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 14267 |
| 14266 | Shanda the Spinner | Shanda la Tisseuse | loch-modan | 1432 | 19 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 14266 |
| 1399 | Magosh | Magosh | loch-modan | 1432 | 21 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 1399 |
| 1398 | Boss Galgosh | Chef Galgosh | loch-modan | 1432 | 22 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 1398 |
| 2476 | Large Loch Crocolisk | Grand crocilisque du Loch | loch-modan | 1432 | 22 | 2 | Indicatif Classic | Classic hérité, preuve directe manquante | 2476 |
| 3068 | Mazzranache | Mazzranache | mulgore | 1412 | 9 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 3068 |
| 5786 | Snagglespear | Snagglespear | mulgore | 1412 | 9 | 2 | Indicatif Classic | Classic hérité, preuve directe manquante | 5786 |
| 5807 | The Rake | Le Rake | mulgore | 1412 | 10 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5807 |
| 5787 | Enforcer Emilgund | Exécuteur Emilgund | mulgore | 1412 | 11 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5787 |
| 5785 | Sister Hatelash | Sœur Fouet-de-haine | mulgore | 1412 | 11 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5785 |
| 3056 | Ghost Howl | Hurlement fantôme | mulgore | 1412 | 12 | 3 | Indicatif Classic | Classic hérité, preuve directe manquante | 3056 |
| 5863 | Geopriest Gukk'rok | Géoprêtre Gukk'rok | mulgore | 1412 | 19 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5863 |
| 5864 | Swinegart Spearhide | Swinegart Peau-de-lance | mulgore | 1412 | 22 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5864 |
| 4438 | Razorfen Spearhide | Lancepeau tranchebauge | razorfen-kraul | instance | 29 | 0 | Carte d’instance nécessaire | Classic hérité, preuve directe manquante | 4438 |
| 14271 | Ribchaser | Chasse-côtes | redridge | 1433 | 17 | 13 | Indicatif Classic | Classic hérité, preuve directe manquante | 14271 |
| 14272 | Snarlflare | Flamme-grogne | redridge | 1433 | 18 | 12 | Indicatif Classic | Classic hérité, preuve directe manquante | 14272 |
| 14270 | Squiddic | Squiddic | redridge | 1433 | 19 | 20 | Indicatif Classic | Classic hérité, preuve directe manquante | 14270 |
| 14269 | Seeker Aqualon | Aqualon le Chercheur | redridge | 1433 | 21 | 3 | Indicatif Classic | Classic hérité, preuve directe manquante | 14269 |
| 616 | Chatter | Bavard | redridge | 1433 | 23 | 14 | Indicatif Classic | Classic hérité, preuve directe manquante | 616 |
| 14273 | Boulderheart | Cœur-de-roche | redridge | 1433 | 25 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 14273 |
| 947 | Rohh the Silent | Rohh le Silencieux | redridge | 1433 | 26 | 13 | Indicatif Classic | Classic hérité, preuve directe manquante | 947 |
| 584 | Kazon | Kazon | redridge | 1433 | 27 | 4 | Indicatif Classic | Classic hérité, preuve directe manquante | 584 |
| classic-shadowfang-keep-deathsworn-captain | Deathsworn Captain | Capitaine lige-mort | shadowfang-keep | instance | 25 | 0 | Carte d’instance nécessaire | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| 12431 | Gorefang | Gorefang | silverpine | 1421 | 13 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 12431 |
| 12432 | Old Vicejaw | Vieux Mâchoire-de-vice | silverpine | 1421 | 14 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 12432 |
| 1920 | Dalaran Spellscribe | Copiste de Dalaran | silverpine | 1421 | 21 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 1920 |
| 2283 | Ravenclaw Regent | Régent Ravenclaw | silverpine | 1421 | 22 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 2283 |
| 1720 | Bruegal Ironknuckle | Bruegal Poing-de-fer | stockade | instance | 26 | 0 | Carte d’instance nécessaire | Classic hérité, preuve directe manquante | 1720 |
| classic-stonetalon-sister-rathtalon | Sister Rathtalon | Sœur Rancune-serre | stonetalon | 1442 | 19 | 0 | Zone seule · position inconnue | Classic hérité, preuve directe manquante | 5830 |
| classic-stonetalon-taskmaster-whipfang | Taskmaster Whipfang | Sous-chef Fouet-croc | stonetalon | 1442 | 22 | 4 | Documenté Forever (communautaire) | Forever (source communautaire) | 5932 |
| classic-stonetalon-foreman-rigger | Foreman Rigger | Contremaître Rigger | stonetalon | 1442 | 24 | 4 | Documenté Forever (communautaire) | Forever (source communautaire) | 5931 |
| stonetalon-pridewing-patriarch | Pridewing Patriarch | Patriarche Aile-fière | stonetalon | 1442 | 25 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| classic-stonetalon-sentinel-amarassan | Sentinel Amarassan | Sentinelle Amarassan | stonetalon | 1442 | 27 | 1 | Indicatif Classic | Classic sourcé | 5916 |
| classic-stonetalon-sorrow-wing | Sorrow Wing | Aile-de-chagrin | stonetalon | 1442 | 27 | 1 | Indicatif Classic | Classic sourcé | 5928 |
| classic-stonetalon-sister-riven | Sister Riven | Sœur Riven | stonetalon | 1442 | 28 | 1 | Indicatif Classic | Classic sourcé | 5930 |
| 5915 | Brother Ravenoak | Frère Chênecorbeau | stonetalon | 1442 | 29 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 5915 |
| classic-stonetalon-nal-taszar | Nal'taszar | Nal'taszar | stonetalon | 1442 | 30 | 1 | Indicatif Classic | Classic sourcé | 4066 |
| stonetalon-vengeful-ancient | Vengeful Ancient | Ancien vengeur | stonetalon | 1442 | 30 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| teldrassil-threggil | Threggil | Threggil | teldrassil | 1438 | 6 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| teldrassil-uruson | Uruson | Uruson | teldrassil | 1438 | 7 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| teldrassil-fury-shelda | Fury Shelda | Shelda la Furieuse | teldrassil | 1438 | 8 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| 14430 | Duskstalker | Traqueur du crépuscule | teldrassil | 1438 | 9 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 14430 |
| 14429 | Grimmaw | Grimmaw | teldrassil | 1438 | 11 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 14429 |
| teldrassil-blackmoss-the-fetid | Blackmoss the Fetid | Moussenoire le Fétide | teldrassil | 1438 | 13 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| classic-thousand-needles-gibblesnik | Gibblesnik | Gibblesnik | thousand-needles | 1441 | 28 | 1 | Indicatif Classic | Classic sourcé | 14427 |
| tirisfal-lost-soul | Lost Soul | Âme perdue | tirisfal | 1420 | 6 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| tirisfal-farmer-solliden | Farmer Solliden | Fermier Solliden | tirisfal | 1420 | 8 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| tirisfal-tormented-spirit | Tormented Spirit | Esprit tourmenté | tirisfal | 1420 | 8 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| 10356 | Bayne | Bayne | tirisfal | 1420 | 10 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 10356 |
| 1910 | Muad | Muad | tirisfal | 1420 | 10 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 1910 |
| tirisfal-ressan-the-needler | Ressan the Needler | Ressan le Harceleur | tirisfal | 1420 | 11 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | ID numérique à rechercher |
| 1911 | Deeb | Deeb | tirisfal | 1420 | 12 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 1911 |
| 10358 | Fellicent's Shade | Ombre de Fellicent | tirisfal | 1420 | 12 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 10358 |
| 10359 | Sri'skulk | Sri'skulk | tirisfal | 1420 | 13 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 10359 |
| 12433 | Krethis Shadowspinner | Krethis Tisse-l'ombre | tirisfal | 1420 | 15 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 12433 |
| 5912 | Deviate Faerie Dragon | Dragon féerique déviant | wailing-caverns | instance | 20 | 0 | Carte d’instance nécessaire | Classic hérité, preuve directe manquante | 5912 |
| 1424 | Master Digger | Maître terrassier | westfall | 1436 | 15 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 1424 |
| 519 | Slark | Slark | westfall | 1436 | 15 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 519 |
| 596 | Brainwashed Noble | Noble manipulé | westfall | 1436 | 18 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 596 |
| 599 | Marisa du'Paige | Marisa du'Paige | westfall | 1436 | 18 | 3 | Indicatif Classic | Classic hérité, preuve directe manquante | 599 |
| 506 | Sergeant Brashclaw | Sergent Griffe-hardie | westfall | 1436 | 18 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 506 |
| 520 | Brack | Brack | westfall | 1436 | 19 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 520 |
| 572 | Leprithus | Leprithus | westfall | 1436 | 19 | 3 | Indicatif Classic | Classic hérité, preuve directe manquante | 572 |
| 573 | Foe Reaper 4000 | Découpeur 4000 | westfall | 1436 | 20 | 20 | Indicatif Classic | Classic hérité, preuve directe manquante | 573 |
| 462 | Vultros | Vultros | westfall | 1436 | 26 | 16 | Indicatif Classic | Classic hérité, preuve directe manquante | 462 |
| 2090 | Ma'ruk Wyrmscale | Ma'ruk Écaille-de-wyrm | wetlands | 1437 | 23 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 2090 |
| 14425 | Gnawbone | Ronge-os | wetlands | 1437 | 24 | 4 | Indicatif Classic | Classic hérité, preuve directe manquante | 14425 |
| 1112 | Leech Widow | Veuve-sangsue | wetlands | 1437 | 24 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 1112 |
| 14424 | Mirelow | Mirelow | wetlands | 1437 | 25 | 6 | Indicatif Classic | Classic hérité, preuve directe manquante | 14424 |
| 2108 | Garneg Charskull | Garneg Brûlecrâne | wetlands | 1437 | 29 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 2108 |
| 1037 | Dragonmaw Battlemaster | Maître de guerre Gueule-de-dragon | wetlands | 1437 | 30 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 1037 |
| 14433 | Sludginn | Sludginn | wetlands | 1437 | 30 | 1 | Indicatif Classic | Classic hérité, preuve directe manquante | 14433 |

## Évaluation des sources et limites
- [Annonce du 24 septembre 2026](https://wowclassicforever.info/fr/news/rare-spawn-sets/) et [Wowhead (Humar, Swiftmane, Takk)](https://www.wowhead.com/forever/news/open-world-rare-spawn-item-sets-make-rares-more-valuable-in-forever-383053) : étayent l'association générale **d'objets d'ensemble** à ces rares, **pas leurs points précis**. L'attribution individuelle de butin et les probabilités restent hors périmètre.
- [ForeverDB, fiches de rare](https://foreverdb.net/rares) : certains points Classic consultables, très explicitement signalés comme hypothétiques pour Forever ; pages `/rare/<ID>` attachées uniquement aux 17 nouveaux points Classic. Les 292 anciennes coordonnées du catalogue n'ont pas de documentation par point vérifiée : elles n'ont **pas** été reclassifiées comme Classic « sourcé ».
- [Stillsixty, rare spawns Forever](https://www.stillsixty.com/rares) : positions précises et changements déclarés, preuve communautaire traçable, **pas** capture in-game individuelle. Le build et l'identité du personnage observateur n'y sont pas disponibles.
- [CurseForge RareNet](https://www.curseforge.com/wow/addons/rarenet) : annonce des spawns modifiés/new et des drops ; ce n'est pas une validation pixel/point indépendante des coordonnées de la page Stillsixty. Aucune donnée d'un autre serveur privé n'a été élevée au rang de preuve Forever.

## Validation / QA et incertitudes
Exiger avant fusion :
```bash
node scripts/check-data-quality.mjs
node --test tests/data-quality.test.mjs
node scripts/validate-rare-locations.mjs
node --test tests/rare-locations.test.mjs
```
Le workflow `.github/workflows/data-quality.yml` déclenche ces tests **uniquement en PR** sur les chemins concernés. Tests de régression : ID, zone/`uiMapID`, 0–100, preuve par point, build/date/source, refus de promotion par `seen_forever`, conflits, instance et absence de `/way` sans point. **Le contrôle des identités, niveaux, noms FR/EN, vraie zone et des positions des 292 anciennes références reste un travail de recherche manuel ; ce validateur ne prétend pas authentifier leur vérité géographique.**

Contrôle visuel demandé (non simulé, à réaliser en navigateur desktop et mobile FR/EN sur la PR) :
- Foreman Rigger : points Forever communautaires et filtre de fiabilité, bouton `/way` et lien direct.
- Vultros : coordonnées Classic indiquées seulement comme pistes.
- Sister Rathtalon : absence de point, conflit accessible et pas de `/way`.
- Bruegal Ironknuckle : statut d'instance et **aucune** carte extérieure.

**Risques :** anciennes références Classic éventuellement mal placées, conflit Sister/Akkrilus, mouvements de patrouille non représentés par des pins uniques, statut de présence non corroboré par capture, dates/builds de Forever non documentés, 34 noms-slugs dont l’ID numérique reste non établi (21 des 55 noms-slugs ont maintenant une référence d’ID Classic, pas Forever). Les taux de drop et timers n'ont volontairement pas été retouchés.

**Rollback :** annuler le commit de `data/rares.json` pour retirer le nouvel audit et les 25 points ajoutés, le petit correctif `assets/rares.js`, ainsi que le validateur, les tests et l'étape CI. Aucune synchronisation ni déploiement n'a été effectué. Ne pas fusionner sans revue du directeur technique.
