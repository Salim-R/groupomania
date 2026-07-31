import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

/**
 * Tests de bout en bout.
 *
 * Les serveurs ne sont pas démarrés par Playwright : l'API et le client
 * tournent déjà pendant le développement, et les relancer à chaque exécution
 * doublerait la durée de la suite. La CI les démarre en amont, dans une étape
 * distincte, ce qui rend aussi les échecs de démarrage lisibles pour eux-mêmes
 * au lieu d'apparaître comme des tests en échec.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,

  // Aucun test .only ne doit passer en intégration continue : il masquerait
  // silencieusement tout le reste de la suite.
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: BASE_URL,
    // Traces et captures conservées uniquement sur échec : c'est au moment du
    // diagnostic qu'elles servent, et les conserver systématiquement remplit
    // le stockage de la CI pour rien.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
