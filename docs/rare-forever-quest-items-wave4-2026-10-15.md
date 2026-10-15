# Issue #59 — Trois butins de rares liés aux quêtes, WoW Forever (15 octobre 2026)

## Périmètre
Lot documentaire limité à trois monstres rares du palier 1–30 **dont la table de butin était vide**. Les pages nommées de Wowhead **Forever** associent explicitement un objet à un monstre, avec identifiant d'objet et certaines caractéristiques. Il ne s'agit **pas** d'une capture de butin obtenue en jeu ni de preuve de l'activation des quêtes Classic sur Forever.

| Monstre (zone) | Objet / ID | Éléments documentés sur Forever | Source de la relation |
| --- | --- | --- | --- |
| Mother Fang / Mère Croc (Elwynn) | Arcane Explainer: Magical Stuff in Simple Words **#248004** | Nouveau sur Forever, objet de quête unique, iLvl 1, sans niveau requis publié | https://www.wowhead.com/forever/item=248004/arcane-explainer-magical-stuff-in-simple-words |
| Blackmoss the Fetid / Moussenoire le Fétide (Teldrassil) | Moss-twined Heart **#5179** | Objet lié quand ramassé, déclenche une quête, iLvl 5, niveau requis 5 | https://www.wowhead.com/forever/item=5179/moss-twined-heart |
| Ghost Howl / Hurlement fantôme (Mulgore) | Demon Scarred Cloak **#4854** | Cape iLvl 11, niveau requis 6, 10 armure, objet de quête | https://www.wowhead.com/forever/item=4854/demon-scarred-cloak |

Les pages Forever portent des **statistiques descriptives**, non des captures gameplay horodatées. Les pourcentages qui apparaissent parfois dans les échantillons communautaires de Wowhead varient entre consultations : **aucun pourcentage de drop Forever n'a été repris**. Aucune durée de repop ni carte n'a été promue en Forever ; les données Classic restent des positions et estimations explicitement indicatives.

## Précautions éditoriales
- Pour chaque association : `source_version=forever_beta`, `evidence_level=documented_forever`, `evidence_kind=forever_community_page`, `observed_at=2026-10-15`, `observed_build=unknown`, `source_url`, `evidence_url`, `evidence_note`. Aucun `confirmed_in_game`.
- Noms **FR non attestés pour ces objets dans ce lot** : repli anglais explicitement balisé, sans traduction improvisée.
- Le descriptif `Begins a quest` et `Quest Item` caractérise seulement l'objet vu dans la fiche Forever. Le **module public Quêtes Classic reste inchangé** et aucune quête Forever n'est activée.
- Mother Fang #248004 est explicitement présenté comme `New in Forever`. Les #5179 et #4854 ont également des références Classic ; leur page Forever documente l'association, **sans prouver un changement d'obtention par rapport à Classic**.

## Mesure avant / après

| Couverture | Avant (après PR #72) | Après cette PR |
| --- | ---: | ---: |
| Rares bêta 1–30 avec un butin renseigné | 68 / 161 | **71 / 161** |
| Rares bêta 1–30 sans butin | 93 | **90** |
| Rares historiques (150) avec un butin renseigné | 62 | **65** |
| Relations rare→objet de l'index « Où l'obtenir » | 105 | **108** |
| Objets indexés toutes sources | 721 | **724** |
| Relations totales indexées | 1 247 | **1 250** |
| Relations Forever documentées, tous modules | 483 | **486** |
| Relations Classic conservées | 764 | **764** |

## Tests, limites, rollback
- `tests/rare-forever-quest-items-wave4.test.mjs` vérifie chaque couple monstre-objet, ID, provenance, inconnues, conservation des positions Classic, accès à Quêtes Classic, et index dérivable.
- Les précédentes suites rares et index conservent leurs assertions, ajustées aux nouvelles valeurs cumulatives.
- Contrôles attendus en PR : `node scripts/check-data-quality.mjs`, `node scripts/check-forever-evidence.mjs`, `node scripts/validate-rare-locations.mjs`, `node scripts/build-item-acquisition-index.mjs --check`, tests Node de régression.
- Limites : aucune visite du client Forever, preuve indépendante du taux de drop ou version précise, localisation du rare, ni test visuel en jeu.
- Rollback : revert de la PR, sans effet sur le module Quêtes Classic ni sur la collecte automatique.
