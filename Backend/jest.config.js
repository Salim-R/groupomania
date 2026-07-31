module.exports = {
  testEnvironment: 'node',
  // Une seule instance PostgreSQL partagée : les tests s'exécutent en série
  // (--runInBand) pour que le nettoyage entre cas reste déterministe.
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  testTimeout: 60000,
  collectCoverageFrom: ['controllers/**/*.js', 'middleware/**/*.js', 'lib/**/*.js', 'utils/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
};
