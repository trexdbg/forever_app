# Signalement d’erreurs ForEveroth

## Objectif

Un bouton discret « Signaler une erreur » apparaît sur toutes les pages. Les visiteurs décrivent un problème, choisissent une catégorie et envoient un signalement. Après configuration, un Cloudflare Worker crée une GitHub Issue dans le dépôt choisi, même privé, sans exposer le nom du dépôt, l'URL de l'issue ou un identifiant GitHub côté navigateur.

Par défaut, **le bouton prépare et copie uniquement le signalement**. Il n'envoie rien tant que le Worker, sa sécurité et son adresse ne sont pas configurés.

## Activation manuelle

1. Vérifier que les Issues sont activées sur le dépôt visé. Si le dépôt devient privé, vérifier séparément que votre plan GitHub permet encore son utilisation avec GitHub Pages. Un dépôt privé distinct réservé aux retours est également possible.
2. Générer un GitHub fine-grained personal access token limité au seul dépôt choisi, avec uniquement la permission **Issues: Read and write** (Metadata: Read automatique).
3. Créer une widget Cloudflare Turnstile pour foreveroth.com (et www.foreveroth.com si nécessaire). Conserver la sitekey publique et la secret key privée.
4. Depuis le dossier feedback-worker, déployer avec **npx wrangler deploy** (après npx wrangler login), puis définir les secrets Worker avec les commandes :
   - npx wrangler secret put GITHUB_TOKEN
   - npx wrangler secret put GITHUB_REPOSITORY
   - npx wrangler secret put TURNSTILE_SECRET

La valeur de GITHUB_REPOSITORY est de type owner/repo. Ne jamais exposer les secrets dans le HTML, le JavaScript, Wrangler vars, ou les commits.

5. Dans assets/feedback.js, renseigner les deux constantes publiques en haut du fichier :
   - API_ENDPOINT : URL HTTPS du Worker terminée par /feedback (par exemple https://MON-WORKER.workers.dev/feedback)
   - TURNSTILE_SITE_KEY : la sitekey publique Turnstile.
6. Publier la mise à jour du site, tester un message sur foreveroth.com et vérifier la création de l'Issue. Un message de succès du site n'est affiché qu'après une réponse HTTP 201 valide.

## Sécurité

Le Worker refuse les origines non prévues et celles absentes, vérifie la catégorie, le texte et le chemin, puis contrôle Turnstile **sur le serveur**, y compris hostname et action. Il utilise une limite de 5 demandes par minute et par adresse IP / localisation Cloudflare (adaptable), avec un champ leurre anti-bots. CORS seul ne constitue pas une mesure anti-spam.

Les Issues ne contiennent ni email, ni IP, ni identifiant d'utilisateur collecté automatiquement. Les descriptions sont du texte volontairement transmis : modérer leur contenu et ne pas republier sans vérification.

## Remarques

- Aucun GitHub Actions périodique supplémentaire.
- GitHub Pages est un hébergement statique : aucun jeton GitHub ne doit y figurer.
- Le caractère privé du dépôt dépend réellement de ses permissions, pas du fait de masquer son nom dans l'interface.
- Tant que le Worker n'est pas déployé et configuré, les utilisateurs ne peuvent que copier leur rapport : aucune Issue n'est créée automatiquement.
