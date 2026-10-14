# Agent 03 — Mission 06 : obtention des huit composants d'alchimie Forever

**Investigation :** 14 octobre 2026 (date réelle de consultation, Europe/Paris). **Base :** `main` après fusion de la PR #47, commit `0747fba8c8a70025d5c20933a3b04c21f5d554a8`. **Champ :** six potions et huit réactifs, niveaux 1–30, aperçu documentaire exclusivement. Aucun test en jeu ni extraction de client réalisés pour cette mission.

## Sources réellement consultées et portée

- [Wowhead Forever — guide Alchimie](https://www.wowhead.com/forever/guide/professions/alchemy-overview-trainer-locations-recipes), auteur Nodge, **mise à jour affichée 2026-10-12**, **consulté 2026-10-14** : dans « How to Craft Alchemy Items », les fioles **Empty Vial** et **Leaded Vial** sont annoncées chez les fournisseurs de marchandises générales, d'alchimie et d'herboristerie. **Le guide ne fournit pas la preuve d'une relation pour un identifiant PNJ particulier** ; aucun prix/stock/délai/point n'est affirmé.
- [Wowhead Forever — guide Herboristerie](https://www.wowhead.com/forever/guide/professions/herbalism/overview-leveling), auteur Nodge, **mise à jour affichée 2026-10-11**, **consulté 2026-10-14** : liste des **noms de plantes**, des **tranches de progression conseillées** et d'**ensembles de zones conseillées**. Ces tranches ne sont *pas* des compétences minimales exactes ; une zone dans une ligne de plusieurs plantes n'atteste pas individuellement un spawn ni une position. Le guide atteste que l'Étouffante/Stranglekelp pousse **sous l'eau**, pas une côte ou un point précis.
- Pages Forever identitaires consultées : [3371](https://www.wowhead.com/forever/item=3371/empty-vial), [3372](https://www.wowhead.com/forever/item=3372/leaded-vial), [2447](https://www.wowhead.com/forever/item=2447/peacebloom), [785](https://www.wowhead.com/forever/item=785/mageroyal), [2453](https://www.wowhead.com/forever/item=2453/bruiseweed), [3820](https://www.wowhead.com/forever/item=3820/stranglekelp). Ces pages identifient les **objets**, mais leurs listes géographiques de vendeurs ne prouvent pas une transaction **PNJ ID ↔ objet ID**, ni une récolte effective.
- Page francophone Forever de l'[objet 3820 « Etouffante »](https://www.wowhead.com/forever/fr/item=3820/etouffante), identifiée par le résultat indexé : la référence précédente « Étangétrangle » contredisait cette version localisée. L'intitulé de référence du catalogue est corrigé en **Étouffante** ; **le texte du client FR n'est pas vérifié**. Aucun champ `name_verification` n'est promu vers une certification.
- Pages directes Forever de [730](https://www.wowhead.com/forever/item=730/murloc-eye) et de [2450](https://www.wowhead.com/forever/item=2450/briarthorn) : **accès non concluants** (page de vérification/JavaScript pour l'une ; contenu vide pour l'autre), ne pas les compter comme preuves de butin.
- [Forever Talents — Recovery Potions](https://wowforevertalents.com/professions/alchemy/recovery-potions/) : **référence héritée de la mission 05** pour les huit identités d'ingrédients dans six recettes du client `1.60.1.70338`, et **non revalidée en direct** dans cette mission ; ne prouve aucune obtention.
- [Wowhead TBC Classic — objet 730](https://www.wowhead.com/tbc/item=730/murloc-eye) : **piste Classic isolée**, attribue des murlocs et des taux Classic, **non transférés** à Forever. Aucun emprunt à Turtle WoW.

## Matrice 8/8 — preuves **par méthode**, et manques

« Doc. » = source **spécifique Forever** décrivant un mode général, **jamais confirmé par jeu**. « ? » = aucune preuve exacte exploitable pour une nouvelle relation. Chaque ligne reste indépendante des autres.

| ID | Réactif FR / EN | Achat | Herboristerie | Butin | Source retenue / lacune |
| ---: | --- | --- | --- | --- | --- |
| 3371 | Fiole vide / Empty Vial | **Doc. type de fournisseur**, PNJ inconnu | ? | ? | Guide Alchimie, relation fournisseur *générique* seulement, prix/stock/lieu `null` |
| 3372 | Fiole plombée / Leaded Vial | **Doc. type de fournisseur**, PNJ inconnu | ? | ? | Idem, vente par **identifiant PNJ** inconnue |
| 2447 | Pacifique / Peacebloom | ? (page objet mentionne des zones) | **Doc.** plage 1–70 | ? | Zones de départ conseillées, **Wilted Peacebloom** distinct ; ID de nœud/quantité inconnus |
| 785 | Mage royal / Mageroyal | ? (page objet mentionne des zones) | **Doc.** plage 70–115 | ? | Sombrivage / Loch Modan / Forêt des Pins argentés : suggestions **pour le groupe** |
| 2450 | Églantine / Briarthorn | ? | **Doc.** plage 70–115 | ? | Même itinéraire de groupe ; page objet non accessible de manière concluante |
| 2453 | Doulourante / Bruiseweed | ? | **Doc.** plage 115–170 | ? | Hautebrande / Paluns / Serres-Rocheuses : itinéraire de groupe |
| 3820 | Étouffante / Stranglekelp | ? | **Doc.** 70–115 (+ 115–170), sous l'eau | ? | Pas de littoral / coordonnées attestés ; « Étangétrangle » était une traduction non confirmée |
| 730 | Œil de murloc / Murloc Eye | ? | ? | **Inconnu** ; Classic uniquement comme piste | Aucune relation Forever créature ID → objet 730 consultable ou attribuable |

**Bilan :** 8 enregistrements `acquisitions` = **2 `vendor` de catégorie**, **5 `herbalism_node` documentaires**, **1 `unverified` butin**. **0 `confirmed_in_game`, 0 vendeur individuel, 0 créature liée, 0 coordonnées ou taux**. Aucun quota artificiel. La présence d'une relation documentaire ne rend **pas** `verified_for_forever` vrai : ce champ reste `false` pour toutes les relations.

## Modèle de preuve adopté

Chaque relation a un `item_id` validé parmi huit composants, `method` (énumération `vendor`, `herbalism_node`, `loot`, `classic_reference`, `unverified`), `scope` limité, `evidence_level`, `evidence_note`. Les relations documentaires comportent `source_url`, `evidence_url`, `observed_at` (= **2026-10-14**, **date de consultation**), `observed_build: "unknown"`, `evidence_kind: "forever_community_page"`, et `guide_updated_at` (= date de mise à jour **affichée**, distincte de `observed_at`). Le guide Forever ne prouve **pas** quel build précis était actif.

`vendor` avec `scope:"supplier_category"` n'autorise ni `vendor_id`, ni `vendor_name`, ni prix, stock, délai, zone ou position. Une future relation **PNJ→objet** exigerait `scope:"npc_item_sale"`, ID et noms localisés de PNJ, et sa **preuve de vente particulière**, sans simplement réutiliser le guide. Aucun lien local vers un PNJ n'est produit sans cette preuve.

`herbalism_node` conserve `node_name` bilingue comme **libellé de référence** et `skill_band` comme **itinéraire conseillé**, distinct de `skill_required:null`. `suggested_zones` est la liste **commune de l'itinéraire**, `zone_scope:"shared_guide_itinerary"`. `node_id:null`, `coordinates:null` et `quantity:null`. La présence de la plante dans la grille ne prouve ni l'ID du nœud ni la quantité récoltée.

`unverified` sur l'objet 730 : `mob_id:null`, `mob_name:null`, `drop_rate:null`, `respawn_minutes:null` et note d'incertitude ; **aucune source Classic n'est promue**. Le validateur prévoit aussi les types `loot` et `classic_reference` séparés avec exigences strictes, mais **aucune de ces relations positives n'est créée faute de preuve**.

L'UI conserve les données anciennes `research_only_not_published` / `opt_in_documentary_preview`, les **6 potions**, les exclusions **118/858** vers le Secourisme, les valeurs `output_quantity:null` et les huit recettes d'ingénierie. Recherche globale : **six potions seulement**, sans indexation des réactifs.

## QA et points à reprendre après revue

Vérifications attendues par CI PR-only : contrôles des provenances par méthode, refus des ventes/coordonnées/quantités/taux sans preuve, cohérence IDs & traductions, tests natifs FR/EN, search, ingénierie, PNJ, qualité, puis **Chromium réel FR/EN × 1440px / 375px** avec captures documentaires des trois modes d'acquisition. Le contrôle du seuil de compétence minimal par plante n'est **pas** présenté comme résolu.

**À traiter dans d'autres PR, sans toucher aux cartes de l'autre agent :** fournir captures datées/build de vente **PNJ ID–objet ID** ; identifiants de nœuds, minimum exact et preuves de coordonnées ; preuve de butin **créature ID–730** (plus sa zone / son taux si attestés). Les listes géographiques Wowhead ou Classic restent des pistes, pas des épingles sur les cartes Forever.

**Rollback :** revert unique de la future PR de mission 06 ; aucune synchronisation, aucun déploiement, aucune modification de `data/crafting-chains-beta.json`, Quêtes Classic ni Quêtes Forever. La fusion exige l'autorisation explicite du propriétaire après revue technique.
