# Quêtes Forever — elfes de la nuit 1–10 (bêta, révision du 12 octobre 2026)

## Limites importantes

**Ce n'est pas une route entièrement validée dans le jeu WoW Forever.** L'itinéraire de base suit des quêtes Classic connues et leurs coordonnées de référence, sans supposer que les objectifs ou l'XP sont inchangés dans Forever. Les ajouts Forever attestés dans les textes du client bêta sont montrés dans un **panneau séparé** ; les sources ne confirment pas leur donneur ni la position exacte. Les titres français des quêtes Forever sans texte français officiel sont des traductions éditoriales.

## Itinéraire principal simplifié

- **15 étapes**, dans Teldrassil puis Darnassus, avec **60 points de passage** au dernier contrôle.
- Départ à Sombrevallon niveau 1 ; les deux étapes de « La Protectrice sylvestre » sont distinguées.
- Dolanaar : quêtes Classic simples et regroupées géographiquement.
- Vers Darnassus autour du niveau 9 ; passage final et maîtrise de classe au niveau 10 selon personnage.
- Règle automatique stricte : aucune quête dont le niveau est **supérieur au niveau conseillé de l'étape +1** et aucune quête de niveau supérieur à **10**. Les quêtes élites/détours (« Ursal le Marteleur », etc.) sont exclues. Certaines chaînes restent donc volontairement incomplètes et se poursuivront après le niveau 10 ; ne pas les présenter comme terminées.
- Le niveau indiqué est un **niveau conseillé**, pas une mesure de l'XP Forever. Si vous n'avez pas atteint ce niveau, terminer les objectifs du secteur adaptés à votre classe ou éliminer quelques monstres proches de votre niveau avant l'étape suivante.
- L'URL conserve le mode `?mode=forever-beta`. Le mode Classic et les autres races conservent leurs parcours existants.

## Trois quêtes Forever documentées, facultatives

| ID | Nom français (éditorial) | Niveau | Requis | Indication |
| --- | --- | --- | --- | --- |
| [97977](https://forever-codex.com/quests/97977/) | L'appel de la nature | 3 | 1 | 4 totems de Pins-tordus, à remettre à Tarindrella ; secteur de Sombrevallon, donneur et lieux exacts inconnus |
| [87288](https://forever-codex.com/quests/87288/) | Peaux souples de sabre-de-nuit | 7 | 4 | 6 peaux à remettre à Aldria, Dolanaar ; donneur et lieux exacts non vérifiés |
| [99046](https://forever-codex.com/quests/99046/) | La messagère disparue | 9 | 4 | Rechercher Eralya Leafshadow vers le Bosquet de l'Oracle ; 80 XP, donneur et position exacte inconnus |

Les niveaux, objectifs et identifiants de ces trois quêtes proviennent des **textes et métadonnées de la bêta**, pas d'une validation en jeu. Elles ne sont **plus** des arrêts obligatoires sur la carte, et aucune coordonnée n'a été inventée.

## Sources complémentaires

- Quêtes Classic de Teldrassil : https://theforeverera.com/en/quests/zone/teldrassil/
- Classic, « The Woodland Protector » (459) : https://foreverdb.net/quest/459-the-woodland-protector
- Changements des quêtes Forever : https://theforeverera.com/fr/changes/
- Itinéraire Classic historique conservé : `data/quests/alliance.json` + `data/quests/levels.json`

## Contrôles

- [x] Structure JSON et JavaScript validée
- [x] Aucun nom/ID de quête non connu dans les étapes
- [x] Quêtes Classic plafonnées à niveau conseillé +1 et niveau de quête au plus 10
- [x] Nouveautés Forever référencées et séparées des étapes Classic
- [x] Versions FR et EN à jour, guide Classic non modifié
- [ ] Parcours optimisé chronométré avec un personnage elfe de la nuit en bêta Forever
- [ ] Vérification en jeu des donneurs, positions et butins des trois quêtes Forever
- [ ] Essais visuels et de navigation sur mobile après publication

Pour les modifications futures, ajouter une quête Forever au parcours principal **uniquement après vérification de son donneur, objectif, coordonnées et faisabilité au niveau conseillé**.
