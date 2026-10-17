# Ingénierie et secourisme : 44 relevés documentaires du build 70425

Enrichissement autorisé, lié au programme #55 et au chantier Métiers #57. Cette PR est **empilée sur #83**, dont elle conserve les 275 liens de marchands et les corrections de revue ; sa base doit rester la branche de #83 tant que celle-ci n'est pas fusionnée. Aucune fusion ni publication autorisée par cette mission.

## Sources effectivement consultées

Les pages WoW Forever Talents indiquent le build **1.60.1.70425**, publié le **16 octobre 2026**. Consultation et extraction des pages HTML : **17 octobre 2026**. Le dépôt public MAF2414 a également été consulté : son dernier commit `bab6cc7556feb95978c11ecb64aaa403a1bf19dd` conserve le build 69876 et ne constitue donc pas une extraction récente. Il n'a pas été utilisé comme preuve du build 70425.

| Page | Relevés retenus | SHA-256 du HTML consulté |
| --- | ---: | --- |
| https://wowforevertalents.com/professions/engineering/parts/ | 16 | `261e86e252b6eba4e5e09c8ae2b10893544859fb3ea457644ecd6475d696f85f` |
| https://wowforevertalents.com/professions/engineering/explosives/ | 14 | `b6f4dfb611fca61f49c7cbbef81e9312abc599a92b85721ef5bea0ae4dc92fe9` |
| https://wowforevertalents.com/professions/first-aid/ | 14 | `bdba4a00bc370ebd1420acfcbd69be41c97d64f3423c13590362049966a01252` |

Critère de sélection : **seuil jaune indiqué de 1 à 150**, avec ID sort, objet produit et composants explicites. Ce filtre priorise les premiers métiers, **pas une preuve d'accessibilité au niveau de personnage 30**. Les niveaux requis de personnage ne sont pas publiés par ces relevés et restent `null`, même lorsqu'un niveau d'objet est indiqué.

Les liens exacts `#r-ID` existent dans le HTML de la source et sont conservés comme `evidence_url`. Le SHA-256 permet de distinguer la page consultée d'une mise à jour future. Les captures HTML sont des entrées de travail ; le dépôt conserve leur projection factuelle normalisée, pas une copie complète des pages. Une future reproduction depuis le site vivant peut donc présenter un hash différent et nécessiter une nouvelle revue.

## Avant / après : enrichissement réel, sans double comptage

| Mesure | Avant | Après |
| --- | ---: | ---: |
| Recettes historiques, build 69876 | 649 | 649 |
| Relevés complémentaires build 70425 | 0 | **44** |
| Répartition de ces relevés | — | 30 Ingénierie, 14 Secourisme |
| Objets produits identifiés dans ces relevés | — | 44 IDs déjà connus |
| Relations recette–composant documentées dans ce nouveau build | 0 | **99**, vers 46 IDs de composants |
| Objets-plans liés par les pages récentes | 0 | 12 relations déjà connues, nouvellement sourcées pour ce relevé |
| Quantités inconnues dans l'archive et maintenant indiquées par une source récente | 0 | **14** |
| Compétences indiquées par la source, distinctes du jaune | 0 | **15** ; 29 restent inconnues |
| Seuils verts publiés comme calcul de la source | 0 | **44** |
| Nouveaux sorts, objets, PNJ ou ventes | 0 | **0** |

Les 44 sorts se trouvaient déjà dans l'archive et tous les couples ID/quantité de composants coïncident avec celle-ci. Ce lot ajoute une **seconde provenance récente et des propriétés auparavant non renseignées**, pas 44 nouvelles recettes découvertes ni 99 nouveaux types de relations dans l'index global.

Les classifications de la source par rapport à Classic sont 16 « new », 12 « changed », 16 « unchanged ». Elles ne décrivent pas 28 changements depuis septembre. Les quantités renseignées étaient auparavant `null` : nous n'affirmons pas qu'un rendement a changé entre les builds.

### Exemples précis

- **Coarse Dynamite**, sort **3931**, objet **4365** : quantité publiée **2**, auparavant inconnue dans l'archive. La valeur historique reste `null` ; le nouveau panneau indique explicitement qu'il s'agit d'une quantité documentaire, sans craft observé.
- **SAF-T Tabs**, sort **1266893** : compétence indiquée **25**, distincte du seuil jaune et conservée dans le relevé séparé. Cela ne prouve pas qu'un PNJ précis enseigne le sort actuellement.
- **Copper Tube**, sort **3924** : quantité publiée **1**, sans résolution autoritaire du conflit 1/2 de l'aperçu de recherche. L'aperçu conserve `output_quantity=null` et `output_quantity_status=conflicting_sources`.
- Les 15 compétences indiquées concernent les sorts 3275, 7935, 1262996, 3918, 3919, 3933, 8339, 1266893, 1266905, 1266906, 1266907, 1266908, 1266909, 1266910, 1266911. Les valeurs sont celles publiées dans le client présenté par la source, y compris « connu dès le départ » ; pas des exigences serveur vérifiées.

## Politique de preuve

Chaque relevé possède les sept champs de provenance obligatoires : `evidence_level=documented_forever`, `source_url`, `evidence_url`, `observed_at=2026-10-17`, `observed_build=1.60.1.70425`, `evidence_kind=forever_community_page`, `evidence_note`.

