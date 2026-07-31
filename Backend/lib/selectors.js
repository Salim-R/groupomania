/**
 * Projections réutilisables.
 *
 * Prisma renvoie toutes les colonnes par défaut, mot de passe compris. Plutôt
 * que de le retirer après coup à chaque endroit, on déclare une fois ce qui est
 * public : un nouveau champ sensible ajouté au schéma ne fuitera pas parce
 * qu'on aura oublié de le masquer quelque part.
 */

const publicUser = {
  id: true,
  pseudo: true,
  picture: true,
  bio: true,
  craft: true,
  city: true,
  createdAt: true,
};

/** Version enrichie pour les pages de profil. */
const userWithCounts = {
  ...publicUser,
  _count: { select: { projects: true, followers: true, following: true } },
};

/** Auteur affiché à côté d'un projet ou d'un commentaire. */
const authorPreview = {
  id: true,
  pseudo: true,
  picture: true,
  craft: true,
};

/**
 * Projet tel qu'affiché dans le fil : auteur inclus, compteurs agrégés, et
 * première étape en guise d'aperçu. En une requête, là où le modèle document
 * imposait au client d'aller chercher chaque auteur séparément.
 */
const projectCard = {
  id: true,
  title: true,
  summary: true,
  coverImage: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  author: { select: authorPreview },
  _count: { select: { likes: true, comments: true, steps: true } },
};

const projectDetail = {
  ...projectCard,
  steps: {
    orderBy: { position: 'asc' },
    select: {
      id: true,
      position: true,
      title: true,
      body: true,
      image: true,
      createdAt: true,
    },
  },
  comments: {
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      text: true,
      createdAt: true,
      author: { select: authorPreview },
    },
  },
};

module.exports = { publicUser, userWithCounts, authorPreview, projectCard, projectDetail };
