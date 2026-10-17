# Métiers : 275 liens documentaires supplémentaires vers les marchands

Mission d'enrichissement autorisée par le propriétaire, distincte d'une mission QA seule. Références : #55, #57, #58. Base auditée : `2d6579def2edde2ec865f57ec4ffc00a9150d606`, le 17 octobre 2026.

## Inventaire initial recalculé

Les périmètres ci-dessous se recouvrent : ne pas additionner des caches, fiches et index comme des objets différents.

| Périmètre | État initial |
| --- | ---: |
| Sept catalogues objets/BiS (`items`, `items-forever`, caches Classic/Forever, `bis`, deux `bis-niveaux`) | 3 040 lignes, **2 934 IDs uniques** |
| Fiches éditoriales Forever / cache Forever | 152 / 1 318 |
| IDs sans aucune infobulle locale dans ces sept catalogues | 42 |
| IDs sans `requiredLevel` dans aucune de leurs occurrences | 376 |
| Index d'obtention | 730 objets, 1 256 relations |
| Relations de l'index par catégorie | 923 marchands, 205 boss, 114 rares, 14 recettes des aperçus |
| Preuves de l'index | 465 documentaires Forever, 767 Classic, 24 non vérifiées |
| Rares, tous niveaux | 378, dont 85 avec butin et 293 sans |
| Rares du périmètre bêta 1–30 | 161, dont 77 avec butin et **84 sans** |
| Rares du périmètre avec coordonnées | 155 ; six sans coordonnées |
| Annuaire PNJ | 359 : 206 marchands et 153 maîtres |
| Identifiants numériques PNJ inconnus | 329 |
| Objets marchands / couples marchand–objet | 409 / 923 |
| Ventes documentaires Forever / Classic ou inconnues | 346 / 577 |
| Maîtres avec coordonnées / preuve Forever individuelle | 153 / **47** |
| PNJ avec preuve Forever individuelle de position, marchands inclus | 49 |
| Recettes archivées | 649 sorts distincts, 12 métiers, build 1.60.1.69876 |
| Composants de recettes | 1 913 liens quantifiés, 225 IDs de composants uniques |
| Objets-plans de recettes | 382 IDs |
| Recettes avec une piste de marchand | 69 |
| Liens recette–plan–marchand | 161 : 25 Forever documentaires et 136 Classic |
| Donjons / rencontres / lignes de butin | 35 / 202 / 206 |
| Boss ayant au moins un objet | 77 |
| Attribution des lignes de butin | 71 documentaires Forever, 25 non vérifiées, 110 références Classic historiques |
| Fiches techniques de butin | 208, dont 119 avec niveau d'objet et infobulle locale non vide |
| Boss avec au moins une infobulle dans ce catalogue complémentaire | 55 |
| Noms français de recettes non attestés dans l'archive | 649 |

Une infobulle non vide n'est pas une certification de statistiques complètes. Un niveau requis absent peut être légitime pour un composant ; ces mesures ne sont pas des erreurs factuelles prouvées. Les 153 points de maîtres incluent des repères Classic ou historiques : ils ne sont pas tous des positions Forever documentées individuellement.

Contrôle initial : **0 erreur structurelle, 584 avertissements**, répartis en 329 `NPC_ID_UNKNOWN`, 140 `RARE_LOCATION_UNKNOWN`, 82 `CLASSIC_WITH_FOREVER_CATALOG_LINK`, 25 `LOOT_SOURCE_INDIRECT`, sept `NPC_LOCATION_UNKNOWN`, un `LOOT_ITEM_ID_UNKNOWN`. Suite initiale : **205 tests réussis**.

## Lacune corrigée et résultat

Les PR #67–#72 ont documenté des ventes après l'import des recettes #64. Ces ventes figuraient dans l'annuaire Marchands et dans l'index des objets, mais pas dans les fiches de recettes. Exemple : un patron était bien proposé chez Daniel/Pawani dans Marchands, alors que la recette correspondante indiquait encore un vendeur non identifié.

