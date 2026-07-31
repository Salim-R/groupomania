const request = require('supertest');

const app = require('../app');
const { clear, disconnect, prisma } = require('./setup');
const { createUser, createProject, addStep, addComment } = require('./helpers');

/**
 * Garanties apportées par le passage au relationnel.
 *
 * Ces tests n'auraient pas pu être écrits sur le modèle document précédent :
 * ils vérifient des invariants tenus par la base elle-même, et non par du code
 * applicatif qu'une écriture concurrente ou un oubli peut contourner.
 */

let artisan;
let visiteur;

afterAll(disconnect);

beforeEach(async () => {
  await clear();
  artisan = await createUser({ pseudo: 'ebeniste', email: 'atelier@exemple.fr' });
  visiteur = await createUser({ pseudo: 'visiteur', email: 'visiteur@exemple.fr' });
});

describe('Clé primaire composite sur les mentions « j\'aime »', () => {
  it('ne compte qu\'une seule fois un double vote', async () => {
    const project = await createProject(artisan.cookie);

    await request(app).put(`/api/project/${project.id}/like`).set('Cookie', visiteur.cookie);
    const second = await request(app)
      .put(`/api/project/${project.id}/like`)
      .set('Cookie', visiteur.cookie);

    expect(second.status).toBe(200);
    expect(second.body.likes).toBe(1);
    expect(await prisma.like.count({ where: { projectId: project.id } })).toBe(1);
  });

  it('refuse le doublon au niveau de la base, pas seulement du code', async () => {
    const project = await createProject(artisan.cookie);

    await prisma.like.create({ data: { userId: visiteur.id, projectId: project.id } });

    await expect(
      prisma.like.create({ data: { userId: visiteur.id, projectId: project.id } })
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('permet de retirer son vote sans toucher à celui des autres', async () => {
    const project = await createProject(artisan.cookie);

    await request(app).put(`/api/project/${project.id}/like`).set('Cookie', visiteur.cookie);
    await request(app).put(`/api/project/${project.id}/like`).set('Cookie', artisan.cookie);

    const response = await request(app)
      .delete(`/api/project/${project.id}/like`)
      .set('Cookie', visiteur.cookie);

    expect(response.body.likes).toBe(1);
    expect(response.body.likedByMe).toBe(false);
  });
});

describe('Suppression en cascade', () => {
  it('emporte projets, étapes, commentaires et votes avec le compte', async () => {
    const project = await createProject(artisan.cookie);
    await addStep(artisan.cookie, project.id, 'Débit des planches');
    await addComment(visiteur.cookie, project.id, 'Beau travail');
    await request(app).put(`/api/project/${project.id}/like`).set('Cookie', visiteur.cookie);

    await request(app).delete(`/api/user/${artisan.id}`).set('Cookie', artisan.cookie);

    // Aucun nettoyage applicatif : la contrainte est déclarée au schéma.
    expect(await prisma.project.count()).toBe(0);
    expect(await prisma.step.count()).toBe(0);
    expect(await prisma.comment.count()).toBe(0);
    expect(await prisma.like.count()).toBe(0);
  });

  it('ne laisse aucun commentaire orphelin après suppression du projet', async () => {
    const project = await createProject(artisan.cookie);
    await addComment(visiteur.cookie, project.id, 'Un avis');

    await request(app).delete(`/api/project/${project.id}`).set('Cookie', artisan.cookie);

    expect(await prisma.comment.count()).toBe(0);
    // Le commentateur, lui, existe toujours.
    expect(await prisma.user.findUnique({ where: { id: visiteur.id } })).not.toBeNull();
  });
});

describe('Numérotation des étapes du carnet', () => {
  it('attribue des rangs successifs', async () => {
    const project = await createProject(artisan.cookie);

    const first = await addStep(artisan.cookie, project.id, 'Débit');
    const second = await addStep(artisan.cookie, project.id, 'Assemblage');
    const third = await addStep(artisan.cookie, project.id, 'Finition');

    expect([first.position, second.position, third.position]).toEqual([1, 2, 3]);
  });

  it('interdit deux étapes au même rang dans un même projet', async () => {
    const project = await createProject(artisan.cookie);
    await addStep(artisan.cookie, project.id, 'Débit');

    await expect(
      prisma.step.create({ data: { projectId: project.id, position: 1, title: 'Doublon' } })
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('autorise le même rang dans deux projets distincts', async () => {
    const premier = await createProject(artisan.cookie, 'Table');
    const second = await createProject(artisan.cookie, 'Buffet');

    const a = await addStep(artisan.cookie, premier.id, 'Débit');
    const b = await addStep(artisan.cookie, second.id, 'Débit');

    expect(a.position).toBe(1);
    expect(b.position).toBe(1);
  });

  it('recompacte la numérotation après une suppression', async () => {
    const project = await createProject(artisan.cookie);
    await addStep(artisan.cookie, project.id, 'Débit');
    const milieu = await addStep(artisan.cookie, project.id, 'Assemblage');
    await addStep(artisan.cookie, project.id, 'Finition');

    await request(app)
      .delete(`/api/project/${project.id}/steps/${milieu.id}`)
      .set('Cookie', artisan.cookie);

    const steps = await prisma.step.findMany({
      where: { projectId: project.id },
      orderBy: { position: 'asc' },
    });

    // Pas de trou dans la numérotation : 1, 2 et non 1, 3.
    expect(steps.map((s) => s.position)).toEqual([1, 2]);
    expect(steps.map((s) => s.title)).toEqual(['Débit', 'Finition']);
  });
});

describe("Réordonnancement d'une étape", () => {
  const titles = async (projectId) => {
    const steps = await prisma.step.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    });
    return steps.map((s) => s.title);
  };

  it('remonte une étape sans violer la contrainte d\'unicité', async () => {
    const project = await createProject(artisan.cookie);
    await addStep(artisan.cookie, project.id, 'Débit');
    await addStep(artisan.cookie, project.id, 'Assemblage');
    const finition = await addStep(artisan.cookie, project.id, 'Finition');

    const response = await request(app)
      .patch(`/api/project/${project.id}/steps/${finition.id}/position`)
      .set('Cookie', artisan.cookie)
      .send({ position: 1 });

    expect(response.status).toBe(200);
    expect(await titles(project.id)).toEqual(['Finition', 'Débit', 'Assemblage']);
  });

  it('descend une étape', async () => {
    const project = await createProject(artisan.cookie);
    const debit = await addStep(artisan.cookie, project.id, 'Débit');
    await addStep(artisan.cookie, project.id, 'Assemblage');
    await addStep(artisan.cookie, project.id, 'Finition');

    await request(app)
      .patch(`/api/project/${project.id}/steps/${debit.id}/position`)
      .set('Cookie', artisan.cookie)
      .send({ position: 3 });

    expect(await titles(project.id)).toEqual(['Assemblage', 'Finition', 'Débit']);
  });

  it('borne une destination hors plage au dernier rang', async () => {
    const project = await createProject(artisan.cookie);
    const debit = await addStep(artisan.cookie, project.id, 'Débit');
    await addStep(artisan.cookie, project.id, 'Assemblage');

    await request(app)
      .patch(`/api/project/${project.id}/steps/${debit.id}/position`)
      .set('Cookie', artisan.cookie)
      .send({ position: 99 });

    expect(await titles(project.id)).toEqual(['Assemblage', 'Débit']);
  });

  it('refuse le réordonnancement par un visiteur', async () => {
    const project = await createProject(artisan.cookie);
    const step = await addStep(artisan.cookie, project.id, 'Débit');

    const response = await request(app)
      .patch(`/api/project/${project.id}/steps/${step.id}/position`)
      .set('Cookie', visiteur.cookie)
      .send({ position: 1 });

    expect(response.status).toBe(403);
  });

  it("refuse d'agir sur une étape appartenant à un autre projet", async () => {
    const premier = await createProject(artisan.cookie, 'Table');
    const second = await createProject(artisan.cookie, 'Buffet');
    const step = await addStep(artisan.cookie, second.id, 'Débit');

    const response = await request(app)
      .delete(`/api/project/${premier.id}/steps/${step.id}`)
      .set('Cookie', artisan.cookie);

    expect(response.status).toBe(404);
  });
});

describe('Fil des carnets', () => {
  it("renvoie l'auteur et les compteurs en une seule requête", async () => {
    const project = await createProject(artisan.cookie);
    await addStep(artisan.cookie, project.id, 'Débit');
    await addComment(visiteur.cookie, project.id, 'Bravo');
    await request(app).put(`/api/project/${project.id}/like`).set('Cookie', visiteur.cookie);

    const response = await request(app).get('/api/project');
    const [card] = response.body.items;

    // Le client n'a plus à résoudre chaque auteur séparément, contrairement au
    // modèle document qui ne renvoyait qu'un identifiant brut.
    expect(card.author.pseudo).toBe('ebeniste');
    expect(card._count).toEqual({ likes: 1, comments: 1, steps: 1 });
  });

  it('pagine par curseur sans doublon ni saut', async () => {
    for (let i = 1; i <= 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await createProject(artisan.cookie, `Projet ${i}`);
    }

    const first = await request(app).get('/api/project?limit=2');
    expect(first.body.items).toHaveLength(2);
    expect(first.body.nextCursor).not.toBeNull();

    const second = await request(app).get(`/api/project?limit=2&cursor=${first.body.nextCursor}`);

    const firstIds = first.body.items.map((p) => p.id);
    const secondIds = second.body.items.map((p) => p.id);

    expect(secondIds).toHaveLength(2);
    expect(firstIds.some((id) => secondIds.includes(id))).toBe(false);
  });

  it('indique au visiteur connecté s\'il a déjà voté', async () => {
    const project = await createProject(artisan.cookie);
    await request(app).put(`/api/project/${project.id}/like`).set('Cookie', visiteur.cookie);

    const response = await request(app)
      .get(`/api/project/${project.id}`)
      .set('Cookie', visiteur.cookie);

    expect(response.body.likedByMe).toBe(true);
  });
});
