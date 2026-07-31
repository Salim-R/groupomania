const { jwtVerify } = require('jose');

const prisma = require('../lib/prisma');
const { publicUser } = require('../lib/selectors');

const readToken = (req) => (req.cookies && req.cookies.jwt) || null;

/**
 * `jose` remplace `jsonwebtoken`.
 *
 * `jsonwebtoken@9` dépend de `jws` → `jwa` → `buffer-equal-constant-time`, qui
 * utilise `SlowBuffer`. Cette API a été retirée de Node : la bibliothèque lève
 * une TypeError au chargement sur les versions récentes, et sa chaîne de
 * dépendances n'est plus maintenue. `jose` s'appuie sur WebCrypto natif et
 * n'embarque aucune dépendance.
 */
const secretKey = () => new TextEncoder().encode(process.env.TOKEN_SECRET);

const verifyToken = async (token) => {
  const { payload } = await jwtVerify(token, secretKey());
  return payload;
};

const findSessionUser = (id) =>
  prisma.user.findUnique({
    where: { id },
    select: { ...publicUser, isAdmin: true },
  });

/**
 * Renseigne res.locals.user lorsqu'un jeton valide accompagne la requête.
 * Ne bloque jamais : sert aux routes publiques qui adaptent leur réponse
 * selon qu'un visiteur est connecté ou non.
 */
module.exports.checkUser = async (req, res, next) => {
  res.locals.user = null;

  const token = readToken(req);
  if (!token) return next();

  try {
    const { id } = await verifyToken(token);
    res.locals.user = await findSessionUser(id);
  } catch {
    res.clearCookie('jwt');
  }

  return next();
};

/**
 * Exige un jeton valide ET un utilisateur toujours présent en base.
 * Seule source d'identité autorisée pour les opérations d'écriture :
 * res.locals.user.id. Aucun identifiant transmis par le client n'est
 * considéré comme fiable.
 */
module.exports.requireAuth = async (req, res, next) => {
  const token = readToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Authentification requise.' });
  }

  try {
    const { id } = await verifyToken(token);
    const user = await findSessionUser(id);

    // Un jeton peut rester valide après la suppression du compte.
    if (!user) {
      res.clearCookie('jwt');
      return res.status(401).json({ message: 'Session invalide.' });
    }

    res.locals.user = user;
    return next();
  } catch {
    res.clearCookie('jwt');
    return res.status(401).json({ message: 'Session expirée ou invalide.' });
  }
};
