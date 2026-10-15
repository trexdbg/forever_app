# ForEveroth — premier lot d'enrichissement transversal des sources d'obtention
15 octobre 2026 · Index régénéré après fusion des PR #62 et #63 · Issue #56 / programme #55

## Apport mesurable

Le premier lot crée **un index transversal de 552 IDs d'objets et 951 relations existantes**, avec accès direct aux modules Marchands, Rares, Donjons et Métiers :

| Type | Relations navigables |
| --- | ---: |
| Marchands → objet | 631 |
| Boss de donjon → butin | 205 |
| Rare → butin | 101 |
| Recette → objet produit | 14 |
| **Total** | **951** |

L'index recense 187 relations **documentaires Forever**, 764 références **Classic indicatives**, **0 confirmation nouvelle en jeu**. Ce premier lot **ne constitue pas 951 nouvelles observations** ; il valorise des données déjà présentes mais non reliées dans le catalogue d'équipements. Les 552 IDs ne doivent pas être ajoutés au nombre de fiches du catalogue comme s'il s'agissait de nouveaux objets.

Les sources sous-jacentes ne sont pas modifiées :
- data/npcs.json : 204 marchands, 631 offres connues, dont 54 documentées Forever et 577 uniquement par le catalogue historique.
- data/rares.json : **101 liens rare–loot** sur l'ensemble du catalogue (dont les 20 ajouts Forever des PR #62 et #63) ; ne pas confondre l'ensemble du catalogue avec le sous-ensemble à niveau exact 1–30.
- data/dungeons-forever.json : 205 relations dotées d'un ID valide, une entrée sans ID exclue du générateur ; 206 liens au total dans le catalogue.
- data/crafting-chains-beta.json et data/alchemy-chains-beta.json : 8 et 6 chaînes de recettes documentaires déjà opt-in.

## Règle de priorité FOREVER > Classic

Une relation attestée spécifiquement par un dossier Forever est présentée **« Forever · documenté »**, jamais « confirmé en jeu » ; en l'absence de cette preuve de relation, conserver la piste **« Classic · indicatif »**.

La priorité se fait **par relation et par champ**, non par ID d'objet. L'existence d'un objet dans le client Forever ne prouve ni l'offre d'un vendeur, ni un drop, ni un taux, ni la disponibilité de la recette en jeu.

**Attention :** l'URL de référence héritée des catalogues peut renvoyer à une *fiche objet* ou à un *guide général* et ne représente pas nécessairement une attestation de relation PNJ–objet / boss–butin / rare–butin. La nouvelle UI le dit explicitement ; le présent chantier n'a pas contrôlé manuellement chacune des 931 relations. Une source documentée Forever n'est pas une observation en jeu.

## Vue joueur

Dans /equipements/ et /en/equipements/, un bouton « Où l'obtenir » / « Where to find » situé à côté de la fiche permet d'afficher, à la demande :
- la nature de la piste, son nom et un lien interne vers la fiche cible ;
- le niveau documentaire Forever ou Classic de cette relation ;
- un lien externe de référence quand celui-ci existe.

Les panneaux sont repliés par défaut, chargement JSON **uniquement au premier clic**, pas d'affichage trompeur quand aucune piste n'est indexée, fermeture et navigation clavier. La disposition mobile est prévue ; une QA navigateur réelle reste à faire avant fusion.

Le chargement d'un index descriptif ne modifie aucune donnée source, transaction, publication, synchronisation, module de Quêtes Classic ou quête Forever.

## Reproduction et validation

```sh
node scripts/build-item-acquisition-index.mjs --check
node --test tests/item-acquisition-index.test.mjs
node --check assets/items-v3.js
node scripts/check-data-quality.mjs
node --test tests/data-quality.test.mjs
```

Si une source change, actualiser l'index depuis la branche de développement avec :

```sh
node scripts/build-item-acquisition-index.mjs --write
```

Le générateur reste local, hors publication et **ne consulte aucune API externe**. CI : ajout d'une vérification PR-path-scoped dans equipment-bis-quality.yml.

## Limites et étapes suivantes

1. Ne pas déduire l'absence d'un objet parce qu'il n'a pas de source indexée.
2. Le bouton pointe vers les catalogues existants, pas vers une preuve de présence in-game.
3. Les rares encore sans butin du palier 30 ne sont pas enrichis par de nouveaux drops dans ce lot ; chantier #59.
4. Les données de vente Classic sont conservées, jamais promues automatiquement en Forever ; chantier #58.
5. Pour les prochaines PR, **augmenter réellement** le nombre de relations spécifiques à Forever depuis des guides, rapports et archives ciblés, avec l'ID exact et la preuve de la relation. Ce lot sert de base de navigation et de métrique.

## Retour arrière

Revert de cette PR pour retirer le fichier d'index, son générateur/test et les panneaux d'acquisition sans modifier les catalogues originaux. Pas de sync ni de déploiement dans cette PR.

## Actualisation du 15 octobre 2026 — fusion des vagues rares

L'index a été reconstruit à partir du `main` incluant les PR #62 et #63 : **+20 nouvelles relations Forever de butin** et **+20 IDs d'objets**, sans modifier les 764 relations historiques Classic. Les tests protègent les 20 liens individuels et vérifient la reproduction exacte via le générateur hors réseau.
