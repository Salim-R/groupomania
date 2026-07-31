import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { nouvelAtelier, ouvrirCarnet, sInscrire } from './helpers';

/**
 * Vérifications d'accessibilité.
 *
 * axe-core ne détecte qu'une partie des problèmes réels — de l'ordre de
 * quarante pour cent selon ses propres auteurs. Il attrape en revanche
 * infailliblement les régressions mécaniques : un contraste insuffisant après
 * un changement de palette, un champ dont le label a été détaché, un bouton
 * réduit à une icône sans nom accessible. C'est précisément ce qui se casse
 * sans qu'on s'en aperçoive.
 *
 * Les vérifications qu'axe ne sait pas faire — l'ordre de tabulation, la
 * pertinence d'un intitulé — sont couvertes par les tests au clavier ci-dessous.
 */
async function analyser(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
}

test.describe('Accessibilité', () => {
  test('le fil ne présente aucune violation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const resultats = await analyser(page);
    expect(resultats.violations).toEqual([]);
  });

  test("l'annuaire des artisans ne présente aucune violation", async ({ page }) => {
    await page.goto('/artisans');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const resultats = await analyser(page);
    expect(resultats.violations).toEqual([]);
  });

  test('les formulaires d’authentification ne présentent aucune violation', async ({ page }) => {
    await page.goto('/inscription');

    const resultats = await analyser(page);
    expect(resultats.violations).toEqual([]);
  });

  test('un carnet et son panneau de gestion ne présentent aucune violation', async ({ page }) => {
    await sInscrire(page, nouvelAtelier('verrier'));
    await ouvrirCarnet(page, 'Vitrail de chapelle', 'Verre soufflé, plomb de 6 mm.');

    const resultats = await analyser(page);
    expect(resultats.violations).toEqual([]);
  });
});

test.describe('Navigation au clavier', () => {
  test("le lien d'évitement est le premier élément atteint", async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    const premier = page.locator(':focus');
    await expect(premier).toHaveText(/Aller au contenu/);

    // Il mène bien au contenu principal, il n'est pas seulement décoratif.
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#contenu$/);
  });

  test('le formulaire de connexion se remplit et se soumet sans souris', async ({ page }) => {
    const atelier = nouvelAtelier('mosaiste');
    await sInscrire(page, atelier);
    await page.getByRole('button', { name: 'Se déconnecter' }).click();

    await page.goto('/connexion');

    await page.getByLabel('Adresse électronique').focus();
    await page.keyboard.type(atelier.email);
    await page.keyboard.press('Tab');
    await page.keyboard.type(atelier.motDePasse);
    await page.keyboard.press('Enter');

    await expect(page.getByRole('link', { name: atelier.pseudo })).toBeVisible();
  });

  test('les boutons de réordonnancement portent un intitulé explicite', async ({ page }) => {
    await sInscrire(page, nouvelAtelier('tapissier'));
    await ouvrirCarnet(page, 'Fauteuil crapaud');

    await page.getByLabel("Titre de l'étape").fill('Dégarnissage');
    await page.getByRole('button', { name: "Ajouter l'étape" }).click();
    await expect(page.getByRole('heading', { level: 3, name: 'Dégarnissage' })).toBeVisible();

    // L'intitulé nomme l'action ET la cible : « Descendre » seul serait
    // inutilisable à l'oreille, puisque plusieurs étapes portent le même bouton.
    const remonter = page.getByRole('button', { name: /Remonter l'étape « Dégarnissage »/ });
    await expect(remonter).toBeVisible();
    await expect(remonter).toBeDisabled();
  });
});
