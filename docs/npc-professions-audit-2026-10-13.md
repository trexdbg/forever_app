# Agent 03 — PNJ, marchands et métiers : premier audit ciblé

Date de consultation : **2026-10-13**. Branche : **agent03/merchant-professions-audit-20261013**. Base : dépôt **trexdbg/forever_app**, branche principale du 13 octobre.

## Périmètre inspecté

- **data/npcs.json** : tableaux PNJ, objets, liens de vente, détails de provenance, rapports historiques de stock et coordonnées.
- **data/professions.json** : répertoire des 12 métiers, maîtres, rangs et statistiques de recettes issues du client ; pas de catalogue détaillé de toutes les recettes et composants.
- Consommateurs examinés : **assets/npcs.js**, **assets/npc-map.js**, pages Marchands et Métiers.
- Règles lues : **AGENTS.md** et **docs/data-quality.md**, inchangées.

Ce contrôle structurel n'est ni un examen individuel de tous les PNJ ni une vérification des stocks et des prix en jeu.

## Chiffres avant/après

| Indicateur | Avant | Après | Interprétation |
| --- | ---: | ---: | --- |
| PNJ | 357 | 357 | 204 marchands, 153 maîtres |
| PNJ avec ID numérique | 28 | 28 | 329 sans ID fiable : ne pas déduire par le nom |
| PNJ avec coordonnées | 303 | 303 | 54 sans position ; ne pas inventer de points |
| Associations PNJ / objet | 631 | 631 | 244 objets distincts, liens structurellement valides |
| Associations documentées par des sources Forever | 54 | 54 | Les guides ne prouvent pas l'inventaire réel |
| Associations Classic/non vérifiées | 577 | 577 | Préservées avec leur incertitude |
| Objets de type recette | 228 | 228 | Fiches de recettes vendues, sans décomposition en ingrédients |
| Composants vendus | 10 | 10 | Majoritairement sources Classic |
| Autres objets | 6 | 6 | Certifications référencées en bêta |
| Métiers | 12 | 12 | Résumés de métiers |
| Entrées de maîtres dans le catalogue des métiers | 119 | 119 | Pas d'identification numérique automatique |
| Recettes détaillées avec ingrédients dans le catalogue métiers | 0 | 0 | Les nombres « count » sont des statistiques client |
| Rapports historiques de stock/attente | 34 | 34 | Commentaires Classic, pas de timers Forever |
| Associations avec champs de provenance explicite complets | 0 | 10 | Six Aza'bek + quatre Nina Surefire |

Une association qualifiée Forever **documented** signifie seulement qu'une page spécifique à Forever mentionne le couple vendeur/objet. Les prix, les stocks, les coordonnées et le temps de réapprovisionnement nécessitent leurs propres preuves.

## Corrections ciblées (sans changement d'ID ou de quantité)

Ajout pour 10 associations existantes : **evidence_level**, **source_url**, **evidence_url**, **observed_at**, **observed_build**, **evidence_kind**, **evidence_note**. Toutes classées **documented_forever / forever_community_page**. Les anciens états et dates de vérification sont conservés.

- **Aza'bek** (PNJ 248198, Horde, coordonnées non inventées) : 249885, Venomous Smoothie (30 Merchant's Favor) ; 249886, Slimy Smoothie (30) ; 249887, Mrrggl Smrrthle (30) ; 249888, Calcified Smoothie (60, Friendly) ; 249889, Spicy Smoothie (60, Friendly) ; 249890, Wicked Smoothie (90, Honored). Source consultée : https://www.wow-professions.com/forever/npc/azabek
- **Nina Surefire** (identifiant de PNJ encore inconnu, Alliance) : 250381, Elixir of Lesser Spirit (45) ; 250376, Lesser Mageblood Elixir (45) ; 250388, Elixir of Lesser Intellect (45) ; 250990, Mender's Potion (45). Source consultée : https://www.wow-professions.com/forever/npc/nina-surefire

**observed_at** (2026-10-13) indique la **date de consultation de ces guides**, et non une observation en jeu. **observed_build** vaut explicitement **unknown**, car ces pages ne fournissent pas de build précis. Les guides bêta ne prouvent ni le stock vivant ni l'emplacement précis de chaque PNJ.

## Principales lacunes / priorités

1. **P1 Identités/coordonnées :** 329 PNJ sans ID et 54 sans point. Ne pas remplir automatiquement depuis les noms ou des coordonnées Classic.
2. **P1 Ventes :** 577 associations Classic non vérifiées sur le serveur ; le lien vers une fiche d'objet Forever ne prouve pas un vendeur.
3. **P1 Ingénierie :** 4371 (Tube en bronze), 4389 (Gyrochronatome) : des fiches Forever indiquent des zones d'achat mais ne confirment ni la vente par un PNJ particulier à une version donnée, ni le stock, ni les délais. Voir https://www.wowhead.com/forever/item=4371 et https://www.wowhead.com/forever/item=4389.
4. **P1 Artisanat :** aucun détail recette → ingrédients → sources dans **data/professions.json**. L'ajout d'un catalogue de recettes exactes nécessitera des preuves versionnées et une PR distincte.
5. **P2 Traductions :** contrôle FR/EN structurel ; absence de certification linguistique individuelle.
6. **P2 Attentes :** 34 commentaires historiques, potentiellement contradictoires ou provenant d'autres versions ; ne pas les transformer en minuterie garantie.

## Validation ajoutée

- **scripts/check-npc-professions.mjs** : contrôle hors ligne, lecture seule ; IDs dupliqués ou mal référencés, liens de vente cassés, noms manquants, coordonnées hors limites, prix et quantités invalides, classements Classic/Forever contradictoires, provenance explicite mal formée, délai précis sans capture directe, vérification de structure des métiers et recettes futures. Option de rapport JSON.
- **tests/npc-professions.test.mjs** : données réelles et cas artificiels volontairement incorrects ; ne modifie aucune donnée.
- **.github/workflows/npc-professions-quality.yml** : uniquement lors des PR et pour des chemins pertinents ; Node 22, scripts natifs et nouveau module. Pas de synchronisation, publication, cron ni permission d'écriture.
- Vérification demandée dans la PR : tests natifs, test du nouvel audit, régression et liens vers les GitHub Actions. Ne pas prétendre à des exécutions réussies avant vérification du CI.

**Réversibilité :** retour arrière par annulation des commits de la branche. Pas de modification du module Quêtes Classic, de Quêtes Forever (désactivé), des équipements/BiS, des rares, des donjons, du design ni des pipelines de publication.

Aucune fusion ou publication sans validation du propriétaire et du directeur technique.
