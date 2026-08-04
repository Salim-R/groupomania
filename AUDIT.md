# Audit de sécurité et de qualité - état initial

> Audit réalisé le 29 juillet 2026 sur le code d'origine, avant refonte.
> Ce document sert de référence : chaque point corrigé donne lieu à un test de
> non-régression, nommé d'après le numéro de la faille. Seul le point 2.3, qui
> relève de l'hygiène du dépôt et non du comportement de l'API, n'en a pas.

L'API expose un réseau social (publications, commentaires, likes, abonnements). Le principe de sécurité violé partout est le même : **l'identité de l'utilisateur est lue depuis le corps de la requête ou depuis l'URL, jamais depuis le jeton d'authentification.** Un client peut donc se déclarer être qui il veut.

---

## 1. Failles d'autorisation et d'usurpation d'identité

### 1.1 Aucune route mutante n'est protégée

`user.routes.js` et `post.routes.js` n'appliquent `requireAuth` sur aucune route. Le middleware existe et n'est branché que sur `/jwtid`.

**Conséquence :** `DELETE /api/user/:id` supprime le compte de n'importe qui, sans être connecté. Idem pour la modification et la suppression de publications.

### 1.2 Le middleware `requireAuth` est lui-même inopérant

```js
module.exports.requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
      if (err) {
        res.send(200).json('no token')   // double envoi de réponse
      } else {
        next();                           // aucune vérification que l'utilisateur existe
      }
    });
  } else {
    console.log('No token');              // ni next(), ni réponse : requête suspendue
  }
};
```

Trois défauts : sans jeton la requête reste pendante jusqu'au timeout au lieu de renvoyer 401 ; avec un jeton invalide, `res.send(200).json(...)` provoque un envoi double et une erreur `ERR_HTTP_HEADERS_SENT` ; et l'existence réelle de l'utilisateur en base n'est jamais vérifiée.

### 1.3 Modification et suppression de publications ouvertes à tous

```js
if (ObjectId.isValid(req.params.id) || req.user.isAdmin === true) {
```

La condition est un **OU**. Dès que l'identifiant est un ObjectId syntaxiquement valide, l'accès est accordé. Aucune vérification que la publication appartient au demandeur.

Second problème : `req.user` n'existe pas, le middleware renseigne `res.locals.user`. Avec un identifiant invalide, `req.user.isAdmin` lève une `TypeError` non capturée et fait tomber la requête en erreur 500.

### 1.4 L'auteur d'une publication est déclaré par le client

`createPost` lit `req.body.posterId`. N'importe qui peut publier au nom de n'importe qui.

### 1.5 Les likes sont attribués depuis le corps de la requête

`likePost` et `unlikePost` lisent `req.body.id`. On peut liker et déliker au nom d'autrui.

### 1.6 Les commentaires permettent l'usurpation complète

`commentPost` lit `commenterId` **et** `commenterPseudo` depuis le corps. Le pseudo affiché est donc entièrement contrôlé par le client : on peut publier un commentaire sous l'identité et le nom de n'importe quel membre.

### 1.7 Édition et suppression de commentaires sans contrôle de propriété

`editCommentPost` et `deleteCommentPost` ne vérifient jamais que le commentaire visé appartient au demandeur.

### 1.8 Modification et suppression de comptes sans contrôle

`updateUser` et `deleteUser` se contentent de valider la forme de l'identifiant. N'importe qui peut modifier la biographie ou supprimer le compte de n'importe qui.

### 1.9 Abonnements forçables

`follow` et `unfollow` prennent l'abonné dans `req.params.id` et la cible dans le corps. On peut donc forcer un compte tiers à en suivre un autre.

### 1.10 Jeton valide huit ans

```js
const maxAge = 3 * 24 * 60 * 60 * 1000;        // 259 200 000
jwt.sign({ id }, secret, { expiresIn: maxAge })
```

`expiresIn`, lorsqu'il reçoit un nombre, est exprimé **en secondes**. La valeur passée est en millisecondes : le jeton est valable 259 200 000 secondes, soit environ huit ans au lieu de trois jours. Un jeton dérobé reste exploitable indéfiniment.

