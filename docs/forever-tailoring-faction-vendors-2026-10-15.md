# Issue #58 — Couture Forever, 36 patrons et les deux camps des factions (15/10/2026)

## Résultat et méthode
- **+1 nouveau marchand** : Jim'bek, PNJ **248202** de la Horde, aux Tarides, [fiche Wowhead Forever](https://www.wowhead.com/forever/npc=248202/jimbek), [page nominative de vente](https://www.wow-professions.com/forever/npc/jimbek).
- **Mivin Shadowweave**, PNJ Alliance déjà recensé aux Carmines, [fiche marchande Forever](https://www.wow-professions.com/forever/npc/mivin-shadowweave), est enrichi sans recréation du PNJ.
- **+36 plans de couture (IDs Wowhead Forever pris dans les 36 liens individuels des deux catalogues)**, **+72 associations marchand→objet**. Six styles (Flame, Pearly, Pristine, Shadow, Shining, Silky) pour bottes (60), gants (75), ceintures (85), couronnes (100), robes (110) et jambières (125). Le chiffre représente le **niveau de compétence métier cité par le vendeur**, pas un niveau personnage, un seuil jaune ou un niveau d’apprentissage confirmé en jeu.
- **30 Merchant's Favor par patron, BoP**, d'après les tableaux de vente des guides spécifiques à Forever. Aucune réputation exigée pour ces **36 plans du premier palier**, contrairement à certaines recettes supérieures figurant après dans les guides et **non intégrées ici**.
- Les noms français des 36 patrons n'ont pas de preuve de localisation fiable dans ce lot : anglais conservé avec `name_fr_status=unverified_fallback_english`. Les icônes sont des parchemins génériques étiquetés `category_fallback`. Aucune statistique d'objet fabriqué ni quantité de composant imaginée.

## Position et statut de Jim'bek
- [Guide Mobalytics Forever — vendeur Horde à 49,6 / 29,4](https://mobalytics.gg/wow-forever/profile/crix/guides/tailoring-guide-for-wow-forever) ; [atlas des Tarides de build Forever](https://endgametools.com/fr/wow-forever/atlas/the-barrens) atteste également Jim'bek à **49,6 / 29,4** ; [stillsixty](https://www.stillsixty.com/merchant-favor) le situe vers **49,6 / 29,5** (différence d'arrondi de 0,1 explicitement notée, sans précision artificielle). Carte des Tarides `uiMapID=1413`, pourcentage de zone, **pas de GPS**.
- Position conservée `coordinate_status=forever_guide_waypoint`, `evidence_level=documented_forever`, date de notre audit `2026-10-15`, build source `unknown`. Il ne s'agit pas d'une capture du PNJ attribuée à un build de jeu ni d'une promesse de disponibilité constante.
- Les deux relations de vente sont `documented_forever` avec URLs nominatives par PNJ/ID, jamais `confirmed_in_game`. Stocks, retours en stock et horaires restent inconnus.

## Comptage par sous-ensemble, après ce lot

| Indicateur | Avant | Après |
| --- | ---: | ---: |
| PNJ total / marchands | 358 / 205 | **359 / 206** |
| Fiches d'objets marchands | 373 | **409** |
| Relations de vente marchand→objet | 851 | **923** |
| Dont sources de vente Forever documentaires | 274 | **346** |
| Anciennes offres Classic/inconnues | 577 | **577** |
| Objets dans l'index « Où l'obtenir » | 685 | **721** |
| Relations d'obtention | 1 175 | **1 247** |
| Liens Forever documentaires dans index | 411 | **483** |
| Liens Classic indicatifs dans index | 764 | **764** |

**NB :** l'index est une aide de navigation. Une fiche Wowhead Forever de plan et un guide qui cite le vendeur ne prouvent pas une vente actuelle sur le client. L'ancienne base Classic demeure utilisable et n'est jamais affichée comme preuve Forever.

## QA et annulation
- Tests unitaires `tests/forever-tailoring-faction-camps.test.mjs` : les **36 couples nom→ID** et les **72 ventes**, Factions / source / prix / statut / coordonnées / ignorance du stock.
- Tests cumulatifs des vagues précédentes maintenus, chiffres mis à jour sans supprimer leurs invariants ; index validable `node scripts/build-item-acquisition-index.mjs --check`.
- CI PR : régressions PNJ/Métiers, Data Reliability, Equipements/BiS, navigateurs FR/EN desktop et mobile. Aucune confirmation de gameplay réelle.
- Rollback par revert de cette PR, ne touche pas aux Quêtes Classic, aux rares ni aux autres marchands.
