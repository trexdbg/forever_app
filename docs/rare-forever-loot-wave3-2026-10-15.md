# Issue #59 — rares Forever, vague 3 : trois nouveaux butins documentaires
Revue documentaire : 15 octobre 2026. Périmètre : niveaux 1–30, sans observation directe en jeu.

## Trois relations indépendantes ajoutées

| Rare / rencontre | ID objet | Objet anglais (FR non attesté) | Item level / requis | Preuve de relation |
| --- | ---: | --- | --- | --- |
| The Condemned One · Tirisfal | 286755 | Helm Splitter | 11 / 6 | [Wowhead Forever](https://www.wowhead.com/forever/item=286755/helm-splitter) ; [Warcraft Wiki Forever](https://warcraft.wiki.gg/wiki/Helm_Splitter) |
| Sister Rathtalon · zone litigieuse | 285345 | Feather Padded Treads | 21 / 16 | [Wowhead Forever](https://www.wowhead.com/forever/item=285345/feather-padded-treads) ; [fiche PNJ Forever](https://www.wowhead.com/forever/npc=5830/sister-rathtalon) |
| Scargil · Hautebrande | 282716 | Imbued Scaled Cuffs | 32 / 27 | [Wowhead Forever](https://www.wowhead.com/forever/item=282716/imbued-scaled-cuffs) ; [Warcraft Wiki Forever](https://warcraft.wiki.gg/wiki/Imbued_Scaled_Cuffs) |

- **Avant** : 61 fiches avec butin pour les 161 entrées strictes 1–30 (59/150 historiques et 2/11 nouvelles) ; **après** : 64 (61/150 historiques, 3/11 nouvelles). Les 13 rencontres nouvelles de niveau exact inconnu ne sont pas comptées ici.
- Trois relations documentées Forever, zéro nouvelle observation `confirmed_in_game`. La mention « Dropped by » d'une page d'objet Forever ne prouve ni un drop garanti ni une probabilité stable. Les pourcentages visibles sur différentes langues/snapshots Wowhead varient ; les deux champs de chance sont donc `null`.
- **Sister Rathtalon : ne pas propager l'incertitude géographique.** Le catalogue conserve le conflit préexistant entre Serres-Rocheuses / Tarides ; la page [Forever du PNJ 5830](https://www.wowhead.com/forever/npc=5830/sister-rathtalon) annonce les Tarides, mais cette vague de butins ne réécrit ni la carte, ni le `uiMapID`, ni les anciens repères. Une mission de localisation doit traiter cette contradiction séparément.
- Noms français des trois nouveaux objets : non vérifiés. Le catalogue conserve explicitement l'anglais comme repli, sans traduction inventée ; les libellés FR des statistiques sont des explications, pas une localisation officielle.
- Le niveau 32 de l'objet **Imbued Scaled Cuffs** est un *niveau d'objet*, pas le niveau du monstre ni un niveau minimum de personnage : son niveau requis est **27**.
- Aucun timer, faction, spawn, position, `seen_forever` ou autre butin existant n'est modifié ; `loot_coverage=notable_only_not_complete` ne prétend pas à une table exhaustive.

## Mise à jour de la recherche « Où l'obtenir »

L'index `data/item-acquisition-index.json` est aligné sur les trois nouvelles relations : 552 → **555** IDs, 951 → **954** liens, dont 101 → **104** relations avec des rares ; **190 documentaires Forever**, **764 références Classic**. Il reste un **index de navigation**, pas une preuve supplémentaire. La construction reproductible reste `node scripts/build-item-acquisition-index.mjs --check`.

## Validation / retour arrière

- Ajouter un test dédié `tests/rare-forever-loot-wave3.test.mjs` : sources item/rares, ID et niveaux, champs de preuve, statuts des anciens lieux, taux inconnus, catégories de traduction et couverture.
- Maintenir les invariants des tests des vagues précédentes, dont les 12 relations de vague 1 et les 8 de vague 2 ; ajuster seulement les totaux cumulés.
- Exécuter les contrôles de provenance, cartes rares, index et traduction hors ligne dans la CI PR. Les tests de navigateur FR/EN et le client in-game nécessitent une QA dédiée : **non revendiqués**.
- Revenir en arrière : revert des modifications `data/rares.json`, de l'index dérivé, des tests cumulatifs et des deux fichiers documentaires/tests créés. Pas de synchronisation ni déploiement.

**Attention :** les trois sources indiquent des relations documentées, pas des captures datées du client. Toute validation en jeu doit recevoir son propre build, capture et statut.
