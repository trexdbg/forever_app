# Équipements rares Forever 1–30 : 22 fiches retrouvées (18 octobre 2026)

Le module Rares contient 29 objets absents des 152 fiches du catalogue éditorial et des 1 318 fiches du cache. Ce lot ajoute uniquement **22 équipements** ayant un emplacement, un iLvl, un niveau requis, des statistiques et une fiche d’objet Wowhead Forever. **152 → 174 objets éditoriaux** ; aucun doublon. Les 7 références exclues concernent des objets non équipables, un slot inconnu ou des sources d’objet non compatibles avec cette sélection (ex. Foreman's Helm #284400 provient de 60.tools et reste dans Rares).

## Équipements ajoutés et sources documentaires

| Rare | Objet | Requis | Fiche Forever |
| --- | --- | ---: | --- |
| Threggil | Keen Machete (#18610) | 5 | https://www.wowhead.com/forever/item=18610/keen-machete |
| Fury Shelda | Bloody Chain Boots (#18612) | 5 | https://www.wowhead.com/forever/item=18612/bloody-chain-boots |
| Timber | White Wolf Gloves (#1965) | 7 | https://www.wowhead.com/forever/item=1965/white-wolf-gloves |
| Shadowclaw | Serrated Shadowclaw (#284174) | 10 | https://www.wowhead.com/forever/item=284174 |
| Scargil | Imbued Scaled Cuffs (#282716) | 27 | https://www.wowhead.com/forever/item=282716/imbued-scaled-cuffs |
| Felweaver Scornn | Felweaver's Staff (#284287) | 8 | https://www.wowhead.com/forever/item=284287 |
| Dishu | Cheetah Hide Grips (#286533) | 10 | https://www.wowhead.com/forever/item=286533 |
| Ghost Howl | Demon Scarred Cloak (#4854) | 6 | https://www.wowhead.com/forever/item=4854/demon-scarred-cloak |
| Marcus Bel | Alliance Outrunner Staff (#285350) | 21 | https://www.wowhead.com/forever/item=285350 |
| Silithid Harvester | Silithid Piercer (#286534) | 21 | https://www.wowhead.com/forever/item=286534 |
| Thunderstomp | Thunderstomp's Horn (#286537) | 21 | https://www.wowhead.com/forever/item=286537 |
| Thora Feathermoon | Alliance Outrunner's Sword (#285346) | 22 | https://www.wowhead.com/forever/item=285346 |
| Hagg Taurenbane | Taurenbane's Family Cleaver (#285328) | 23 | https://www.wowhead.com/forever/item=285328 |
| Sister Rathtalon | Feather Padded Treads (#285345) | 16 | https://www.wowhead.com/forever/item=285345/feather-padded-treads |
| Taskmaster Whipfang | Whipfang's Skinsearer (#284386) | 19 | https://www.wowhead.com/forever/item=284386 |
| Snapbeak the Quick | Thendal Watcher's Boots (#285269) | 5 | https://www.wowhead.com/forever/item=285269/thendal-watchers-boots |
| Tel'daeor the Stormspeaker | Skyseer's Pants (#263015) | 9 | https://www.wowhead.com/forever/item=263015/skyseers-pants |
| Dro'zem the Blasphemous | Dro'zem's Tunic (#277213) | 20 | https://www.wowhead.com/forever/item=277213/drozems-tunic |
| Shal'ma | Shal'ma's Shawl (#286746) | 4 | https://www.wowhead.com/forever/item=286746/shalmas-shawl |
| Nightscreech | Wisesight Wand (#286750) | 5 | https://www.wowhead.com/forever/item=286750/wisesight-wand |
| Wrathvine | Wrathroot (#286749) | 3 | https://www.wowhead.com/forever/item=286749/wrathroot |
| The Condemned One | Helm Splitter (#286755) | 6 | https://www.wowhead.com/forever/item=286755/helm-splitter |

## Périmètre et preuve

Le nom, ID, slot, niveau d'objet, niveau requis et résumé de statistiques proviennent des fiches déjà attribuées dans `data/rares.json` : la source par item est l'URL Wowhead Forever de la fiche. Les champs `source_url`, `evidence_url`, `observed_at`, `observed_build=unknown`, `evidence_kind=forever_community_page` et `evidence_note` précisent l'étendue. **L'existence d'une fiche et une association communautaire rare→objet ne prouvent pas un drop observé en jeu.** Aucune date de capture ou version client n'est inventée. Le conflit autour de Marcus Bel reste signalé dans les données Rares.

Les icônes sont reprises uniquement quand l'ID dispose déjà d'une correspondance documentée dans le module Rares. Rareté `quality:null` faute de preuve, afin de ne pas inventer de couleur. Les rares associés s'affichent en français `Rare signalé` et en anglais `Reported rare` ; les traductions Classic déjà vérifiées gardent leur statut Classic. Aucun objet de quête/consommable ne devient équipement.

## Validation et retour arrière

- Catalogue éditorial **152 → 174** ; cache de 1 318 inchangé.
- Relations rare→objet inchangées (**114**), index d'obtention inchangé (**730** items / **1256** relations).
- Test ciblé `tests/rare-gear-catalogue-20261018.test.mjs` ajouté à `equipment-bis-quality.yml` (validation des 22 IDs, preuves, absence de doublons, FR/EN et exclusions).
- Cache front mis à jour : `20261018-rare-gear-22`. Pas de sync, aucune édition du module Quêtes.
- Rollback : revert de cette PR.
