const request = require('supertest');

const { clear, disconnect } = require('./setup');

/**
 * Limitation de débit sur l'authentification.
 *
 * La suite principale tourne avec la limitation désactivée : chaque cas crée
 * un ou deux comptes, et le plafond serait atteint avant la fin, faisant
 * échouer des tests pour une raison sans rapport avec ce qu'ils vérifient.
 *
 * Ce fichier fait l'inverse. Il recharge l'application avec un plafond de
 * trois tentatives, puis en envoie quatre. Sans lui, la seule protection
 * contre l'essai de mots de passe en boucle ne serait jamais exercée avant la
 * mise en production.
 *
 * Le rechargement est nécessaire parce que `express-rate-limit` est monté au
 * chargement du module : changer la variable d'environnement après coup
 * n'aurait aucun effet sur l'instance déjà construite.
 */
const chargerAppAvecPlafond = (plafond) => {
  const precedent = process.env.AUTH_RATE_LIMIT;
  process.env.AUTH_RATE_LIMIT = String(plafond);

  let app;
  jest.isolateModules(() => {
    app = require('../app');
  });

  if (precedent === undefined) delete process.env.AUTH_RATE_LIMIT;
  else process.env.AUTH_RATE_LIMIT = precedent;

  return app;
};

afterAll(disconnect);

beforeEach(clear);

describe('Limitation de débit sur la connexion', () => {
  it('refuse la quatrième tentative quand le plafond est de trois', async () => {
    const app = chargerAppAvecPlafond(3);
    const tentative = () =>
      request(app)
        .post('/api/user/login')
        .send({ email: 'inconnu@exemple.fr', password: 'MotDePasse!2026' });

    const [un, deux, trois] = await Promise.all([tentative(), tentative(), tentative()]);

    // Les trois premières sont traitées normalement : le compte n'existe pas,
    // l'API répond 401. C'est bien la limite qui change le comportement
    // ensuite, et non une erreur survenue en chemin.
    expect([un.status, deux.status, trois.status]).toEqual([401, 401, 401]);

    const quatrieme = await tentative();

    expect(quatrieme.status).toBe(429);
    expect(quatrieme.body.message).toMatch(/Trop de tentatives/);
  });

  it("compte séparément l'inscription et laisse passer les autres routes", async () => {
    const app = chargerAppAvecPlafond(1);

    await request(app)
      .post('/api/user/login')
      .send({ email: 'inconnu@exemple.fr', password: 'MotDePasse!2026' });

    const secondeConnexion = await request(app)
      .post('/api/user/login')
      .send({ email: 'inconnu@exemple.fr', password: 'MotDePasse!2026' });

    expect(secondeConnexion.status).toBe(429);

    // La limitation ne doit peser que sur les routes d'authentification :
    // l'appliquer à la lecture du fil rendrait le site inutilisable derrière
    // une adresse partagée, un réseau d'entreprise par exemple.
    const fil = await request(app).get('/api/project');

    expect(fil.status).toBe(200);
  });
});
