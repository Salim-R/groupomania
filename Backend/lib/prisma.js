const { PrismaClient } = require('@prisma/client');

const { hash, isHashed } = require('./password');

/**
 * Client Prisma partagé.
 *
 * Une extension intercepte les écritures sur User pour hacher le mot de passe.
 * Mongoose offrait la même garantie via un hook `pre('save')` ; Prisma n'a pas
 * de hook de modèle, et confier ce hachage à chaque contrôleur reviendrait à
 * accepter qu'un oubli finisse un jour par écrire un mot de passe en clair.
 *
 * Le garde `isHashed` évite le défaut de la version Mongoose, qui re-hachait
 * un condensat déjà calculé dès qu'on sauvegardait le profil pour une autre
 * raison, rendant la connexion impossible.
 */
const hashIfNeeded = async (data) => {
  if (!data || typeof data.password !== 'string' || isHashed(data.password)) return data;
  return { ...data, password: await hash(data.password) };
};

// En test, les violations de contrainte sont des résultats attendus : les
// journaliser noierait la sortie de la suite sous des erreurs volontaires.
const logLevels = {
  development: ['warn', 'error'],
  test: [],
};

const createClient = () =>
  new PrismaClient({
    log: logLevels[process.env.NODE_ENV] || ['error'],
  }).$extends({
    query: {
      user: {
        async create({ args, query }) {
          return query({ ...args, data: await hashIfNeeded(args.data) });
        },
        async update({ args, query }) {
          return query({ ...args, data: await hashIfNeeded(args.data) });
        },
        async upsert({ args, query }) {
          return query({
            ...args,
            create: await hashIfNeeded(args.create),
            update: await hashIfNeeded(args.update),
          });
        },
      },
    },
  });

// En développement, le rechargement à chaud recrée le module : sans ce cache
// chaque rechargement ouvrirait un nouveau pool de connexions.
const globalForPrisma = globalThis;

const prisma = globalForPrisma.__prisma || createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma;

module.exports = prisma;
