const prisma = require('../lib/prisma');
const { publicUser, userWithCounts, projectCard } = require('../lib/selectors');
const { parse, updateProfileSchema } = require('../lib/validation');

/** Vrai si l'utilisateur connecté agit sur son propre compte. */
const isSelf = (res, targetId) => res.locals.user.id === targetId;

exports.getAllUsers = async (req, res, next) => {
  const { craft, city } = req.query;

  try {
    const users = await prisma.user.findMany({
      // Recherche par métier et par ville : les deux critères réels par
      // lesquels on cherche un artisan. Les colonnes sont indexées.
      where: {
        ...(craft ? { craft: { equals: craft, mode: 'insensitive' } } : {}),
        ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
      },
      select: publicUser,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.status(200).json(users);
  } catch (err) {
    return next(err);
  }
};

exports.getOneUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { ...userWithCounts, projects: { select: projectCard, orderBy: { createdAt: 'desc' } } },
    });

    if (!user) return res.status(404).json({ message: 'Artisan introuvable.' });

    return res.status(200).json(user);
  } catch (err) {
    return next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  // Sans ce contrôle, n'importe qui modifiait le profil de n'importe qui.
  if (!isSelf(res, req.params.id)) {
    return res.status(403).json({ message: 'Vous ne pouvez modifier que votre profil.' });
  }

  const data = parse(updateProfileSchema, req, res);
  if (!data) return undefined;

  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: publicUser,
    });

    return res.status(200).json(user);
  } catch (err) {
    // P2025 : enregistrement absent. L'ancien `upsert: true` créait à la place
    // un utilisateur dépourvu d'adresse et de mot de passe.
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Artisan introuvable.' });
    }

    return next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  if (!isSelf(res, req.params.id) && !res.locals.user.isAdmin) {
    return res.status(403).json({ message: 'Vous ne pouvez supprimer que votre compte.' });
  }

  try {
    // Projets, étapes, commentaires, likes et abonnements suivent par cascade :
    // la contrainte est déclarée dans le schéma, pas reconstituée ici.
    await prisma.user.delete({ where: { id: req.params.id } });

    if (isSelf(res, req.params.id)) res.clearCookie('jwt');

    return res.status(200).json({ message: 'Compte supprimé.' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Artisan introuvable.' });
    }

    return next(err);
  }
};

/**
 * Abonnement et désabonnement.
 *
 * L'abonné est TOUJOURS l'utilisateur du jeton. La version précédente le lisait
 * dans l'URL, ce qui permettait de forcer un compte tiers à en suivre un autre.
 * Les deux mises à jour émettaient par ailleurs chacune une réponse, provoquant
 * systématiquement une erreur d'en-têtes déjà envoyés.
 */
exports.follow = async (req, res, next) => {
  const followerId = res.locals.user.id;
  const followingId = req.params.id;

  if (followerId === followingId) {
    return res.status(400).json({ message: 'Vous ne pouvez pas vous suivre vous-même.' });
  }

  try {
    // La clé primaire composite rend l'opération idempotente : un second appel
    // ne crée pas de doublon et ne lève pas d'erreur.
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });

    const user = await prisma.user.findUnique({
      where: { id: followerId },
      select: userWithCounts,
    });

    return res.status(200).json(user);
  } catch (err) {
    // P2003 : la clé étrangère ne correspond à aucun utilisateur.
    if (err.code === 'P2003') {
      return res.status(404).json({ message: 'Artisan introuvable.' });
    }

    return next(err);
  }
};

exports.unfollow = async (req, res, next) => {
  const followerId = res.locals.user.id;
  const followingId = req.params.id;

  try {
    await prisma.follow.deleteMany({ where: { followerId, followingId } });

    const user = await prisma.user.findUnique({
      where: { id: followerId },
      select: userWithCounts,
    });

    return res.status(200).json(user);
  } catch (err) {
    return next(err);
  }
};
