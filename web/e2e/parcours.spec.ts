import { expect, test } from '@playwright/test';

import { ajouterEtape, nouvelAtelier, ouvrirCarnet, sInscrire, seConnecter } from './helpers';

test.describe("Parcours d'un atelier", () => {
  test('inscription, ouverture de carnet, étapes et réordonnancement', async ({ page }) => {
    const atelier = nouvelAtelier('ebeniste');

    await sInscrire(page, atelier);
    await ouvrirCarnet(page, 'Coffre à outils en frêne', 'Assemblage à queues d’aronde.');

    await ajouterEtape(page, 'Débit des planches', 'Frêne de récupération, séché deux ans.');
    await ajouterEtape(page, 'Queues d’aronde', 'Traçage puis coupe à la scie à dos.');
    await ajouterEtape(page, 'Finition', 'Huile de lin, deux couches.');

    const deroule = page.getByRole('list').filter({ hasText: 'Débit des planches' }).first();
    await expect(deroule.getByRole('heading', { level: 3 })).toHaveText([
      'Débit des planches',
      'Queues d’aronde',
      'Finition',
    ]);

    // Le réordonnancement met à l'épreuve la contrainte différée côté base :
    // décaler une étape traverse un état où deux rangs coïncident.
    await page.getByRole('button', { name: /Remonter l'étape « Finition »/ }).click();

    await expect(deroule.getByRole('heading', { level: 3 })).toHaveText([
      'Débit des planches',
      'Finition',
      'Queues d’aronde',
    ]);

    await page.getByRole('button', { name: /Supprimer l'étape « Finition »/ }).click();

    await expect(deroule.getByRole('heading', { level: 3 })).toHaveText([
      'Débit des planches',
      'Queues d’aronde',
    ]);
  });

  test('une page protégée redirige puis ramène à la destination demandée', async ({ page }) => {
    await page.goto('/carnets/nouveau');

    await expect(page).toHaveURL(/\/connexion\?suite=%2Fcarnets%2Fnouveau/);

    const atelier = nouvelAtelier('potier');
    await sInscrire(page, atelier);

    // La destination initiale est mémorisée dans l'URL de connexion, et
    // l'inscription y ramène.
    await page.goto('/carnets/nouveau');
    await expect(page.getByRole('heading', { level: 1, name: 'Ouvrir un carnet' })).toBeVisible();
  });

  test('la session survit à un rechargement et se ferme à la déconnexion', async ({ page }) => {
    const atelier = nouvelAtelier('luthier');

    await sInscrire(page, atelier);
    await page.reload();
    await expect(page.getByRole('link', { name: atelier.pseudo })).toBeVisible();

    await page.getByRole('button', { name: 'Se déconnecter' }).click();

    await expect(page.getByRole('link', { name: 'Se connecter' })).toBeVisible();
    await expect(page.getByRole('link', { name: atelier.pseudo })).toBeHidden();

    // Reconnexion : le compte existe toujours après déconnexion.
    await seConnecter(page, atelier);
  });

  test('les identifiants erronés ne révèlent pas si le compte existe', async ({ page }) => {
    const atelier = nouvelAtelier('forgeron');
    await sInscrire(page, atelier);
    await page.getByRole('button', { name: 'Se déconnecter' }).click();

    await page.goto('/connexion');
    await page.getByLabel('Adresse électronique').fill(atelier.email);
    await page.getByLabel('Mot de passe').fill('mauvais-mot-de-passe');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    const messageCompteConnu = await page.getByRole('alert').textContent();

    await page.goto('/connexion');
    await page.getByLabel('Adresse électronique').fill('inconnu@exemple-test.fr');
    await page.getByLabel('Mot de passe').fill('mauvais-mot-de-passe');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    const messageCompteInconnu = await page.getByRole('alert').textContent();

    // Deux messages identiques : sinon la page de connexion devient un
    // annuaire des comptes existants.
    expect(messageCompteConnu).toBe(messageCompteInconnu);
  });
});

test('propose la connexion plutôt qu’un bouton mort au visiteur anonyme', async ({ page }) => {
  await page.goto('/');

  // On vise un lien vers un carnet, et non le premier titre de niveau 2 : la
  // page d'accueil porte aussi des titres de section, et s'appuyer sur leur
  // ordre rendait ce test dépendant de la mise en page plutôt que du parcours
  // qu'il vérifie.
  await page.locator('a[href^="/carnets/"]').first().click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Un visiteur non connecté doit pouvoir atteindre l'invitation au clavier :
  // un bouton désactivé n'est pas focalisable, et l'explication qu'il porterait
  // dans un `title` resterait donc hors de portée.

  const invitation = page.getByRole('link', { name: /Connectez-vous pour apprécier/ });

  await expect(invitation).toBeVisible();
  await invitation.focus();
  await expect(invitation).toBeFocused();

  await invitation.click();
  await expect(page.getByRole('heading', { level: 1, name: /Se connecter/i })).toBeVisible();
});
