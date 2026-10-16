# Audit des traductions de rares et objets de quête — 16 octobre 2026

Issue d'origine : [#59](https://github.com/trexdbg/forever_app/issues/59). Correctif FR/EN **ciblé**, sans synchronisation ni nouvelle affirmation d'obtention en jeu.

## Correction de 3 noms de monstres (palier 1–30)
| Nom anglais préservé | Ancien libellé FR | Nom FR Wowhead Classic vérifié | Source nominative |
| --- | --- | --- | --- |
| Timber | Timber | **Grumeux** | https://www.wowhead.com/classic/fr/npc=1132/grumeux |
| Ghost Howl | Hurlement fantôme | **Hurleur fantomatique** | https://www.wowhead.com/classic/fr/npc=3056/hurleur-fantomatique |
| Blackmoss the Fetid | Moussenoire le Fétide | **Noiremousse le Fétide** | https://www.wowhead.com/classic/fr/npc=3535/noiremousse-le-fetide |

Les noms ont le statut explicite `name_fr_status=classic_reference` et un `name_fr_source_url` précis. Pour Timber et Blackmoss, l'identifiant numérique de la page Classic sert **seulement de référence linguistique**, sans prétendre résoudre leur ID Forever ni leur disponibilité en jeu. Les points de carte et estimations de repop existants demeurent des références Classic.

## Deux noms FR d'objets de quête, même prudence
| Objet (nom original anglais) | ID | Nom publié sur Wowhead Classic frFR |
| --- | ---: | --- |
| Demon Scarred Cloak | 4854 | **Cape griffée par les démons** |
| Moss-twined Heart | 5179 | **Cœur moussu** |

Sources indépendantes du lien de butin Forever :
- https://www.wowhead.com/classic/fr/item=4854/cape-griffee-par-les-demons
- https://www.wowhead.com/classic/fr/item=5179/coeur-moussu

Ces noms sont ajoutés à la table de localisation par **ID exact** de `assets/item-locale.js` et aux fiches `data/rares.json`. La relation de butin reste `documented_forever` selon sa preuve propre sur la page d'objet Forever, et **n'est pas** une capture d'un drop actuel. Les deux champs sont volontairement séparés : `name_fr_source_url` = Classic FR ; `evidence_url` = lien de la relation du butin dans Forever. L'absence de localisation spéciale au client Forever n'est pas comblée par invention. L'objet #248004, nouveau Forever, reste **en anglais** faute de preuve FR suffisante.

## Bug de confiance corrigé
L'étiquette collective **« Objets ajoutés dans Forever »** faisait passer des objets historiquement présents dans Classic (#4854, #5179) pour des nouveautés. Elle devient **« Butins référencés dans Forever »** (EN « Loot listed for Forever »). Les noms FR issus de Classic sont signalés dans les fiches rares et les lignes de butin. L'affichage n'assimile plus la preuve d'une **relation dans Forever** à la nouveauté intrinsèque de l'objet.

## Impact, vérification et annulation
- **3 libellés PNJ corrigés**, **2 libellés objets corrigés** ; pas d'ajout artificiel de données, quantités, drops, taux ou coordonnées.
- Périmètre inchangé : **161 rares au palier 30**, **71** avec au moins un butin et **90** encore incomplets ; **724 objets et 1 250 relations** dans l'index d'obtention. Le changement de libellé conserve `name_en`, les IDs et les liens des objets.
- Index d'obtention mis à jour pour **2 noms de rare** en conservant le générateur comme source de vérité ; compteur et statut d'évidence inchangés.
- Scripts FR/EN actualisés via version des assets dans les deux pages Rares. Module Quêtes Classic, données de quêtes et module Forever inactif restent intacts.
- Tests : `tests/rare-classic-fr-localization-20261016.test.mjs`, `scripts/check-item-locales.mjs`, régression `tests/rare-forever-quest-items-wave4.test.mjs`, `tests/rare-forever-new-wave2.test.mjs`, checks des rares, qualité Data, équipements/BiS et index. CI hors ligne, aucun import depuis le jeu.
- Limites : traductions vérifiées dans la **base Classic** ; aucune attestation du texte localisé du client Forever. Pas de taux de drop ni de timer validé par l'audit.
- Rollback par revert de la PR, sans migration de données.
