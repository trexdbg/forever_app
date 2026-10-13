# ForEveroth — Quest Lab (Classic beta)

## Isolation et accès

- Entrée statique : **/lab/quetes/**. Aucune entrée dans les menus, l'Explorer, la recherche globale, les pages d'accueil ou les sitemaps.
- La page porte \`robots: noindex,nofollow,noarchive,nosnippet\`. **L'URL reste publique** sur GitHub Pages : « non liée » n'est pas « privée ».
- Le guide existant \`/quetes/\` et ses JS/CSS/données restent inchangés.
- FR et EN sur la même URL via le bouton EN/FR. Les quêtes Classic utilisent les traductions présentes dans le dépôt.
- La page charge uniquement les données Classic locales existantes, pas de données Turtle WoW, et aucun ensemble de quêtes Forever fictif.

## Test en jeu

1. Ouvrir \`/lab/quetes/\` sur un second écran.
2. Choisir faction, race, niveau. Le guide communautaire commence **vers le niveau 5**, pas au niveau 1.
3. Choisir la zone, saisir X/Y ou cliquer sur la carte pour signaler la **position déclarée** du personnage.
4. Dans « Journal de quêtes », rechercher des noms ou IDs. Indiquer pour chaque quête **Acceptée**, **Objectifs faits**, **Rendue**, **Ignorée**, ou revenir à **Disponible / inconnue**.
5. L'itinéraire est recalculé immédiatement après chaque changement. Les actions sur la liste d'étapes changent aussi l'état déclaré.
6. Exporter la session en JSON pour reproduire une anomalie de route, ou importer une session pour reprendre les tests. La session est mémorisée par profil dans le \`localStorage\` du navigateur.

**Important :** ce prototype **ne lit pas automatiquement** le journal du client WoW, ne vérifie pas les quêtes en jeu et ne téléporte pas le personnage. Le statut de quête et la position sont **saisis manuellement**. La minimap est une ressource Classic communautaire externe et peut ne pas charger ; le repérage X/Y reste fonctionnel sans image.

## Moteur et principes

- \`engine.js\` est autonome : aucun DOM, aucune dépendance, aucun réseau. \`buildCatalog\` transforme les routes et le journal d'IDs en points et objets de quête.
- Chaque quête utilise son ID Classic ou, en dernier recours, une clé canonique basée sur le nom/phase.
- \`calculate(catalog, state)\` retient les prises de quêtes disponibles, les objectifs des quêtes **acceptées**, et les rendus des quêtes dont les **objectifs sont déclarés accomplis**. Il les ordonne par distance **dans une même zone**, continuité du guide et priorité à l'état actif.
- Les changements de zone sont pénalisés plutôt qu'estimés en kilomètres : les coordonnées X/Y sont propres à chaque carte, pas à une carte mondiale.
- Les étapes par défaut sont une **heuristique**, pas la solution mathématiquement optimale du voyageur de commerce.
- Le niveau de quête présent dans \`levels.json\` est un **niveau de quête**, et **non** un niveau minimum d'acceptation. En Classic, la marge de recommandation est volontairement prudente : un joueur de niveau 8 ne reçoit **pas** de nouvelle quête de niveau 12. Les quêtes déjà acceptées restent suivies même au-delà de la marge.
- Les prérequis Classic **ne sont pas intégralement présents** dans les données du guide. Ils ne sont **pas déduits fictivement** des noms ou de l'ordre des étapes. Lorsqu'ils ne sont pas documentés, l'interface les marque comme non vérifiés. Les prérequis connus ajoutés ultérieurement sont appliqués strictement.
- La recherche du journal ne couvre que les quêtes présentes dans les chemins importés, plus celles spécifiées explicitement dans une surcouche. Il ne s'agit pas d'un catalogue intégral Classic.

## Préparer Forever sans réécrire le moteur

Le moteur accepte une surcouche **versionnée** \`schema_version: 1\`, distincte du catalogue Classic. L'interface actuelle utilise **Classic seulement**. Exemple de **format**, avec **IDs et noms fictifs** qui ne doivent pas être déployés comme quêtes réelles :

\`\`\`json
{
  "schema_version": 1,
  "edition": "forever",
  "quests": {
    "928": { "removed": true },
    "999991": {
      "name_fr": "Quête de démonstration (fictive)",
      "name_en": "Demonstration quest (fictional)",
      "level": 8,
      "min_level": 6,
      "requires": [999990]
    },
    "999990": {
      "name_fr": "Prérequis fictif",
      "name_en": "Fictional prerequisite"
    }
  },
  "waypoints": [
    {
      "faction": "alliance",
      "profiles": ["nelf"],
      "zone": "teldrassil",
      "level": 7.5,
      "order": 0,
      "waypoints": [
        {
          "header": "PNJ fictif",
          "coords": { "x": 55.5, "y": 61.2 },
          "starts": [{ "id": 999991, "name": "Demonstration quest" }]
        }
      ]
    }
  ]
}
\`\`\`

- \`quests[ID].removed\` désactive une quête Classic retirée.
- \`requires\` impose des ID de quêtes déjà **rendues** ; les prérequis sans waypoint restent modifiables dans le journal (entrées « métadonnées seules »).
- \`min_level\` est le minimum **vérifié** ; \`level\` est le niveau de quête (utilisé pour la prudence, pas un minimum).
- Les nouveaux waypoints sont **insérés près du niveau de progression et de la zone correspondants**, et non empilés à la fin du niveau 60.
- \`faction\` et \`profiles\` évitent qu'une nouvelle quête soit proposée à la mauvaise race/faction.
- Le moteur accepte un objet \`overlay\` dans \`buildCatalog\`. Il faudra brancher une source Forever versionnée, **avec provenance et validation des IDs, prerequis, coordonnées et niveaux** avant d'exposer l'édition Forever dans l'interface.
- Des données supplémentaires comme les alternatives de quête, chaînes exclusives, objectifs multiples distincts, passages continentaux et vitesses de trajet peuvent ensuite être ajoutées au modèle ; elles ne sont pas aujourd'hui inférées.

## Vérification locale

\`\`\`sh
node lab/quetes/engine.test.cjs
\`\`\`

Les tests utilisent les **vraies routes Classic du dépôt**, sans installation npm ni Actions. Ils couvrent les 6 profils, l'interdiction des quêtes trop hautes, les transitions d'état, la surcouche future et la progression de niveau. Faire ensuite un test manuel des clics et de la carte dans un navigateur après déploiement.

**Limites attendues de la bêta :** pas de quête Classic 1–4 dans les routes actuelles, pas d'intégration automatique au jeu, absence de prérequis exhaustifs, pas de calcul de temps de trajet interzones, points et traductions communautaires pouvant contenir des erreurs. Signaler une erreur avec le fichier exporté et les IDs de quêtes concernés.
