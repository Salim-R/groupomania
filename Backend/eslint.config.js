const js = require('@eslint/js');

/**
 * Configuration à plat, format imposé depuis ESLint 9.
 *
 * L'API est en CommonJS et ne passe par aucun transpilateur : les globales
 * déclarées sont celles de Node, plus celles de Jest dans le seul dossier de
 * tests. Déclarer Jest partout laisserait passer un `describe` oublié dans du
 * code de production.
 */
module.exports = [
  {
    ignores: ['node_modules/**', 'uploads/**', 'coverage/**', '.postgres-dev/**'],
  },

  js.configs.recommended,

  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        console: 'readonly',
        module: 'writable',
        require: 'readonly',
        exports: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        TextEncoder: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        globalThis: 'readonly',
      },
    },
    rules: {
      // Un paramètre inutilisé est parfois imposé par la signature : Express
      // ne reconnaît un gestionnaire d'erreurs qu'à ses quatre arguments, le
      // dernier restant souvent inutile. La règle ne signale donc que ce qui
      // précède le dernier paramètre réellement employé.
      'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  {
    // Le serveur annonce son démarrage et son arrêt sur la sortie standard :
    // c'est ce que lit l'hébergeur, et la seule trace disponible quand le
    // processus refuse de se lier à son port.
    files: ['server.js'],
    rules: { 'no-console': 'off' },
  },

  {
    files: ['tests/**/*.js', 'prisma/seed.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      // Les scripts de démonstration et d'amorçage rendent compte de leur
      // travail sur la sortie standard : c'est leur interface.
      'no-console': 'off',
    },
  },
];
