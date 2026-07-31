const { z } = require('zod');

/**
 * Schémas de validation des entrées.
 *
 * Prisma garantit l'intégrité de ce qui est stocké, pas la forme de ce qui
 * arrive. Sans cette couche, un corps de requête malformé produit une erreur
 * de base de données renvoyée en 500 plutôt qu'un 400 explicite.
 *
 * Ces schémas font autorité : le client pose bien des attributs `maxLength` et
 * `required` sur ses champs, mais ce sont des indications d'interface, que
 * n'importe qui contourne en envoyant la requête directement. Rien n'est admis
 * en base sans être passé par ici.
 *
 * Les deux applications étant déployées séparément, elles ne partagent pas ce
 * fichier. Les bornes sont donc écrites deux fois, et un écart entre les deux
 * se traduit par un champ refusé après envoi plutôt que signalé à la saisie.
 * Les mutualiser demanderait un paquet commun, c'est-à-dire un dépôt outillé
 * pour en publier un.
 */

const trimmed = (schema) => z.preprocess((v) => (typeof v === 'string' ? v.trim() : v), schema);

const pseudo = trimmed(
  z
    .string()
    .min(3, 'Le pseudo doit faire au moins 3 caractères.')
    .max(55, 'Le pseudo ne peut pas dépasser 55 caractères.')
);

const email = trimmed(z.string().email('Adresse électronique invalide.')).transform((v) =>
  v.toLowerCase()
);

const password = z
  .string()
  .min(6, 'Le mot de passe doit faire au moins 6 caractères.')
  .max(200, 'Le mot de passe ne peut pas dépasser 200 caractères.');

module.exports.signUpSchema = z.object({ pseudo, email, password });

module.exports.signInSchema = z.object({
  email: trimmed(z.string().min(1, 'Adresse électronique requise.')).transform((v) =>
    v.toLowerCase()
  ),
  password: z.string().min(1, 'Mot de passe requis.'),
});

module.exports.updateProfileSchema = z.object({
  bio: trimmed(z.string().max(1024, 'La biographie ne peut pas dépasser 1024 caractères.')).optional(),
  craft: trimmed(z.string().max(80)).nullish(),
  city: trimmed(z.string().max(80)).nullish(),
});

module.exports.projectSchema = z.object({
  title: trimmed(
    z.string().min(3, 'Le titre doit faire au moins 3 caractères.').max(120)
  ),
  summary: trimmed(z.string().max(500)).optional(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
});

module.exports.projectUpdateSchema = module.exports.projectSchema.partial();

module.exports.stepSchema = z.object({
  title: trimmed(z.string().min(1, "Le titre de l'étape est requis.").max(120)),
  body: trimmed(z.string().max(2000)).optional(),
});

module.exports.commentSchema = z.object({
  text: trimmed(z.string().min(1, 'Le commentaire est vide.').max(500)),
});

/**
 * Valide un corps de requête et renvoie soit les données typées, soit une
 * réponse 400 détaillant les champs fautifs.
 *
 * Renvoie `null` lorsqu'une réponse a déjà été émise, ce qui permet au
 * contrôleur de sortir immédiatement.
 */
module.exports.parse = (schema, req, res) => {
  const result = schema.safeParse(req.body);

  if (result.success) return result.data;

  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join('.') || '_';
    if (!errors[field]) errors[field] = issue.message;
  }

  res.status(400).json({ errors });
  return null;
};
