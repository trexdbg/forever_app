# Issue #58 — Résolution de deux IDs de plans Forever restés inconnus (15/10/2026)

## Résultat contrôlé

Deux recettes documentées dans les précédentes vagues ont maintenant un **item ID exact** individuellement vérifié, sans déduction à partir d'IDs voisins :

| Objet | ID Wowhead Forever | Vendus chez | Compétence objet | Prix / réputation |
|---|---:|---|---:|---|
| Plans: Protector's Boots | **251357** | Stondry Darkhammer et Gor'mak | Forge **85** | **30 Merchant's Favor**, source guide nommé |
| Pattern: Azure Windraveled Jerkin | **276964** | Vayn Moongaze | Travail du cuir **60** | **Nightclaw Druids — Honored** ; coût d'achat laissé inconnu |

**Preuve pour chaque objet :**
- [Wowhead Forever objet 251357 — Plans: Protector's Boots](https://www.wowhead.com/forever/item=251357/plans-protectors-boots) : objet nouveau Forever, BoP, nécessite Forge 85, localisations marchand **Redridge Mountains (2) et The Barrens**. [Catalogue Stondry Forever](https://www.wow-professions.com/forever/npc/stondry-darkhammer) et [guide marchand Forever de la faction](https://www.wow-professions.com/forever/merchants-favor-durotar-supply-azeroth-commerce) établissent la relation précise avec Stondry et Gor'mak et le coût **30 Merchant's Favor**.
- [Wowhead Forever objet 276964 — Pattern: Azure Windraveled Jerkin](https://www.wowhead.com/forever/item=276964/pattern-azure-windraveled-jerkin) : objet nouveau Forever, BoP, nécessite Travail du cuir 60, Nightclaw Druids **Honored**, zone **Zephras Isle** ; [catalogue spécifique Vayn Moongaze](https://www.wow-professions.com/forever/npc/vayn-moongaze) qui associe le vendeur au patron exact. Son **prix** demeure inconnu dans ForEveroth en raison du désaccord des montants entre guides.
- Les noms français sont également issus de sources Forever distinctes de l'attestation d'achat : [Plans : bottes de protecteur](https://foreverchanges.pro/fr/item/251357) (localisation d'une extraction client, **pas** une confirmation en jeu) et [Patron : pourpoint mêle-vent azur](https://www.wowhead.com/forever/fr/item=276964/patron-pourpoint-m%C3%AAle-vent-azur) (localisation Wowhead Forever). Aucun autre objet du catalogue n'a été traduit par analogie.

Les données conservent pour **chaque vente** la source, le lien de preuve, une date de revue, le build des preuves communautaires **unknown**, le type de preuve, la relation vendeur-ID, le statut **documented_forever**, et une note explicite. La disponibilité en jeu, les stocks et le restock sont **non attestés**. La source « Binds when picked up » atteste une propriété de l'objet, pas une transaction.

## Avant / après, sans confusion de périmètre

| Indicateur | Avant | Après |
| --- | ---: | ---: |
| Marchands | 205 | 205 |
| Fiches d'objets dans Marchands | 335 | **337** |
| Relations vendeur→objet | 776 | **779** |
| Dont ventes Forever documentaires | 199 | **202** |
| Références Classic ou incertaines | 577 | **577** |
| Index « Où l'obtenir » : objets | 647 | **649** |
| Index « Où l'obtenir » : liens | 1 100 | **1 103** |
| Index : liens documentaires Forever | 336 | **339** |
| Index : liens Classic | 764 | **764** |

Les deux anciennes vagues **ne sont pas réécrites** : Vayn conserve ses 47 liens initiaux, les vendeurs de Forge leurs 57 ajouts initiaux, avec un objet `resolved_followup` indiquant la résolution en 2026-10-15. Les champs `unresolved_item` / `unknown_item` sont maintenant `null` ; on évite d'afficher un problème déjà résolu.

## Validation et limites

- Test indépendant `tests/forever-resolved-vendor-plans.test.mjs` (2 IDs + 3 liens + frFR, stock/rang/prix et preuves par vente).
- Régressions existantes mises à jour **sans supprimer les contrôles anciens** : Forge, Vayn, marchands, rares, index équipements. `node scripts/build-item-acquisition-index.mjs --check` doit garantir la reproductibilité.
- Vérification CI Data Reliability + Equipment/BiS + Agent 03 PNJ / visual FR/EN, puis revue et fusion.
- Périmètre : référencement de ventes documentaires, **pas de client beta manipulé**. Aucun changement de coordonnées, loot, Quêtes Classic, rendu du site ou synchronisation massive.

Rollback : annuler cette seule PR restaure les deux manques et les compteurs du commit de base, sans altérer les 30 + 48 autres références de vente documentées des lots précédents.
