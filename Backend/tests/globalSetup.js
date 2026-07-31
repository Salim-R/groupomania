const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const EmbeddedPostgresModule = require('embedded-postgres');

const EmbeddedPostgres = EmbeddedPostgresModule.default || EmbeddedPostgresModule;

const PORT = 55433;
const DATABASE = 'etabli_test';
const DATA_DIR = path.join(os.tmpdir(), 'etabli-postgres-tests');

/**
 * Démarre un vrai PostgreSQL jetable pour la durée de la suite.
 *
 * Ni Docker ni installation locale ne sont requis : le paquet embarque le
 * binaire du serveur, à la manière de mongodb-memory-server qu'utilisait la
 * version précédente. Les tests s'exécutent donc sur le même moteur qu'en
 * production, et non sur une imitation dont le comportement diverge
 * précisément là où ça compte : contraintes d'unicité, cascades, transactions.
 */
module.exports = async () => {
  // Une exécution interrompue laisse le répertoire de données en place, et
  // initdb refuse alors de démarrer. On repart systématiquement d'un état
  // vierge : les tests ne doivent hériter d'aucune donnée antérieure.
  await fs.promises.rm(DATA_DIR, { recursive: true, force: true });

  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: 'postgres',
    password: 'postgres',
    port: PORT,
    persistent: false,
    onLog: () => {},
    onError: () => {},
  });

  await pg.initialise();
  await pg.start();

  try {
    await pg.createDatabase(DATABASE);
  } catch {
    // La base survit parfois à une interruption brutale de la suite précédente.
  }

  const url = `postgresql://postgres:postgres@localhost:${PORT}/${DATABASE}`;
  process.env.DATABASE_URL = url;
  process.env.TOKEN_SECRET = process.env.TOKEN_SECRET || 'secret-de-test-non-utilise-en-production';

  // Les migrations versionnées sont appliquées, et non un `db push` : c'est la
  // seule façon de tester le schéma réel, contrainte différable comprise, que
  // `db push` reconstruirait en index unique ordinaire.
  //
  // Le binaire est invoqué par son point d'entrée JavaScript plutôt que via
  // npx : depuis Node 20, Windows refuse de lancer un `.cmd` par execFile sans
  // shell, et passer par un shell rendrait la commande sensible à
  // l'échappement des chemins.
  execFileSync(
    process.execPath,
    [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
    { cwd: path.join(__dirname, '..'), env: { ...process.env, DATABASE_URL: url }, stdio: 'ignore' }
  );

  globalThis.__EMBEDDED_PG__ = pg;
};

module.exports.PORT = PORT;
module.exports.DATABASE = DATABASE;
