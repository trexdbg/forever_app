# Issue #58 — Vague de Forge Forever à deux camps (15 octobre 2026)

## Résultat
Deux marchands déjà indexés : **Stondry Darkhammer**, Alliance / Les Carmines, et **Gor'mak**, Horde / Les Tarides. L'enrichissement concerne les plans de forge des premiers paliers, **29 IDs objet exactement vérifiés** à partir des liens individuels Wowhead Forever du catalogue de Stondry. Une des 58 associations préexistait chez Stondry (Plans: Acolyte's Chain Belt #251368). Cette vague ajoute donc **57 relations marchand → objet**, **28 fiches objet inédites**, **0 nouvel PNJ**.

Sources nominatives : [Stondry Darkhammer, liste de plans et coûts](https://www.wow-professions.com/forever/npc/stondry-darkhammer) ; [guide Merchant's Favor Forever, qui nomme explicitement Stondry et Gor'mak comme les deux vendeurs de la même série de 61 plans de Forge](https://www.wow-professions.com/forever/merchants-favor-durotar-supply-azeroth-commerce). Chaque association de cette vague retient également une fiche item Wowhead Forever dont l'ID a été suivi individuellement.

## Périmètre low level
- Plans de **chaînes** (5 modèles) : compétence Forge 45.
- **Gants** (5 modèles) : Forge 80.
- **Bottes** (4 modèles et une entrée volontairement non ajoutée) : Forge 85.
- **Casques à chaîne argentée** (5 modèles) : Forge 95.
- **Chemises à chaîne argentée** (5 modèles) : Forge 110.
- **Jambières à chaîne argentée** (5 modèles) : Forge 125.

Il reste **un patron volontairement non ajouté** : *Plans: Protector's Boots*. Le guide répertorie son nom, mais le lien item n'a pu être consulté de manière à garantir son identifiant exact. Aucune déduction numérique à partir des IDs adjacents n'est autorisée.

Pour les 57 nouvelles offres, la source documente **30 Merchant's Favor** et BoP, sans rang de réputation indiqué. Le statut `documented_forever` signifie documenté par guide, **pas achat personnellement observé dans le client** ; stock et réapprovisionnement restent inconnus. La compétence 45–125 décrit la condition de métier du plan et **ne vaut pas niveau de personnage ou seuil jaune de fabrication confirmé**.

Les noms français non attestés des 28 nouveaux plans sont conservés en anglais avec statut `unverified_fallback_english`. Les autres données ne sont pas traduites artificiellement. Aucun changement de position/faction des deux marchands ni des quêtes Classic.

## Statistiques nettes par domaine

| Donnée | Avant | Après | Variation |
| --- | ---: | ---: | ---: |
| Marchands | 205 | 205 | 0 |
| Fiches objets Marchands | 307 | **335** | **+28** |
| Offres marchand→objet | 719 | **776** | **+57** |
| Offres Forever documentées | 142 | **199** | **+57** |
| Offres Classic ou incertaines | 577 | **577** | 0 |
| Objets « Où l'obtenir » | 619 | **647** | **+28** |
| Relations d'obtention | 1 043 | **1 100** | **+57** |
| Relations Forever documentaires dans index | 279 | **336** | **+57** |

## Tests et rollback

- `node --test tests/forever-blacksmith-camp.test.mjs` contrôle les 29 IDs, les deux vendeurs, prix, compétence, 57 nouveaux liens, liens index et conservation des liens précédents.
- `node scripts/check-npc-professions.mjs` ; `node --test tests/npc-professions.test.mjs`, `node scripts/check-forever-evidence.mjs`.
- `node scripts/build-item-acquisition-index.mjs --check` ; `node --test tests/item-acquisition-index.test.mjs`, plus régressions rares et wave2 fournisseurs.
- Tests navigateur FR/EN existants de l'Action PNJ/Métiers. Validation dans le client de jeu **non réalisée**.
- Retour arrière : revert de la PR, qui ne modifie que les 2 fiches vendeurs, les 28 nouveaux items, l'index dérivé et les tests/docs. Pas de synchroniseur ou modification de Quêtes Classic.
