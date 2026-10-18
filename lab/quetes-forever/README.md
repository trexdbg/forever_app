# Quêtes Forever — reprise de #32, elfes de la nuit 1–10

Atelier isolé : `/lab/quetes-forever/` (`?lang=en` pour l'anglais). Aucun lien entrant, aucune entrée sitemap, aucun changement du guide public Classic. `noindex,nofollow` ne rend pas une URL privée. La PR #32 a été fusionnée le 12 octobre puis son pilote retiré ; cette suite part du main actuel et réutilise le rendu carte/frise/recherche du module Classic, sans réactiver son ancienne bascule publique.

## Parcours et comportement

- Catalogue : 42 quêtes Teldrassil de niveau de quête ≤10, consultées individuellement sur ForeverDB le 18 octobre 2026. La liste des quêtes et les fiches détaillées peuvent différer : le niveau détaillé de Twisted Hatred #932 est **8**, celui de l'index est 7 ; priorité à la fiche détaillée.
- Route directe et variante avec Ban’ethil/Darnassus. Séquence éditoriale, pas solveur global ; proximité utilisée pour choisir les lieux documentés par composant et regrouper des lots d’objectifs voisins en conservant chaque position (voir révision v2 ci-dessous). Chaque zone garde sa carte.
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

## Révision des secteurs et du parcours — 18 octobre (v2)

Retour joueur : les objectifs proches doivent être combinés et les lieux de monstres distingués des zones générales de quête.

Corrections concrètes :

- L'importeur initial associait à tort les zones générales d'objectif placées après le dernier composant HTML à ce composant. Les associations de composants ont été relues dans les fiches originales : aucune position de vendeur/monstre pour l'eau de source #99050 ; Rune of Nesting uniquement au Chest of Nesting 44.4/60.7, pas aux autres coffres. Les anciennes observations de zone restent dans `locations.objectives`, séparées des relations composant → lieu.
- Les conseils d'un point citent ses seuls composants, pas tous les composants de la quête. La fiole est préparée à Dolanaar avant de partir chercher les feuilles ; l'eau reste une préparation sans vendeur inventé.
- L'antidote #3521 est pris dès le retour d'Iverron, avant la collecte de venin. La mousse #459 est conservée pour le passage au nord : #457/#459/#3521 se regroupent dans un secteur dont tous les repères sont à ≤5 points de carte les uns des autres. L'ichor #3521 et le venin #916 partagent le même repère d'araignées 56.4/30.3. L'œuf exige toujours le rendu préalable du venin ; la livraison chronométrée n'est jamais interrompue.
- #918/#919 (graines et pousses) partagent un secteur au lac avec leurs deux positions originales. La boucle Zenn choisit conjointement les trois lieux de composants et leur ordre, avec retour au donneur : plus de détour ouest entre deux objectifs à l'est.
- #2541 : les coordonnées de chamans listées par ForeverDB sont hors des tumulus et comprennent des projections sur Darnassus. Elles sont conservées dans les sources, mais le parcours utilise le repère d'entrée Classic 43/58 du parcours existant et une consigne à l'intérieur de Ban’ethil. Ce point est explicitement une entrée, jamais présenté comme une apparition exacte de chaman. Prendre la quête d'Oben avant le regroupement avec les reliques.

Les regroupements ne concernent que des lots d'objectifs déclarés éditorialement. Aucun déplacement d'une prise, d'un rendu ou d'une chaîne n'est décidé par simple proximité. Rayon borné entre toutes les paires de membres (pas seulement par rapport au centre) ; entrée de grotte et apparitions ne fusionnent pas. Un secteur garde chaque coordonnée, composant, source et type de preuve ; tous ses petits repères sont dessinés et cliquables, les commandes individuelles restent visibles. Le point principal est un repère d'un secteur, pas une prétention que tous les monstres apparaissent au même endroit.

Le choix de points de Zenn est une recherche géométrique bornée, pas un calcul de trajet navigable. Les niveaux restent des repères éditoriaux ; ni mesure d'XP ni validation des apparitions en jeu revendiquée. Noms de composants en repli anglais lorsque leur traduction n'est pas établie.

Validation de cette révision : 10 tests du moteur (dont triple quête, séparation des composants, vrai coffre, entrée des tumulus, boucle Zenn), 12 tests QA, contrôle Chromium FR/EN ordinateur et mobile avec points du groupe visibles ; aucun changement du guide Classic public. Audit avant/après : 0 erreur et 584 avertissements historiques.
