# Issue #58 — Vague marchands 02, recettes Forever des premiers métiers (15/10/2026)

## Résultat réel

| Indicateur | Avant | Après | Variation |
|---|---:|---:|---:|
| PNJ marchands | 204 | 204 | 0 (enrichissement de vendeurs existants) |
| Maîtres de métiers | 153 | 153 | 0 |
| Offres marchand → objet | 631 | **672** | **+41** |
| Offres documentées Forever | 54 | **95** | **+41** |
| Fiches d'objets vendus | 244 | **260** | **+16** |
| Objets dans index croisé « Où l'obtenir » | 556 | **572** | **+16** |
| Relations dans index croisé | 955 | **996** | **+41** |
| Classic héritées dans index | 764 | 764 | inchangées |

Sept vendeurs existants enrichis, 16 nouveaux identifiants exacts de plans/recettes. Les 41 nouvelles offres sont **documentaires Forever**, pas certifiées comme achat réalisé en jeu. Pas de taux de stock, prix en pièces inférés ni minuteur de restock inventés. Les anciens 631 liens et autres modules sont conservés.

## Vendeurs et ajout de relations

- **Fritz Fizzle** (Alliance, Carmines) : +4 schémas ; [catalogue Forever nommé](https://www.wow-professions.com/forever/npc/fritz-fizzle).
- **Fizzlefuse** (Horde, Tarides) : +7 schémas ; [catalogue Forever nommé](https://www.wow-professions.com/forever/npc/fizzlefuse).
- **Nina Surefire** (Alliance, Carmines) : +4 recettes d'alchimie ; [catalogue Forever nommé](https://www.wow-professions.com/forever/npc/nina-surefire).
- **Apothecary Durelle** (Horde, Tarides) : +6 recettes d'alchimie ; [source Forever indiquant explicitement les deux vendeurs de la faction](https://www.wow-professions.com/forever/merchants-favor-durotar-supply-azeroth-commerce), corroborée par la [carte communautaire de la bêta Forever](https://warcraftforever.games/fr/maps/the-barrens).
- **Alynsia** (Alliance, Carmines) : +8 formules d'enchantement ; [catalogue Forever nommé](https://www.wow-professions.com/forever/npc/alynsia).
- **Beneris** (Horde, Tarides) : +10 formules d'enchantement ; [catalogue Forever nommé](https://www.wow-professions.com/forever/npc/beneris).
- **Aza'bek** (Horde, Tarides) : +2 recettes classiques supplémentaires **signalées sur sa fiche dédiée Forever**, préservées comme vente documentée pour ce PNJ sans inventer le prix en unités monétaires ; [catalogue Forever nommé](https://www.wow-professions.com/forever/npc/azabek).

Les schémas d'ingénierie concernés couvrent les identifiants d'objets exacts **264201, 264202, 264203, 285285, 264204, 264205, 264206** ; recettes d'alchimie **250381, 250376, 250388, 250367, 250378, 250990, 250978, 250984** ; formules d'enchantement **249476, 249478, 249477, 249479, 249480, 249481, 249482, 249484, 249485, 249483** ; cuisine **21099, 21219**. Chaque nouvelle offre a une URL prouvant la **relation vendeur → recette** et une fiche objet Forever d'ID exact, ainsi que `observed_at=2026-10-15`, `observed_build=unknown`, `evidence_kind=forever_community_page`, et une note exposant la limite de preuve.

## Règles d'interprétation

- **Marchands Forever ≠ ventes confirmées en jeu**. Les pages communautaires décrivent la bêta et peuvent changer ; la disponibilité/stock actuel restent inconnus.
- Pour 39 des 41 nouveaux liens, le coût spécifié dans la page est **45 Merchant's Favor** ; les deux ventes de Cuisine affichent une somme en pièces non détaillée de manière fiable et ne reçoivent donc **aucun montant numérique** dans notre modèle. Les prix Merchant's Favor ne sont jamais interprétés comme du cuivre.
- Le chiffre `skill` d'une fiche objet provient du niveau métier affiché dans le guide de vendeur, **pas d'une validation séparée du seuil jaune ni du premier niveau d'apprentissage du sort** ; `skill_semantics` le précise pour les 16 nouveaux objets.
- Les nouveaux noms français non attestés sont conservés identiques à l'anglais, étiquetés `unverified_fallback_english`. Les traductions déjà enregistrées n'ont pas été altérées.
- L'étiquette `bind: pickup` n'est donnée que si explicitement vérifiée ; en particulier les anciens schémas Engineering 25–145 ne sont pas présumés BoP.
- Le périmètre privilégie les premiers niveaux de métier (25–145) et deux recettes de cuisine 80 et 175 ; la compétence métier ne signifie pas que l'objet est porté au niveau du personnage 145/175.
- Coordonnées PNJ non renseignées auparavant : restent inconnues (en particulier le camp Horde) même si le guide indique une zone. Le module Quêtes Classic demeure intact.

## Validation et rollback

- Test `tests/forever-vendors-wave2.test.mjs` des 52 combinaisons (existantes + nouvelles) et des 41 nouveaux liens.
- Audit `node scripts/check-npc-professions.mjs` ; `node --test tests/npc-professions.test.mjs`.
- Validation index reproductible `node scripts/build-item-acquisition-index.mjs --check` ; `node --test tests/item-acquisition-index.test.mjs`.
- Pas de synchronisation, ni d'import vers les quêtes Forever, ni de modification des autres données Classic. Retour arrière via revert du commit/PR.

**Sources utilisées** : fiches PNJ et liens `/forever/item=<id>` référencés individuellement. Il n'y a **aucune** preuve de commande passée depuis un client ni de taux de réapprovisionnement stable.