**Pas de classification `datamined`** pour ce lot : nous lisons une présentation communautaire de données client et n'avons pas décodé indépendamment les DB2 du build récent. **Zéro confirmation en jeu.** La source indique que le seuil vert est calculé comme le milieu arrondi entre jaune et gris ; `green_threshold_status=source_calculated_midpoint_not_independently_extracted` conserve cette limite et le libellé FR/EN la montre. Aucun seuil vert n'est présenté comme un nouveau champ client vérifié.

`learning_skill_reported` ne remplace jamais le niveau jaune. S'il manque dans la source, il reste `null`. La disponibilité actuelle, le rendement observé en jeu et le niveau requis du personnage restent inconnus. Aucun vendeur, prix, coordonnée, stock, traduction française ou taux de drop n'est ajouté.

## Consultation FR/EN

Après ouverture de l'explorateur de recettes existant, un second JSON local est chargé de manière facultative. Pour les 44 sorts correspondants, la fiche propose un panneau replié **« Relevé documentaire récent · 1.60.1.70425 »**, avec produit/quantité, composants, seuils, compétence publiée, plans et lien de preuve exact. Le panneau explique les limites en français et en anglais.

Le relevé récent n'écrase aucun champ de l'archive 69876 : les anciens chiffres, inconnues, vendeurs, sources et comparaisons restent affichables séparément. La jointure exige **le même ID sort et le même métier**, pas le nom du produit. Une réponse réseau absente, mal formée ou d'un autre métier ne désactive pas l'archive. Pas de nouvelle dépendance réseau externe au chargement du site, pas de changement CSS ni de refonte ; cache du script FR/EN actualisé.

## Extraction et contrôles

Extracteur Python standard, hors ligne, sans synchronisation ni publication :

```sh
python scripts/extract-recent-profession-snapshots.py \
  --parts /chemin/parts.html \
  --explosives /chemin/explosives.html \
  --first-aid /chemin/first-aid.html \
  --observed-at 2026-10-17 \
  --output data/recipes-forever-70425-snapshots.json
python -m unittest discover -s tests -p test_recent_profession_extraction.py -v
node --test tests/recent-profession-snapshots.test.mjs
node --test tests/*.test.mjs
node scripts/check-data-quality.mjs
node --test tests/data-quality.test.mjs
node scripts/build-item-acquisition-index.mjs --check
node scripts/check-crafting-chains.mjs
node scripts/check-alchemy-beta.mjs
node scripts/check-item-locales.mjs
```

Résultats : **225 tests Node réussis**, **quatre tests Python réussis**, contrôles qualité/index/aperçus/localisation réussis. Contrôle général : **0 erreur, 584 avertissements**, identiques à la base. L'index global reste inchangé à 730 objets / 1 256 relations. Les 216 tests de la PR #83 corrigée sont inclus dans les 225, pas additionnés comme une seconde suite.

Les tests exécutent le renderer réel dans un DOM simulé FR/EN : panneau récent, sources, quantité 2, inconnue historique préservée, indisponibilité réseau, réponse mal formée et métier incorrect. Ils valident également l'ensemble des 44 identités, les 99 relations de composants, les 12 plans, les 15 compétences et les limites des preuves. Les tests Python utilisent uniquement des fixtures synthétiques et rejettent build/métier/ID incohérents, quantités non entières ou nulles, et seuils hors sélection.

**Limite de validation graphique** : une vérification Chromium a été tentée, mais le binaire du navigateur n'est pas installé dans l'environnement. Aucune capture graphique mobile/desktop ni observation en jeu n'est revendiquée. L'absence de navigateur ne remet pas en cause les contrôles du DOM et des données, mais le rendu visuel reste à relire avant fusion.

Le workflow ajouté se déclenche uniquement sur PR et chemins pertinents, avec permissions en lecture et sans planification. Les pipelines de publication, secrets et quêtes sont inchangés.

## État et suite

- **Terminé** : 44 relevés sourcés, extracteur, panneau FR/EN, contrôles et PR de livraison.
- **Partiel** : comparaison récente limitée à deux professions et trois pages ; aucun changement de recette depuis septembre démontré au-delà des propriétés nouvellement documentées.
- **Non commencé** : autres métiers récents, fournisseurs de composants, preuves serveur et gameplay. La recherche initiale sur les fournisseurs n'a pas produit de preuve suffisante pour promouvoir les anciennes ventes de composants Classic : elles sont conservées sans requalification.
- **Coordination** : dépendance explicite à #83 ; #82 et ses fichiers de rares/index restent à leur auteur. Les trois remarques de revue de #83 ont été corrigées dans celle-ci avant d'empiler ce lot.

Priorités : étendre les relevés récents aux autres métiers avec le même contrat ; rechercher les fournisseurs nominatifs des composants sans déduire une vente d'une catégorie générique ; confirmer les prérequis serveur et rendements avec captures/build attribuables.

Retour arrière : revert du lot récent retire le JSON complémentaire et le panneau, sans supprimer l'archive ni les liens marchands #83. Ne pas fusionner, synchroniser en production ou déployer sans accord du propriétaire.
