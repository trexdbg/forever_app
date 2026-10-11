# ForEveroth — audit SEO/GEO, 11 octobre 2026

## Objectif

Publier des pages **utiles**, originales et vérifiables sans transformer l'accueil, les cartes ni les outils en blog. Les guides sont accessibles via de petits liens contextuels et le sitemap. Le site est communautaire, non officiel et indépendant de Blizzard.

## Périmètre vérifié automatiquement

L'outil sans dépendance externe `node scripts/audit-site.mjs --strict` analyse chaque page HTML et le sitemap du dépôt. Il vérifie les URL canoniques, les versions FR/EN et leurs cibles, les descriptions, les titres, les liens `href`/`src` internes, la structure JSON-LD Article, l'attribution des sources, les liens vers la méthodologie et les exigences mobiles de base (viewport, défilement horizontal des tableaux, région principale).

Lors de la première exécution du **11 octobre 2026**, le contrôle a identifié :

| Élément | Premier audit | Corrections |
| --- | ---: | --- |
| Pages HTML | 330 | Pas de suppression |
| URL du sitemap | 328 | Pas de changement |
| Liens internes contrôlés | 7 572 | Aucun lien cassé détecté |
| Erreurs structurelles | 6 | Deux anciennes redirections `/pnj/` et `/en/pnj/` : cas `noindex,follow` correctement reconnu |
| Avertissements de qualité | 135 | 76 attributs `Article.citation` ajoutés à partir de sources existantes, 28 liens de méthodologie rétablis, en-têtes accessibles Marchands restaurés |
| Guides de type `Article` | 282 | Tous ont une attribution de source documentée |
| Guides courts | 23 | Paragraphes ciblés ajoutés aux 23 guides, sans bourrage de mots ni création de faits |

Le nouvel audit considère les deux anciennes pages PNJ comme des **redirections volontaires**, canoniques vers Marchands, non destinées à l'indexation. Les deux pages index de guides sont de type annuaire et n'ont pas besoin d'un `Article`.

Les références sont distinguées selon leur niveau de preuve : source Classic, données de la bêta Forever, documentations tierces, ou observation en jeu. **Une référence de stock, de quête ou de recette dans une base n'est pas une confirmation de disponibilité en direct.**

## Correctif métier majeur : potions de soins

Les sorts bêta Forever de potion de soins mineure, inférieure, normale et supérieure (**1244431–1244434**) sont attribués aux **Premiers soins**, et non aux anciennes recettes d'alchimie Classic. Les composants et le rendement par fabrication ont été corrigés dans `data/geo-quest-crafting.json`, dans les guides des potions et des objets de quêtes, ainsi que dans les pages Alchimie / Secourisme. La source de référence est le [guide Forever Premiers soins](https://www.wowhead.com/forever/guide/professions/first-aid/overview) et les fiches individuelles des sorts.

Les articles de quêtes distinguent les objets finis, les recettes, les PNJ vendeurs et la production par un autre joueur. Les liens contextualisés filtrent directement Marchands et Métiers.

## Dernier résultat d'audit strict

Le **11 octobre 2026 à 06:20 UTC**, après enrichissement ciblé des 23 guides courts, le workflow GitHub Actions [audit GEO/SEO](https://github.com/trexdbg/forever_app/actions/runs/38117710241) a terminé avec succès :

- **330 pages HTML** analysées ;
- **328 URL** dans le sitemap, deux anciennes redirections PNJ volontairement non indexées ;
- **282 pages Article sur 282** disposant d'une attribution de sources dans les données structurées ;
- **7 663 liens internes** contrôlés ;
- **0 erreur, 0 avertissement** (y compris les vérifications statiques mobiles) ;
- GitHub Pages : dernière compilation et déploiement de la passe validés avec succès.

Le rapport JSON a été conservé dans l'artefact `geo-audit` du workflow pour cinq jours. Il ne certifie pas la vitesse, le comportement interactif des cartes ou la disponibilité publique depuis tous les pays : ces points nécessitent de véritables essais réseau et navigateur.

## Reproduire la vérification

~~~bash
node scripts/audit-site.mjs --strict
node scripts/audit-site.mjs --json > geo-audit.json
node scripts/check-bis-niveaux.mjs
~~~

Le workflow `.github/workflows/site-geo-audit.yml` est déclenché uniquement lors des changements de son script ou de son fichier YAML, ou manuellement : **pas de vérification quotidienne sur les minutes GitHub Actions**. Le rapport est gardé 5 jours.

Le script de normalisation `scripts/normalize-geo.mjs` a été exécuté une seule fois, a ajusté les attributions de 104 pages, et ne fonctionne pas chaque jour. Toute modification de ce script peut déclencher une nouvelle passe ; ne l'éditer que pour une opération d'entretien explicitement justifiée.

## Vérifications complémentaires à conserver

- Sur une véritable session mobile 320–390 px : menu, cartes, zoom, défilement des tableaux, boutons et titres longs FR/EN, clavier et lecteurs d'écran.
- Sur un accès HTTPS réel : absence de ressource 404, pages avec et sans JavaScript, langue et canoniques, consentement Analytics avant et après acceptation.
- Search Console : indexation de quelques URL représentatives et premières impressions, avec délai de traitement. La présence dans le sitemap ne prouve pas l'indexation.
- Trafic interne : ouvrir `https://foreveroth.com/?fo_dev=off` sur chaque navigateur de test, après vérification du correctif et de sa diffusion. L'exclusion n'efface pas l'historique GA4.

L'audit statique vérifie le dépôt, **pas** le rendu réel d'un navigateur, la rapidité d'une carte, ni l'expérience d'un joueur sur un appareil physique. Ne pas annoncer ces vérifications manuelles comme faites tant qu'elles ne l'ont pas été.
