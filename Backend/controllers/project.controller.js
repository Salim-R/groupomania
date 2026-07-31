const prisma = require('../lib/prisma');
const { projectCard, projectDetail, authorPreview } = require('../lib/selectors');
const { storeImage } = require('../lib/upload');
const { uploadErrors } = require('../utils/errors.utils');
const {
  parse,
  projectSchema,
  projectUpdateSchema,
  commentSchema,
} = require('../lib/validation');

/**
 * Charge un projet et vérifie que l'utilisateur connecté en est l'auteur.
 * Renvoie `null` après avoir répondu lorsqu'une condition n'est pas remplie,
 * ce qui permet au contrôleur appelant de sortir immédiatement.
 */
const findOwnedProject = async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    select: { id: true, authorId: true },
  });

  if (!project) {
    res.status(404).json({ message: 'Projet introuvable.' });
    return null;
  }

  // Contrôle de propriété : la version précédente accordait l'accès dès que
  // l'identifiant était syntaxiquement valide.
  if (project.authorId !== res.locals.user.id && !res.locals.user.isAdmin) {
    res.status(403).json({ message: 'Ce projet ne vous appartient pas.' });
    return null;
  }

  return project;
};

exports.readProjects = async (req, res, next) => {
  const take = Math.min(Number.parseInt(req.query.limit, 10) || 20, 50);
  const { cursor, craft, city, author } = req.query;

  try {
    const projects = await prisma.project.findMany({
      where: {
        status: { not: 'ARCHIVED' },
        ...(author ? { authorId: author } : {}),
        ...(craft || city
          ? {
              author: {
                ...(craft ? { craft: { equals: craft, mode: 'insensitive' } } : {}),
                ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
              },
            }
          : {}),
      },
      select: projectCard,
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      // Pagination par curseur plutôt que par décalage : le décalage duplique
      // ou saute des éléments dès qu'une publication s'intercale pendant la
      // navigation.
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = projects.length > take;

    return res.status(200).json({
      items: hasMore ? projects.slice(0, take) : projects,
      nextCursor: hasMore ? projects[take - 1].id : null,
    });
  } catch (err) {
    return next(err);
  }
};

exports.readOneProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      select: projectDetail,
    });

    if (!project) return res.status(404).json({ message: 'Projet introuvable.' });

    // Le visiteur connecté sait immédiatement s'il a déjà aimé ce projet,
    // sans requête supplémentaire côté client.
    let likedByMe = false;
    if (res.locals.user) {
      const like = await prisma.like.findUnique({
        where: { userId_projectId: { userId: res.locals.user.id, projectId: project.id } },
      });
      likedByMe = Boolean(like);
    }

    return res.status(200).json({ ...project, likedByMe });
  } catch (err) {
    return next(err);
  }
};

exports.createProject = async (req, res, next) => {
  const data = parse(projectSchema, req, res);
  if (!data) return undefined;

  let coverImage;

  if (req.file) {
    try {
      coverImage = await storeImage(req.file, 'projects');
    } catch (err) {
      return res.status(400).json({ errors: uploadErrors(err) });
    }
  }

  try {
    const project = await prisma.project.create({
      data: {
        ...data,
        coverImage,
        // L'auteur vient du jeton vérifié. Un authorId envoyé par le client
        // est ignoré : il n'est même pas lu.
        authorId: res.locals.user.id,
      },
      select: projectCard,
    });

    return res.status(201).json(project);
  } catch (err) {
    return next(err);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const owned = await findOwnedProject(req, res);
    if (!owned) return undefined;

    const data = parse(projectUpdateSchema, req, res);
    if (!data) return undefined;

    const project = await prisma.project.update({
      where: { id: owned.id },
      data,
      select: projectCard,
    });

    return res.status(200).json(project);
  } catch (err) {
    return next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const owned = await findOwnedProject(req, res);
    if (!owned) return undefined;

    // Étapes, commentaires et likes suivent par cascade déclarée au schéma.
    await prisma.project.delete({ where: { id: owned.id } });

    return res.status(200).json({ message: 'Projet supprimé.' });
  } catch (err) {
    return next(err);
  }
};

