const request = require('supertest');

const app = require('../app');

/**
 * Crée un compte et renvoie son identifiant ainsi que le cookie de session.
 * Le cookie est réinjecté tel quel dans les requêtes suivantes : les tests
 * empruntent donc le même chemin d'authentification que le client réel.
 */
module.exports.createUser = async ({ pseudo, email, password = 'motdepasse123' }) => {
  await request(app).post('/api/user/register').send({ pseudo, email, password });

  const response = await request(app).post('/api/user/login').send({ email, password });

  return {
    id: response.body.user.id,
    cookie: response.headers['set-cookie'],
    pseudo,
  };
};

/** Ouvre un projet au nom de l'utilisateur dont le cookie est fourni. */
module.exports.createProject = async (cookie, title = 'Table en chêne massif') => {
  const response = await request(app)
    .post('/api/project')
    .set('Cookie', cookie)
    .send({ title, summary: 'Carnet de bord du chantier' });

  return response.body;
};

/** Ajoute une étape à un projet et renvoie l'étape créée. */
module.exports.addStep = async (cookie, projectId, title) => {
  const response = await request(app)
    .post(`/api/project/${projectId}/steps`)
    .set('Cookie', cookie)
    .send({ title });

  return response.body;
};

/** Dépose un commentaire et renvoie le commentaire créé. */
module.exports.addComment = async (cookie, projectId, text) => {
  const response = await request(app)
    .post(`/api/project/${projectId}/comments`)
    .set('Cookie', cookie)
    .send({ text });

  return response.body;
};
