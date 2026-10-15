# ForEveroth — enrichissement massif des métiers, vague 1 (issues #55, #57, #58)
Date de collecte : 15 octobre 2026.

## Ce qui change
- **649 recettes** issues d'un snapshot documentaire d'un véritable client WoW Forever, sur les **12 métiers**, avec IDs sort et objets, **1 913 ingrédients quantifiés** et des seuils de couleur historiques.
- Parmi ces recettes : **317 nouvelles dans Forever**, **206 modifiées par rapport à Classic**, **124 inchangées dans cet ancien client**, **2 héritées**.
- **382 identifiants d'objets-recettes liés à leur sort**, dont **161 pistes de marchands reliées au catalogue de PNJ existant**. Parmi ces relations, **25 sont étiquetées comme vente Forever documentée dans la base marchands** ; **136 demeurent des indications Classic**. On ne transforme jamais le simple fait qu'une recette existe en preuve que le vendeur l'a en stock.
- Nouveau catalogue FR/EN facultatif, visible dans les pages Métiers, entièrement local et chargé à l'ouverture. Recherche du nom, ID objet, ID sort, ingrédient, marchand ; filtrage des 12 métiers et de la différence par rapport à Classic ; détails du coût en composants, provenance et liens.
- Les deux anciens aperçus limités à **8 recettes d'ingénierie et 6 d'alchimie** ne sont PAS modifiés, ni publiés autrement. Ils conservent les éventuels conflits documentaires actuels, indépendants de l'extraction historique.

## Source exacte
- Projet communautaire https://github.com/MAF2414/wow-forever-talents
- Données extraites https://github.com/MAF2414/wow-forever-talents/blob/main/docs/professions-data.json
- Archive build **1.60.1.69876**, date du snapshot **17 septembre 2026**, antérieure au référentiel courant 1.60.1.70338 (10 octobre 2026).
- Extraction **sans enregistrement saisonnier ni sort absent** ; uniquement records kind=recipe/enchant, avec au moins une sortie et un composant, seuil jaune historique 1–150 et niveau d'utilisation de sortie renseigné ≤30 lorsqu'il est disponible. Ce filtre est une **priorisation de métiers et d'objets pour le palier bas niveau**, **pas une preuve qu'une recette est accessible en jeu au niveau 30**.

## Sémantique des sources : Forever > Classic sans fausse confirmation
- Chaque sort conservé est une **preuve du contenu de l'ancien client** (`evidence_level: datamined`, build historique et URL de l'extraction). Ni présence sur le serveur actuel ni expérience en jeu prouvées.
- `skill_yellow_archive` et `skill_grey_archive` viennent du tableau de couleur de l'ancien client ; `skill_green_archive = null` si la source d'extraction ne sépare pas le seuil. **`learning_skill_required = null`** : le champ historique `minimumSkillField` n'est pas une certification de niveau d'apprentissage.
- `reported_client_output_quantity` = sortie affichée dans l'ancien snapshot lorsque la valeur est non ambiguë ; **`verified_live_yield = null`**. Exemple : **Tube en cuivre (sort 3924)** : quantité archive 1 ; l'aperçu de recherche existant garde explicitement le conflit de rendements 1/2. Aucun écrasement de ce conflit.
- Les noms français ne sont pas connus de cette extraction, donc `name_fr = null`, **jamais de traduction inventée**. L'interface peut demander au système de traductions existant le nom FR d'un objet, mais cela reste une référence, pas une chaîne officielle attestée par le snapshot.
- `vendor_references[]` recopie uniquement les relations plan/objet d'un vendeur déjà indexé dans `data/npcs.json`, sans créer de NPC, coordonnées, prix, stock ni restock fictif. Seule l'affirmation **vendeur–plan exact** dispose de son statut `documented_forever` ou `classic_reference` spécifique, et de l'URL d'origine.
- Une recette apprise ailleurs (butin, PNJ, quête, exploration, faveur) peut être documentée dans les sources sans apparaître dans `vendor_references` ; aucune absence de vendeur n'implique une impossibilité de l'obtenir.

## Limites et suite
- Il s'agit d'une **archive client plus ancienne** et non de 649 nouvelles observations d'un build actuel. Des recettes peuvent avoir été supprimées, modifiées ou rééquilibrées après septembre.
- Le corpus est relativement large (environ 1,4 Mo) et est **chargé uniquement à l'ouverture**, pour limiter le poids de la page Métiers.
- La source ne démontre pas qu'une classe/faction spécifique maîtrise un sort, un taux de rendement en jeu ou la présence actuelle chez un marchand.
- La recherche est une première interface de découverte ; la validation navigateur réelle et l'accessibilité de tous les détails sont à réaliser avant toute publication.
- Prochaine vague #57 : recopier et vérifier séparément des lots directement depuis **Forever 1.60.1.70338**, avec les seuils et les changements documentés par https://wowforevertalents.com/professions/, en donnant priorité à **Ingénierie, Alchimie, Forge, Couture et Cuisine**. Prochaine vague #58 : collecter les marchands réellement spéciaux Forever et lier leurs listes de recettes exactes.
- Aucun fichier Classic existant n'a été effacé ou requalifié automatiquement. Aucun synchroniseur, déploiement, Action de publication ni API réseau n'est lancé par le commit.

## Tests
```sh
node --check assets/recipes-early.js
node --test tests/early-forever-recipes.test.mjs
node scripts/check-data-quality.mjs
node scripts/check-npc-professions.mjs
node scripts/check-forever-evidence.mjs
```
CI automatique read-only de la PR : `.github/workflows/early-forever-recipes.yml`. Voir rapports et statut de la PR avant fusion.
