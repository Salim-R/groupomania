const { execFileSync } = require('child_process');
const path = require('path');

const EmbeddedPostgresModule = require('embedded-postgres');

const EmbeddedPostgres = EmbeddedPostgresModule.default || EmbeddedPostgresModule;

const PORT = 55432;
const DATABASE = 'etabli';
const DATA_DIR = path.join(__dirname, '..', '.postgres-dev');

/**
 * Base de développement locale.
 *
 * Le binaire PostgreSQL est embarqué : ni installation système ni Docker ne
 * sont nécessaires pour lancer le projet. Les données sont conservées entre
 * deux démarrages, contrairement à l'instance jetable des tests.
 */
async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: 'postgres',
    password: 'postgres',
    port: PORT,
    persistent: true,
  });

  const fs = require('fs');
  const alreadyInitialised = fs.existsSync(path.join(DATA_DIR, 'PG_VERSION'));

  if (!alreadyInitialised) {
    console.log('Initialisation du cluster PostgreSQL…');
    await pg.initialise();
  }

  await pg.start();

  try {
    await pg.createDatabase(DATABASE);
    console.log(`Base « ${DATABASE} » créée.`);
  } catch {
    // Déjà présente : c'est le cas normal après le premier démarrage.
  }

  const url = `postgresql://postgres:postgres@localhost:${PORT}/${DATABASE}`;

  console.log('Application des migrations…');
  execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  });

  console.log(`\nPostgreSQL écoute sur le port ${PORT}.`);
  console.log(`DATABASE_URL=${url}\n`);
  console.log('Laissez ce terminal ouvert. Ctrl+C pour arrêter.');

  const stop = async () => {
    console.log('\nArrêt de PostgreSQL…');
    await pg.stop();
    process.exit(0);
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
