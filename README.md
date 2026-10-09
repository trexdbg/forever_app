# Forever Atlas — compagnon WoW Forever

Application web communautaire statique, responsive et compatible GitHub Pages : [ouvrir Forever Atlas](https://trexdbg.github.io/forever_app/).

## Modules disponibles
- **Guide de quêtes** : 6 profils de départ (Alliance/Horde), routes Classic niveaux ~5–60, sélection visuelle des factions et des huit races, curseur d'étapes avec repères de niveaux, liste latérale des quêtes et actions de l'étape liée à la carte, recherche français/anglais, coordonnées X/Y normalisées et suivi de progression local au navigateur. Source [trexdbg/vanilla-questing](https://github.com/trexdbg/vanilla-questing), MIT. **Les quêtes ne sont pas garanties sur WoW Forever.**
- **Talents** : 9 classes, 27 arbres, 466 talents de bêta, gestion des points/niveaux/prérequis, sauvegarde locale et lien partageable.
- **Équipements et pré-BiS** : 9 classes, 27 spécialisations, 17 emplacements, 41 références d'équipement Classic sélectionnées, tableau de progression et suivi sur le navigateur. Catalogue : 44 références d'objets, icônes locales. **Ces listes ne sont pas des classements BiS confirmés pour WoW Forever** : il faut encore examiner chaque source de drop, les statistiques modifiées et les phases de jeu.
- **Minage HL** : 1 749 points de minerais référencés sur **10 cartes**, fond de carte Classic, filtres de minerais, zoom, déplacement et commande TomTom `/way #UiMapID X Y`. Points communautaires non garantis en jeu.
- **Population Alliance/Horde** : vue prête pour les recensements, pas de chiffres affichés tant que la source d'observation quotidienne n'est pas connectée.

## Sources et coordonnées
- Quêtes : routes et traductions [trexdbg/vanilla-questing](https://github.com/trexdbg/vanilla-questing), licence MIT ([copie](data/quests/VanillaQuesting-LICENSE.txt)). Les cartes et waypoints utilisent des coordonnées **X vers la droite, Y vers le bas, de 0 à 100 sur chaque carte de zone**, et ne doivent pas être fusionnés avec les coordonnées minage d'un autre UiMapID. Les cartes de quêtes sont affichées depuis une révision GitHub figée, une zone à la fois. Une commande `/way X Y` n'est valide que lorsque le personnage est dans la zone correspondante avec un addon adapté.

- Talents : [Talents Forever](https://talentsforever.com/data.json), données **CC BY 4.0**.
- Emplacements HL : [Wuild/GatherLite](https://github.com/Wuild/GatherLite), source de positions Forever/ Wowhead Forever, licence **MIT** (texte complet dans [data/GatherLite-LICENSE.txt](data/GatherLite-LICENSE.txt)). Les identifiants Forever de zone `UiMapID` et les coordonnées normalisées 0–1 sont conservés. Le frontend représente `x*100` et `y*100` en pourcentage de la **carte de zone**, **X vers la droite, Y vers le bas**. Aucune conversion vers latitude/longitude terrestre, carte continentale ou autre expansion WoW. Ex : (0,643, 0,598) = (64,30 %, 59,80 %) sur l'UiMapID spécifié.
- Fonds de cartes Classic : jeu de cartes Blizzard, extrait et retraité à partir de [keyboardturner/WoWMapUprezClassic](https://github.com/keyboardturner/WoWMapUprezClassic). Les reliefs peuvent différer dans Forever. World of Warcraft et ses illustrations © Blizzard Entertainment.
- Icônes : World of Warcraft © Blizzard, distribuées localement dans `assets/icons`. Identification des noms d'icônes de référence via [Napalmsteak/WoW-Classic-Item-Caches](https://github.com/Napalmsteak/WoW-Classic-Item-Caches), sources Forever et Classic Era.
- Références Classic pré-BiS : guides publics communautaires [Wowhead Classic](https://www.wowhead.com/classic/guides). Les objets proposés doivent être revus pour la version Forever.

## Actualisation automatique
Le dépôt privé [forever_agent](https://github.com/trexdbg/forever_agent) gère les données et la publication avec un token GitHub à droits minimaux, configuré uniquement comme secret `PUBLIC_REPO_TOKEN` **dans le dépôt privé**.

| Données | Workflow | Fréquence |
| --- | --- | --- |
| Talents | `sync.yml` | Tous les deux jours (jours alternés du mois) |
| Population | `population.yml` | Tous les jours, si une source `POPULATION_SOURCE_URL` est renseignée |
| Minage | `mining.yml` | Chaque dimanche |
| Équipements | `gear.yml` | Chaque jeudi |
| Quêtes Classic | `quests.yml` | Chaque mercredi ; publication uniquement si le dépôt Vanilla Questing a évolué |
| Cartes | `maps.yml` | Actualisation manuelle ou lors de modifications de génération |

La collecte de données et les secrets ne sont jamais exposés au navigateur. Le site publié reste entièrement statique.

## Déploiement
GitHub Pages est configuré sur `main`, dossier `/ (root)`. Sans compte ni cookies de suivi obligatoires ; la progression BiS et les builds de talents sont conservés localement.

## Avertissement
Projet de fans, **non affilié à Blizzard**. Sources communautaires en évolution ; le fait qu'une fiche d'objet ou un emplacement de gisement soit référencé ne prouve pas qu'il soit actuellement disponible dans le jeu.
