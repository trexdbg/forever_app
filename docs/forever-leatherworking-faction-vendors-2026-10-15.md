# Issue #58 — Patrons de travail du cuir Forever chez Daniel Stitchsong et Pawani

Audit documentaire du 15 octobre 2026. **Ajout de 36 IDs vérifiés individuellement et de 72 relations marchand → recette**. Priorité aux métiers des premiers niveaux de compétence ; aucune vérification directe dans le client n'est revendiquée.

## Sources indépendantes par PNJ et item

- [Daniel Stitchsong — marchand de travail du cuir des Carmines, vendeur Alliance](https://www.wow-professions.com/forever/npc/daniel-stitchsong) : tableau nominatif des recettes, professions, compétences, prix en Merchant's Favor, et lien vers les IDs Wowhead Forever de chaque article.
- [Pawani — marchand de travail du cuir des Tarides, vendeur Horde](https://www.wow-professions.com/forever/npc/pawani) : second tableau nominatif indépendant présentant **les mêmes 36 patrons** aux premiers paliers.
- Chaque ID est suivi dans le lien de l'objet individuel `https://www.wowhead.com/forever/item=<ID>` figurant dans le tableau des marchands. Aucun ID n'est déduit d'une plage numérique. Quelques fiches Wowhead se chargent difficilement : la source de la **relation PNJ→objet** reste le guide Forever nominatif correspondant, et son lien d'item constitue l'indice individuel d'identité.
- Exemples recoupés : [Brawler's Leather Belt #252765](https://www.wowhead.com/forever/item=252765), [Defender's Leather Gloves #252779](https://www.wowhead.com/forever/item=252779), [Wisdom's Leather Boots #252791](https://www.wowhead.com/forever/item=252791), [Totemic Leather Tunic #252808](https://www.wowhead.com/forever/item=252808).

## Périmètre de 36 recettes

Six modèles d'armure (Brawler, Defender, Stormrider, Totemic, Trapper, Wisdom), six emplacements distincts :

| Catégorie | Compétence Travail du cuir | Nombre de patrons |
| --- | ---: | ---: |
| Ceintures | 60 | 6 |
| Gants | 75 | 6 |
| Bottes | 85 | 6 |
| Chaperons | 100 | 6 |
| Tuniques | 110 | 6 |
| Jambières / kilts | 125 | 6 |
| **Total** | | **36** |

Les 72 liens de vente sont **documentaires Forever**, pas des achats en jeu. Chaque achat est sourcé avec **PNJ nommé, ID d'objet, profession, compétence, prix 30 Merchant's Favor, BoP, date du contrôle, type de preuve, build documentaire inconnu** et une note par association. Ce guide ne précise pas de rang de réputation pour ces 36 patrons : aucun rang n'est affirmé. Stocks, timer de repop, captures de vente et disponibilité du vendeur en jeu restent **inconnus**.

Les noms français de ces 36 objets ne sont pas attestés dans la vague : **fallback anglais** explicitement marqué `unverified_fallback_english`. Les icônes génériques de parchemin sont marquées `category_fallback` et non présentées comme des icônes extraites du client. Le niveau de compétence est le prérequis métier tel que publié dans la fiche, pas le seuil jaune ou un niveau requis de personnage.

## Mesures cumulées de la nouvelle branche

| Donnée | Avant | Après | Variation |
| --- | ---: | ---: | ---: |
| Marchands | 205 | 205 | 0 |
| Fiches d'objets vendus | 337 | **373** | **+36** |
| Offres marchand → objet | 779 | **851** | **+72** |
| Offres documentées Forever | 202 | **274** | **+72** |
| Offres Classic / inconnues | 577 | **577** | 0 |
| Objets liés dans « Où l'obtenir » | 649 | **685** | **+36** |
| Liens d'obtention globaux | 1 103 | **1 175** | **+72** |
| Liens documentaires Forever dans l'index | 339 | **411** | **+72** |
| Liens d'index Classic | 764 | **764** | 0 |

## Contrôles et retour arrière

- Le test `tests/forever-leatherworking-camps.test.mjs` fige chacun des 36 noms + IDs, chacun des 72 liens et preuves, prix et localisation documentaire des PNJ, noms FR non attestés, BoP, et garantit l'absence de promotion en `confirmed_in_game`.
- Les anciens tests des vendeurs, maîtres, rares et de l'index sont conservés avec les seuls totaux cumulatifs ajustés.
- CI attendue : `node scripts/check-npc-professions.mjs`, `node scripts/check-forever-evidence.mjs`, `node scripts/build-item-acquisition-index.mjs --check`, tests Node et rendu FR/EN mobile/desktop.
- Aucune modification des coordonnées, des rares, des quêtes Classic, ni import synchronisé de données beta.
- Rollback : revert de cette PR indépendante. Les catalogues et avertissements de provenance précédents ne changent pas.
