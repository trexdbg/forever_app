# Agent 03 — Mission 07 : audit des emplacements des maîtres de métiers Forever

**Date de recherche et de consultation des sources : 14 octobre 2026.**  
**Issue :** https://github.com/trexdbg/forever_app/issues/51  
**Branche :** `agent03/mission07-trainer-locations-20261014`  
**Base :** `main` après PR #50 (`fed46b878c3f5b32714faca93c0b0aeead454600`).

## Périmètre réel et limites

Le tableau `npcs[]` comporte **357 PNJ**, dont **204 marchands et 153 entrées `role=trainer`**. Parmi les 153, **8 sont maîtres d'armes** et **7 enregistrements historiques n'ont pas de `trainer_kind` explicite**. Les 47 coordonnées initialement absentes concernent bien des maîtres de métiers, non les maîtres d'armes.

`data/professions.json` comporte **119 mentions de maîtres dans les résumés de 12 métiers** ; ces références ne possèdent pas de coordonnées propres et ne doivent pas être reliées à un PNJ différent sur le seul nom. Les nouvelles positions sont portées par `data/npcs.json`, consommé par Marchands/PNJ, sans répliquer les coordonnées dans le catalogue des métiers.

**Vérifications effectuées :** inspection des **106 points préexistants** du jeu de données pour la présence d'une zone, d'un `uiMapID` positif, de coordonnées numériques entre 0 et 100, d'une URL de référence et d'un statut ; croisement des **47 lignes auparavant vides** avec les guides professionnels Forever nommant chaque maître, sa zone et son waypoint. Chaque nouvel enregistrement est doté d'une preuve spécifique à l'assertion de position.

**Non effectuées :** vérification individuelle en client jeu des 153 maîtres, contrôle exhaustif des positions Classic contre une capture gameplay Forever, preuve d'apparition effective, contrôle du bon état de chaque PNJ pendant la bêta. **Un point documenté dans un guide Forever peut lui-même dériver de Classic** ; il ne saurait être `confirmed_in_game` sans capture versionnée.

## Comparatif avant / après

| Indicateur | Initial (`main`) | Branche de mission |
| --- | ---: | ---: |
| Maîtres `role=trainer` | 153 | 153 |
| Avec au moins un point de zone | 106 | **153** |
| Sans point | 47 | **0** |
| Points avec provenance individualisée nouvellement créée | 0 | **47** |
| Points historiques non requalifiés / sans objet `location_evidence` | 106 | **106** |
| Statuts `forever_guide_waypoint` (guide, non gameplay) | 25 | **72** |
| Statuts `forever_guides_classic_waypoint_not_ingame_verified` | 70 | 70 |
| Statuts `classic_reference_unverified` | 11 | 11 |
| Positions `confirmed_in_game` par capture vérifiable dans cette mission | 0 | **0** |
| Marchands / ventes / stocks / recettes modifiés | 0 | **0** |

**Les 47 « nouveaux points » signifient « coordonnées citées par des sources Forever identifiables », pas « 47 PNJ personnellement vérifiés en jeu ».** Le total de zones couvertes n'est pas une mesure de certitude.

## Méthode de provenance (par assertion de localisation)

Chaque nouvel enregistrement a :
- `coordinate_status = forever_guide_waypoint` et `coordinate_source = URL du guide`.
- `location_evidence.evidence_level = documented_forever`, `source_url`, `evidence_url`, `observed_at=2026-10-14`, `observed_build=unknown` (les pages indiquent 1.60.1 comme patch, **pas** un build exact testé), `evidence_kind=forever_community_page`, `evidence_note` décrivant le PNJ, la zone, les coordonnées, ainsi que l'absence de capture en jeu.
- `location_evidence.zone_id`, `ui_map_id` et `coordinate_system=zone_percent_0_100` pour éviter la conversion accidentelle entre cartes.

