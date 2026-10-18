# Quêtes Forever — reprise de #32, elfes de la nuit 1–10

Atelier isolé : `/lab/quetes-forever/` (`?lang=en` pour l'anglais). Aucun lien entrant, aucune entrée sitemap, aucun changement du guide public Classic. `noindex,nofollow` ne rend pas une URL privée. La PR #32 a été fusionnée le 12 octobre puis son pilote retiré ; cette suite part du main actuel et réutilise le rendu carte/frise/recherche du module Classic, sans réactiver son ancienne bascule publique.

## Parcours et comportement

- Catalogue : 42 quêtes Teldrassil de niveau de quête ≤10, consultées individuellement sur ForeverDB le 18 octobre 2026. La liste des quêtes et les fiches détaillées peuvent différer : le niveau détaillé de Twisted Hatred #932 est **8**, celui de l'index est 7 ; priorité à la fiche détaillée.
- Route directe et variante avec Ban’ethil/Darnassus. Séquence éditoriale, pas solveur global ; proximité utilisée pour choisir un lieu documenté par composant et regrouper uniquement des actions adjacentes à coordonnées identiques. Chaque zone garde sa carte.
- Tous les composants documentés restent indiqués. Une position de vendeur n'est pas présentée comme une zone de combat. Les localisations inconnues deviennent des éléments à préparer, sans coordonnées inventées.
- Prises et rendus des chaînes respectés ; les détours retirent également les prises inutiles. Livraison chronométrée de l'antidote sans détour. Les quêtes de niveau >10, les missions de classe et le bon Collector #5842 ne sont pas proposés.
- Les niveaux des chapitres sont des repères éditoriaux, pas une simulation d'XP ; le sélecteur saute à une étape et ne lit pas le niveau du jeu.
- « Quête(s) rendue(s) » enregistre uniquement les rendus choisis. Les quêtes terminées disparaissent, leurs suites restent accessibles. Journal local, indépendant de WoW, non inclus dans les URL ; réinitialisation possible. Variante/langue/étape partageables.
- #87288 et #99046 : le lieu de prise n'est pas documenté. Le joueur les active dans « Quêtes Forever déjà dans mon journal ». Sans cette indication, aucune prise ni quête dépendante n'est inventée. La chaîne #99046 → #99047 → #99050 est alors intercalée dans la boucle nord et le retour au lac.

## Sources et limites

Point de départ : https://foreverdb.net/quests/teldrassil ; données annoncées du client 1.60.1.70450, extraction du 17 octobre. Chaque entrée conserve son URL précise, date de consultation, build et note de provenance. Les positions gardent leur statut individuel `classic_reference` ou `documented_forever`. Même si ForeverDB dit « seen in Forever », il s'agit ici d'un rapport communautaire, jamais d'une confirmation personnelle en jeu.

Corrections par rapport à #32 :

- https://foreverdb.net/quest/87288-soft-saber-pelts : **Aldia**, 55.4 / 57.2 ; 6 peaux ; lieu de prise/source de butin absents.
- https://foreverdb.net/quest/99046-the-lost-runner : Eralya 37.6 / 36.9 ; aucun lieu de prise.
- https://foreverdb.net/quest/99047-not-dead-yet : Eralya → Byancie 55.3 / 56.8.
- https://foreverdb.net/quest/99050-the-great-tree-provides : 6 Dewy Lasher Fronds, 1 Empty Vial, 1 Refreshing Spring Water ; fiole auprès de Narret 55.3 / 57.1, feuilles au lac, rendu à Byancie. Aucun vendeur d'eau inventé, aucune XP fixe extrapolée d'un niveau observé.
- #97977 de l'ancien pilote n'est pas étayée par le catalogue actuel ni par sa fiche générique https://foreverdb.net/quest/97977 (aucun titre/niveau/lieu). Elle reste une piste historique de #32, sans route opérationnelle ni déclaration de suppression en jeu.
- La position du puits #921 provient de l'introduction Classic de #32, basée sur https://www.joanasworld.com/alliance-1-12-teldrassil.php ; ForeverDB ne donne pas de position d'objectif pour cette fiole. Le point conserve cette provenance Classic et son lien propre.

Les noms français proviennent du catalogue Classic et de l'ancien pilote, sinon repli anglais ; aucun nouveau nom français officiel revendiqué. Les noms de composants restent en anglais lorsque leur traduction n'est pas établie. Le jeu reste à tester pour la difficulté, l'XP cumulée, la disponibilité et les trajets dans les grottes ; les segments entre points ne sont pas des chemins navigables garantis.

## Vérification / retour arrière

`node --test lab/quetes-forever/route-engine.test.cjs` : variantes, coordonnées sourcées, chaînes, progression, composants, absence de faux donneurs et livraison chronométrée. Workflow PR limité à ce répertoire, sans publication ni synchronisation. Contrôles QA du dépôt inchangés : 11/11 datasets, 0 erreur, 584 avertissements historiques avant/après ; 12 tests QA réussis. Aucun changement de donnée dans ces 11 catalogues publics.

Retour arrière : revert de la PR, aucun état serveur ni migration. La clé locale `forever-nelf-route-v1` peut être effacée via le bouton de réinitialisation.

Validation supplémentaire : simulation DOM FR/EN réussie (rendu, variante, chaîne Forever, recherche, sélection carte, rendu/réinitialisation). Les 24 invariants du laboratoire Classic passent également. Chromium absent ; téléchargement du navigateur bloqué dans cet environnement, donc aucun contrôle visuel navigateur ni validation en jeu revendiqué.
