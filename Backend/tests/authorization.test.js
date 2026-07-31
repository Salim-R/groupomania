const request = require('supertest');

const app = require('../app');
const { clear, disconnect, prisma } = require('./setup');
const { createUser, createProject, addComment } = require('./helpers');

/**
 * Tests d'attaque.
 *
 * Chaque bloc rejoue une faille relevée dans AUDIT.md et vérifie qu'elle est
 * refermée. Ce ne sont pas des tests unitaires : ils décrivent ce qu'un
 * utilisateur malveillant tentait de faire, et prouvent que l'API le refuse.
 *
 * Ces mêmes tests ont validé la migration de MongoDB vers PostgreSQL sans
 * régression : ils passent par HTTP et ignorent tout du moteur de stockage.
 *
 * Convention : Alice est l'attaquante, Bob est la victime.
 */

let alice;
let bob;

afterAll(disconnect);

beforeEach(async () => {
  await clear();
  alice = await createUser({ pseudo: 'alice', email: 'alice@exemple.fr' });
  bob = await createUser({ pseudo: 'bob', email: 'bob@exemple.fr' });
});

describe('Audit 1.1 - les routes mutantes exigent une session', () => {
  it("refuse la suppression d'un compte sans authentification", async () => {
    const response = await request(app).delete(`/api/user/${bob.id}`);

    expect(response.status).toBe(401);
    expect(await prisma.user.findUnique({ where: { id: bob.id } })).not.toBeNull();
  });

  it("refuse l'ouverture d'un projet sans authentification", async () => {
    const response = await request(app).post('/api/project').send({ title: 'Projet pirate' });

    expect(response.status).toBe(401);
  });

  it('laisse les carnets consultables sans compte', async () => {
    const response = await request(app).get('/api/project');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
  });
});

describe('Audit 1.2 - requireAuth répond au lieu de rester muet', () => {
  it('répond 401 en absence de jeton plutôt que de laisser la requête pendante', async () => {
    const response = await request(app).put(`/api/user/${bob.id}`).send({ bio: 'test' });

    expect(response.status).toBe(401);
  });

  it('rejette un jeton syntaxiquement invalide sans erreur serveur', async () => {
    const response = await request(app)
      .put(`/api/user/${bob.id}`)
      .set('Cookie', ['jwt=jeton-invente'])
      .send({ bio: 'test' });

    expect(response.status).toBe(401);
  });

  it("rejette un jeton valide dont le compte n'existe plus", async () => {
    await prisma.user.delete({ where: { id: alice.id } });

    const response = await request(app)
      .post('/api/project')
      .set('Cookie', alice.cookie)
      .send({ title: 'Compte supprimé' });

    expect(response.status).toBe(401);
  });
});

describe('Audit 1.3 - propriété des projets', () => {
  it('empêche Alice de modifier le projet de Bob', async () => {
    const project = await createProject(bob.cookie, 'Buffet de Bob');

    const response = await request(app)
      .put(`/api/project/${project.id}`)
      .set('Cookie', alice.cookie)
      .send({ title: 'Titre remplacé par Alice' });

    expect(response.status).toBe(403);
  });

  it('empêche Alice de supprimer le projet de Bob', async () => {
    const project = await createProject(bob.cookie, 'Buffet de Bob');

    const response = await request(app)
      .delete(`/api/project/${project.id}`)
      .set('Cookie', alice.cookie);

    expect(response.status).toBe(403);
    expect(await prisma.project.findUnique({ where: { id: project.id } })).not.toBeNull();
  });

  it('autorise Bob à modifier son propre projet', async () => {
    const project = await createProject(bob.cookie, 'Version initiale');

    const response = await request(app)
      .put(`/api/project/${project.id}`)
      .set('Cookie', bob.cookie)
      .send({ title: 'Version corrigée' });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Version corrigée');
  });

  it("renvoie 404 sur un identifiant inconnu au lieu d'une erreur serveur", async () => {
    const response = await request(app)
      .delete('/api/project/identifiant-inexistant')
      .set('Cookie', alice.cookie);

    expect(response.status).toBe(404);
  });
});

describe("Audit 1.4 - l'auteur d'un projet vient du jeton", () => {
  it('ignore un authorId forgé dans le corps de la requête', async () => {
    const response = await request(app)
      .post('/api/project')
      .set('Cookie', alice.cookie)
      .send({ title: 'Publié au nom de Bob', authorId: bob.id });

    expect(response.status).toBe(201);
    expect(response.body.author.id).toBe(alice.id);
  });
});

describe('Audit 1.5 - les mentions « j\'aime » sont attribuées à leur auteur réel', () => {
  it("ignore l'identifiant transmis dans le corps", async () => {
    const project = await createProject(bob.cookie);

    const response = await request(app)
      .put(`/api/project/${project.id}/like`)
      .set('Cookie', alice.cookie)
      .send({ id: bob.id });

    expect(response.status).toBe(200);

    const likes = await prisma.like.findMany({ where: { projectId: project.id } });
    expect(likes).toHaveLength(1);
    expect(likes[0].userId).toBe(alice.id);
  });

  it("n'émet qu'une seule réponse", async () => {
    const project = await createProject(bob.cookie);

    const response = await request(app)
      .put(`/api/project/${project.id}/like`)
      .set('Cookie', alice.cookie)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.likes).toBe(1);
  });
});

