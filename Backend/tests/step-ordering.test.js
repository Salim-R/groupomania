const request = require('supertest');

const app = require('../app');
const { clear, disconnect, prisma } = require('./setup');
const { createUser, createProject, addStep } = require('./helpers');

/**
 * Numérotation des étapes.
 *
 * Deux étapes d'un même carnet ne peuvent pas partager un rang, et la
 * numérotation ne doit jamais présenter de trou. Or toute suppression ou tout
 * déplacement au milieu du carnet impose de décaler une plage entière, et
 * PostgreSQL vérifie les index uniques ligne par ligne : un décalage en masse
 * peut heurter une ligne pas encore réécrite.
 *
 * Ces tests forcent le cas : les carnets y sont d'abord réordonnés plusieurs
 * fois, ce qui disperse les lignes dans le fichier de la table et retire au
 * moteur toute raison de les traiter dans l'ordre des rangs.
 */
let atelier;
let carnet;

const positions = (projectId) =>
  prisma.step
    .findMany({ where: { projectId }, orderBy: { position: 'asc' }, select: { position: true } })
    .then((etapes) => etapes.map((e) => e.position));

afterAll(disconnect);

beforeEach(async () => {
  await clear();
  atelier = await createUser({ pseudo: 'margaux', email: 'margaux@exemple.fr' });
  carnet = await createProject(atelier.cookie);
});

describe('Numérotation des étapes', () => {
  it('reste contiguë après la suppression d’une étape du milieu', async () => {
    const etapes = [];
    for (const titre of ['Débit', 'Corroyage', 'Assemblage', 'Ponçage', 'Finition']) {
      etapes.push(await addStep(atelier.cookie, carnet.id, titre));
    }

    const reponse = await request(app)
      .delete(`/api/project/${carnet.id}/steps/${etapes[1].id}`)
      .set('Cookie', atelier.cookie);

    expect(reponse.status).toBe(200);
    expect(await positions(carnet.id)).toEqual([1, 2, 3, 4]);
  });

  it('reste contiguë après une suppression sur un carnet déjà réordonné', async () => {
    const etapes = [];
    for (const titre of ['Débit', 'Corroyage', 'Assemblage', 'Ponçage', 'Finition']) {
      etapes.push(await addStep(atelier.cookie, carnet.id, titre));
    }

    // Chaque déplacement réécrit les lignes concernées, que PostgreSQL range
    // alors en fin de table. L'ordre physique cesse de suivre l'ordre des
    // rangs, ce qui est précisément la situation qu'un décalage en masse
    // rencontre en production après quelques semaines d'usage.
    const deplacer = (stepId, position) =>
      request(app)
        .patch(`/api/project/${carnet.id}/steps/${stepId}/position`)
        .set('Cookie', atelier.cookie)
        .send({ position });

    await deplacer(etapes[4].id, 1);
    await deplacer(etapes[0].id, 5);
    await deplacer(etapes[2].id, 2);

    expect(await positions(carnet.id)).toEqual([1, 2, 3, 4, 5]);

    const milieu = await prisma.step.findFirst({
      where: { projectId: carnet.id, position: 3 },
      select: { id: true },
    });

    const reponse = await request(app)
      .delete(`/api/project/${carnet.id}/steps/${milieu.id}`)
      .set('Cookie', atelier.cookie);

    expect(reponse.status).toBe(200);
    expect(await positions(carnet.id)).toEqual([1, 2, 3, 4]);
  });

  it('reste contiguë après la suppression de la première étape', async () => {
    const etapes = [];
    for (const titre of ['Débit', 'Corroyage', 'Assemblage']) {
      etapes.push(await addStep(atelier.cookie, carnet.id, titre));
    }

    const reponse = await request(app)
      .delete(`/api/project/${carnet.id}/steps/${etapes[0].id}`)
      .set('Cookie', atelier.cookie);

    expect(reponse.status).toBe(200);
    expect(await positions(carnet.id)).toEqual([1, 2]);
  });
});
