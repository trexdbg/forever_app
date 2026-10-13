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

Les étapes utilisent les niveaux estimés du guide communautaire (au niveau actuel et précédent), les points X/Y Classic et les traductions locales. **Le parcours commence vers le niveau 5** : les zones de départ 1–4 ne sont pas couvertes dans la source existante. La sélection des étapes reste volontairement manuelle (précédent/suivant), sans journal à saisir ni progression à synchroniser. Lorsque le guide d'origine place un donjon trop tôt, la variante « Donjons utiles » ajoute un **chapitre facultatif de donjon au niveau conseillé**, sans déplacer artificiellement ses quêtes vers le parcours solo. Chaque donjon possède une courte liste de préparation de chaînes de quêtes.

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

## Expérience Classic : données sourcées vs estimations

Pour éviter un guide irréaliste, le laboratoire possède une **table des XP nécessaires pour chaque niveau Classic (1–59)** et un **premier catalogue vérifié de 17 récompenses de quêtes de Teldrassil** (\`xp-classic.json\`, IDs et liens vers les fiches sources). Aucun XP de quête Forever n'est inféré.

Le nombre affiché sur chaque quête est une **récompense de référence Classic à la validation**, non l'XP déjà obtenue lors de la prise de quête. Les sous-totaux de secteur ne comptent que les actions **rendre** et **prendre et rendre** avec XP documentés ; une même quête n'y est comptée qu'une fois. Le sous-total reste **incomplet** dès qu'un rendu ne figure pas dans le catalogue, et les XP des monstres ne sont jamais inventés.

Le guide ne connaît pas l'XP actuellement accumulée par le personnage à l'intérieur du niveau indiqué. Par exemple, un niveau 5 nécessite 2 800 XP pour passer au niveau 6, **pas obligatoirement 2 800 XP supplémentaires depuis sa position réelle**. L'XP des monstres peut varier avec leur niveau, le repos, le groupe et les réglages du serveur. Les récompenses de quêtes peuvent être réduites si le joueur les rend en étant trop haut niveau.

Les divergences de source sont conservées explicitement : pour la quête 919, WCLBox affiche **800 XP** et Wowhead Classic **790 XP** ; pour la quête 932, ClassicDB indique **625 XP** (niveau 7), tandis qu’une fiche WCLBox plus récente affiche **700 XP** (niveau 8). Nous présentons des valeurs propres aux sources identifiées, sans prétendre résoudre ces écarts sans validation en jeu.

**Sources :**
- Tableau de niveau Classic : https://wowpedia.fandom.com/wiki/Experience_to_level
- Récompenses par quête : https://wowforever.wclbox.com/en/renwu/488, https://wowforever.wclbox.com/en/renwu/918, https://wowforever.wclbox.com/en/renwu/929 (et liens propres à chaque ID dans le JSON).
- Contre-vérification de la quête 919 : https://www.wowhead.com/classic/quest=919/timberling-sprouts

**Prochaine validation en jeu :** relever l'XP affichée avant/après chaque rendu, les kills effectivement nécessaires pour chaque quête et l'XP de combat, puis comparer cette somme à la progression de niveau. Ne pas utiliser les chiffres fractionnaires \`experience\` de VanillaQuesting comme des récompenses XP vérifiées.

## Relecture comme un joueur : Elfe de la nuit, niveaux 5–10

**Couverture éditoriale approfondie pour cette livraison : Elfe de la nuit (Alliance) uniquement.** Les cinq autres profils continuent d’utiliser l'ancien parcours Classic filtré par niveau ; ils ne sont pas encore audités quête par quête. Ce travail constitue une **simulation du déroulement en jeu à partir des données Classic**, pas le récit d'une session réelle effectuée sur un client de jeu.

L’interface charge \`playbook-nelf-5-10.json\` uniquement avec la race/profil \`nelf\` et un niveau de 5 à 10. Ce cahier de route remplace alors la sélection automatique de tranches \`experience\` par **17 chapitres ordonnés / 44 arrêts**, avec instructions FR/EN, points X/Y du guide historique et les **24 identifiants Classic** réellement utilisés. Au niveau 8, l’interface sélectionne d’abord le premier chapitre de niveau 8, tout en laissant les précédents accessibles en remontant la liste. Le changement « Sans donjons / Donjons utiles » reste disponible, mais il n'y a **aucun donjon dans Teldrassil aux niveaux 5–10**.

La séquence jouée, vérifiée par un test d’états successifs :
- **5** : quitter Sombrevallon avec la Couronne, récupérer la livraison de Porthannius, faire les trois butins de Zenn **sur le même circuit**, rendre livraison et Couronne à Dolanaar, faire la fiole près de Dolanaar en chemin vers Denalan.
- **6** : accepter le rapport à Gaerolas et le Capteur de rêves **avant un unique passage à Brise-étoile**, puis rendre les deux au retour. Les quêtes de niveau 7 restent hors du parcours strict même si leur minimum d'acceptation est inférieur.
- **7** : prendre **Graines et Pousses** ensemble à Denalan, les collecter sur **les mêmes sylvains**, les rendre en même temps et garder le message vers Rellian jusqu'au passage de Darnassus ; regrouper les cônes de Zenn avec le secteur de Fel Rock. Lord Melenas est difficile en solo et n'est pas un verrou de progression.
- **8** : faire le bijou de Ferocitas dans le secteur est, puis les embusqués de la route ouest. Éviter de traverser les deux côtés de la carte plusieurs fois pour le même objectif.
- **9** : accepter les Reliques en amont, puis préparer et rendre la Couronne 933. Faire l'aller-retour Darnassus → rivière Wellspring → Darnassus pour **Rellian puis Tumeurs dans cet ordre**. Ne pas descendre au Terrier trop tôt.
- **10** : **une seule entrée au Terrier de Ban’ethil** pour les quatre reliques, Le druide endormi et Le druide de la Griffe (suite prise sur place), rendre les reliques à Dolanaar, faire la livraison du Temple de la Lune. La suite de Nessa et le vol vers Auberdine sont affichés comme **facultatifs** si le joueur quitte la zone, sans forcer un départ niveau 10.

Les \`requirements\` du cahier de route documentent les minima Classic d'acceptation et les IDs de quêtes précédentes issus de [TyrsDev/WoW-Classic-Quests](https://github.com/TyrsDev/WoW-Classic-Quests) ; ils ne sont **pas des preuves de compatibilité Forever**. Exemple : **Ordres de Zenn (488)** est de niveau de quête 5 mais demande seulement le niveau 4 ; **Graines des sylvains (918)** est de niveau de quête 7 et demande le niveau 4 (après la livraison à Denalan). La politique actuelle masque volontairement les actions dont **le niveau de quête** dépasse le niveau du joueur, même si le jeu les autoriserait — un choix de confort, pas une barrière mécanique.

Chaque entrée contient ses actions de prise/objectif/rendu dans l’ordre. Le validateur parcourt la route depuis Sombrevallon (quête préliminaire 921 supposée accomplie), exige qu'un objectif soit précédé de l'acceptation, qu'un rendu ait un objectif déjà accepté et qu'une suite ne soit prise qu'après la quête précédente. Les combats, le butin RNG, les quêtes de classe, l'XP en cours, les quêtes déjà accomplies avant d’ouvrir le guide et les conditions d'apparition des monstres **ne sont pas synchronisés avec le jeu**. En cas de niveau insuffisant au passage d'un chapitre, tuer des monstres du secteur de niveau comparable jusqu'au prochain palier — **sans montant de grind inventé**.

La carte conserve les véritables coordonnées X/Y communautaires mais ne représente pas l'altitude/les étages des grottes. Les actions des quêtes enchaînées dans le Terrier sont **rassemblées sur un seul repère**, pas empilées en 7 marqueurs. Le couteau à dépecer est noté comme **achat de métier facultatif**, et non comme prérequis de quête. Aucun objet coûteux ni course vers Darnassus n'est conseillé sans raison explicite.

**Avant publication du guide définitif :** faire tester chacune des sept tranches de départ du profil en jeu, vérifier les récompenses XP/temps, difficultés de monstres, trajectoires réelles et éventuelles divergences client. Garder la séparation Classic/Forever stricte.

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
