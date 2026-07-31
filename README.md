# L'Établi

> Le carnet de bord public des artisans et des créateurs. Un ébéniste, un tatoueur, un mécanicien documente un ouvrage étape par étape : on y montre le travail, pas seulement le résultat.

Application complète en deux parties : une API Node/Express sur PostgreSQL, et un client Next.js 16. Contenus de démonstration entièrement fictifs.

**Stack** · Next.js 16 · React 19 · TypeScript strict · Tailwind 4 · Node · Express · PostgreSQL · Prisma 6 · Jest · Playwright · Zod · jose

```
API          73 tests          0 vulnérabilité en production
Bout en bout 13 tests          0 violation WCAG 2.1 AA
```

## Démonstration en ligne

**[letabli.vercel.app](https://letabli.vercel.app)** · API sur [letabli.onrender.com](https://letabli.onrender.com/health)

Se connecter avec `margaux@exemple.fr` et le mot de passe `atelier2026` pour créer un carnet, ajouter des étapes et les réordonner. Tous les comptes de démonstration partagent ce mot de passe ; la liste complète est [plus bas](#comptes-de-démonstration).

> L'API est hébergée sur une offre gratuite qui met le service en veille après quinze minutes sans trafic. **Le tout premier chargement peut donc prendre une minute**, le temps que l'instance se réveille. Les suivants sont immédiats.

---

## Ce que ce dépôt raconte

Ce projet est né de la reprise d'un exercice de formation : un réseau social écrit en 2024 avec React 18, Redux et MongoDB. L'audit de départ a relevé **une vingtaine de défauts, dont dix failles d'autorisation**. Le détail complet, faille par faille, est dans [AUDIT.md](AUDIT.md).

Le fil conducteur était unique, et c'est ce qui rendait le problème systémique plutôt qu'accidentel :

> **L'identité de l'utilisateur était lue depuis le corps de la requête ou depuis l'URL, jamais depuis le jeton d'authentification.**

Un client pouvait donc se déclarer être qui il voulait. Concrètement, sur le code d'origine :

| Faille | Ce qu'elle permettait |
|---|---|
| Aucune route mutante protégée | Supprimer le compte de n'importe qui **sans être connecté** |
| `requireAuth` inopérant | Sans jeton, la requête restait pendante jusqu'au délai d'attente au lieu de renvoyer 401 |
| `commenterId` **et** `commenterPseudo` acceptés depuis le corps | Commenter sous l'identité et le nom d'un autre membre |
| `ObjectId.isValid(id) \|\| req.user.isAdmin` | Un OU : un identifiant syntaxiquement valide suffisait pour modifier la publication d'autrui |
| `expiresIn: 259200000` | `expiresIn` s'exprime en secondes : les jetons vivaient **huit ans** au lieu de trois jours |
| `tuype: Boolean` | Faute de frappe : le champ `isAdmin` n'existait pas en base. Tout le contrôle administrateur reposait sur une valeur absente |
| Nom de fichier construit depuis `req.body` | Écriture d'un fichier hors du dossier prévu par remontée de répertoire |
| `upsert: true` sur la mise à jour de profil | Un identifiant inexistant **créait** un compte sans adresse ni mot de passe |
| Mot de passe de la base dans `frontend/.env`, versionné | Variable préfixée `REACT_APP_`, donc **inscrite dans le bundle envoyé au navigateur** |

La règle appliquée à la refonte tient en une phrase : **l'identité de l'auteur d'une action provient exclusivement du jeton vérifié.** Tout champ `authorId`, `commenterId` ou identifiant d'abonné transmis par le client est ignoré, et chaque écriture vérifie ensuite que la ressource visée appartient bien à cet utilisateur.

---

## Les tests sont des tests d'attaque

Le point qui compte davantage que le nombre : **chaque faille de l'audit a son test**, nommé d'après le scénario d'attaque plutôt que d'après la fonction testée.

```
Audit 1.3 - propriété des projets
  ✓ empêche Alice de modifier le projet de Bob
  ✓ empêche Alice de supprimer le projet de Bob
  ✓ autorise Bob à modifier son propre projet

Audit 1.4 - l'auteur d'un projet vient du jeton
  ✓ ignore un authorId forgé dans le corps de la requête

Audit 1.6 - impossible de commenter sous l'identité d'un autre
  ✓ ignore authorId et pseudo envoyés par le client

Audit 2.1 - le nom des fichiers déposés est généré par le serveur
  ✓ n'accepte pas un chemin fourni par le client
```

Ces tests passent par HTTP et ne connaissent rien du moteur de stockage. C'est ce qui a permis de **migrer de MongoDB vers PostgreSQL sans une seule régression** : la suite était verte avant la migration, elle l'est restée après. C'est la démonstration concrète de ce à quoi servent des tests, et elle vaut mieux qu'un pourcentage de couverture.

```bash
npm test
```

`73 tests, 6 suites, 0 échec.`

### Et treize tests de bout en bout, dont un à deux ateliers

Playwright ouvre **deux contextes de navigateur simultanés**, chacun avec son propre magasin de cookies : deux sessions coexistent réellement, comme deux personnes devant deux machines.

```
Deux ateliers en parallèle
  ✓ un carnet publié est visible, commentable et apprécié par un autre atelier
  ✓ un atelier ne peut pas atteindre la page de gestion d'un carnet tiers
```

C'est la seule façon de vérifier ce qu'une session unique ne peut pas voir : qu'une publication traverse bien la base jusqu'à autrui, et surtout que les contrôles d'autorisation tiennent quand deux comptes agissent en même temps.

**Trois défauts réels ont été trouvés en écrivant ces tests**, aucun visible à l'œil :

| Trouvé | Nature |
|---|---|
| Contraste du laiton à **3,92:1** sur le papier, **3,95:1** sous du texte blanc | Sous le seuil AA de 4,5:1. Palette corrigée à 5,4 et 5,7:1 |
| Contraste du gris secondaire à **3,14:1** en thème clair, **3,63:1** en sombre | Corrigé à 4,95 et 5,3:1 |
| La limitation de débit bloquait la suite au bout de quelques scénarios | Plafond rendu configurable, relevé hors production plutôt que désactivé |

Le premier point mérite d'être souligné : le blanc sur l'accent laiton était non conforme, ce qui touchait **tous les boutons principaux du site**. Une couleur `--on-brass` distincte a été introduite, parce qu'un texte posé sur l'accent ne peut pas être figé à blanc : en thème sombre l'accent s'éclaircit et le blanc n'y contraste plus qu'à 2,6:1.

```bash
cd web && npm run e2e
```

---

## Décisions techniques

### PostgreSQL plutôt que MongoDB

Le modèle d'origine stockait `followers`, `following` et `likes` comme des tableaux de chaînes dans le document utilisateur : aucune intégrité référentielle, aucune unicité, et la même information dupliquée des deux côtés de chaque relation. Le relationnel confie ces garanties à la base au lieu de les confier à du code applicatif qu'un oubli ou une écriture concurrente peut contourner.

- `@@id([userId, projectId])` sur les votes : **le double vote est impossible au niveau de la base**. La version MongoDB s'appuyait sur `$addToSet`, une garantie applicative.
- `onDelete: Cascade` : supprimer un compte emporte projets, étapes, commentaires et votes. Le code ne peut pas oublier de nettoyer, parce qu'il n'a rien à nettoyer.
- `@@unique([projectId, position])` : deux étapes ne peuvent pas partager un rang dans un même projet.

### La contrainte différée

Réordonner une étape traverse nécessairement un état où deux étapes partagent un rang. PostgreSQL vérifie les index uniques **ligne par ligne**, si bien qu'un `UPDATE` en masse échoue dès la première ligne réécrite.

La solution facile aurait été de ruser dans le code : positions négatives temporaires, écritures ordonnées une à une. À la place, la contrainte est déclarée `DEFERRABLE INITIALLY IMMEDIATE`, et **seule** la transaction de réordonnancement demande `SET CONSTRAINTS ... DEFERRED`.

Conséquences : une insertion en doublon échoue toujours sur-le-champ, avec un diagnostic clair ; et l'invariant reste garanti pour tout lecteur, puisqu'aucune transaction ne peut valider un état comportant deux rangs identiques. Voir [`migrations/20260729000001`](Backend/prisma/migrations/20260729000001_deferrable_step_position/migration.sql).

### `jose` plutôt que `jsonwebtoken`

Les tests refusaient de démarrer. Diagnostic : `jsonwebtoken@9` passait alors par `jws` → `jwa` → `buffer-equal-constant-time`, qui appelait `SlowBuffer`, une API retirée de Node. La bibliothèque levait une `TypeError` au chargement.

Ce point précis a depuis été corrigé en amont, et une version récente de `jsonwebtoken` se charge sans erreur. La migration n'est pas revenue en arrière pour autant : une chaîne de quatre paquets dont le maillon fautif n'était plus maintenu reste une dépendance qu'on préfère ne pas porter.

`jose` s'appuie sur WebCrypto natif et n'embarque aucune dépendance. Sa durée d'expiration s'exprime en littéral (`"3d"`), ce qui rend l'erreur d'unité du jeton de huit ans structurellement impossible à reproduire.

### Le hachage confié au client de base de données

Mongoose garantissait le hachage par un hook `pre('save')`. Prisma n'a pas de hook de modèle, et confier ce hachage à chaque contrôleur revient à accepter qu'un oubli finisse un jour par écrire un mot de passe en clair. Une extension Prisma intercepte donc les écritures sur `User`.

Le garde `isHashed` corrige au passage un défaut de la version Mongoose : le hook re-hachait un condensat déjà calculé dès qu'on sauvegardait le profil pour une autre raison, ce qui rendait la connexion impossible après une simple modification de biographie.

### Une base qui ne référence pas de fichier fantôme

La colonne `picture` valait par défaut `uploads/profils/default.png`, un fichier inexistant : chaque profil sans photo déclenchait une requête en 404, et le client ne pouvait pas distinguer « pas de photo » de « photo introuvable ».

Le réflexe aurait été un repli JavaScript sur l'image, sauf que `onError` ne peut rien signaler quand l'échec précède l'hydratation. Le défaut était en amont : **une base ne doit pas référencer un fichier dont elle ne garantit pas l'existence**. La colonne est devenue nullable, et le repli est une responsabilité de l'interface.

### Les formulaires fonctionnent sans JavaScript

Les mutations passent par des Server Actions attachées à l'attribut `action` du formulaire, jamais à un gestionnaire `onSubmit`. La soumission aboutit donc même si le script n'a pas chargé ou a échoué - ce que la plupart des applications React ont cessé de savoir faire. `useActionState` n'ajoute que l'affichage progressif de l'état ; il ne conditionne pas le fonctionnement.

Le point délicat est le relais de session : quand une Server Action authentifie un visiteur, c'est le serveur Next qui reçoit l'en-tête `Set-Cookie` de l'API, pas le navigateur. Sans réémission explicite, la session serait perdue aussitôt obtenue. La lecture se fait par `getSetCookie()` et non `get('set-cookie')` : ce dernier concatène les cookies multiples en une chaîne dont le découpage devient ambigu dès qu'une valeur contient une virgule, ce qui est le cas des dates d'expiration.

Corollaire moins évident, découvert en testant : `revalidatePath` invalide le cache d'une route, mais seule une soumission de formulaire redemande la page d'elle-même. Une action déclenchée à la main - supprimer un commentaire, déplacer une étape - exige un `router.refresh()` explicite.

### Images : 12 Ko servis en 1,4 Ko

| En-tête `Accept` | Format servi | Poids |
|---|---|---|
| Original sur disque | JPEG | 12 Ko |
| Ancien navigateur | JPEG | 3,7 Ko |
| Sans AVIF | WebP | 2,2 Ko |
| Navigateur moderne | **AVIF** | **1,4 Ko** |

Soit **88 % de réduction** sur le chemin le plus courant, avec repli propre. L'attribut `sizes` fait le reste : les cartes du fil demandent une variante de 640 pixels et non de 1200, les avatars de 64 pixels à qualité réduite - un cercle de 32 pixels ne justifie pas 75 % de qualité JPEG.

Deux durcissements de Next 16 ont été rencontrés au passage. L'optimiseur **refuse les hôtes résolvant vers une adresse privée**, protection contre le SSRF : sans elle, il peut servir de relais vers le réseau interne. L'exception est donc conditionnée à `NODE_ENV`, et la protection reste entière en production. Les **niveaux de qualité doivent être déclarés**, pour qu'une valeur arbitraire dans une URL ne fasse pas générer une infinité de variantes.

Les 47 visuels de démonstration sont **générés, pas empruntés** : un SVG paramétré par matière - bois chaud, acier froid, calcaire clair - converti en JPEG, avec un grain léger parce qu'un dégradé pur se repère immédiatement comme un aplat artificiel. 692 Ko au total, non versionnés puisqu'ils se régénèrent.

### Streaming : la page part avant les données

```
accroche + squelette :  64 ms
contenu réel :         105 ms
```

L'accroche et la structure partent immédiatement, la grille arrive en flux. En local l'API est sur la même machine ; en production, hébergée séparément, cet écart se compte en centaines de millisecondes - c'est autant d'attente devant une page blanche que le streaming supprime.

Les squelettes reproduisent la **géométrie exacte** du contenu final : mêmes rapports de forme, mêmes hauteurs de ligne. Un squelette approximatif est pire qu'un simple indicateur d'attente, puisqu'il provoque à l'arrivée des données le décalage de mise en page que mesure le CLS.

### Images de partage générées à la volée

Chaque carnet a sa propre vignette, composée depuis ses données : titre, atelier, métier, avancement. Une capture statique unique donnerait la même image à dix-sept carnets, et le lien partagé ne dirait rien de son contenu.

Le rendu passe par Satori, qui n'implémente qu'un sous-ensemble de CSS : flexbox uniquement, `display: flex` obligatoire sur tout conteneur à plusieurs enfants, et pas de rognage multiligne - la coupe des titres longs est donc faite en amont, sur la donnée.

### Accessibilité

Pas une case à cocher, des choix conscients :

- **Le réordonnancement se fait par deux boutons, pas par glisser-déposer.** Un glisser-déposer est inutilisable au clavier, difficile à annoncer par un lecteur d'écran et pénible sur écran tactile étroit. « Descendre l'étape 2 » est immédiatement compréhensible.
- **Les étapes sont une liste ordonnée** (`<ol>`) : l'ordre porte du sens, et un lecteur d'écran annonce « 2 sur 5 ».
- Champs liés par `htmlFor`, `aria-invalid`, `aria-describedby` et `role="alert"` sur les erreurs, pour qu'elles soient annoncées à leur apparition et non seulement lues au retour dans le champ.
- Anneau de focus visible imposé, `aria-current` sur la navigation, lien d'évitement, respect de `prefers-reduced-motion`, thème sombre natif.
- Images décoratives en `alt=""` : le nom de l'artisan est déjà écrit à côté, le répéter le ferait annoncer deux fois.

### Autres

- **Pagination par curseur**, pas par décalage : un décalage duplique ou saute des éléments dès qu'une publication s'intercale pendant la navigation.
- **Validation par Zod** en entrée d'API : Prisma garantit l'intégrité de ce qui est stocké, pas la forme de ce qui arrive. Sans cette couche, un corps malformé produit une erreur de base renvoyée en 500 au lieu d'un 400 explicite.
- **Projections centralisées** (`lib/selectors.js`) : un nouveau champ sensible ajouté au schéma ne fuite pas parce qu'on aurait oublié de le masquer quelque part.
- **Mises à jour optimistes** via `useOptimistic` : l'état réel est rétabli par React à la fin de la transition, donc aucun retour arrière à écrire à la main.
- **Limitation de débit** sur la connexion et l'inscription, en-têtes durcis par Helmet, arrêt propre du serveur sur `SIGTERM`.

---

## Lancer le projet

Aucune installation de base de données, aucun conteneur, aucun compte hébergé : le binaire PostgreSQL est embarqué.

### 1. L'API

```bash
cd Backend
npm install
cp .env.example .env
```

Renseigner `TOKEN_SECRET` dans `.env` :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Puis, dans trois terminaux :

```bash
npm run db:dev
```

```bash
npm run db:seed
```

```bash
npm run dev
```

L'API écoute sur `http://localhost:5000`.

### 2. Le client

```bash
cd web
npm install
cp .env.local.example .env.local
npm run dev
```

L'application est sur `http://localhost:3000`.

### Comptes de démonstration

| Adresse | Atelier | Métier |
|---|---|---|
| `margaux@exemple.fr` | Margaux Ferrand | Ébénisterie |
| `ravel@exemple.fr` | Atelier Ravel | Mécanique ancienne |
| `forge@exemple.fr` | Forge du Vésinet | Coutellerie |
| `vasseur@exemple.fr` | Lutherie Vasseur | Lutherie |
| `terrefeu@exemple.fr` | Terre & Feu | Céramique |
| `solene@exemple.fr` | Atelier Solène Marchand | Tapisserie d'ameublement |
| `pierretrait@exemple.fr` | Pierre & Trait | Taille de pierre |

Mot de passe commun : `atelier2026`

Deux comptes valent mieux qu'un pour explorer : les autorisations ne se voient que depuis un second atelier, qui n'a aucun panneau de gestion sur les carnets du premier.

### Tests

```bash
cd Backend && npm test
```

La suite démarre son propre PostgreSQL jetable et applique les migrations : les contraintes, cascades et transactions sont donc testées sur le **même moteur qu'en production**, et non sur une imitation dont le comportement diverge précisément là où ça compte.

---

## Structure

```
Backend/
  prisma/
    schema.prisma          modèle relationnel
    migrations/            dont la contrainte différée
    seed.js
  lib/
    prisma.js              client + hachage par extension
    validation.js          schémas Zod
    selectors.js           projections publiques
    upload.js              écriture de fichiers à nom généré
  middleware/auth.js       checkUser et requireAuth
  controllers/
  routes/
  tests/
    authorization.test.js  tests d'attaque
    auth.test.js
    relational.test.js     garanties tenues par la base
web/
  app/                     App Router
  components/
  lib/
    api.ts                 client fonctionnant serveur et navigateur
    queries.ts
    types.ts
  middleware.ts
```

Le client API fonctionne **des deux côtés du rendu** : sur le serveur il lit le cookie de session dans la requête entrante et le retransmet, sur le navigateur `credentials: 'include'` suffit. C'est ce qui permet à l'en-tête d'afficher le bon état dès le premier rendu, sans le clignotement « déconnecté puis connecté ».

---

## Limites connues

Autant les écrire que les laisser découvrir :

- **`npm audit` remonte des vulnérabilités en dépendances de développement**, toutes issues d'`embedded-postgres`, qui télécharge des archives. Elles ne partent jamais en production : `npm audit --omit=dev` renvoie zéro. Le paquet est déclaré en `devDependencies` pour cette raison.
- Le client Next.js hérite d'alertes liées à `sharp` et `libvips`, dépendances de l'optimisation d'images de Next. Les corriger imposerait de rétrograder Next de plusieurs versions majeures, ce qui serait un mauvais échange.
- **Le filtre de routes côté client est une commodité d'affichage, pas une mesure de sécurité.** Il évite de montrer un formulaire à quelqu'un qui sera refusé ; l'autorisation réelle est vérifiée par l'API, qui seule détient le secret de signature. Un test de bout en bout vérifie d'ailleurs qu'un atelier atteignant directement l'adresse d'un carnet tiers n'y obtient aucun panneau de gestion.
- L'état d'abonnement affiché sur une page de profil n'est pas encore renvoyé par l'API : le bouton part de l'état « non abonné » au premier rendu.
- Les images de partage utilisent la police par défaut de Satori et non la serif du site. Charger une police personnalisée imposerait de versionner un fichier binaire ; l'écart a été jugé plus acceptable que la dépendance.
- **axe-core ne détecte qu'une partie des problèmes d'accessibilité** - de l'ordre de quarante pour cent selon ses propres auteurs. Il attrape en revanche infailliblement les régressions mécaniques, ce qui est précisément ce qui se casse sans qu'on s'en aperçoive. Les vérifications qu'il ne sait pas faire, comme l'ordre de tabulation ou la pertinence d'un intitulé, sont couvertes par des tests au clavier dédiés.
- Les tests de bout en bout ne couvrent que Chromium. Ajouter Firefox et WebKit est une ligne de configuration, mais triplerait la durée de la vérification pour un gain limité à ce stade.
- **L'instance de démonstration se met en veille après quinze minutes sans trafic**, le plan gratuit de Render ne maintenant pas de processus permanent. Le premier appel après une veille attend le réveil, de l'ordre d'une minute. Un plan payant supprime le comportement sans changer une ligne de code.
- **Les données de la démonstration sont réinitialisées à chaque déploiement.** Le seed tourne pendant le build, parce que c'est lui qui génère les visuels : les images vivent sur un système de fichiers éphémère, et les régénérer au même moment que les lignes correspondantes est la seule façon de garantir que la base ne référence pas un fichier absent. Conséquence assumée : un compte créé par un visiteur ne survit pas au déploiement suivant. Rendre les inscriptions persistantes suppose de sortir les fichiers vers un stockage objet, ce qui est un choix d'hébergement, pas une correction.

---

## Licence

Tous droits réservés. Voir [LICENSE](LICENSE). Dépôt publié à des fins de démonstration et d'évaluation.
