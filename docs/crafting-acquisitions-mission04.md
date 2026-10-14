# Agent 03 — Mission 04 / sources d'obtention, fonte et composants (niveau 1–30)

**Date de consultation : 2026-10-14.** Base `main` : `3a0485b2555fc3ad87d6a4e1003fbbfb2846db3b` (PR #44 fusionnée). **Périmètre : recherche et prévisualisation documentaire opt-in**, ni obtention constatée en jeu ni promotion de références Classic.

## Résultat chiffré

- Le même fichier `data/crafting-chains-beta.json` contient désormais **21 identités d'objets** (+5), **8 recettes d'ingénierie inchangées**, **12 arêtes d'ingrédients d'ingénierie** ; **15 sources d'obtention** (7 précédentes, avec 4 candidats de fonte remplacés par des sources documentaires, +1 fonte d'étain, +6 sources de filon, +1 piste Classic d'étoffe de laine).
- **5 fontes** identifiées par sort, métier, forge, composants et quantités d'entrée ; **6 associations filon→matière** documentées sur un guide spécifiquement Forever (minerai et pierre) ; **0 marchand confirmé en jeu Forever**, **0 prix ou stock Forever certifié**, **0 emplacement exact de filon prouvé dans cette mission**.
- Chaque nouvelle fonte conserve **`output_quantity=null` et `output_quantity_status=conflicting_sources`**, chacune avec deux publications précises. L'index Forever Talents et la fiche Wowhead Forever divergent parfois ; le rendement de sortie ne sert donc jamais à calculer un coût ni des quantités totales.
- **0 recette d'ingénierie modifiée**, **0 recette d'alchimie ajoutée**. La prévisualisation reste volontaire et non présentée comme catalogue « live » : `scope.status=research_only_not_published`, `scope.preview.status=opt_in_documentary_preview`.

## Chaîne 4371 — Tube en bronze

```text
4371 Tube en bronze (ingénierie 3938 ; rendement inconnu)
 ├─ 2841 Barre de bronze ×2
 │   └─ Fonte du bronze (Minage, sort 2659, forge, jaune 65, compétence d'apprentissage inconnue)
 │       ├─ 2840 Barre de cuivre ×1
 │       │   └─ Fonte du cuivre (2657, connue au début de Minage, jaune 25)
 │       │       └─ 2770 Minerai de cuivre ×1
 │       │           └─ Filon de cuivre (source Forever documentée, minage 1 ; coordonnées inconnues)
 │       └─ 3576 Barre d'étain ×1
 │           └─ Fonte de l'étain (3304, jaune 50, niveau d'apprentissage inconnu)
 │               └─ 2771 Minerai d'étain ×1
 │                   └─ Filon d'étain (source Forever documentée, minage 65 ; coordonnées inconnues)
 └─ 2880 Catalyseur léger ×1
     └─ Références de vendeurs Classic seulement : aucune vente Forever vérifiée
```

La [table client Forever Talents, Minage](https://wowforevertalents.com/professions/mining/) précise **2657, 3304, 2659** et les quantités d'entrée de ces procédés (respectivement **1 minerai de cuivre**, **1 minerai d'étain**, **1 barre de cuivre + 1 barre d'étain**). **La compétence du maître n'est pas exposée par le client** : le jaune (respectivement **25, 50, 65**) n'est pas une preuve du niveau requis pour apprendre la fonte. Le [guide Forever Wowhead, Minage](https://www.wowhead.com/forever/guide/professions/mining/overview-leveling) décrit explicitement **Copper Vein → Copper Ore / Rough Stone** et **Tin Vein → Tin Ore / Coarse Stone**, avec une liste de zones indicative, non des points de spawn vérifiés.

**Désaccord sur les quantités produites :** le tableau Forever Talents affiche **1 barre de cuivre**, **1 barre d'étain** et **2 barres de bronze** ; les pages Forever de Wowhead affichent, dans une partie de la fiche, des sorties **2, 2 et 3** respectivement. La [fiche du sort 2659](https://www.wowhead.com/forever/spell=2659/smelt-bronze) contient elle-même des variantes entre son texte descriptif et son affichage de produit. Aucune de ces divergences n'est arbitrée : `output_quantity=null`.

## Chaîne 4389 — Gyrochronatome

```text
4389 Gyrochronatome (ingénierie 3961 ; rendement inconnu)
 ├─ 3575 Barre de fer ×1
 │   └─ Fonte du fer (Minage, sort 3307, forge, jaune 130, niveau d'apprentissage conservé inconnu)
 │       └─ 2772 Minerai de fer ×1
 │           └─ Gisement de fer (source Forever documentée, minage 125 ; pas de point garanti)
 └─ 10558 Batterie en or ×1 (ingénierie 12584, rendement inconnu)
     └─ 3577 Barre d'or ×1
         └─ Fonte de l'or (Minage, sort 3308, forge, jaune 170, niveau d'apprentissage conservé inconnu)
             └─ 2776 Minerai d'or ×1
                 └─ Filon d'or (source Forever documentée, minage 155 ; pas de point garanti)
```

Sources indépendantes [Forever Talents](https://wowforevertalents.com/professions/mining/), [Fonte du fer 3307 sur Wowhead Forever](https://www.wowhead.com/forever/spell=3307/smelt-iron), [Fonte de l'or 3308 sur Wowhead Forever](https://www.wowhead.com/forever/spell=3308/smelt-gold) et [guide des filons Forever](https://www.wowhead.com/forever/guide/professions/mining/overview-leveling). Les valeurs de la colonne « jaune » sont **130** et **170**, **pas** l'affirmation d'un PNJ qui enseigne à ces seuils. Les sorties de fonte affichées **1** dans l'index et **2** dans les fiches de sort restent des sources contradictoires. De même, les rendements de la Batterie en or (PR #42) demeurent inconnus.

## Autres composants du lot

| Objet | Mode d'obtention documentaire | Limites conservées |
| --- | --- | --- |
| 2835 Pierre brute / Rough Stone | **Filon de cuivre** dans le [guide Minage Forever](https://www.wowhead.com/forever/guide/professions/mining/overview-leveling) | Pas de rendement ni drop rate |
| 2836 Pierre grossière / Coarse Stone | **Filon d'étain** dans le même guide | Pas de rendement ni drop rate |
| 2840 Barre de cuivre | Fonte du cuivre **2657** → 2770 | Sortie contradictoire |
| 2592 Étoffe de laine | Indice de butin sur des humanoïdes dans le [guide Classic](https://www.wowhead.com/classic/guide/classic-cloth-farming-linen-wool) | **`classic_reference`**, aucune créature ni loot Forever prouvés |
| 2880 Weak Flux / Catalyseur léger | [Fiche Forever de l'objet](https://forevercompass.com/items/2880), [index marchands WowSeer](https://wowseer.gg/items/Weak_Flux_2880) | L'objet/le sort utilisent 2880, mais la table de vendeurs est héritée de Classic. Aucun vendeur particulier, aucune transaction/prix/stock/location en jeu prouvés sur Forever |

Le [guide de minage Forever publié le 9 octobre](https://www.wowhead.com/forever/guide/professions/mining/overview-leveling) fournit des **exemples de zones** : cuivre (Dun Morogh, Elwynn Forest, Durotar), étain (Loch Modan, Ashenvale, Westfall), fer et or (Arathi Highlands, Desolace, Stranglethorn Vale). Les zones sont des indices documentaires de prospection, **pas des coordonnées ni des spawns individuellement vérifiés**. On ne modifie ni les cartes ni le catalogue Minage des autres agents.

## Provenance et séparation des assertions

Chaque acquisition documentée possède sa propre ligne dans `acquisitions[]`, avec ses six champs `source_url`, `evidence_url`, `observed_at`, `observed_build`, `evidence_kind`, `evidence_note` ; elle reste `verified_for_forever:false` et `available_in_game:null` lorsqu'applicable. `documented_forever` signifie uniquement qu'une publication précisément liée à Forever décrit la fonte/filon — pas que le joueur l'a réalisé. La recette, la couleur, la source du minerai et la vente sont des assertions séparées. L'ancien marchand PNJ-objet Classic n'est pas recertifié par l'existence de l'objet dans la bêta.

Pour les fontes de mineur, `skill_required_status=trainer_requirement_not_in_client` et `skill_required:null` lorsque la documentation client ne prouve pas le seuil du maître. **Smelt Copper** est indexé « Known from the start », donc la compétence de départ **1** est indiquée comme **documentaire**. Les sorties sont conservées `null`, même lorsque les candidats existent ; aucune formule implicite ne calcule les besoins totaux.

## Interface FR/EN

Les liens `?craft=2841`, `?craft=3576`, `?craft=3575`, `?craft=3577`, `?craft=2770`, `?craft=2771`, `?craft=2772`, `?craft=2776` ouvrent les **fiches d'ingrédients internes déjà associées à la prévisualisation**. Les huit recettes d'ingénierie restent seules dans les résultats de recherche ; les ingrédients ne sont accessibles que par sélection ou lien profond. Une barre affiche :
- Fonte documentée Forever, nom de sort, métier Minage, besoin de forge, **jaune distinct du niveau d'apprentissage**, quantités d'entrée et liens HTTPS des deux rendements contradictoires ; les ingrédients sont cliquables.
- Filon documenté, compétence de récolte indiquée dans le guide, quelques zones **sans pointeur ou coordonnées inventés**, lien vers le guide Forever.
- Objet sans source suffisante : « Source d'obtention non vérifiée sur Forever » ; vendeur/butin Classic explicitement qualifiés de pistes non confirmées.

Le DOM reste construit uniquement par `document.createElement` / `textContent` ; les URL des preuves sont filtrées HTTPS et les liens gardent `noopener noreferrer`. Les versions FR/EN et la carte des maîtres ne sont pas modifiées. Les fichiers `assets/global-search.js`, `assets/npcs.js`, `data/npcs.json` et les routes générales ne sont **pas** changés.

## Tests, vérification, rollback

Les tests natifs de crafting couvrent les **5 fontes**, les **6 liens de filons**, la provenance exacte et la détection de cycles d'ingénierie/fonte, les rendements `null`, valeurs inconnues, erreurs de composants, noms FR/EN, restrictions Classic. Les tests UI suivent les sous-recettes en FR/EN, les URLs profondes et la non-promesse sur les vendeurs. Le navigateur Chromium PR-only existant couvre FR/EN à **1440px et 375px**, focus clavier, carte, absence de débordement et captures.

Commandes GitHub Actions :
```sh
node scripts/check-crafting-chains.mjs
node --test tests/crafting-chains.test.mjs
node --test tests/crafting-beta-ui.test.mjs
node scripts/check-npc-professions.mjs
node --test tests/npc-professions.test.mjs
node scripts/check-data-quality.mjs
node --test tests/data-quality.test.mjs
node scripts/check-crafting-visual.mjs
```

**État de vérification :** voir les deux exécutions CI sur le HEAD final de la PR (aucun résultat anticipé ici). Aucun workflow de publication ajouté. Les avertissements historiques restent distincts des erreurs nouvelles. Plan de retour arrière : revert de cette branche sur les seuls catalogues de recherche, JS/CSS de la prévisualisation, validateurs et tests/documentation, sans altérer les autres modules.

**Mission autonome, PR en brouillon, sans fusion, synchronisation ni déploiement.**
