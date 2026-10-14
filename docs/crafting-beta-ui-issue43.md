# Agent 03 · Mission 03 · Issue #43 — prévisualisation documentaire d'artisanat

Date : **2026-10-14**. Base : `main` à `a32a68cd23f534d50f6a2f491af1df5206dc42c4` (missions #41 et #42 fusionnées).

## Choix de conception et de publication

La route réelle `/metiers/` et sa variante `/en/metiers/` sont les **cartes publiques de maîtres/armes** sous `assets/npcs.js`. Le fichier `assets/professions.js` contient un ancien explorateur d'archive de recettes mais **n'est pas référencé par ces deux pages** : le brancher soudainement aurait créé une confusion avec ses milliers de lignes historiques et aurait risqué de dégrader la carte.

L'interface bêta est donc un `<details>` compact, **fermé par défaut**, au début du module Métiers, **avant la carte inchangée**. Le script autonome `assets/crafting-beta.js` charge seulement `/data/crafting-chains-beta.json` **après ouverture** ou à partir d'un lien `?craft=ID`. Aucun appel réseau vers une archive externe, aucun nouvel onglet global ni refonte de la navigation.

`data/crafting-chains-beta.json` **conserve** `scope.status=research_only_not_published`, ses niveaux de preuve, les valeurs `null`, les rendements et les ventes Classic non confirmées. Un bloc `scope.preview` déclare seulement `status=opt_in_documentary_preview`, les **huit identifiants de sorties** exposées, le type d'exposition et les routes locales. Il **ne certifie aucune information en jeu** et ne requalifie pas les seize éléments du catalogue complet en données confirmées. Un contrôle runtime vérifie ce contrat avant rendu.

**Ce qui apparaîtrait après fusion (non effectuée)** : un encart bilingue fermé par défaut dans Métiers, avec huit recettes d'ingénierie documentaires (4357, 4361, 4364, 4371, 4375, 10558, 4387, 4389) et les seize fiches d'objets accessibles via leurs composants, plus huit résultats de fabrication dans la recherche globale à la première recherche. Ni les prix Classic, ni les vendeurs, ni la disponibilité des recettes ne sont présentés comme des faits Forever. La carte des maîtres reste visible et fonctionnelle.

## Parcours testés · français / anglais

| Action | Français | English |
| --- | --- | --- |
| Prévisualisation fermée par défaut | `/metiers/` | `/en/metiers/` |
| Tube en bronze | `/metiers/?craft=4371` | `/en/metiers/?craft=4371` |
| Gyrochronatome | `/metiers/?craft=4389` | `/en/metiers/?craft=4389` |
| Batterie en or | `/metiers/?craft=10558` | `/en/metiers/?craft=10558` |
| Feuille de composant non fabriqué | `/metiers/?craft=3577` | `/en/metiers/?craft=3577` |
| Préservation des ancres du module | `/metiers/?type=profession&craft=4389#prof-trainers` | `/en/metiers/?type=profession&craft=4389#prof-trainers` |

Le lien direct ouvre `<details>`, charge les huit recettes, sélectionne l'ID **même après rechargement**, et peut revenir via l'historique du navigateur. Les clics sur les composants utilisent la même route locale : **4389 Gyrochronatome → 10558 Batterie en or (sort 12584) → 3577 Barre d'or**, dont l'absence de sous-recette auditée est affichée explicitement. Les objets sans fiche locale ne pointent jamais vers une page inexistante. La recherche normalise les accents/casses sur les deux noms de l'objet et accepte ID d'objet et ID de sort.

**Descriptions de rendu à contrôler manuellement par le directeur :**
- FR : titre « Fabrications documentées (bêta) » et panneau déroulant ; indication « prévisualisation documentaire », fiche « Tube en bronze », « Compétence requise (documentation) » séparée de « Seuil jaune (pas le niveau requis) » ; lien de preuve pour chaque assertion lorsqu'il existe.
- EN : « Documented crafting (beta) », « Bronze Tube », « Required skill (documentation) », « Yellow threshold (not required skill) » et « Recipe documented for Forever, not confirmed in game ».
- Rendement `null` : « Quantité fabriquée : inconnue » ou « Produced quantity: unknown » ; quatre recettes signalent des sources contradictoires et quatre autres un rendement non confirmé. Les pages sources peuvent différer de ce qu'un joueur peut réellement fabriquer.
- Marchands : pour 4371 et 4389, « 16 marchands candidats issus de Classic » / « 16 Classic-reference candidate vendors », sans tarif, quantité en stock, localisation ou timer présentés comme Forever.
- Les libellés français sont toujours indiqués comme des traductions de référence, **sans certification de localisation officielle**.

Les éléments du DOM utilisent `document.createElement`, `textContent` et des URLs validées HTTPS (pas d'`innerHTML`). L'icône utilise uniquement une clé locale `[a-z0-9_]+` et se masque si introuvable ; les références URL malformées ou non-HTTPS ne créent pas de lien. Le chargement refuse les données incorrectes, affiche un message localisé et autorise une nouvelle tentative à la prochaine ouverture. Le graphe de crafting reste contrôlé contre les cycles par le validateur existant ; l'interface n'emploie aucune récursion de rendu.

## Recherche globale

`assets/global-search.js` n'indexe que les huit recettes **lorsque le marqueur de prévisualisation est présent et cohérent**. Les résultats sont dans la catégorie actuelle « Métiers », avec sous-libellé « Fabrication documentée · bêta (non confirmée en jeu) » / « Documented crafting · beta (not confirmed in game) » et URL pointant directement sur la fiche sélectionnée dans `/metiers/?craft=ID` ou `/en/metiers/?craft=ID`. Pas de lien brut vers JSON et pas de promesse d'achat.

## Données / limites de fiabilité

- Références d'ingénierie documentées, **pas huit fabrications prouvées accessibles sur le serveur**.
- `skill_required=50` du Tube en cuivre : affirmé par [guide communautaire Forever wowtbc.gg](https://wowtbc.gg/warcraftforever/professions/engineering/), distinct du seuil de couleur jaune 80 lu dans [Forever Talents](https://wowforevertalents.com/professions/engineering/parts/).
- 4 rendements `null/conflicting_sources` (3924, 3938, 12584, 3961) et 4 `null/unknown` (3918, 3929, 3942, 3958) : aucun coût unitaire ni chaîne de quantités totales calculés.
- Marchands 4371 et 4389 uniquement **référence Classic** : les 16 candidats, prix/stock et temps de réapprovisionnement ne sont **pas vérifiés Forever**.
- L'archive historique optionnelle de `assets/professions.js` demeure **hors de la route publique** et non modifiée ; la recherche mondiale exclut son contenu ancien.
- Aucune nouvelle recette, alchimie, quête, BiS, butin, rare, publication ou synchronisation.
- La validation automatisée simule le DOM et les événements Node ; aucune capture d'un navigateur réellement connecté au serveur Forever n'est fournie. Vérification visuelle par le directeur recommandée avant autorisation de fusion.

## Contrôles ciblés et retour arrière

`tests/crafting-beta-ui.test.mjs` : simulations DOM natives bilingues : chargement différé, huit sorties/16 objets, filtre sans accents, rechargement profond, historique/ancres, clic sous-recette/feuille, preuves HTTPS, exigences de compétences distinctes, vendeurs Classic, absence de HTML injecté, panne/mauvais JSON, URLs réelles. Le workflow PR-only `.github/workflows/npc-professions-quality.yml` est étendu aux deux pages et aux JS/CSS/tests nouveaux, **sans ajout d'un nouveau job ni pipeline de publication**.

Commandes exécutées automatiquement en CI :
```sh
node --check assets/crafting-beta.js
node --check assets/global-search.js
node --check tests/crafting-beta-ui.test.mjs
node --test tests/crafting-beta-ui.test.mjs
node scripts/check-crafting-chains.mjs
node --test tests/crafting-chains.test.mjs
node scripts/check-npc-professions.mjs
node --test tests/npc-professions.test.mjs
node scripts/check-data-quality.mjs
node --test tests/data-quality.test.mjs
```

**Régression attendue** : mêmes avertissements hérités (**383 PNJ**, **721 globaux**), **zéro erreur structurelle**. Retour arrière : revert des seuls commits de cette PR (pages métiers FR/EN, JS/CSS isolés, sous-ensemble opt-in marqué, tests et workflow ciblé). Les données originales et les modules Classic/Forever restent préservés.

**Statut : PR en brouillon ; aucune fusion ou mise en production sans approbation du propriétaire.**
