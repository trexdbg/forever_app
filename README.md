# Forever Atlas

Application web communautaire non officielle pour **World of Warcraft: Forever**.

Site statique (HTML/CSS/JavaScript), prêt pour GitHub Pages sous `/forever_app/`. Les données sont publiées par le dépôt privé `forever_agent`.

## Modules
- Constructeur de talents des neuf classes (arbre beta importé de [Talents Forever](https://talentsforever.com/data.json), CC BY 4.0)
- Repères de minage haut niveau et secteurs à vérifier
- Catalogue d'équipements avec filtres, données vérifiées uniquement
- Tableau de population, vide tant qu'aucune mesure vérifiable n'est disponible

## Mise en ligne
Dans **Settings → Pages**, choisir **Deploy from a branch**, branche `main`, dossier `/ (root)`.
L'adresse prévue est `https://trexdbg.github.io/forever_app/`.

Ne pas ajouter de token ou de secret à ce dépôt public. Le repo privé `forever_agent` pousse les données grâce à `PUBLIC_REPO_TOKEN`.

## Sources et avertissement
Les données de talents proviennent de [talentsforever.com](https://talentsforever.com/), sous licence [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), et demeurent des données de bêta. Noms, sorts, icônes et éléments Warcraft sont la propriété de Blizzard Entertainment. Projet indépendant, sans affiliation à Blizzard.
