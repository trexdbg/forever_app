# Agent 03 — Mission 05 : six potions d'alchimie Forever (bêta documentaire)

**Date de recherche :** 14 octobre 2026. **Base de départ :** `main` après PR #45, commit `bc626dedfb5984328690675eddeb02a094f93b06`. **État :** prévisualisation documentaire facultative, en PR brouillon, non publiée tant que la PR n'est pas fusionnée.

## Intention, périmètre et exclusions

La mission introduit un **catalogue indépendant** `data/alchemy-chains-beta.json` et une nouvelle section repliée « Alchimie documentée (bêta) » / “Documented alchemy (beta)” dans `/metiers/` et `/en/metiers/`. Les huit recettes d'ingénierie et leurs acquisitions (`data/crafting-chains-beta.json`) ne sont **pas modifiées**.

Le client Forever `1.60.1.70338` indique que les potions de soins **Minor Healing Potion** et **Lesser Healing Potion** n'existent plus comme fabrications d'**Alchimie**, étant transférées au **Secourisme**. Les IDs 118 et 858 font partie des **exclusions testées**, pas de la liste publiée.

**Sources primaires de cette étude documentaire :**
- [Forever Talents — Recovery Potions](https://wowforevertalents.com/professions/alchemy/recovery-potions/) (index de recettes par lecture du client `1.60.1.70338`, taux et seuils de couleur, distinction nouvelle / modifiée).
- [Forever Talents — Alchemy Not in Forever](https://wowforevertalents.com/professions/alchemy/not-in-forever/) (ancienne appartenance au métier).
- [Forever Talents — First Aid](https://wowforevertalents.com/professions/first-aid/) (nouvelle profession de soins).
- [Wowhead Forever — Alchemy Overview](https://www.wowhead.com/forever/guide/professions/alchemy-overview-trainer-locations-recipes), mis à jour le 12 octobre 2026.
- Les URLs de sorts précises figurent sur **chaque** entrée JSON.

## Lot de six recettes

| Objet fabriqué | Objet ID | Sort ID | Ingrédients exacts (IDs) | Compétence d'apprentissage | Jaune | Écart |
| --- | ---: | ---: | --- | --- | ---: | --- |
| Minor Discolored Healing Potion | 4596 | 4508 | 3371×1 + 2447×1 + 730×1 | 50 (plan **4597**, source d'obtention inconnue) | 55 | Modifiée |
| Minor Mana Potion | 2455 | 2331 | 785×1 + 2447×1 + 3371×1 | Inconnue (maître) | 65 | Modifiée |
| Minor Rejuvenation Potion | 2456 | 2332 | 785×2 + 2447×1 + 3371×1 | 40 (client, maître) | 70 | Stable |
| Lesser Discolored Healing Potion | 247239 | 1244645 | 3371×1 + 2450×1 + 730×1 | Inconnue (maître) | 85 | Nouvelle |
| Discolored Healing Potion | 247240 | 1244646 | 3372×1 + 2453×1 + 730×1 | Inconnue (maître) | 135 | Nouvelle |
| Lesser Mana Potion | 3385 | 3173 | 785×1 + 3820×1 + 3371×1 | Inconnue (maître) | 145 | Stable |

**Niveaux** : `item_level` provient de l'index client, mais `player_level_required` reste explicitement `null` en l'absence de vérification spécifique au client pour ce niveau. Le site ne déduit pas le niveau requis du niveau d'objet.

**Quantité produite :** Forever Talents indique « Makes 1 » pour les six recettes ; aucune production en jeu n'a été observée ici. On conserve donc `reported_client_yield=1` comme valeur documentaire sourcée et `output_quantity=null` comme **rendement réel non vérifié**, sans calcul de coût ou de besoins totaux. Une page Forever peut présenter un « (2) » différent : ne pas résoudre les écarts par supposition.

**Composants :** fiole vide (3371), fiole plombée (3372), pacifique (2447), mage royal (785), églantine (2450), doulourante (2453), étangétrangle (3820), œil de murloc (730). Leur présence comme réactif est documentée ; **aucune source de récolte, vente ou butin précise n'est considérée confirmée**. Traductions françaises de référence, non officiellement certifiées dans la bêta.

## Choix de sécurité et compatibilité

- Allowlist de **six** sorties et `scope.preview.status=opt_in_documentary_preview`, catalogue racine `research_only_not_published`.
- Les anciennes potions Classic **118** / **858** sont déclarées `excluded_alchemy` ; le script `scripts/check-alchemy-beta.mjs` et les tests bloquent toute promotion.
- Pas de `innerHTML` ; construction DOM via `textContent`, URL HTTPS vérifiée, impossible de créer un faux lien vendeur local.
- L'interface `assets/alchemy-beta.js` utilise des IDs et un paramètre `?alchemy=ID` distincts de `?craft=ID` existant ; les deux peuvent coexister dans une URL sans effacer la sélection de l'autre.
- Recherche globale : **six** résultats documentaires seulement, routés vers `/metiers/?alchemy=ID` et `/en/metiers/?alchemy=ID`. Aucun fichier JSON exposé directement par un lien utilisateur.
- `/metiers/` reste avant tout la carte des maîtres ; ancien explorateur externe de `assets/professions.js` toujours inactif. Pas de modification PNJ ni des listes de marchands.
- Alchimie 1–30 est une **sélection utile**, pas la preuve que toutes les recettes sont apprenables avant le niveau 30 du personnage.

## Vérifications et risques

Contrôles PR-only : `node scripts/check-alchemy-beta.mjs`, `node --test tests/alchemy-beta.test.mjs`, validateur et tests préexistants ingénierie/PNJ/qualité, Chromium réel FR/EN × ordinateur 1440 px / mobile 375 px avec captures.

**Inconnues :** apprentissage précis de plusieurs recettes, origine des plans, vente des fioles, filons d'herbes, créatures donnant l'œil de murloc, rendement effectif, effets des potions et niveau joueur requis. Il serait trompeur de présenter un vendeur ou un spot Classic comme vérifié Forever.

**Rollback :** revert de cette PR uniquement (nouveau JSON/JS/CSS/validateur/tests/document, ajouts isolés aux pages Métiers/recherche globale/workflow/tests navigateur) ; les données d'ingénierie PR #42–#45 restent intactes.

**Décision :** revue du directeur technique avant fusion. **Aucune fusion, aucun déploiement ni synchronisation autorisée à ce stade.**
