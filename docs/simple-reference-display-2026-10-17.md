# Affichage simple — directive propriétaire du 17 octobre 2026

Le propriétaire demande une application de consultation : les PNJ et métiers référencés sont considérés comme existants ; une modification étayée Forever remplace la valeur Classic, sinon la référence Classic est conservée. Les explications de validation ne doivent plus encombrer les fiches.

## Résultat

- Une seule fiche de recette et une valeur par propriété. Les 44 relevés récents complètent directement l'affichage ; le panneau de comparaison avec l'archive est retiré.
- Suppression des paragraphes de doute, badges de confiance et détails de preuve répétitifs dans Métiers, Marchands, Rares, Donjons, Équipement, BiS et la recherche d'accueil FR/EN. Libellés de version courts et liens Source discrets.
- Champs inconnus omis ; pas de quantité inventée en cas de conflit. Relations explicitement non vérifiées omises des listes publiques de butin/acquisition, sans effacement du catalogue source.
- Catalogue objets : priorité aux valeurs Forever renseignées, propriétés Classic conservées lorsqu'elles manquent dans le complément Forever, et références Classic utilisables dans la vue niveaux 1–30.
- Statistiques des rares présentées une seule fois, avec le complément Forever sourcé en priorité. Coordonnées, sélection des points, commandes /way et /mappin, ingrédients et navigation entre composants conservés.
- Aucune modification des JSON de jeu ni reclassement de preuve. Sources, observations, builds et historique restent disponibles pour la maintenance.
- Règle publique ajoutée à AGENTS.md afin de ne pas réintroduire les avertissements lors des prochains enrichissements.

## Livraison et contrôles

PR empilée sur #84, elle-même basée sur #83. Ce lot remplace volontairement la présentation détaillée de #84 selon la nouvelle instruction du propriétaire. Pas de fusion, synchronisation de production ni déploiement.

228 tests Node réussis, contrôles de qualité et d'intégrité des index réussis ; 0 erreur structurelle et 584 avertissements historiques inchangés. Les assertions qui exigeaient les anciens paragraphes ont été remplacées par les règles d'affichage simple, tout en conservant les assertions de données, d'identité, de provenance et les parcours fonctionnels.

Le rendu FR/EN des recettes est exercé via le code réel dans un DOM simulé. Le test graphique local ne peut pas démarrer : Chrome/Chromium n'est pas installé. Les scripts de contrôle navigateur en CI ont été adaptés à la nouvelle présentation ; leurs résultats sont indiqués dans la PR.

Les pages Quêtes Classic et les pipelines de publication ne sont pas modifiés. Retour arrière : revert de ce lot de présentation ; les données enrichies par #83/#84 restent disponibles.
