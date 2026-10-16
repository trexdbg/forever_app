# 16 octobre 2026 — SEO et fiabilité des guides donjons/boss FR/EN

## Point de départ : trafic Google mesuré, pas supposé

Le rapport privé `trexdbg/forever_agent/reports/analytics/latest.json` (collecté le 16 octobre 2026, fenêtre de données terminant au 13 octobre) contient notamment :
- `/guides/cite-dalaran-boss-loot/` : 5 clics depuis Google, 11 impressions ;
- `/en/guides/forever-level-30-bis-gear/` : 11 clics, 50 impressions ;
- `/en/guides/forever-boss-city-of-dalaran-archmage-s-shade/` : 1 clic, 48 impressions.

Ces données servent à **prioriser le travail**, mais ne prouvent aucune amélioration SEO après déploiement. Le temps de stabilisation GSC et les visites de test limitent les conclusions.

## Problème corrigé

La [revue #77](https://github.com/trexdbg/forever_app/pull/77) a classifié chaque relation boss→objet dans `data/dungeons-forever.json` : `documented_forever` lorsque WoW Source liste le couple exact, `unverified` lorsqu'une fiche d'objet seule, un cache ou un nom de boss discordant ne le prouvent pas. Les pages guides antérieures à cette revue continuaient néanmoins à présenter tous les objets comme des « butins rapportés », sans distinguer clairement le niveau de preuve **par boss et par objet**.

**Cette PR ne change aucune table de loot, aucun ID ni aucune coordonnée.** Elle rend les niveaux de confiance existants consultables sur les pages indexées par Google, avec liens vérifiables et navigation utile vers le module Donjons.

## Éditions livrées

Quatre guides de donjons **FR et EN** :
- `guides/cite-dalaran-boss-loot/` ↔ `en/guides/city-of-dalaran-boss-loot/` : 15/26 relations documentées, 11 à vérifier.
- `guides/ruines-lordaeron-boss-loot/` ↔ `en/guides/ruins-of-lordaeron-boss-loot/` : 15/22, 7 à vérifier.
- `guides/salle-des-thanes-boss-loot/` ↔ `en/guides/hall-of-thanes-boss-loot/` : 12/12, 0 à vérifier.
- `guides/excavations-paluns-boss-loot/` ↔ `en/guides/wetlands-excavation-boss-loot/` : 9/11, 2 à vérifier, plus un boss sans objet listé.

Chaque guide affiche un bilan documentaire visible, un lien direct vers la table source spécifique au donjon, le nombre de relations documentées **par boss**, le nom des éléments à vérifier, une note expliquant les limites (documentaire ≠ drop en jeu), et un lien direct `/donjons/?donjon=...&boss=N` vers les données consultables. Les tableaux de butin et les 23 boss sont intégralement préservés.

Quatre fiches Dalaran **FR et EN** :
- Atrexis : 3/3 liens documentés,
- Lyn l'Ignoré / Lyn the Unheeded : 0/3 liens attribués **sous cette identité exacte**, malgré une autre appellation dans le catalogue WoW Source ;
- Anomalie arcanique : 3/3 liens documentés ;
- Ombre de l'archimage / Archmage's Shade : 0/4 sous cette appellation exacte — la liste externe utilise Shade of the Archmage.

Ces statuts sont **liés aux noms et preuves exacts actuellement retenus dans notre catalogue**. Ne pas inférer que les drops sont absents : le rapprochement Lyn the Unheeded / Lyn the Ignored, Archmage's Shade / Shade of the Archmage et autres alias devra être réalisé sur identifiants de PNJ, source officielle ou capture en jeu avant une promotion du statut.

## Provenance et limites

- [City of Dalaran — WoW Source](https://wowsrc.com/loot/city-of-dalaran/)
- [Ruins of Lordaeron — WoW Source](https://wowsrc.com/loot/ruins-of-lordaeron/)
- [Hall of Thanes — WoW Source](https://wowsrc.com/loot/hall-of-thanes/)
- [Excavation Site: Wetlands — WoW Source](https://wowsrc.com/loot/excavation-site-wetlands/)
- Catalogue analysé : `data/dungeons-forever.json`, champs `evidence_level`, `loot_attribution_status`, `evidence_url`, `evidence_note`.

Ces sources sont des tableaux communautaires, non des observations directement confirmées en jeu. « Documenté pour Forever » **ne** signifie **pas** « obtenu personnellement dans ce build ». Dates de revue HTML et JSON-LD `Article.dateModified` fixées au **16 octobre 2026** car les pages ont réellement été éditées et contrôlées. Les méta-descriptions et leurs équivalents Open Graph / JSON-LD reflètent les nombres sans contenu artificiel ni promesse de rang Google.

## Validation et retour arrière

- Nouveau test `tests/seo-dungeon-boss-trust-guides-20261016.test.mjs` : 16 pages FR/EN, 23 boss par langue, comparaison **calculée** des statuts avec le JSON publié, présence des objets non documentés et des liens directs, cohérence JSON-LD/meta/canonicals/hreflang, existence des guides internes, absence d'activation des quêtes Forever.
- `scripts/audit-site.mjs --strict`, `scripts/check-seo-gsc-pages.mjs` et le nouveau test sont lancés automatiquement par `.github/workflows/site-geo-audit.yml` sur cette PR.
- Les positions, les objets, les rares, les BiS et les quêtes Classic sont **inchangés**.
- Rollback : revert de cette unique PR HTML + test + workflow ; pas de migration, synchronisation ni changement de schéma.

### Suivi à vérifier seulement après délai GSC

Observer sur 7 et 28 jours stabilisés les clics et impressions du guide Dalaran et de ses pages détaillées, en comparant les tendances **sans attribuer automatiquement** les fluctuations à ces corrections (trafic faible, bêta évolutive et latence GSC).