Guides consultés (sources de position) :
- Herboristerie : https://www.wowhead.com/forever/guide/professions/herbalism/overview-leveling
- Minage : https://www.wowhead.com/forever/guide/professions/mining/overview-leveling
- Dépeçage : https://www.wowhead.com/forever/guide/professions/skinning/overview-leveling
- Cuisine : https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling
- Cuisine (Cook Torka uniquement, le tableau Wowhead n'incluant pas cet entraîneur) : https://www.icy-veins.com/wow-forever/cooking
- Pêche : https://www.wowhead.com/forever/guide/professions/fishing/overview-leveling
- Secourisme : https://www.wowhead.com/forever/guide/professions/first-aid/overview

Les guides disponibles étaient actualisés entre le 9 et le 11 octobre 2026. **La date `observed_at` est celle de notre consultation**, pas une visite dans le client ni la date d'apparition du PNJ.

### Correction de cohérence de l'annuaire Métiers (119 lignes)

Le contrôle croisé, limité à la structure des 119 entrées de `data/professions.json`, a identifié **2 erreurs effectives de zone** et **11 différences d'alias purement linguistiques** (`Stormwind City` dans l'annuaire vs `Stormwind` dans les PNJ). **119/119 entrées correspondent à un maître connu, la même faction et, après correction, à la même zone normalisée.** Les coordonnées ne sont pas recopiées dans le catalogue des professions.

