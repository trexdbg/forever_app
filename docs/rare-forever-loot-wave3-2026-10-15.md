# Issue #59 — rares Forever, vague 3 : quatre nouveaux butins documentaires
Revue documentaire : 15 octobre 2026. Périmètre : niveaux 1–30, sans observation directe en jeu.

## Quatre relations indépendantes ajoutées

| Rare / rencontre | ID objet | Objet anglais (FR non attesté) | Item level / requis | Preuve de relation |
| --- | ---: | --- | --- | --- |
| The Condemned One · Tirisfal | 286755 | Helm Splitter | 11 / 6 | [Wowhead Forever](https://www.wowhead.com/forever/item=286755/helm-splitter) ; [Wowhead Forever FR](https://www.wowhead.com/forever/fr/item=286755/helm-splitter) |
| Sister Rathtalon · zone litigieuse | 285345 | Feather Padded Treads | 21 / 16 | [Wowhead Forever](https://www.wowhead.com/forever/item=285345/feather-padded-treads) ; [fiche PNJ Forever](https://www.wowhead.com/forever/npc=5830/sister-rathtalon) |
| Scargil · Hautebrande | 282716 | Imbued Scaled Cuffs | 32 / 27 | [Wowhead Forever](https://www.wowhead.com/forever/item=282716/imbued-scaled-cuffs) |
| Mist Howler · Orneval | 284666 | Wolf Whistle (consommable à 5 charges) | 24 / 19 | [Wowhead Forever](https://www.wowhead.com/forever/item=284666/wolf-whistle) : association rare → objet et effet d'invocation |

- **Avant** : 64 fiches avec butin parmi les 161 entrées strictes 1–30 (59/150 historiques et 5/11 nouvelles) ; **après** : 68 (62/150 historiques et 6/11 nouvelles). Les 13 rencontres nouvelles de niveau exact inconnu ne sont pas comptées ici.
- Quatre relations documentées Forever, zéro nouvelle observation `confirmed_in_game`. La mention « Dropped by » d'une page d'objet Forever ne prouve ni un drop garanti ni une probabilité stable. Les pourcentages visibles sur différentes langues/snapshots Wowhead varient ; les deux champs de chance sont donc `null`.
- **Sister Rathtalon : ne pas propager l'incertitude géographique.** Le catalogue conserve le conflit préexistant entre Serres-Rocheuses / Tarides ; la page [Forever du PNJ 5830](https://www.wowhead.com/forever/npc=5830/sister-rathtalon) annonce les Tarides, mais cette vague de butins ne réécrit ni la carte, ni le `uiMapID`, ni les anciens repères. Une mission de localisation doit traiter cette contradiction séparément.
- Noms français des quatre nouveaux objets : non vérifiés. Le catalogue conserve explicitement l'anglais comme repli, sans traduction inventée ; les libellés FR des statistiques sont des explications, pas une localisation officielle.
- Le niveau 32 de l'objet **Imbued Scaled Cuffs** est un *niveau d'objet*, pas le niveau du monstre ni un niveau minimum de personnage : son niveau requis est **27**.
- Aucun timer, faction, spawn, position, `seen_forever` ou autre butin existant n'est modifié ; `loot_coverage=notable_only_not_complete` ne prétend pas à une table exhaustive.

## Fiabilisation de quatre relations déjà publiées (sans nouveau lien)
 
Les **quatre** butins spécifiques Forever historiquement présents mais dépourvus de preuve individualisée ont été revus et complétés le 15/10/2026 :
 
- Humar the Pridelord → **Mark of the Pack Leader** (#285331) : [fiche Forever](https://www.wowhead.com/forever/item=285331/mark-of-the-pack-leader) et [annonce du set](https://www.wowhead.com/forever/news/open-world-rare-spawn-item-sets-make-rares-more-valuable-in-forever-383053).
- Takk the Leaper → **Raptor Hide Cloak** (#285329) : [fiche Forever et témoignages](https://www.wowhead.com/forever/item=285329/raptor-hide-cloak).
- Swiftmane → **Signet of the Zhevra** (#285330) : [fiche Forever](https://www.wowhead.com/forever/item=285330/signet-of-the-zhevra).
- Duskstalker → **Duskstalker's Hide** (#284165) : [section « Drops » spécifique Forever](https://warcraft.wiki.gg/wiki/Duskstalker) et [fiche PNJ Forever](https://www.wowhead.com/forever/npc=14430/duskstalker).

Pour chacun : `evidence_level=documented_forever`, URL de preuve spécifique, date de notre revue, build inconnu, nature et limites de la preuve. Les anciens pourcentages (1,23 %, 4,09 %, 4,68 % et 0,85 %) sont **archivés** dans `historical_drop_sample` ; ils ne sont plus annoncés comme taux actuels dans l'interface. Les trois premiers échantillons avaient été relevés le 11/10 ; **date du quatrième échantillon inconnue**, conservée `unknown`. Les positions et respawns restent historiques Classic.

Ces quatre éléments étaient **déjà comptés** dans l'index ; leur clarification documentaire ne doit pas augmenter artificiellement les totaux d'objets et de relations ci-dessous.

## Mise à jour de la recherche « Où l'obtenir »

L'index `data/item-acquisition-index.json` est aligné sur les quatre nouvelles relations : 552 → **556** IDs, 951 → **955** liens, dont 101 → **105** relations avec des rares ; **191 documentaires Forever**, **764 références Classic**. Il reste un **index de navigation**, pas une preuve supplémentaire. La construction reproductible reste `node scripts/build-item-acquisition-index.mjs --check`.

Le générateur de l'index exige désormais pour les butins rares une **preuve individuelle** (`evidence_level`, URLs, date, build, type et note de preuve) avant l'étiquette `documented_forever`. Une association estampillée `source_version=forever_beta` mais sans preuve spécifique demeure `unverified`, et n'est pas transformée en Classic fictif. Les 28 relations déjà documentées sont conservées ; les 77 liens Classic restent des références Classic.

## Validation / retour arrière

- Test dédié ajouté `tests/rare-forever-loot-wave3.test.mjs` : sources item/rares, ID et niveaux, champs de preuve, statuts des anciens lieux, taux inconnus, catégories de traduction et couverture.
- Maintenir les invariants des tests des vagues précédentes, dont les 12 relations de vague 1 et les 8 de vague 2 ; ajuster seulement les totaux cumulés.
- Exécuter les contrôles de provenance, cartes rares, index et traduction hors ligne dans la CI PR. Les tests de navigateur FR/EN et le client in-game nécessitent une QA dédiée : **non revendiqués**.
- Revenir en arrière : revert des modifications `data/rares.json`, de l'index dérivé, des tests cumulatifs et des deux fichiers documentaires/tests créés. Pas de synchronisation ni déploiement.

**Attention :** les quatre sources indiquent des relations documentées, pas des captures datées du client. Toute validation en jeu doit recevoir son propre build, capture et statut.