describe("Audit 1.6 - impossible de commenter sous l'identité d'un autre", () => {
  it('ignore authorId et pseudo envoyés par le client', async () => {
    const project = await createProject(bob.cookie);

    const response = await request(app)
      .post(`/api/project/${project.id}/comments`)
      .set('Cookie', alice.cookie)
      .send({
        text: 'Commentaire attribué à Bob',
        authorId: bob.id,
        commenterPseudo: 'bob',
      });

    expect(response.status).toBe(201);
    expect(response.body.author.id).toBe(alice.id);
    expect(response.body.author.pseudo).toBe('alice');
  });

  it('refuse un commentaire vide', async () => {
    const project = await createProject(bob.cookie);

    const response = await request(app)
      .post(`/api/project/${project.id}/comments`)
      .set('Cookie', alice.cookie)
      .send({ text: '   ' });

    expect(response.status).toBe(400);
  });
});

describe('Audit 1.7 - propriété des commentaires', () => {
  it('empêche Alice de modifier le commentaire de Bob', async () => {
    const project = await createProject(alice.cookie);
    const comment = await addComment(bob.cookie, project.id, 'Commentaire de Bob');

    const response = await request(app)
      .put(`/api/project/${project.id}/comments/${comment.id}`)
      .set('Cookie', alice.cookie)
      .send({ text: 'Propos réécrits' });

    expect(response.status).toBe(403);
  });

  it('empêche Alice de supprimer le commentaire de Bob sur un projet tiers', async () => {
    const project = await createProject(bob.cookie);
    const comment = await addComment(bob.cookie, project.id, 'Commentaire de Bob');

    const response = await request(app)
      .delete(`/api/project/${project.id}/comments/${comment.id}`)
      .set('Cookie', alice.cookie);

    expect(response.status).toBe(403);
  });

  it("autorise l'auteur du projet à retirer un commentaire indésirable", async () => {
    const project = await createProject(alice.cookie);
    const comment = await addComment(bob.cookie, project.id, 'Commentaire indésirable');

    const response = await request(app)
      .delete(`/api/project/${project.id}/comments/${comment.id}`)
      .set('Cookie', alice.cookie);

    expect(response.status).toBe(200);
    expect(await prisma.comment.count({ where: { projectId: project.id } })).toBe(0);
  });
});

describe('Audit 1.8 - propriété du compte', () => {
  it('empêche Alice de modifier le profil de Bob', async () => {
    const response = await request(app)
      .put(`/api/user/${bob.id}`)
      .set('Cookie', alice.cookie)
      .send({ bio: 'Biographie imposée' });

    expect(response.status).toBe(403);

    const unchanged = await prisma.user.findUnique({ where: { id: bob.id } });
    expect(unchanged.bio).toBe('');
  });

  it('empêche Alice de supprimer le compte de Bob', async () => {
    const response = await request(app)
      .delete(`/api/user/${bob.id}`)
      .set('Cookie', alice.cookie);

    expect(response.status).toBe(403);
    expect(await prisma.user.findUnique({ where: { id: bob.id } })).not.toBeNull();
  });
});

describe('Audit 1.9 - les abonnements ne sont pas forçables', () => {
  it("interdit de faire suivre un compte tiers à la place de son propriétaire", async () => {
    // Alice appelle la route en visant Bob : c'est Alice qui suit Bob,
    // et non l'inverse comme le permettait la version précédente.
    const response = await request(app)
      .put(`/api/user/${bob.id}/follow`)
      .set('Cookie', alice.cookie)
      .send({ followerId: bob.id });

    expect(response.status).toBe(200);

    const follows = await prisma.follow.findMany();
    expect(follows).toHaveLength(1);
    expect(follows[0].followerId).toBe(alice.id);
    expect(follows[0].followingId).toBe(bob.id);
  });

  it('refuse de se suivre soi-même', async () => {
    const response = await request(app)
      .put(`/api/user/${alice.id}/follow`)
      .set('Cookie', alice.cookie)
      .send({});

    expect(response.status).toBe(400);
  });
});

describe('Audit 2.1 - le nom des fichiers déposés est généré par le serveur', () => {
  it("n'accepte pas un chemin fourni par le client", async () => {
    const response = await request(app)
      .post('/api/user/me/picture')
      .set('Cookie', alice.cookie)
      .field('name', '../../../evasion')
      .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xdb]), {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(200);
    // Nom aléatoire, dossier imposé : aucune trace de la valeur transmise.
    expect(response.body.picture).toMatch(/^uploads\/profils\/[0-9a-f-]{36}\.jpg$/);
    expect(response.body.picture).not.toContain('evasion');
  });

  it('rejette un type de fichier non autorisé', async () => {
    const response = await request(app)
      .post('/api/user/me/picture')
      .set('Cookie', alice.cookie)
      .attach('file', Buffer.from('#!/bin/sh\necho bonjour'), {
        filename: 'script.sh',
        contentType: 'application/x-sh',
      });

    expect(response.status).toBe(400);
  });
});

describe('Audit 2.4 - plus de comptes fantômes', () => {
  it("ne crée aucun utilisateur lorsque l'identifiant visé n'existe pas", async () => {
    const before = await prisma.user.count();

    const response = await request(app)
      .put('/api/user/identifiant-inexistant')
      .set('Cookie', alice.cookie)
      .send({ bio: 'Compte fantôme' });

    // L'appelant n'est pas propriétaire de cet identifiant : refus avant tout accès.
    expect(response.status).toBe(403);
    expect(await prisma.user.count()).toBe(before);
  });
});