---

## 2. Autres problèmes de sécurité

### 2.1 Écriture de fichier en chemin non maîtrisé

```js
fileName = req.body.posterId + Date.now() + ".jpg";
await fs.promises.writeFile(`${__dirname}/../../frontend/public/img/posts/${fileName}`, ...)
```

`posterId` vient du client et n'est jamais validé. Une valeur contenant des séquences de remontée de répertoire permet d'écrire hors du dossier prévu. Le chemin cible dépend en outre de l'arborescence du front, ce qui ne fonctionne pas en déploiement séparé.

### 2.2 Cookie de session insuffisamment protégé

```js
res.cookie('jwt', token, { httpOnly: true, maxAge });
```

`httpOnly` est bien présent, mais ni `secure` ni `sameSite`. Le cookie transite en clair en HTTP et reste exposé aux requêtes intersites.

### 2.3 Identifiants de base de données dans le dépôt

`db.js` contient l'URI Atlas complète en dur : nom du cluster et nom d'utilisateur figurent dans un dépôt public. Seul le mot de passe passe par une variable d'environnement.

### 2.4 Création de comptes fantômes par `upsert`

`updateUser`, `follow` et `unfollow` utilisent `upsert: true`. Un identifiant inexistant ne provoque pas une erreur : il crée un document utilisateur dépourvu d'adresse électronique et de mot de passe.

---

## 3. Défauts de modélisation

| Fichier | Écrit | Attendu | Effet réel |
|---|---|---|---|
| `user.model.js` | `tuype: Boolean` | `type: Boolean` | Le champ `isAdmin` n'est jamais créé en base |
| `user.model.js` | `password: { max: 1024 }` | `maxlength` | Contrainte ignorée par Mongoose |
| `user.model.js` | `bio: { max: 1024 }` | `maxlength` | Contrainte ignorée |
| `post.model.js` | `posterId: { require: true }` | `required: true` | Validation jamais appliquée |

Le point le plus significatif est `tuype` : tout le contrôle d'accès administrateur repose sur un champ qui n'existe pas.

---

## 4. Défauts de robustesse et de conventions

**Réponses envoyées deux fois.** `likePost`, `unlikePost`, `follow` et `unfollow` enchaînent deux `res.send()` dans la même requête, ce qui déclenche systématiquement `ERR_HTTP_HEADERS_SENT`.

**Erreurs renvoyées avec un code 200.** `signup` et `signIn` répondent `res.status(200).send({ errors })` en cas d'échec. Un client ne peut pas distinguer une réussite d'un échec par le code HTTP.

**API bloquée sur Mongoose 6.** Les appels par fonction de rappel (`Model.find((err, docs) => ...)`) et `Model.remove()` ont été retirés de Mongoose 7. Toute montée de version casse l'application.

**Dépendance morte.** `crypto-js` est importé dans le contrôleur d'authentification sans y être utilisé. `path` est déclaré en dépendance alors qu'il s'agit d'un module natif.

**Nommage incohérent.** `auth.Controller.js` (majuscule), `upload.contoller.js` (faute de frappe), dossier `utilis`. Sur un système de fichiers sensible à la casse, ces noms provoquent des échecs d'import.

**Métadonnées non renseignées.** `package.json` conserve `description: ""`, `author: ""` et `main: "index.js"` alors que le point d'entrée est `server.js`.

**Titre par défaut.** `frontend/public/index.html` affiche encore `<title>React App</title>`.

---

## 5. Principe directeur de la refonte

Une seule règle règle la majorité des points ci-dessus :

> **L'identité de l'auteur d'une action provient exclusivement du jeton vérifié, jamais du corps de la requête ni de l'URL.**

Concrètement, `res.locals.user.id` devient la seule source d'identité. Tout champ `posterId`, `commenterId`, `id` ou identifiant d'abonné transmis par le client est ignoré. Chaque opération de modification vérifie ensuite que la ressource visée appartient bien à cet utilisateur.
