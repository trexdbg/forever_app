# Maîtres de métiers — revue des niveaux de preuve des positions (15/10/2026)

### Résultat du contrôle de `main` après la mission #51
- 153 entrées `role=trainer` (y compris huit maîtres d'armes), toutes avec un point de zone **dans le catalogue**, mais aucune position avec preuve de présence directe en jeu.
- **72** `forever_guide_waypoint` : 47 avec métadonnées de preuve individualisées issues d'un guide Forever ; 25 points historiques classés guide Forever mais sans preuve individualisée.
- **70** `forever_guides_classic_waypoint_not_ingame_verified` : repères Classic repris / cités par des guides Forever, **non** certifiés pour la bêta.
- **11** `classic_reference_unverified` : références Classic uniquement, non confirmées dans Forever.
- **0** `confirmed_in_game`. Une coordonnée numérique peut être utile à titre de piste sans devenir une localisation attestée. Une capture du client datée avec build serait nécessaire pour promouvoir une position.

### Changement limité à l'affichage FR/EN

Le panneau de détail des maîtres affiche maintenant un libellé distinct pour les **trois** situations réellement présentes :
1. **Documenté dans un guide Forever · point non confirmé en jeu** (72).
2. **Référence Classic reprise dans un guide Forever · position indicative, non confirmée en jeu** (70).
3. **Référence Classic uniquement · position indicative, non confirmée en jeu** (11).

Pour les futurs cas sans point, le message « zone seulement, aucun repère inventé » reste prévu et le bouton `/mappin` n'apparaît toujours qu'avec des coordonnées et un `uiMapID`.

### Limites
- Il s'agit **d'une clarification de présentation**, pas d'une vérification des 153 positions dans le client. Les 72 positions documentées peuvent elles-mêmes provenir de repères anciens dans des guides communautaires.
- Aucun changement de `data/npcs.json`, de liens marchands/objets, de `data/rares.json`, de carte, de quêtes ou d'algorithme de waypoint.
- Le contrôle existant `scripts/check-trainer-locations.mjs` continue de refuser les fausses promotions, les coordonnées impossibles, les erreurs de carte et l'absence de preuves positives. Un test de non-régression vérifie la répartition exacte et les libellés FR/EN.
- Des tests navigateur FR/EN sur les panels Jandi/Zéphras sont couverts par l'action PR des maîtres. Vérification réelle en jeu non effectuée.
- Retour arrière : revert de cette PR seulement. Aucune synchronisation ni publication.

Sources internes : [rapport mission #51](https://github.com/trexdbg/forever_app/blob/main/docs/trainer-locations-mission07-2026-10-14.md) et [contrôles](https://github.com/trexdbg/forever_app/blob/main/scripts/check-trainer-locations.mjs).