- **Hgarth — Enchantement** : `Orneval / Ashenvale` → **`Serres-Rocheuses / Stonetalon Mountains`**, zone explicitement mentionnée dans le [guide Forever Enchantement](https://www.wow-professions.com/forever/enchanting-trainers). L'ancien point PNJ `49.2 / 57.2` reste une référence historique non confirmée en jeu.
- **Finbus Geargrind — Ingénierie** : `Forêt d'Elwynn / Elwynn Forest` → **`Bois de la Pénombre / Duskwood`**, zone directement documentée dans le [guide Forever Ingénierie](https://www.wow-professions.com/forever/engineering-trainers) et les [coordonnées de référence Icy Veins](https://www.icy-veins.com/wow-forever/engineering). Ancien point `77.4 / 48.4` conservé, sans promotion de fiabilité.

Ces changements concernent **uniquement la zone FR/EN** des deux entrées de maître. Ni noms, ni rangs, ni ID, ni programmes d'apprentissage ne sont modifiés.

## Les 47 lignes initialement inconnues — traitement individuel

Toutes ces lignes restent classées **documented_forever** avec les limites ci-dessus. Les zones et positions sont données en pourcentage ; le `uiMapID` associé est conservé dans chaque enregistrement.

| Maître | Métier | Zone | X / Y | Source du waypoint | Niveau de preuve |
| --- | --- | --- | --- | --- | --- |
| Jandi | Herboristerie | Orgrimmar | 55.6 / 39.6 | https://www.wowhead.com/forever/guide/professions/herbalism/overview-leveling | documented_forever (non confirmé en jeu) |
| Komin Winterhoof | Herboristerie | Thunder Bluff | 49.8 / 39.8 | https://www.wowhead.com/forever/guide/professions/herbalism/overview-leveling | documented_forever (non confirmé en jeu) |
| Martha Alliestar | Herboristerie | Undercity | 54.8 / 50.2 | https://www.wowhead.com/forever/guide/professions/herbalism/overview-leveling | documented_forever (non confirmé en jeu) |
| Mishiki | Herboristerie | Durotar | 55.4 / 75 | https://www.wowhead.com/forever/guide/professions/herbalism/overview-leveling | documented_forever (non confirmé en jeu) |
| Ruw | Herboristerie | Feralas | 76 / 43.4 | https://www.wowhead.com/forever/guide/professions/herbalism/overview-leveling | documented_forever (non confirmé en jeu) |
| Zor'la | Herboristerie | Durotar | 42.6 / 67.4 | https://www.wowhead.com/forever/guide/professions/herbalism/overview-leveling | documented_forever (non confirmé en jeu) |
| Makaru | Minage | Orgrimmar | 73 / 26.4 | https://www.wowhead.com/forever/guide/professions/mining/overview-leveling | documented_forever (non confirmé en jeu) |
| Brek Stonehoof | Minage | Thunder Bluff | 34.6 / 57.6 | https://www.wowhead.com/forever/guide/professions/mining/overview-leveling | documented_forever (non confirmé en jeu) |
| Brom Killian | Minage | Undercity | 56 / 37 | https://www.wowhead.com/forever/guide/professions/mining/overview-leveling | documented_forever (non confirmé en jeu) |
| Krunn | Minage | Durotar | 51.8 / 40.8 | https://www.wowhead.com/forever/guide/professions/mining/overview-leveling | documented_forever (non confirmé en jeu) |
| Norzsh | Minage | Durotar | 40.6 / 68 | https://www.wowhead.com/forever/guide/professions/mining/overview-leveling | documented_forever (non confirmé en jeu) |
| Thuwd | Dépeçage | Orgrimmar | 63.2 / 45.2 | https://www.wowhead.com/forever/guide/professions/skinning/overview-leveling | documented_forever (non confirmé en jeu) |
| Mooranta | Dépeçage | Thunder Bluff | 45.2 / 43.6 | https://www.wowhead.com/forever/guide/professions/skinning/overview-leveling | documented_forever (non confirmé en jeu) |
| Killian Hagey | Dépeçage | Undercity | 71 / 59.4 | https://www.wowhead.com/forever/guide/professions/skinning/overview-leveling | documented_forever (non confirmé en jeu) |
| Malux | Dépeçage | Desolace | 23.2 / 69.8 | https://www.wowhead.com/forever/guide/professions/skinning/overview-leveling | documented_forever (non confirmé en jeu) |
| Eladriel | Dépeçage | Darnassus | 64.2 / 21.8 | https://www.wowhead.com/forever/guide/professions/skinning/overview-leveling | documented_forever (non confirmé en jeu) |
| Balthus Stoneflayer | Dépeçage | Ironforge | 39.8 / 33 | https://www.wowhead.com/forever/guide/professions/skinning/overview-leveling | documented_forever (non confirmé en jeu) |
| Maris Granger | Dépeçage | Stormwind City | 67.8 / 49 | https://www.wowhead.com/forever/guide/professions/skinning/overview-leveling | documented_forever (non confirmé en jeu) |
| Jayla | Dépeçage | Ashenvale | 50 / 67.2 | https://www.wowhead.com/forever/guide/professions/skinning/overview-leveling | documented_forever (non confirmé en jeu) |
| Zamja | Cuisine | Orgrimmar | 57.6 / 53.6 | https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling | documented_forever (non confirmé en jeu) |
| Aska Mistrunner | Cuisine | Thunder Bluff | 51 / 52.8 | https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling | documented_forever (non confirmé en jeu) |
| Eunice Burch | Cuisine | Undercity | 62.6 / 44.6 | https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling | documented_forever (non confirmé en jeu) |
| Stephen Ryback | Cuisine | Stormwind City | 78.2 / 53 | https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling | documented_forever (non confirmé en jeu) |
| Daryl Riknussun | Cuisine | Ironforge | 60.4 / 38 | https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling | documented_forever (non confirmé en jeu) |
| Alegorn | Cuisine | Darnassus | 49.8 / 21 | https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling | documented_forever (non confirmé en jeu) |
| Cook Torka | Cuisine | Durotar | 51.2 / 42.6 | https://www.icy-veins.com/wow-forever/cooking | documented_forever (non confirmé en jeu) |
| Pyall Silentstride | Cuisine | Mulgore | 45 / 61.6 | https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling | documented_forever (non confirmé en jeu) |
| Tomas | Cuisine | Elwynn Forest | 44.2 / 66 | https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling | documented_forever (non confirmé en jeu) |
| Lumak | Pêche | Orgrimmar | 69.8 / 29.6 | https://www.wowhead.com/forever/guide/professions/fishing/overview-leveling | documented_forever (non confirmé en jeu) |
| Kah Mistrunner | Pêche | Thunder Bluff | 56 / 46.8 | https://www.wowhead.com/forever/guide/professions/fishing/overview-leveling | documented_forever (non confirmé en jeu) |
| Armand Cromwell | Pêche | Undercity | 80.8 / 31.2 | https://www.wowhead.com/forever/guide/professions/fishing/overview-leveling | documented_forever (non confirmé en jeu) |
| Arnold Leland | Pêche | Stormwind City | 55 / 69.6 | https://www.wowhead.com/forever/guide/professions/fishing/overview-leveling | documented_forever (non confirmé en jeu) |
| Grimnur Stonebrand | Pêche | Ironforge | 48.4 / 6.4 | https://www.wowhead.com/forever/guide/professions/fishing/overview-leveling | documented_forever (non confirmé en jeu) |
| Astaia | Pêche | Darnassus | 47.6 / 56.6 | https://www.wowhead.com/forever/guide/professions/fishing/overview-leveling | documented_forever (non confirmé en jeu) |
| Lau'Tiki | Pêche | Durotar | 53.2 / 81.6 | https://www.wowhead.com/forever/guide/professions/fishing/overview-leveling | documented_forever (non confirmé en jeu) |
| Uthan Stillwater | Pêche | Mulgore | 44.6 / 60.6 | https://www.wowhead.com/forever/guide/professions/fishing/overview-leveling | documented_forever (non confirmé en jeu) |
| Clyde Kellen | Pêche | Tirisfal Glades | 67.2 / 51 | https://www.wowhead.com/forever/guide/professions/fishing/overview-leveling | documented_forever (non confirmé en jeu) |
| Lee Brown | Pêche | Elwynn Forest | 47.6 / 62.2 | https://www.wowhead.com/forever/guide/professions/fishing/overview-leveling | documented_forever (non confirmé en jeu) |
| Katoom the Angler | Pêche | The Hinterlands | 80.2 / 81.4 | https://www.wowhead.com/forever/guide/professions/fishing/overview-leveling | documented_forever (non confirmé en jeu) |
| Brannock | Pêche | Feralas | 32.2 / 41.6 | https://www.wowhead.com/forever/guide/professions/fishing/overview-leveling | documented_forever (non confirmé en jeu) |
| Mary Edras | Secourisme | Undercity | 73.6 / 55.6 | https://www.wowhead.com/forever/guide/professions/first-aid/overview | documented_forever (non confirmé en jeu) |
| Pand Stonebinder | Secourisme | Thunder Bluff | 29.6 / 21.4 | https://www.wowhead.com/forever/guide/professions/first-aid/overview | documented_forever (non confirmé en jeu) |
| Nissa Firestone | Secourisme | Ironforge | 54.8 / 58.6 | https://www.wowhead.com/forever/guide/professions/first-aid/overview | documented_forever (non confirmé en jeu) |
| Dannelor | Secourisme | Darnassus | 51.6 / 12.6 | https://www.wowhead.com/forever/guide/professions/first-aid/overview | documented_forever (non confirmé en jeu) |
| Rawrk | Secourisme | Durotar | 54 / 42 | https://www.wowhead.com/forever/guide/professions/first-aid/overview | documented_forever (non confirmé en jeu) |
| Vira Younghoof | Secourisme | Mulgore | 46.8 / 60.8 | https://www.wowhead.com/forever/guide/professions/first-aid/overview | documented_forever (non confirmé en jeu) |
| Nurse Neela | Secourisme | Tirisfal Glades | 61.8 / 52.8 | https://www.wowhead.com/forever/guide/professions/first-aid/overview | documented_forever (non confirmé en jeu) |

## Inventaire des 106 points préexistants — audit de structure / fiabilité

**106/106** ont une zone avec `uiMapID`, des coordonnées dans `[0, 100]` et une référence existante ; **106/106** sont conservés **inchangés**. **81** proviennent d'anciennes références Classic ou dérivées de Classic ; **25** portaient déjà l'étiquette `forever_guide_waypoint`, dont **24 à Zephras** et un maître d'armes à Hurlevent. Aucun de ces 106 points n'a été promu à `confirmed_in_game` ni doté rétroactivement d'une fausse preuve gameplay.

| Maître | Métier | Zone | X / Y | Statut avant/après | Source disponible, non nécessairement preuve directe |
| --- | --- | --- | --- | --- | --- |
| Ainethil | Alchimie | Darnassus | 55 / 24 | classic_reference_unverified | https://www.wowhead.com/classic/guide/alchemy-leveling-1-300-wow-classic |
| Kylanna Windwhisper | Alchimie | Feralas | 32.6 / 43.8 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Lilyssia Nightbreeze | Alchimie | Stormwind | 55.7 / 86.1 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Tally Berryfizz | Alchimie | Ironforge | 67.2 / 54.2 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Yelmak | Alchimie | Orgrimmar | 56.8 / 33 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Doctor Herbert Halsey | Alchimie | Undercity | 47.8 / 73.3 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Rogvar | Alchimie | Swamp of Sorrows | 48.5 / 55.8 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Kitta Firewind | Enchantement | Elwynn Forest | 64.8 / 70.6 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Hgarth | Enchantement | Stonetalon Mountains | 49.2 / 57.2 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Springspindle Fizzlegear | Ingénierie | Ironforge | 68.4 / 44 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Roxxik | Ingénierie | Orgrimmar | 76 / 25 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Georgio Bolero | Couture | Stormwind | 43.2 / 73.6 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Josef Gregorian | Couture | Undercity | 70.6 / 30.6 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Bengus Deepforge | Forge | Ironforge | 52.5 / 41.5 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Saru Steelfury | Forge | Orgrimmar | 82.3 / 23 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Telonis | Travail du cuir | Darnassus | 64.4 / 21.6 | classic_reference_unverified | https://www.warcrafttavern.com/wow-classic-sod/guides/profession-trainer-locations-requirements-for-phase-2/ |
| Una | Travail du cuir | Thunder Bluff | 41.5 / 42.6 | classic_reference_unverified | https://www.warcrafttavern.com/wow-classic-sod/guides/profession-trainer-locations-requirements-for-phase-2/ |
| Shaina Fuller | Secourisme | Stormwind | 43.1 / 26.2 | classic_reference_unverified | https://wow-guides.com/classic-era/professions/first-aid |
| Arnok | Secourisme | Orgrimmar | 34.2 / 84.6 | classic_reference_unverified | https://wow-guides.com/classic-era/professions/first-aid |
| Whuut | Alchimie | Orgrimmar | 55.8 / 32.9 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Doctor Martin Felben | Alchimie | Undercity | 46.6 / 74.1 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Doctor Marsh | Alchimie | Undercity | 50.9 / 74.6 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Kray | Alchimie | Thunder Bluff | 47 / 34.6 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Bena Winterhoof | Alchimie | Thunder Bluff | 46.6 / 33.2 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Tel'Athir | Alchimie | Stormwind | 55.5 / 85.6 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Vosur Brakthel | Alchimie | Ironforge | 66.3 / 55.7 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Milla Fairancora | Alchimie | Darnassus | 55.4 / 22.7 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Sylvanna Forestmoon | Alchimie | Darnassus | 56.4 / 24.2 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Ug'thok | Forge | Orgrimmar | 80.8 / 23.7 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Snarl | Forge | Orgrimmar | 79.6 / 23.3 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Basil Frye | Forge | Undercity | 60.2 / 29.1 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| James Van Brunt | Forge | Undercity | 61.3 / 30.6 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Thrag Stonehoof | Forge | Thunder Bluff | 39.4 / 56.7 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Karn Stonehoof | Forge | Thunder Bluff | 39.4 / 55.1 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Dane Lindgren | Forge | Stormwind | 64.1 / 37 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Therum Deepforge | Forge | Stormwind | 63.7 / 37 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Groum Stonebeard | Forge | Ironforge | 52.3 / 41.9 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Rotgath Stonebeard | Forge | Ironforge | 52.4 / 42.6 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Jhag | Enchantement | Orgrimmar | 53.6 / 38.2 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Malcomb Wynn | Enchantement | Undercity | 62.6 / 60.4 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Mot Dawnstrider | Enchantement | Thunder Bluff | 45 / 38.4 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Betty Quin | Enchantement | Stormwind | 43.2 / 63.8 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Thonys Pillarstone | Enchantement | Ironforge | 60.6 / 44.2 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Lalina Summermoon | Enchantement | Darnassus | 59.6 / 12.6 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Thund | Ingénierie | Orgrimmar | 75.8 / 24.6 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Nogg | Ingénierie | Orgrimmar | 75.8 / 25.2 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Franklin Lloyd | Ingénierie | Undercity | 76 / 73.4 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Trixie Quikswitch | Ingénierie | Ironforge | 67.8 / 43.2 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Lilliam Sparkspindle | Ingénierie | Stormwind | 62.2 / 30.4 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Finbus Geargrind | Ingénierie | Duskwood | 77.4 / 48.4 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Kamari | Travail du cuir | Orgrimmar | 63 / 45 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Karolek | Travail du cuir | Orgrimmar | 62.8 / 44.4 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Mak | Travail du cuir | Thunder Bluff | 42.2 / 43.2 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Tarn | Travail du cuir | Thunder Bluff | 42.4 / 43 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Dan Golthas | Travail du cuir | Undercity | 70.4 / 58.4 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Arthur Moore | Travail du cuir | Undercity | 70.6 / 57.8 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Chaw Stronghide | Travail du cuir | Mulgore | 45 / 61.4 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Randal Worth | Travail du cuir | Stormwind | 67.4 / 49.4 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Simon Tanner | Travail du cuir | Stormwind | 67.2 / 49.4 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Adele Fielder | Travail du cuir | Elwynn Forest | 46.4 / 62.2 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Nadyia Maneweaver | Travail du cuir | Teldrassil | 41.8 / 49.4 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Faldron | Travail du cuir | Darnassus | 64.4 / 21.4 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Fimble Finespindle | Travail du cuir | Ironforge | 39.4 / 33 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Drakk Stonehand | Travail du cuir | The Hinterlands | 13.4 / 43.4 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Hahrana Ironhide | Travail du cuir | Feralas | 74.4 / 43 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Snang | Couture | Orgrimmar | 63 / 49.6 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Victor Ward | Couture | Undercity | 70.2 / 29.6 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Vhan | Couture | Thunder Bluff | 44 / 44.6 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Lawrence Schneider | Couture | Stormwind | 43.6 / 73.8 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Sellandus | Couture | Stormwind | 42 / 76.2 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Uthrar Threx | Couture | Ironforge | 43.6 / 28.2 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Jormund Stonebrow | Couture | Ironforge | 43.6 / 28.2 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Trianna | Couture | Darnassus | 63.6 / 21.6 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Me'lynn | Couture | Darnassus | 62.6 / 22.6 | forever_guides_classic_waypoint_not_ingame_verified | https://www.icy-veins.com/wow-forever/professions |
| Nyalah Brightfire | Cuisine | Zephras Isle | 60.6 / 72.6 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Baelann Swiftcurrent | Pêche | Zephras Isle | 63.2 / 75.6 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Fenn Fairweather | Pêche | Zephras Isle | 45 / 48.4 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Melasa Fairmend | Secourisme | Zephras Isle | 63 / 72.6 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Naleeia Tattermend | Secourisme | Zephras Isle | 43 / 46.2 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Nyassa Swiftdraught | Alchimie | Zephras Isle | 43.8 / 43.6 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Iaadaria Bitterwind | Alchimie | Zephras Isle | 66.2 / 79.6 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Valiena Swiftgale | Alchimie | Zephras Isle | 59.2 / 76.2 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Aedi Thriceforged | Forge | Zephras Isle | 44.8 / 44.4 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Daeann Steelwind | Forge | Zephras Isle | 65.4 / 80.2 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Nasalanna Windsinger | Enchantement | Zephras Isle | 43.2 / 43.2 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Eaysaa Brightgust | Enchantement | Zephras Isle | 59.2 / 76.2 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Strange Hermit | Ingénierie | Zephras Isle | 54 / 39 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Indari Sunseam | Travail du cuir | Zephras Isle | 44.6 / 44.6 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Emerii Tallgust | Travail du cuir | Zephras Isle | 63.8 / 80.6 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Taleen Shimmerthread | Couture | Zephras Isle | 44.8 / 44.2 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Othesia Evengale | Couture | Zephras Isle | 64.4 / 81 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Halassa Fernbreeze | Herboristerie | Zephras Isle | 43 / 43.6 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Syriel Nightrain | Herboristerie | Zephras Isle | 57.8 / 75.4 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Messana Crestwind | Minage | Zephras Isle | 44.8 / 44.4 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Halavuul Cragwind | Minage | Zephras Isle | 65.4 / 80.4 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Mendalass Tattermend | Dépeçage | Zephras Isle | 43.2 / 43.6 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Ishlee Breezewhisper | Dépeçage | Zephras Isle | 59.6 / 76 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Zerril Softbreeze | Cuisine | Zephras Isle | 43.8 / 43.8 | forever_guide_waypoint | https://www.wowhead.com/forever/guide/zephras-isle-zone-overview |
| Ilyenia Moonfire | Armes | Darnassus | 57.6 / 46.7 | classic_reference_unverified | https://www.warcrafttavern.com/wow-classic/guides/weapon-skill-trainers-and-locations/ |
| Bixi Wobblebonk | Armes | Ironforge | 62.2 / 89.6 | classic_reference_unverified | https://www.warcrafttavern.com/wow-classic/guides/weapon-skill-trainers-and-locations/ |
| Buliwyf Stonehand | Armes | Ironforge | 61.2 / 89.5 | forever_guides_classic_waypoint_not_ingame_verified | https://forever-codex.com/map/ironforge/ |
| Woo Ping | Armes | Stormwind | 63.9 / 69.1 | forever_guide_waypoint | https://www.warcrafttavern.com/forever/guides/weapon-trainers/ |
| Hanashi | Armes | Orgrimmar | 81.5 / 19.6 | classic_reference_unverified | https://www.warcrafttavern.com/wow-classic/guides/weapon-skill-trainers-and-locations/ |
| Sayoc | Armes | Orgrimmar | 81.7 / 19.5 | classic_reference_unverified | https://www.warcrafttavern.com/wow-classic/guides/weapon-skill-trainers-and-locations/ |
| Ansekhwa | Armes | Thunder Bluff | 40.9 / 62.7 | classic_reference_unverified | https://www.warcrafttavern.com/wow-classic/guides/weapon-skill-trainers-and-locations/ |
| Archibald | Armes | Undercity | 57.3 / 32.8 | classic_reference_unverified | https://www.warcrafttavern.com/wow-classic/guides/weapon-skill-trainers-and-locations/ |

### Incertitudes et conflits documentaires non résolus

- Les sources Classic, Saison de la découverte et guides Forever ne sont pas interchangeables. Une URL `/forever/` fournit une **référence à étudier**, sans garantir la position du PNJ dans une version du jeu.
- Certains repères Classic existants diffèrent de ceux de guides Forever ; par exemple **Arnok** : notre référence historique **34.2 / 84.6**, versus **34.0 / 84.4** dans le guide Forever Premiers soins. **Shaina Fuller** : historique **43.1 / 26.2**, versus **42.8 / 26.6** dans ce même guide. **Aucun point préexistant n'a été remplacé automatiquement.** Ils attendent une confrontation de preuves plus précise.
- Tous les éléments actuels ont des positions de *carte de zone*, pas des coordonnées GPS, et un point sur un fond de carte Forever **ne valide pas l'emplacement dans le client**.
- Les 7 PNJ sans `trainer_kind` explicite sont restés tels quels : ne pas altérer un champ non démontré à cette étape.
- Les noms et identités distinctes sont conservés ; aucun ID numérique n'a été deviné et aucun rapprochement par nom seul n'a été écrit dans le fichier Métiers.

## Validation, non-régression, retour arrière

- `node scripts/check-trainer-locations.mjs` : audit hors ligne, toutes les positions, statuts, preuves, zones, `uiMapID`, bornes et niveaux de certitude.
- `node --test tests/trainer-locations.test.mjs` : fixtures couvrant point déclaré, source Forever, identité/zone, point inconnu, conflits, format date/build, faux Classic, `uiMapID` invalide, coordonnées hors limites, aucun `/mappin` inventé, préservation des points Zephras et des 204 marchands.
- Contrôles préexistants : `node scripts/check-npc-professions.mjs`, `node --test tests/npc-professions.test.mjs`, `node scripts/check-data-quality.mjs`, `node --test tests/data-quality.test.mjs`, ainsi que la CI de l'agent 03.
- Rendu FR/EN : le panneau des maîtres affiche déjà l'étiquette **« Point cité dans un guide Forever, non confirmé en jeu »** / **« Waypoint from a Forever guide, not verified in-game »** pour les nouveaux points. `coordinate_source` renvoie directement vers le guide correspondant ; `/mappin` n'est disponible qu'avec une coordonnée et un `uiMapID`.
- **Test navigateur réel effectué en CI** : Chromium headless FR/EN sur largeurs **1440 px** et **375 px** ; Jandi : coordonnées 55.6 / 39.6, source du point et avertissement de non-confirmation ; Nyassa Swiftdraught : waypoint Zephras préservé. Les 4 parcours ont réussi dans le [workflow GitHub #38628371366](https://github.com/trexdbg/forever_app/actions/runs/38628371366). Captures de chaque vue conservées uniquement comme artefacts éphémères de la PR. **Aucune capture ne vaut preuve d'observation en jeu** ; vérifier encore les PNJ sur un vrai client Forever.

**Rollback** : annuler exclusivement cette PR / ses commits. Aucune modification de `data/rares.json`, des cartes rares, des quêtes, des marchands ou des données d'objets ; seule l'intégration de contrôles de PR et deux zones du répertoire Métiers sont également comprises dans cette mission. **Aucune fusion et aucun déploiement sans validation du propriétaire.**
