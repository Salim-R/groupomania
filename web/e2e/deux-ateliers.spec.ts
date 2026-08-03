import { expect, test, type Browser } from '@playwright/test';

import { ajouterEtape, nouvelAtelier, ouvrirCarnet, sInscrire } from './helpers';

/**
 * Deux ateliers, deux sessions simultanées.
 *
 * Chaque contexte de navigateur possède son propre magasin de cookies : les
 * deux sessions coexistent réellement, comme deux personnes devant deux
 * machines. C'est la seule façon de vérifier ce qu'un test à session unique ne
 * peut pas voir : qu'une publication est visible par autrui, qu'un commentaire
 * traverse bien la base, et surtout que les contrôles d'autorisation tiennent
 * quand deux comptes agissent en même temps.
 */
async function ouvrirSession(browser: Browser, prefixe: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const atelier = nouvelAtelier(prefixe);

  await sInscrire(page, atelier);

  return { context, page, atelier };
}

test.describe('Deux ateliers en parallèle', () => {
  test('un carnet publié est visible, commentable et apprécié par un autre atelier', async ({
    browser,
  }) => {
    const alice = await ouvrirSession(browser, 'alice');
    const bob = await ouvrirSession(browser, 'bob');

    try {
      const titre = `Établi de menuisier ${Date.now()}`;

      // Alice publie.
      const adresseCarnet = await ouvrirCarnet(alice.page, titre, 'Hêtre massif, plateau de 60 mm.');
      await ajouterEtape(alice.page, 'Assemblage du piètement', 'Tenons chevillés, sans vis.');

      // Bob découvre le carnet depuis le fil, sans en connaître l'adresse.
      await bob.page.goto('/');
      await bob.page.getByRole('heading', { level: 2, name: titre }).click();

      await expect(bob.page.getByRole('heading', { level: 1, name: titre })).toBeVisible();
      await expect(
        bob.page.getByRole('heading', { level: 3, name: 'Assemblage du piètement' })
      ).toBeVisible();

      // Bob ne peut pas tenir le carnet d'Alice : le panneau de gestion ne lui
      // est pas proposé. L'API le refuserait de toute façon, ce que vérifient
      // les tests d'autorisation côté serveur.
      await expect(bob.page.getByRole('heading', { name: 'Mettre à jour le projet' })).toBeHidden();

      // Bob apprécie et commente.
      await bob.page.getByRole('button', { name: /Marquer comme apprécié/ }).click();
      await expect(bob.page.getByRole('button', { name: /Retirer mon appréciation/ })).toBeVisible();

      await bob.page.getByLabel('Votre retour').fill('Le piètement chevillé, c’est du sérieux.');
      await bob.page.getByRole('button', { name: 'Publier' }).click();

      await expect(bob.page.getByText('Le piètement chevillé, c’est du sérieux.')).toBeVisible();

      // Alice recharge son carnet et retrouve ce que Bob a laissé.
      await alice.page.goto(adresseCarnet);

      await expect(alice.page.getByText('Le piètement chevillé, c’est du sérieux.')).toBeVisible();
      await expect(alice.page.getByText(bob.atelier.pseudo)).toBeVisible();
      await expect(alice.page.getByRole('button', { name: /apprécié 1/ })).toBeVisible();

      // Alice modère : l'auteur du carnet peut retirer un commentaire déposé
      // sur son propre carnet, même s'il n'en est pas l'auteur.
      //
      // `exact` est indispensable : la correspondance par nom accessible se
      // fait par sous-chaîne, si bien qu'un simple « Supprimer » désignerait
      // aussi les boutons « Supprimer l'étape … » du panneau de gestion.
      await alice.page.getByRole('button', { name: 'Supprimer', exact: true }).click();
      await expect(
        alice.page.getByText('Le piètement chevillé, c’est du sérieux.')
      ).toBeHidden();
    } finally {
      await alice.context.close();
      await bob.context.close();
    }
  });

  test("un atelier ne peut pas atteindre la page de gestion d'un carnet tiers", async ({
    browser,
  }) => {
    const alice = await ouvrirSession(browser, 'alice');
    const bob = await ouvrirSession(browser, 'bob');

    try {
      const titre = `Buffet deux corps ${Date.now()}`;
      const adresseCarnet = await ouvrirCarnet(alice.page, titre);

      // Bob se rend directement à l'adresse du carnet d'Alice.
      await bob.page.goto(adresseCarnet);

      await expect(bob.page.getByRole('heading', { level: 1, name: titre })).toBeVisible();
      await expect(bob.page.getByLabel("Titre de l'étape")).toBeHidden();

      // Alice, elle, dispose bien du panneau sur son propre carnet.
      await alice.page.goto(adresseCarnet);
      await expect(alice.page.getByLabel("Titre de l'étape")).toBeVisible();
    } finally {
      await alice.context.close();
      await bob.context.close();
    }
  });
});
