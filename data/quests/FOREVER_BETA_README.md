# Quêtes Forever — pilote elfe de la nuit niveaux 1–10

Version expérimentale **non validée en jeu**, préparée le 12 octobre 2026. Ne pas confondre une référence Classic, un texte de quête Forever attesté et une position réellement vérifiée dans le client Forever.

## Activation

Dans `/quetes/` et `/en/quetes/`, choisir l'Alliance puis « Elfe de la nuit / Night Elf » et basculer « Forever Bêta / Beta ». Le guide Classic et toutes les autres races restent inchangés. L'URL conserve `?faction=alliance&race=nelf&peuple=nelf&mode=forever-beta&step=...` pour un partage reproductible. Aucune progression n'est enregistrée.

## Périmètre et route

- Niveaux ~1–5 : 5 nouvelles étapes et 25 points de passage Classic (Sombrevallon : Protectrice sylvestre, Équilibre de la nature, Venin/Œuf Tissebois, Antidote d'Iverron, Couronne de la Terre). Positionnement 0–100 Classic non garanti sur Forever.
- Niveaux ~5–10 : les 11 étapes de la source Vanilla Questing Night Elf (Dolanaar, Teldrassil, Darnassus), puis une étape de niveau cible 10. **Niveau estimé, pas XP exact ou niveau réel du personnage**.
- Trois nouvelles quêtes de Forever attestées par les caches de textes de quête :
  - `97977` « La llamada de la naturaleza » / « L'appel de la nature » (FR éditorial) : 4 totems des Pins-tordus à rendre à Tarindrella ; le camp ouest est un **secteur estimé**, et le donneur exact inconnu. Conditionnelle.
  - `87288` « Los pelambres de sable de la noche suaves » / « Peaux souples de sabre-de-nuit » (FR éditorial) : 6 peaux à remettre à Aldria près de Dolanaar ; **secteur estimé, donneur non confirmé**. Conditionnelle.
  - `99046` « The Lost Runner » / « La messagère disparue » (FR éditorial) : rechercher la sentinelle Eralya Leafshadow sur la route du Bosquet de l'Oracle. **80 XP seulement**, optionnelle ; coordonnées estimées.

**Important :** les nouveaux textes Forever sont attestés, mais les NPC qui les proposent, les emplacements exacts des objets et l'accès par niveau/personnage ne sont pas tous vérifiés. Le code interdit le bouton copier `/way` pour les nouvelles positions incertaines. Les quêtes élites de niveau supérieur ne sont pas recommandées dans la route 1–10.

## Changements Classic observés sur la bêta

Les métadonnées `changes_classic` enregistrent « Bounty: Gnarlpine Furbolg » (20 → 15 cibles) et « Escaping Ban'ethil » (sentinelle plus lente). Ces quêtes ne sont pas insérées de force dans le parcours 1–10 ; le changement est enregistré pour l'extension des routes.

## Provenances

- Itinéraire Classic de départ : https://www.joanasworld.com/alliance-1-12-teldrassil.php
- Référence identifiants des quêtes Classic : https://theforeverera.com/en/quests/zone/teldrassil/
- Nouvelle quête `97977` : https://forever-codex.com/quests/97977/
- Nouvelle quête `87288` : https://forever-codex.com/quests/87288/
- Nouvelle quête `99046` : https://forever-codex.com/quests/99046/
- Correctifs bêta : https://theforeverera.com/fr/changes/
- Traductions des quêtes Classic : fiches WoWHead Forever, lorsque vérifiées.

## Vérification avant publication

- [x] JavaScript valide syntaxiquement et `manifest.source_commit` compatible.
- [x] 17 étapes jusqu'au niveau cible 10 et 81 points de passage Classic + Forever.
- [x] Toutes les coordonnées calculées sont comprises entre 0 et 100 ; aucun autre secteur que Teldrassil/Darnassus.
- [x] 3 nouvelles quêtes Forever et liens sources ; nouvelles positions non confirmées signalées.
- [x] Pages FR et EN chargent le nouveau JS et les nouveaux styles ; script Classic préservé.
- [ ] Tester réellement les cartes et les interactions sur mobile et ordinateur (pas de déploiement de cette branche).
- [ ] Valider en jeu le nom, le donneur, les objectifs, la suite et les positions des 3 quêtes Forever.
- [ ] Mesurer les niveaux et le temps de parcours avec l'XP actuelle de la bêta.
- [ ] Vérifier les chaînes de quêtes de classe selon le personnage.

La base `data/quests/alliance.json` d'origine n'est **pas modifiée** : le pilote est un overlay indépendant sous `data/quests/forever-nelf-1-10.json`.
