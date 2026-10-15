# Lot 03 — Vayn Moongaze : catalogue des 47 recettes de réputation sur l'Île de Zéphras
Date de collecte : 15 octobre 2026. Référence : issues #55 et #58.

## Résultat

- **+1 marchand Forever** (ID PNJ 254151, Vayn Moongaze, faction neutre), catégorie multiformations forge/cuir/couture, sur **l'île de Zéphras** (nouvelle zone Forever).
- **+47 identifiants objets-recettes et +47 relations vendeur→objet documentaires Forever**, soit 12 plans de forge, 23 patrons de cuir, 12 patrons de couture.
- Coordonnée **63,8 / 36,0** documentée dans une [fiche de quête Forever](https://www.60.tools/quests/93459-more-alaketh-ears) (point Vayn Moongaze) et recoupée par le [guide Nightclaw Druids](https://www.warcrafttavern.com/forever/guides/nightclaw-druids-reputation/). Carte Zephras `uiMapID=2521`. C'est un **repère documentaire**, pas une présence confirmée dans une session de jeu. Le PNJ [254151 sur Wowhead Forever](https://www.wowhead.com/forever/npc=254151/vayn-moongaze) associe bien Vayn aux professions et à l'île.
- Source générale des **47 associations exactes** : [catalogue Forever Vayn Moongaze](https://www.wow-professions.com/forever/npc/vayn-moongaze). Chaque lien mène à un identifiant item Wowhead Forever ; le fichier PNJ conserve son URL individuelle. Le vendeur fait partie des Druides Griffenuit (Nightclaw Druids).
- Rep nécessaire : **Friendly** pour les 50 et 55 points de métier, **Honored** pour les 60. Les valeurs 50/55/60 sont des seuils affichés dans les fiches plans/patrons et ne doivent pas être confondues avec les niveaux de personnage ou les seuils jaunes d'une recette.
- **1 patron volontairement non ajouté** : *Pattern: Azure Windraveled Jerkin*, cité par le vendeur mais son ID objet exact n'a pu être vérifié dans les pages récupérées. Aucune association fabriquée.

## Transparence des coûts et de la preuve

- Certains guides montrent un coût de 9s50c, tandis que d'autres présentent 10s68c pour des plans apparentés ; les coûts exacts sont donc laissés inconnus, `price_status=coin_price_conflict_or_not_comparable_between_guides` ; pas de conversion monétaire supposée.
- Les **noms FR officiels** des 47 patrons ne sont pas démontrés. Texte anglais conservé et statut `unverified_fallback_english`, mais la catégorie de métier est traduite dans l'interface.
- Sources Forever communautaires : `evidence_level=documented_forever`, `source_url`, `evidence_url`, `observed_at=2026-10-15`, `observed_build=unknown`, `evidence_kind=forever_community_page`, note précisant le plan, l'ID, le métier et le rang.
- Aucun des liens n'est marqué **achat confirmé en jeu** ; même le PNJ 254151 peut être absent lors de la bêta et ses stocks évolutifs. Aucun temps de repop/stock assuré.
- Les données antérieures Classic restent inchangées.

## Comparatif avant / après

| Indicateur | Avant | Après |
| --- | ---: | ---: |
| PNJ / marchands | 357 / 204 | **358 / 205** |
| Objets du catalogue Marchands | 260 | **307** |
| Liens marchand→objet | 672 | **719** |
| Dont ventes Forever documentées | 95 | **142** |
| Références Classic / incertaines | 577 | **577** |
| Objets dans « Où l'obtenir » | 572 | **619** |
| Relations d'obtention totales | 996 | **1 043** |
| Relations « documented_forever » dans index | 232 | **279** |

## Tests

- `node scripts/check-npc-professions.mjs` et `node --test tests/npc-professions.test.mjs`
- `node scripts/check-forever-evidence.mjs`
- `node scripts/build-item-acquisition-index.mjs --check`, `node --test tests/item-acquisition-index.test.mjs`
- `node --test tests/zephras-vayn-vendor.test.mjs` (47 IDs, 47 sources, localisation, métiers, rangs, coûts inconnus, non-régression Classic)
- `node scripts/check-trainer-locations.mjs`, `node --test tests/trainer-locations.test.mjs`
- GitHub Actions NPC/Professions et Equipment/BiS sur PR ; navigateur FR/EN piloté par les tests NPC existants. Aucun test client in-game n'est revendiqué.

## Retour arrière

Revert de la PR pour retirer uniquement le marchand, les 47 objets/liens dérivés, leurs métadonnées et tests. Quêtes Classic, rares et métiers de l'archive inchangés. Aucune synchronisation serveur du client.
