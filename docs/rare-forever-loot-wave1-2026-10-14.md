# Mission #59 — vague 1 des butins rares Forever documentés (palier 1–30)
Revue documentaire : 14/10/2026

## Résultats
- Avant : **47 / 150** fiches rares du palier 30 avec au moins un butin ; **103** sans butin.
- Après : **59 / 150** avec au moins un butin ; **91** sans butin.
- **12 associations rares → objet Forever nouvellement documentées**, 12 IDs objet exacts, 12 fiches auparavant vides enrichies.
- Le classement des 150 créatures est un **périmètre de références historiques niveaux 1–30**, et non la preuve que ces 150 rares apparaissent actuellement dans la bêta Forever.
- Coordonnées, minuteurs, `seen_forever`, tables Classic et autres modules **inchangés**.
- Les 12 taux de drop Forever restent **explicitement inconnus**. Les pourcentages affichés par Wowhead viennent d'échantillons communautaires qui peuvent évoluer, et ne sont pas repris comme taux définitifs.
- Noms français non attestés par le client ou une page frFR : **affichage provisoire du nom EN**, sans traduction inventée ; métadonnée `name_fr_status="unverified_fallback_english"`.

## Associations nouvelles et sources directes
| Monstre rare | Objet (ID) | Preuve documentaire |
| --- | --- | --- |
| Aean Swiftriver | Alliance Outrunner Bow (285347) | https://www.wowhead.com/forever/item=285347 |
| Thora Feathermoon | Alliance Outrunner's Sword (285346) | https://www.wowhead.com/forever/item=285346 |
| Hannah Bladeleaf | Alliance Outrunner Healing Rod (285348) | https://warcraft.wiki.gg/wiki/Alliance_Outrunner_Healing_Rod ; item https://www.wowhead.com/forever/item=285348 |
| Marcus Bel | Alliance Outrunner Staff (285350) | https://www.wowhead.com/forever/item=285350 |
| Taskmaster Whipfang | Whipfang's Skinsearer (284386) | https://www.wowhead.com/forever/item=284386 |
| Foreman Rigger | Foreman's Helm (284400) | https://www.stillsixty.com/rare/foreman-rigger-stonetalon-mountains ; item https://www.60.tools/items/284400-foremans-helm |
| Dishu | Cheetah Hide Grips (286533) | https://www.wowhead.com/forever/item=286533 |
| Silithid Harvester | Silithid Piercer (286534) | https://www.wowhead.com/forever/item=286534 |
| Thunderstomp | Thunderstomp's Horn (286537) | https://www.wowhead.com/forever/item=286537 |
| Felweaver Scornn | Felweaver's Staff (284287) | https://www.wowhead.com/forever/item=284287 |
| Hagg Taurenbane | Taurenbane's Family Cleaver (285328) | https://www.wowhead.com/forever/item=285328 |
| Shadowclaw | Serrated Shadowclaw (284174) | https://www.wowhead.com/forever/item=284174 |

## Degré de certitude
Chaque nouvelle liaison est `source_version=forever_beta`, `evidence_level=documented_forever`, `observed_build=unknown`, `evidence_kind=forever_community_page`, avec URL de l'affirmation spécifique, date et note de limites.

**Conflit de sources :** Wowhead Forever et stillsixty associent Alliance Outrunner Staff (285350) à Marcus Bel, tandis que [Forevercraft](https://www.forevercraft.app/items/285350) attribue l'objet à Aean Swiftriver. L'association à Marcus est conservée comme *documentaire contestée* et doit être vérifiée en jeu. Ce conflit ne modifie pas la relation Aean → Bow établie séparément.

**Point de vigilance :** Foreman Rigger → Foreman's Helm est un **signalement communautaire** ; une autre analyse rappelle que la table Wowhead de ce PNJ ne prouve pas cette association. L'objet 284400 existe dans les fiches du client Forever, mais sa provenance reste **non confirmée en jeu**. Aucun de ces enregistrements ne constitue une capture de loot in-game attribuée à un build.

Autres corroborations par guide communautaire Forever (non considérées comme preuves de gameplay individuelles) :
- https://www.stillsixty.com/rares
- https://www.60.tools/guides/rares
- https://foreverchanges.pro/rares

Les identités/coordonnées historiques des patrouilleurs Alliance dans les Tarides restent **Classic et indicatives**. Le nouveau loot Forever ne convertit pas leur emplacement en point confirmé. Le site affiche séparément les statuts des points et celui des butins.

## Tests
```sh
node scripts/check-data-quality.mjs
node --test tests/data-quality.test.mjs
node scripts/validate-rare-locations.mjs
node --test tests/rare-locations.test.mjs
node --test tests/rare-forever-loot-wave1.test.mjs
```
Nouveau test dédié et étape CI `data-quality.yml` uniquement pour les PR pertinentes. Validation dans GitHub Actions, sans requête externe durant la CI. **Aucun parcours navigateur ni test dans le client Forever n'est revendiqué.**

## Dépendance avec la PR #61
La PR #61 ajoute un index dérivé objet → source, actuellement basé sur l'ancien `main`. **Après intégration de cette vague dans `main`, l'index de la PR #61 devra être régénéré**, par `node scripts/build-item-acquisition-index.mjs --write`, avant son contrôle de drift si l'on souhaite que les 12 nouvelles associations apparaissent dans la recherche équipements. Pas de modification de la PR #61 par ce lot, pour éviter une collision multi-agent.

## Prochaines vagues
Intégrer les rares **nouveaux dans Forever** (notamment Zephras, Dro'zem en Redridge et Elmpaw) dans une PR séparée : ils ne sont actuellement pas dans les 150 références héritées. Ils demandent un traitement de zone/cartographie et d'identité distinct avant leur affichage au public. Poursuivre l'enrichissement des 91 fiches historiques sans butin avec des sources item→drop probantes spécifiques à Forever, ou conserver explicitement « pas de butin notable documenté ».

## Retour arrière
Revert de la PR : retire uniquement les 12 relations et les tests/doc nouveaux, sans réécrire les 150 rares, leurs positions ou les butins existants. Pas de publication/déploiement/sync.