/**
 * Mentions « j'aime ».
 *
 * L'auteur du vote est l'utilisateur du jeton : la version précédente lisait
 * `req.body.id`, ce qui permettait de voter au nom d'autrui. La clé primaire
 * composite (userId, projectId) rend par ailleurs le double vote impossible
 * au niveau de la base, et non plus par une garantie applicative.
 */
exports.likeProject = async (req, res, next) => {
  const userId = res.locals.user.id;
  const projectId = req.params.id;

  try {
    await prisma.like.upsert({
      where: { userId_projectId: { userId, projectId } },
      create: { userId, projectId },
      update: {},
    });

    const likes = await prisma.like.count({ where: { projectId } });

    return res.status(200).json({ projectId, likes, likedByMe: true });
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(404).json({ message: 'Projet introuvable.' });
    }

    return next(err);
  }
};

exports.unlikeProject = async (req, res, next) => {
  const userId = res.locals.user.id;
  const projectId = req.params.id;

  try {
    // `deleteMany` réussit sur un projet inexistant, là où l'ajout d'un vote
    // échoue sur la contrainte de clé étrangère. Sans cette vérification, la
    // même adresse répondrait 404 au verbe PUT et 200 au verbe DELETE.
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) return res.status(404).json({ message: 'Projet introuvable.' });

    await prisma.like.deleteMany({ where: { userId, projectId } });

    const likes = await prisma.like.count({ where: { projectId } });

    return res.status(200).json({ projectId, likes, likedByMe: false });
  } catch (err) {
    return next(err);
  }
};

exports.addComment = async (req, res, next) => {
  const data = parse(commentSchema, req, res);
  if (!data) return undefined;

  try {
    // L'auteur du commentaire vient du jeton. Accepter `commenterId` et
    // `commenterPseudo` depuis le corps permettait de commenter sous
    // l'identité et le nom d'un autre membre.
    const comment = await prisma.comment.create({
      data: {
        text: data.text,
        projectId: req.params.id,
        authorId: res.locals.user.id,
      },
      select: {
        id: true,
        text: true,
        createdAt: true,
        author: { select: authorPreview },
      },
    });

    return res.status(201).json(comment);
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(404).json({ message: 'Projet introuvable.' });
    }

    return next(err);
  }
};

exports.updateComment = async (req, res, next) => {
  const data = parse(commentSchema, req, res);
  if (!data) return undefined;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.commentId },
      select: { id: true, authorId: true, projectId: true },
    });

    // Le commentaire doit appartenir au projet nommé dans l'adresse. Sans cette
    // vérification, n'importe quel identifiant de projet ferait l'affaire et la
    // route cesserait de décrire ce qu'elle manipule.
    if (!comment || comment.projectId !== req.params.id) {
      return res.status(404).json({ message: 'Commentaire introuvable.' });
    }

    if (comment.authorId !== res.locals.user.id) {
      return res.status(403).json({ message: 'Ce commentaire ne vous appartient pas.' });
    }

    const updated = await prisma.comment.update({
      where: { id: comment.id },
      data: { text: data.text },
      select: {
        id: true,
        text: true,
        createdAt: true,
        author: { select: authorPreview },
      },
    });

    return res.status(200).json(updated);
  } catch (err) {
    return next(err);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.commentId },
      select: { id: true, authorId: true, projectId: true, project: { select: { authorId: true } } },
    });

    if (!comment || comment.projectId !== req.params.id) {
      return res.status(404).json({ message: 'Commentaire introuvable.' });
    }

    const userId = res.locals.user.id;

    // L'auteur du commentaire peut le retirer, l'auteur du projet aussi :
    // c'est lui qui modère son carnet de bord.
    if (comment.authorId !== userId && comment.project.authorId !== userId) {
      return res.status(403).json({ message: 'Suppression non autorisée.' });
    }

    await prisma.comment.delete({ where: { id: comment.id } });

    return res.status(200).json({ message: 'Commentaire supprimé.' });
  } catch (err) {
    return next(err);
  }
};