Le lot joint **l'ID du plan associé au sort archivé** à **l'ID exact de l'offre du marchand**. Aucun rapprochement par ressemblance de noms ni numéro interpolé.

| Métier | Liens ajoutés |
| --- | ---: |
| Travail du cuir | 96 |
| Couture | 84 |
| Forge | 61 |
| Enchantement | 12 |
| Ingénierie | 11 |
| Alchimie | 10 |
| Cuisine | 1 |
| **Total** | **275** |

**166 recettes enrichies**, associées à 166 IDs de plans et 14 marchands existants. Parmi elles, l'archive classe 165 sorts comme nouveaux dans Forever et un comme inchangé : ce sont des classifications historiques du client, pas 165 nouvelles découvertes de cette mission.

Marchands : Vayn Moongaze 48 liens, Daniel Stitchsong 36, Pawani 36, Mivin Shadowweave 36, Jim'bek 36, Gor'mak 25, Stondry Darkhammer 24, Beneris sept, Fizzlefuse sept, Apothecary Durelle six, Alynsia cinq, Nina Surefire quatre, Fritz Fizzle quatre, Aza'bek un.

Après : **436 liens** (300 Forever documentaires, 136 Classic), **226 recettes avec marchand** contre 69. Les neuf recettes déjà partiellement reliées gagnent des vendeurs supplémentaires ; 157 recettes obtiennent leur première piste.

**Aucun nouvel objet, rare, sort, marchand ou couple de vente source.** La valeur ajoutée est la liaison exploitable depuis les recettes de données déjà recherchées et validées par les autres agents, désormais interrogeable aussi par nom de marchand dans Métiers FR/EN. L'index global reste à 730 objets / 1 256 relations : les 275 liens ne doivent pas être comptés une deuxième fois comme nouvelles ventes.

## Provenance et méthode

