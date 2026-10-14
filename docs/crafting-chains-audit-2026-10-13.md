# Agent 03 — Mission 02 / chaînes de fabrication bêta 1–30

Date de consultation : **2026-10-13**. Version comparée : **Forever 1.60.1.70291** et Classic Era **1.15.9.70003** lorsque précisé par la source. Cette PR n'effectue **aucune observation personnelle en jeu**. Toutes les fiches de crafting sont de la documentation Forever consultée ou de la comparaison de tables tierce ; disponibilité effective dans la bêta **inconnue**.

## Périmètre et méthode

- Nouvelle donnée isolée et **non publiée** : `data/crafting-chains-beta.json` (sans affecter les 12 répertoires de professions déjà publiés ni les 631 relations vendeur-objet du catalogue existant).
- Objets distincts : **16** (8 produits et 8 autres composants) ; **8** sorts-recettes d'ingénierie documentés, **12** relations ingrédient-quantité, **9** identifiants d'ingrédients distincts (dont le sous-composant 10558).
- Sept fiches de recherche sur les modes d'obtention : **2** inventaires historiques de vendeurs Classic, **1** index général de fournisseurs de catalyseur, **4** pistes de fonte non encore validées.
- **0** vente au joueur confirmée sur Forever ; **0** quantité de production tranchée quand les publications sont contradictoires ; **0** chronomètre de réapprovisionnement certifié ; **0** composant attribué à un butin/une quête sans preuve dédiée.
- Les **8 voies de fabrication documentées** ne prouvent ni l'apprentissage auprès du PNJ sur la version actuellement jouée, ni l'obtention en jeu. Niveau de certitude principal : `documented_forever`. Les identités 4371 et 4389 issues de la comparaison client versionnée : `datamined`.

## Correctifs de revue — seuils de couleur et niveau d'apprentissage

