# ForEveroth — Guide Classic réadapté (bêta isolée)

## Périmètre et accès

- URL directe : **/lab/quetes/**, sans lien dans la navigation, la recherche globale, l'Explorer ou les sitemaps.
- Page **noindex,nofollow**. **Attention :** l'URL reste publiquement accessible sur GitHub Pages et ne constitue pas une page privée.
- Le **guide public** \`/quetes/\`, les datasets Classic et les autres modules ne changent pas.
- **Version Classic uniquement** ; aucune quête Forever inventée ni source Turtle.
- Page en français / anglais, URL partageable avec \`faction\`, \`race\`, \`level\`, \`variant\`, \`stage\` et \`lang\`.

## Philosophie

Cette version remplace le laboratoire de recalcul sur un journal manuel par un **guide éditorial simple**, à tester en jeu sur Classic.

Le joueur choisit faction, race, niveau actuel, puis la variante :
- **Sans donjons** : itinéraire extérieur et suppression des objectifs d'instance identifiés.
- **Donjons utiles** : même progression, avec une sélection de donjons à faire éventuellement **en une visite préparée**, selon la faction et la tranche de niveau : Gouffre de Ragefeu (Horde), Mortemines (Alliance), Cavernes des Lamentations, Donjon d'Ombrecroc, Profondeurs de Brassenoire (Horde). Les instances plus longues, plus hautes ou peu intéressantes dans la fenêtre actuelle sont écartées de cette **sélection éditoriale**. Ce n'est pas une liste exhaustive des donjons Classic.

La règle principale est **le niveau réel choisi par le joueur** : pour un niveau 8, aucune quête connue de niveau 9 ou 12 n'est proposée comme action de l'itinéraire. Cela s'applique aux quatre types d'action (prendre, objectif, rendre, prendre et rendre). Le niveau indiqué dans la base est un **niveau de quête**, pas le minimum requis : nous privilégions volontairement une règle prudente, pas une affirmation de prérequis exact. Les quêtes au niveau non documenté restent visibles avec un avertissement. Aucun calcul ne peut certifier une chaîne de prérequis complète avec les datasets actuels.

Les étapes utilisent les niveaux estimés du guide communautaire (au niveau actuel et précédent), les points X/Y Classic et les traductions locales. **Le parcours commence vers le niveau 5** : les zones de départ 1–4 ne sont pas couvertes dans la source existante. La sélection des étapes reste volontairement manuelle (précédent/suivant), sans journal à saisir ni progression à synchroniser.

## Optimisation géographique des objectifs

Le moteur \`guide-engine.js\` :
1. Résout les identifiants des quêtes, les variantes de chaîne \`p2,p3\` et les textes FR/EN.
2. Filtre les actions dépassant le niveau actuel.
3. Identifie les quêtes d'instance via le marqueur \`d\` du parcours et les lieux répertoriés dans \`curation.json\`, en conservant les phases de chaîne **hors instance** lorsqu'elles sont séparées.
4. **Regroupe uniquement des points d'objectifs consécutifs proches** dans une même étape / zone (rayon indicatif 9 points de coordonnée) ; aucune fusion des donneurs et des rendus qui pourrait casser la progression.
5. Conserve les positions individuelles du groupe (petits repères sur la carte) ainsi que les noms distincts : regrouper ne signifie pas inventer que deux objectifs sont sur le même monstre.
6. Ajoute des conseils spécifiques lorsque plusieurs quêtes connues se combinent réellement (notamment Sylvains de Teldrassil et sangliers de la Marche de l'Ouest).

Le moteur **ne change pas librement l'ordre de toutes les quêtes** et ne prétend pas résoudre mathématiquement tous les trajets interzones. Il améliore les déplacements **dans une même étape** et conserve le déroulé sûr du guide source. Les regroupements restent à tester en jeu.

## Objets et achats anticipés

\`curation.json\` distingue :
- \`quest\` : besoin de quête vérifié avec une source externe et un ID (ex. **Tube en bronze** pour Les étoiles #174, **Herbes aromatiques** pour Brochettes de loup #90, **Tromblon mortel** pour Lames du clan Warsong #6581, **Régime sec** #116).
- \`gather\` : objets à **conserver** pendant le passage (ex. 5 houblons des moissonneurs, 5 fioles d'huile suggérées par le guide).
- \`guide\` : simple achat conseillé par le parcours d'origine, pas un besoin vérifié.
- \`route\` : commodité facultative (ex. potion de rapidité pour un déplacement).

Les achats sont signalés **quelques niveaux avant leur usage**. Pour élargir la couverture sans inventer les besoins, \`guide-engine.js\` extrait également les notes explicites \`buy...\` et \`save ...\` des étapes communautaires à venir, au maximum **quatre notes**. Ces recommandations automatiques portent la mention « guide à vérifier » et ne sont jamais présentées comme des exigences prouvées.

Les textes des quêtes étant en partie hérités de guides communautaires, **il n'existe pas encore de vérification manuelle exhaustive des prérequis et objets pour toutes les quêtes 1–60**. Les ajouts validés sont enregistrés séparément avec leurs sources, afin d'être remplacés par les données Forever à mesure qu'elles deviennent fiables.

Références éditoriales des besoins vérifiés :
- https://www.wowhead.com/classic/quest=116/dry-times
- https://warcraft.wiki.gg/wiki/Look_To_The_Stars_%28Classic%29
- https://warcraft.wiki.gg/wiki/Seasoned_Wolf_Kabobs_%28Classic%29
- https://www.wowhead.com/classic/quest=6581/warsong-saw-blades

Référence pour la sélection des instances : https://www.wowhead.com/classic/guide/dungeon-quests-wow-classic

## Vérifications

Lancer sans dépendances, sans minute GitHub Actions :

\`\`\`sh
node lab/quetes/guide-engine.test.cjs
\`\`\`

La matrice couvre **6 profils × 56 niveaux (5–60) × 2 variantes**, soit **672 combinaisons**, plus les achats, les groupes, les niveaux et les cas d'erreur.

Après intégration : effectuer un **smoke test dans un navigateur** (niveaux, choix du profil, bascule de variante, navigation par étapes, zoom carte, liens d'objets) puis surtout **un test en jeu**. Les tests Node valident les règles du moteur, pas la présence réelle des PNJ / objets ou la qualité de l'ergonomie.

## Développement Forever futur

Le guide se compose de deux couches :
- Le moteur pur \`guide-engine.js\` traite des quêtes, zones, étapes et conseils.
- Les corrections / recommandations Classic validées sont externalisées dans \`curation.json\`, avec les sources.

Pour Forever, il faudra une couche de données **versionnée, sourcée et validée** qui remplace ou ajoute les quêtes, leurs niveaux, prérequis, PNJ et points de passage. **Il n'y a pas d'injection de données Forever aujourd'hui.** L'interface existante est une base à faire évoluer sans réutiliser un faux journal en temps réel.
