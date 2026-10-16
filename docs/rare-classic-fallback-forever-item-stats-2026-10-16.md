# Issue #59 — Rares de départ : trois références Classic, deux objets Forever distincts (16 octobre 2026)

## Pourquoi ce lot privilégie explicitement le repli Classic

Trois monstres rares 1–30 avaient une table de butin vide dans ForEveroth. Les bases WoW **Classic** identifient leurs objets historiques ; nous avons vérifié séparément deux fiches *d'objets* sur Wowhead **Forever**, mais celles-ci ne fournissent pas de preuve exploitable que les rares correspondants les lâchent actuellement sur Forever. Une fiche d'objet dans le client Forever ≠ une preuve de drop.

**Résultat : +3 relations Classic indicatives, et 0 relation Forever nouvelle pour des drops non prouvés.** Les fiches conservent `source_version=classic_reference`, les probabilités et le repop actuels sont inconnus. Les chiffres distincts du client Forever sont enregistrés dans `forever_item_snapshot` et visibles **sur une seconde ligne balisée « butin non confirmé »**, sans promotion du lien de butin.

| Monstre, zone | Objet et ID | Valeurs Classic | Snapshot Forever séparé |
| --- | --- | --- | --- |
| Uruson, Teldrassil | Gnarlpine Leggings **18611** | iLvl 7, niveau 2, 36 armure | Inconnu : fiche Forever non exploitable lors de l'audit |
| Gibblewilt / Margouilleur, Dun Morogh | Foreman Vest **10553** | iLvl 11, niveau 6, 21 armure, +2 Force | iLvl 13, niveau 8, 25 armure, +3 Force |
| Narg the Taskmaster / Narg le Sous-chef, Elwynn | Studded Blackjack **1913** | iLvl 10, niveau 5, 5–10 dégâts, vitesse 1,80 | iLvl 12, niveau 7, 10–19 dégâts, vitesse 2,20, +1 Force |

## Sources consultées, **différentes pour chaque propriété**

**Attributions historiques Classic** :
- https://www.wowhead.com/classic/item=18611/gnarlpine-leggings — Uruson (Classic)
- https://www.wowhead.com/classic/item=10553/foreman-vest — Gibblewilt (Classic)
- https://www.wowhead.com/classic/item=1913/studded-blackjack — Narg the Taskmaster (Classic)
- https://www.wowhead.com/classic/fr/npc=79/narg-le-sous-chef et https://www.wowhead.com/classic/npc=8503/gibblewilt — confirmations nominatives de l'association dans les références et commentaires Classic, qui **ne** prouvent **pas** Forever.

**Deux pages d'objets Forever (statistiques seulement, pas preuve d'attribution ni de drop en jeu)** :
- https://www.wowhead.com/forever/item=10553/foreman-vest : iLvl 13, 25 armure, +3 Force, requis 8.
- https://www.wowhead.com/forever/item=1913/studded-blackjack : iLvl 12, 10–19 dégâts, vitesse 2,20, +1 Force, requis 7.

Ces pages indiquent des valeurs documentaires sur la branche Forever, mais pas de build précis. Nous laissons `observed_build=unknown` et refusons d'en déduire la probabilité ou l'obtention.

**Traductions classiques et provenance linguistique** :
- Gnarlpine Leggings **#18611** → **Jambières de Pin-tordu** : https://www.wowhead.com/classic/fr/item=18611/jambi%C3%A8res-de-pin-tordu
- Foreman Vest **#10553** → **Gilet de contremaître** : https://www.wowhead.com/wotlk/fr/item=10553/gilet-de-contrema%C3%AEtre (référence de localisation WoW Classic, édition WotLK, pas validation actuelle du client Forever)
- Gibblewilt **#8503** → **Margouilleur** : https://www.wowhead.com/mop-classic/fr/npc=8503/margouilleur (localisation héritée WoW Classic, non confirmée par client Forever)
- Studded Blackjack **#1913** : **anglais conservé**, aucune traduction française suffisamment assurée dans ce lot.

Noms français `name_fr_status=classic_reference` quand sourcés, `unverified_fallback_english` sinon. Les deux noms sourcés par item ID sont également intégrés au moteur partagé `assets/item-locale.js` et testés FR/EN.

## Avant / après
| Métrique | Avant | Après |
| --- | ---: | ---: |
| Rares 1–30 ayant au moins une entrée de butin, Classic ou Forever | 74 / 161 | **77 / 161** |
| Rares 1–30 sans entrée de butin | 87 | **84** |
| Rares historiques 150 avec au moins une entrée | 68 | **71** |
| Relations rare→objet dans l'index | 111 | **114** |
| Objets uniques dans « Où l'obtenir » | 727 | **730** |
| Relations d'obtention tous modules | 1 253 | **1 256** |
| Relations Forever documentées dans l'index | 489 | **489**, inchangées |
| Relations Classic indicatives dans l'index | 764 | **767** |

**Ce que nous n'affirmons pas :** que ces trois items sont actuellement obtenables sur WoW Forever ; que les taux Classic sont applicables ; que Gibblewilt y possède une localisation, un taux de spawn ou les mêmes caractéristiques ; que les noms FR Classic sont ceux du client Forever.

## Vérifications et retour arrière
- Nouveau test `tests/rare-classic-fallback-forever-item-stats-20261016.test.mjs` : trois paires exactes, relation **Classic** jamais reclassée par les deux snapshots **Forever**, inconnues, noms FR, visualisation, index et quêtes Classic accessibles.
- Tests cumulés ajustés pour conserver le décompte des 161 rares 1–30 et tous les liens précédents.
- `scripts/check-item-locales.mjs` enrichi de deux traductions indépendantes.
- CI « Data reliability » et « Equipment/BiS » hors ligne, vérification de l'index reproductible.
- Rollback par revert de la PR, sans sync, ni activation de quêtes Forever, ni modification des coordonnées.
