const { SignJWT } = require('jose');

const prisma = require('../lib/prisma');
const { verify } = require('../lib/password');
const { publicUser } = require('../lib/selectors');
const { parse, signUpSchema, signInSchema } = require('../lib/validation');

// Durée de session : trois jours.
const SESSION_DAYS = 3;
const MAX_AGE_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === 'production';

const secretKey = () => new TextEncoder().encode(process.env.TOKEN_SECRET);

/**
 * La version précédente passait une durée en millisecondes à l'option
 * `expiresIn` de jsonwebtoken, qui l'interprète en secondes : les jetons
 * émis vivaient environ huit ans au lieu de trois jours.
 *
 * `jose` attend une durée explicite ("3d"), ce qui rend l'erreur d'unité
 * impossible à reproduire.
 */
const createToken = (id) =>
  new SignJWT({ id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());

const cookieOptions = {
  httpOnly: true,
  // HTTPS uniquement en production : un cookie de session ne doit pas
  // transiter en clair.
  secure: isProduction,
  // Empêche l'envoi automatique du cookie depuis un site tiers (CSRF).
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: MAX_AGE_MS,
  path: '/',
};

exports.signup = async (req, res, next) => {
  const data = parse(signUpSchema, req, res);
  if (!data) return undefined;

  try {
    // Le mot de passe est haché par l'extension Prisma, jamais ici :
    // aucun contrôleur ne peut oublier de le faire.
    const user = await prisma.user.create({ data, select: publicUser });
    return res.status(201).json({ user });
  } catch (err) {
    // P2002 : violation de contrainte d'unicité.
    if (err.code === 'P2002') {
      const field = Array.isArray(err.meta?.target) ? err.meta.target[0] : 'champ';
      const messages = {
        pseudo: 'Ce pseudo est déjà pris.',
        email: 'Cette adresse est déjà enregistrée.',
      };

      // Une inscription refusée renvoyait auparavant un statut 200 : le client
      // ne pouvait pas distinguer un succès d'un échec.
      return res.status(409).json({ errors: { [field]: messages[field] || 'Valeur déjà utilisée.' } });
    }

    return next(err);
  }
};

exports.signIn = async (req, res, next) => {
  const data = parse(signInSchema, req, res);
  if (!data) return undefined;

  // Message unique quelle que soit la cause : distinguer « adresse inconnue »
  // de « mot de passe erroné » permettrait d'énumérer les comptes existants.
  const refuse = () =>
    res.status(401).json({ message: 'Adresse électronique ou mot de passe incorrect.' });

  try {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return refuse();

    const valid = await verify(data.password, user.password);
    if (!valid) return refuse();

    const token = await createToken(user.id);
    res.cookie('jwt', token, cookieOptions);

    return res.status(200).json({
      user: {
        id: user.id,
        pseudo: user.pseudo,
        picture: user.picture,
        craft: user.craft,
        city: user.city,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.logout = (req, res) => {
  // Une API confirme, elle ne redirige pas.
  res.clearCookie('jwt', { ...cookieOptions, maxAge: undefined });
  return res.status(200).json({ message: 'Déconnecté.' });
};

/**
 * Utilisateur de la session courante. Remplace l'ancienne route `/jwtid`,
 * qui renvoyait un identifiant brut en texte.
 */
exports.me = (req, res) => res.status(200).json(res.locals.user);