La [revue technique de la PR #42](https://github.com/trexdbg/forever_app/pull/42#issuecomment-6153906206) a révélé une confusion entre l'exigence de métier et le **seuil jaune** : pour le **Tube en cuivre (objet 4361, sort 3924)**, la fiche de couleurs client Forever affiche **jaune 80, vert 95, gris 110**. L'ancien catalogue avait à tort mis `skill_yellow=95` (vert) et `skill_required=80` (jaune).

Le [guide d'ingénierie consacré à Forever sur wowtbc.gg](https://wowtbc.gg/warcraftforever/professions/engineering/) publie séparément un **niveau d'apprentissage de 50** pour Copper Tube, avec jaune 80, vert 95 et gris 110. **50 est donc une affirmation communautaire documentée Forever**, pas une extraction du client ni une observation en jeu. Les champs `skill_required_source_url`, `skill_required_evidence_level`, `skill_required_observed_at`, `skill_required_observed_build`, `skill_required_evidence_kind` et `skill_required_evidence_note` portent explicitement cette attribution. Le [catalogue WoW Forever Talents](https://wowforevertalents.com/professions/engineering/parts/) avertit que le **niveau d'apprentissage du maître n'est pas dans les tables du client** ; aucune disponibilité auprès d'un PNJ n'est certifiée.

**Contrôle des huit seuils jaunes** dans la même page Forever Talents, qui décrit le client `1.60.1.70338` (la page précise que les sorts sont inchangés par rapport à `1.60.1.70291`).

| ID du sort | Recette | `skill_required` (claim documentaire) | `skill_yellow` (index de couleurs Forever) |
| --- | --- | ---: | ---: |
| 3918 | Rough Blasting Powder | 1 | **20** |
| 3924 | Copper Tube | 50, d'après wowtbc.gg Forever | **80** |
| 3929 | Coarse Blasting Powder | 75 | **85** |
| 3938 | Bronze Tube | 105 | **105** |
| 3942 | Whirring Bronze Gizmo | 125 | **125** |
| 12584 | Gold Power Core | 150 | **150** |
| 3958 | Iron Strut | 160 | **160** |
| 3961 | Gyrochronatom | 170 | **170** |

Pour les autres recettes apprises auprès d'un maître, le champ `skill_required` provient des références documentaires du lot initial, **et non de l'extraction client Forever Talents** : cette valeur ne doit pas être interprétée comme une vérification en jeu. Les huit seuils `skill_yellow` possèdent désormais une URL, une date, un build et une note **propres à l'affirmation de couleur**. Les nouveaux tests figent ces seuils par sort.

### Quantités produites : distinguer véritable contradiction et simple inconnue

| Sort | Source A : [Forever Talents / Parts](https://wowforevertalents.com/professions/engineering/parts/) | Source B : fiche de sort Forever | Statut |
| --- | ---: | ---: | --- |
| 3924 Copper Tube | **1** | **2** ([Wowhead](https://www.wowhead.com/forever/spell=3924/copper-tube)) | `conflicting_sources`, quantité `null` |
| 3938 Bronze Tube | **1** | **2** ([Wowhead](https://www.wowhead.com/forever/spell=3938/bronze-tube)) | `conflicting_sources`, quantité `null` |
| 12584 Gold Power Core | **3** | **4** ([Wowhead](https://www.wowhead.com/forever/spell=12584/gold-power-core)) | `conflicting_sources`, quantité `null` |
| 3961 Gyrochronatom | **1** | **2** ([Wowhead](https://www.wowhead.com/forever/spell=3961/gyrochronatom)) | `conflicting_sources`, quantité `null` |
| 3918, 3929, 3942, 3958 | **1** chacun | Deuxième preuve de rendement non établie | `unknown`, quantité `null` |

Ce sont des **valeurs affichées par des sites**, pas une observation d'une fabrication dans le jeu : ni la mention « Makes 1 » d'un index dérivé du client, ni l'effet « Create Item » de Wowhead ne prouvent le nombre produit par un personnage réel sur le serveur. Pour 3918, 3929, 3942 et 3958, la seconde source du premier lot ne permettait pas d'établir assez précisément une divergence : les faux conflits ont été retirés. Chaque valeur candidate désormais conservée possède `source_url` et `evidence_note` propres ; une future résolution de rendement ne nécessitera que la recette concernée, avec une source explicite.

## Étape A — Bronze Tube / Tube en bronze (4371)

| Assertion | Forever bêta : constat documentaire | Classic / lacune |
|---|---|---|
| Identité | Item **4371**, `Bronze Tube`, niveau objet 21, icône `inv_gizmo_pipe_01` ; comparaison de tables au build 1.60.1.70291 | Même ID, tooltip identique au Classic Era 1.15.9.70003 d'après Forever Compass |
| Nom français | Le catalogue actuel affiche **Tube en bronze** ; la documentation française utilise aussi **Tube de bronze**. Nom officiel FR non certifié ; traduction existante conservée | Ne pas substituer arbitrairement les libellés |
| Sort de fabrication | **3938**, ingénierie, **105** de compétence indiqué sur la fiche de sort Forever ; note : seuil jaune ≠ toujours condition d'apprentissage | Référence Classic, sans transposition automatique |
| Ingrédients | **2 × barre de bronze 2841**, **1 × catalyseur léger / Weak Flux 2880** ; recoupé par deux catalogues orientés Forever | Ingrédients du client / guides ; pas de test d'artisanat en jeu |
| Quantité produite | **Inconnue, divergence** : index de recettes Forever `1`, une fiche sort Forever affiche `2`. Ne pas choisir de rendement pour un calcul de matériaux | La présentation des fiches varie selon source / édition |
| Vente PNJ | **16 candidats dans le catalogue historique**, **aucun vérifié Forever**. Anciens champs de référence : 800 cuivre et stock 2. | Prix, stock et réapprovisionnement **Forever inconnus** |
| Usages | Le client indexe plusieurs recettes qui consomment 4371 (dont Standard Scope et Repair Bot) | Mention de quêtes dans commentaires Classic **non** certifiée sur Forever |

**Sources directement consultées :**
- [Forever Compass : objet 4371 et comparaison exacte de build](https://forevercompass.com/items/4371).
- [Wowhead Forever : sort 3938, 2 barres de bronze + Weak Flux, compétence et icône](https://www.wowhead.com/forever/spell=3938/bronze-tube).
- [WoW Forever Talents : composants, rendement annoncé, seuils couleur](https://wowforevertalents.com/professions/engineering/parts/).
- [The Forever Era : version française du parcours d'ingénierie](https://theforeverera.com/fr/guides/professions/engineering/).

## Étape A — Gyrochronatom / Gyrochronatome (4389)

| Assertion | Forever bêta : constat documentaire | Classic / lacune |
|---|---|---|
| Identité | Item **4389**, nom EN `Gyrochronatom`, niveau objet 34, icône `inv_misc_pocketwatch_02` ; comparaison de tables build 1.60.1.70291 | Tooltip décrit comme inchangé par rapport au Classic Era |
| Nom français | **Gyrochronatome**, cohérent avec les pages françaises orientées Forever ; orthographe conservée, mais localisation officielle du client non indépendamment extraite | Ne pas réintroduire la coquille « Gyrochonatome » |
| Sort de fabrication | **3961**, ingénierie, **170** de compétence sur la fiche Forever ; apprentissage indexé auprès de maîtres | Aucun PNJ déclaré vérifié accessible dans la bêta actuellement jouée |
| Ingrédients | **1 × barre de fer 3575**, **1 × batterie en or / Gold Power Core 10558** | Documentation Forever cohérente sur les ingrédients |
| Quantité produite | **Inconnue, divergence** : des index affichent `1`, la fiche du sort Forever `2` | Ne pas calculer de coût unitaire sûr |
| Sous-recette | Batterie en or 10558 : sort ingénierie **12584** (compétence 150), **1 × barre d'or 3577**, rendement **contradictoire : 3 ou 4** dans des vues Forever | C'est une chaîne à deux niveaux, non une validation de fonte de la barre d'or |
| Vente PNJ | **16 candidats historiques** ; aucun PNJ/stock Forever démontré. Anciens champs de référence : 3 000 cuivre, stock 1 | Réapprovisionnement Forever inconnu |
| Usages | Index Forever mentionne notamment Hoof-Shaped Foot Pedal, Compact Harvest Reaper Kit | Pas de promesse de disponibilité des schémas ou d'usage en quêtes |

**Sources directement consultées :**
- [Forever Compass : objet 4389 et comparaison de build](https://forevercompass.com/items/4389).
- [Wowhead Forever : sort 3961 et ingrédients](https://www.wowhead.com/forever/spell=3961/gyrochronatom).
- [WowSeer : sort d'ingénierie 3961, rang 170, consommations documentées](https://wowseer.gg/recipe/engineering-3961).
- [Wowhead Forever : fabrication de batterie en or 12584](https://www.wowhead.com/forever/spell=12584/gold-power-core) ; [fiche objet 10558](https://www.wowhead.com/forever/item=10558) — *rendements affichés non concordants*.
- [WoW Forever Talents : autres recettes et seuils](https://wowforevertalents.com/professions/engineering/parts/).
- [Guide français The Forever Era, Gyrochronatome et batterie](https://theforeverera.com/fr/guides/professions/engineering/).

## Étapes B/C — Première structure testable

```text
4389 Gyrochronatome (sort 3961, métier 202)
 ├─ 3575 Barre de fer [fonte : chemin non résolu]
 └─ 10558 Batterie en or (sort 12584, métier 202)
     └─ 3577 Barre d'or [fonte : chemin non résolu]

4371 Tube en bronze (sort 3938, métier 202)
 ├─ 2841 Barre de bronze × 2 [fonte : chemin non résolu]
 └─ 2880 Catalyseur léger × 1 [index vendeurs Classic, pas de preuve Forever]
```

Les autres six recettes d'ingénierie (1–30) ajoutées : **3918** poudre d'explosion basique (4357), **3924** tube en cuivre (4361), **3929** poudre d'explosion grossière (4364), **3942** bidule bourdonnant en bronze (4375), **12584** batterie en or (10558), **3958** contrefiche en fer (4387). Toutes ont un sort identifié, des ingrédients quantifiés, des identifiants d'items vérifiables, une indication d'apprentissage et la preuve liée à cette assertion. Le rendement est conservé explicitement `null` lorsque les sources se contredisent **ou** lorsque le rendement reste non tranché ; `recipe_item_id: null` signifie qu'aucun objet de recette distinct n'a été établi, et non « sort = ID d'objet-recette ».

**Note de méthode :** les recettes d'ingénierie très bas niveau sont des recettes connues dans Classic ; leur présence dans une fiche ciblant Forever atteste une *documentation Forever*, non leur création en jeu. Les sources séparent la compétence requise et la couleur de la recette : le validateur distingue `skill_required` et `skill_yellow`, et les nouveaux tests valident les seuils jaunes directement contre la table Forever.

### Sources d'approvisionnement sous vérification

Les associations PNJ présentes dans `data/npcs.json` pour 4371 et 4389 sont **16 par objet**. Les noms, ID et coordonnées du catalogue n'ont **pas** été modifiés ni requalifiés. Leur disponibilité est indiquée seulement comme *piste Classic*. Le catalogue de recherche exige de retrouver la même quantité de candidats et les anciens champs de prix/stock afin de signaler d'éventuelles divergences, mais ne transforme aucun de ces chiffres en tarif Forever.

Le [catalogue Weak Flux de WowSeer](https://wowseer.gg/items/Weak_Flux_2880) contient un index de vendeurs dont la table est explicitement marquée **Classic** : ce n'est donc **pas** un nouvel achat confirmé sur Forever. Les barres métalliques ont des pistes de fonte, mais pas encore de chaîne complète de sources certifiées. Les noms FR hors 4371/4389 sont des traductions de référence, non une extraction officielle de localisation.

### Limites à conserver

- Aucune capture en jeu, build exact non publié pour certaines pages de recettes, ni vérification du serveur de production.
- **Rendements contradictoires pour 3924, 3938, 12584 et 3961 ; rendements non arbitrés pour 3918, 3929, 3942 et 3958** : tous restent `null` dans le catalogue de recherche, avec les sources candidates traçables.
- Les ventes de tubes/gyrochronatomes, leurs prix, stocks, timers et localisations **sur Forever** restent sans preuve : ne pas promouvoir les marchands Classic.
- Aucun lien de fiche d'objet sur le site n'est ajouté : ce lot est **research-only**, tant que les sorties unitaires et l'accès en jeu sont ambigus.
- Aucune recette d'alchimie ajoutée dans ce lot : privilégier la validation ciblée des chaînes d'ingénierie avant de généraliser.
- Les 12 métiers dans `data/professions.json` conservent **zéro recette détaillée** ; ce nouveau catalogue est strictement distinct des compteurs statistiques existants.
- Le module Quêtes Classic reste public et fonctionnel et peut être amélioré dans une PR dédiée. Les Quêtes Forever restent désactivées. Aucun changement BiS, rare, donjon, design, navigation ou publication.

## Contrôles, intégration et retour arrière

`scripts/check-crafting-chains.mjs` contrôle les IDs d'objets et sorts, noms FR/EN, références de composants, quantités, compétences, cycle de graphe, provenances, incertitudes, et la correspondance aux **données PNJ historiques inchangées**. `tests/crafting-chains.test.mjs` ajoute fixtures positives et négatives (IDs brisés, niveaux incohérents, doublons, boucles, faux Forever, invalides/null). La CI **PR-only** de l'Agent 03 est réutilisée, pas de nouveau pipeline de publication.

**Commandes de validation :**
```sh
node --check scripts/check-crafting-chains.mjs
node --test tests/crafting-chains.test.mjs
node scripts/check-crafting-chains.mjs
node scripts/check-npc-professions.mjs
node --test tests/npc-professions.test.mjs
node scripts/check-data-quality.mjs
node --test tests/data-quality.test.mjs
```

**Avant ce lot :** 0 chaîne de fabrication détaillée, 0 erreur structurelle PNJ (383 avertissements historiques) et 0 erreur qualité générale (721 avertissements historiques). **Après :** 8 chaînes décrites et auditées dans un catalogue isolé ; les avertissements historiques restent tels quels. Retour arrière : revert des commits de cette branche sans toucher à la publication des marchandises ni aux modules publics. Aucune fusion/déploiement/synchronisation sans le propriétaire.
