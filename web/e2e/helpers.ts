import { expect, type Page } from '@playwright/test';

/**
 * Chaque exécution crée ses propres comptes.
 *
 * Réutiliser des identifiants fixes rendrait la suite dépendante de l'état
 * laissé par l'exécution précédente : le premier passage réussirait, les
 * suivants échoueraient sur un pseudo déjà pris. Un suffixe aléatoire rend
 * chaque exécution indépendante, sans nettoyage préalable de la base.
 */
export function nouvelAtelier(prefixe: string) {
  const suffixe = Math.random().toString(36).slice(2, 9);

  return {
    pseudo: `${prefixe}-${suffixe}`,
    email: `${prefixe}-${suffixe}@exemple-test.fr`,
    motDePasse: 'motdepasse-de-test-2026',
  };
}

export type Atelier = ReturnType<typeof nouvelAtelier>;

/** Inscrit un atelier et laisse la page sur le fil, session ouverte. */
export async function sInscrire(page: Page, atelier: Atelier) {
  await page.goto('/inscription');

  await page.getByLabel("Nom d'atelier").fill(atelier.pseudo);
  await page.getByLabel('Adresse électronique').fill(atelier.email);
  await page.getByLabel('Mot de passe').fill(atelier.motDePasse);
  await page.getByRole('button', { name: 'Ouvrir mon atelier' }).click();

  // L'inscription enchaîne la connexion : le nom d'atelier apparaît dans
  // l'en-tête dès que la session est ouverte.
  await expect(page.getByRole('link', { name: atelier.pseudo })).toBeVisible();
}

export async function seConnecter(page: Page, atelier: Atelier) {
  await page.goto('/connexion');

  await page.getByLabel('Adresse électronique').fill(atelier.email);
  await page.getByLabel('Mot de passe').fill(atelier.motDePasse);
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await expect(page.getByRole('link', { name: atelier.pseudo })).toBeVisible();
}

/** Ouvre un carnet et renvoie son adresse. */
export async function ouvrirCarnet(page: Page, titre: string, resume = 'Carnet de test') {
  await page.goto('/carnets/nouveau');

  await page.getByLabel('Nom du projet').fill(titre);
  await page.getByLabel('En deux phrases').fill(resume);
  await page.getByRole('button', { name: 'Publier le projet' }).click();

  await expect(page.getByRole('heading', { level: 1, name: titre })).toBeVisible();

  return page.url();
}

/** Ajoute une étape au carnet actuellement affiché. */
export async function ajouterEtape(page: Page, titre: string, corps?: string) {
  await page.getByLabel("Titre de l'étape").fill(titre);
  if (corps) await page.getByLabel('Ce que vous avez fait').fill(corps);

  await page.getByRole('button', { name: "Ajouter l'étape" }).click();

  // Le déroulé public est la source de vérité : on attend que l'étape y soit,
  // pas seulement dans le panneau de gestion.
  await expect(
    page.getByRole('heading', { level: 3, name: titre })
  ).toBeVisible();
}
