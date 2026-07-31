const prisma = require('../lib/prisma');
const { storeImage } = require('../lib/upload');
const { uploadErrors } = require('../utils/errors.utils');
const { parse, stepSchema } = require('../lib/validation');

const stepSelect = {
  id: true,
  position: true,
  title: true,
  body: true,
  image: true,
  createdAt: true,
};

/** Charge le projet parent et vérifie que l'appelant en est l'auteur. */
const requireOwnedProject = async (projectId, res) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, authorId: true },
  });

  if (!project) {
    res.status(404).json({ message: 'Projet introuvable.' });
    return null;
  }

  if (project.authorId !== res.locals.user.id && !res.locals.user.isAdmin) {
    res.status(403).json({ message: 'Ce projet ne vous appartient pas.' });
    return null;
  }

  return project;
};

exports.addStep = async (req, res, next) => {
  try {
    const project = await requireOwnedProject(req.params.id, res);
    if (!project) return undefined;

    const data = parse(stepSchema, req, res);
    if (!data) return undefined;

    let image;
    if (req.file) {
      try {
        image = await storeImage(req.file, 'steps');
      } catch (err) {
        return res.status(400).json({ errors: uploadErrors(err) });
      }
    }

    // La position est calculée dans la même transaction que l'insertion :
    // deux ajouts simultanés ne peuvent pas obtenir le même rang, et la
    // contrainte @@unique([projectId, position]) refuserait de toute façon.
    const step = await prisma.$transaction(async (tx) => {
      const last = await tx.step.findFirst({
        where: { projectId: project.id },
        orderBy: { position: 'desc' },
        select: { position: true },
      });

      return tx.step.create({
        data: {
          ...data,
          image,
          projectId: project.id,
          position: (last?.position ?? 0) + 1,
        },
        select: stepSelect,
      });
    });

    return res.status(201).json(step);
  } catch (err) {
    return next(err);
  }
};

exports.updateStep = async (req, res, next) => {
  try {
    const project = await requireOwnedProject(req.params.id, res);
    if (!project) return undefined;

    const data = parse(stepSchema, req, res);
    if (!data) return undefined;

    const step = await prisma.step.findUnique({
      where: { id: req.params.stepId },
      select: { id: true, projectId: true },
    });

    // Une étape appartenant à un autre projet ne doit pas être modifiable
    // en passant par l'identifiant d'un projet que l'on possède.
    if (!step || step.projectId !== project.id) {
      return res.status(404).json({ message: 'Étape introuvable.' });
    }

    let image;
    if (req.file) {
      try {
        image = await storeImage(req.file, 'steps');
      } catch (err) {
        return res.status(400).json({ errors: uploadErrors(err) });
      }
    }

    const updated = await prisma.step.update({
      where: { id: step.id },
      data: { ...data, ...(image ? { image } : {}) },
      select: stepSelect,
    });

    return res.status(200).json(updated);
  } catch (err) {
    return next(err);
  }
};

exports.deleteStep = async (req, res, next) => {
  try {
    const project = await requireOwnedProject(req.params.id, res);
    if (!project) return undefined;

    const step = await prisma.step.findUnique({
      where: { id: req.params.stepId },
      select: { id: true, projectId: true, position: true },
    });

    if (!step || step.projectId !== project.id) {
      return res.status(404).json({ message: 'Étape introuvable.' });
    }

    // Suppression et recompactage dans la même transaction : sans cela, une
    // lecture intercalée verrait un trou dans la numérotation des étapes.
    await prisma.$transaction([
      prisma.step.delete({ where: { id: step.id } }),
      prisma.step.updateMany({
        where: { projectId: project.id, position: { gt: step.position } },
        data: { position: { decrement: 1 } },
      }),
    ]);

    return res.status(200).json({ message: 'Étape supprimée.' });
  } catch (err) {
    return next(err);
  }
};

/**
 * Déplacement d'une étape dans le carnet.
 *
 * Le point délicat : deux étapes ne peuvent pas partager un rang, mais tout
 * décalage traverse un état où c'est momentanément le cas. PostgreSQL vérifie
 * les index uniques ligne par ligne, si bien qu'un UPDATE en masse échoue dès
 * la première ligne réécrite.
 *
 * Plutôt que de compenser dans le code (positions négatives temporaires,
 * écritures ordonnées une à une), la contrainte est déclarée DEFERRABLE et
 * cette transaction demande sa vérification au COMMIT. L'invariant reste
 * garanti pour tout lecteur : aucune transaction ne valide un état comportant
 * deux rangs identiques. Voir la migration 20260729000001.
 */
exports.reorderStep = async (req, res, next) => {
  const target = Number.parseInt(req.body.position, 10);

  if (!Number.isInteger(target) || target < 1) {
    return res.status(400).json({ message: 'Position invalide.' });
  }

  try {
    const project = await requireOwnedProject(req.params.id, res);
    if (!project) return undefined;

    const steps = await prisma.$transaction(async (tx) => {
      const step = await tx.step.findUnique({
        where: { id: req.params.stepId },
        select: { id: true, projectId: true, position: true },
      });

      if (!step || step.projectId !== project.id) return null;

      const total = await tx.step.count({ where: { projectId: project.id } });
      const destination = Math.min(target, total);

      if (destination !== step.position) {
        // Vérification repoussée à la fin de la transaction, uniquement ici.
        await tx.$executeRawUnsafe(
          'SET CONSTRAINTS "Step_projectId_position_key" DEFERRED'
        );

        if (destination < step.position) {
          await tx.step.updateMany({
            where: {
              projectId: project.id,
              position: { gte: destination, lt: step.position },
            },
            data: { position: { increment: 1 } },
          });
        } else {
          await tx.step.updateMany({
            where: {
              projectId: project.id,
              position: { gt: step.position, lte: destination },
            },
            data: { position: { decrement: 1 } },
          });
        }

        await tx.step.update({ where: { id: step.id }, data: { position: destination } });
      }

      return tx.step.findMany({
        where: { projectId: project.id },
        orderBy: { position: 'asc' },
        select: stepSelect,
      });
    });

    if (!steps) return res.status(404).json({ message: 'Étape introuvable.' });

    return res.status(200).json(steps);
  } catch (err) {
    return next(err);
  }
};
