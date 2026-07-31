const prisma = require('../lib/prisma');

/**
 * Vide toutes les tables entre deux tests.
 *
 * TRUNCATE ... CASCADE est un ordre unique, bien plus rapide qu'une suite de
 * suppressions, et il remet les séquences à zéro. La liste des tables est lue
 * dans le catalogue plutôt qu'écrite en dur : une table ajoutée au schéma est
 * nettoyée sans qu'on ait à penser à modifier ce fichier.
 */
module.exports.clear = async () => {
  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma%'
  `;

  if (tables.length === 0) return;

  const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
};

module.exports.disconnect = () => prisma.$disconnect();

module.exports.prisma = prisma;