- Source recette–plan : archive client conservée au build **1.60.1.69876, 17 septembre 2026**, selon la méthode de #64 et `docs/early-forever-recipes-2026-10-15.md`.
- Source marchand–plan : assertions individuelles de `data/npcs.json` dans le [commit audité](https://github.com/trexdbg/forever_app/blob/2d6579def2edde2ec865f57ec4ffc00a9150d606/data/npcs.json), issues des PR #67, #68, #69, #70, #71, #72 et des ventes antérieures. Chaque ajout porte ce lien immuable `source_catalogue_url`.
- Chaque lien nouveau conserve exactement `evidence_level`, `source_url`, `evidence_url`, `observed_at`, `observed_build`, `evidence_kind`, `evidence_note` de l'offre d'origine. **`observed_at` reste la date de consultation d'origine**, `linked_at=2026-10-17` décrit uniquement cette intégration.
- Les 275 liens sont `documented_forever` ; **zéro** `confirmed_in_game`, zéro nouvelle preuve client, zéro conversion d'une relation Classic. Les 161 relations précédentes sont conservées intégralement, contrôlées par empreinte dans le test.
- Le script local refuse une offre seulement nommée sans ID correspondant, une preuve incomplète et un statut historique sans classification explicite. Les IDs PNJ inconnus restent `null` ; aucune identité numérique n'est reconstruite.
- Les sources WoW-Professions nominatives Vayn, Pawani, Daniel, Stondry, Jim'bek, Mivin, Nina, Beneris, Fizzlefuse et le guide Merchant's Favor ont été rouvertes pour revue contextuelle. **Pas de nouvelle vérification exhaustive de chaque ligne externe revendiquée** : la preuve réutilisée est le catalogue versionné validé. Les requêtes HTTP directes vers ces sources étaient refusées (403), leur contenu documentaire restait accessible par l'outil de consultation web.
- Aucun prix, liaison BoP, stock ou coordonnée n'est ajouté aux références dérivées. La note source peut décrire les observations de prix historiques, sans création de prix opérationnel.

Sources originales conservées par relation, notamment :

- https://www.wow-professions.com/forever/npc/vayn-moongaze
- https://www.wow-professions.com/forever/npc/daniel-stitchsong
- https://www.wow-professions.com/forever/npc/pawani
- https://www.wow-professions.com/forever/npc/mivin-shadowweave
- https://www.wow-professions.com/forever/npc/jimbek
- https://www.wow-professions.com/forever/npc/stondry-darkhammer
- https://www.wow-professions.com/forever/merchants-favor-durotar-supply-azeroth-commerce

## Reproduction et validation

```sh
node scripts/link-archived-recipe-vendors.mjs --revision=2d6579def2edde2ec865f57ec4ffc00a9150d606 --date=2026-10-17
node --test tests/early-forever-recipes.test.mjs tests/archived-recipe-vendors.test.mjs
node scripts/check-data-quality.mjs
node --test tests/data-quality.test.mjs
node --test tests/*.test.mjs
node scripts/build-item-acquisition-index.mjs --check
node scripts/check-npc-professions.mjs
node scripts/check-forever-evidence.mjs
node scripts/check-crafting-chains.mjs
node scripts/check-alchemy-beta.mjs
```

Le mode par défaut vérifie sans écrire ; `--write` intègre les liens locaux. Il faut fournir le SHA réellement examiné du catalogue source et la date réelle de liaison. **Aucun accès réseau ni publication dans le script.**

Résultats : **214 tests réussis**, zéro échec final ; contrôles ci-dessus réussis. Les 584 avertissements historiques sont identiques avant/après ; le contrôle PNJ indépendant conserve ses 336 avertissements. Nouveaux tests : intégrité de toutes les relations ajoutées, preuves et dates conservées, préservation des références Classic, idempotence, absence de doublons, cas négatifs d'ID et de preuve. Le script de rendu réel est exécuté dans un DOM simulé en FR/EN : recherche Vayn (48 recettes), plans #276964 et #253932, liens vers marchands et badges documentaires. Ce n'est pas une validation graphique mobile/navigateur ni un test en jeu.

Fichiers : catalogue de recettes, générateur local, nouveau test, deux compteurs du test historique, documentation et workflow de régression PR existant. Seule la CI de PR hors ligne est étendue, sans nouvelle fréquence ni modification d'un pipeline de publication.

## Coordination, limites et priorités

Les issues #55–#60, les audits #51/#52, les PR listées dans la mission et les PR récentes ont été consultés via leurs données GitHub et/ou les rapports intégrés. Les API GitHub publiques ont atteint leur quota pendant la collecte ; les PR nécessaires au lot ont ensuite été relues avec le connecteur. Le README privé de `forever_agent` a été consulté en lecture seule, sans lancement de collecteur.

- **Terminé** : inventaire, analyse des preuves existantes, jonction du premier lot, validation technique et préparation de PR.
- **Partiel** : étude des catalogues objets, rares, donjons et traductions pour l'inventaire. Pas de certification exhaustive ni nouvelles données dans ces domaines.
- **Non commencé** : nouvelle extraction de client récent, nouveaux drops, nouvelles positions, traductions de recettes, preuves de gameplay.
- PR #82 ouverte au début et à la vérification précédant la branche : rares/index/tests de leurs totaux laissés à son auteur. Sa revue signale six fixtures de totaux à actualiser ; ce problème ne touche pas la présente branche et n'est pas résolu ici.
- Contrats historiques de recettes conservés : compétence d'apprentissage, seuil vert, disponibilité et rendement observé restent inconnus. Le conflit du Tube en cuivre est intact. Aucun contenu supérieur au palier n'est promu comme accessible.

Trois priorités suivantes :

1. Comparer les 649 recettes à une extraction récente, immuable et versionnée ; séparer changements client, apprentissage et disponibilité au niveau 30.
2. Rattacher les composants à leurs fournisseurs et ressources avec preuves exactes par relation, en conservant les références Classic et leurs limites.
3. Résoudre les 25 attributions boss–objet non vérifiées et les identités ambiguës, puis les 84 rares du palier sans butin, après coordination avec #82.

Retour arrière : revert de cette PR. Aucun changement de `main`, fusion, déploiement, synchronisation de production, secret, Quêtes Classic ou activation de Quêtes Forever par cette mission. Les issues de programme restent ouvertes.
