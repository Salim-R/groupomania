const request = require('supertest');
const { decodeJwt } = require('jose');

const app = require('../app');
const { clear, disconnect, prisma } = require('./setup');
const { createUser } = require('./helpers');

const parseCookie = (setCookie) => {
  const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  const attributes = raw.split(';').map((part) => part.trim());

  return {
    value: attributes[0].split('=')[1],
    attributes: attributes.slice(1).map((a) => a.toLowerCase()),
  };
};

afterAll(disconnect);
beforeEach(clear);

describe('Inscription', () => {
  it('crée un compte et renvoie 201', async () => {
    const response = await request(app).post('/api/user/register').send({
      pseudo: 'camille',
      email: 'camille@exemple.fr',
      password: 'motdepasse123',
    });

    expect(response.status).toBe(201);
    expect(response.body.user.pseudo).toBe('camille');
  });

  it('ne renvoie jamais le mot de passe, même haché', async () => {
    const response = await request(app).post('/api/user/register').send({
      pseudo: 'camille',
      email: 'camille@exemple.fr',
      password: 'motdepasse123',
    });

    expect(response.body.user.password).toBeUndefined();
  });

  it('stocke le mot de passe haché, jamais en clair', async () => {
    await request(app).post('/api/user/register').send({
      pseudo: 'camille',
      email: 'camille@exemple.fr',
      password: 'motdepasse123',
    });

    const user = await prisma.user.findUnique({ where: { email: 'camille@exemple.fr' } });

    expect(user.password).not.toBe('motdepasse123');
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });

  it('normalise la casse de l\'adresse électronique', async () => {
    await request(app).post('/api/user/register').send({
      pseudo: 'camille',
      email: '  Camille@Exemple.FR  ',
      password: 'motdepasse123',
    });

    expect(await prisma.user.findUnique({ where: { email: 'camille@exemple.fr' } })).not.toBeNull();
  });

  it('renvoie 409 sur un pseudo déjà pris, pas 200', async () => {
    await createUser({ pseudo: 'camille', email: 'camille@exemple.fr' });

    const duplicate = await request(app).post('/api/user/register').send({
      pseudo: 'camille',
      email: 'autre@exemple.fr',
      password: 'motdepasse123',
    });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.errors.pseudo).toBeDefined();
  });

  it('refuse un mot de passe trop court avec un message exploitable', async () => {
    const response = await request(app).post('/api/user/register').send({
      pseudo: 'camille',
      email: 'camille@exemple.fr',
      password: '123',
    });

    expect(response.status).toBe(400);
    expect(response.body.errors.password).toMatch(/6 caractères/);
  });

  it('refuse une adresse électronique malformée', async () => {
    const response = await request(app).post('/api/user/register').send({
      pseudo: 'camille',
      email: 'pas-une-adresse',
      password: 'motdepasse123',
    });

    expect(response.status).toBe(400);
    expect(response.body.errors.email).toBeDefined();
  });
});

describe('Connexion', () => {
  it('renvoie 401 sur un mot de passe erroné, pas 200', async () => {
    await createUser({ pseudo: 'camille', email: 'camille@exemple.fr' });

    const response = await request(app)
      .post('/api/user/login')
      .send({ email: 'camille@exemple.fr', password: 'mauvais-mot-de-passe' });

    expect(response.status).toBe(401);
  });

  it("ne permet pas de distinguer une adresse inconnue d'un mot de passe erroné", async () => {
    await createUser({ pseudo: 'camille', email: 'camille@exemple.fr' });

    const wrongPassword = await request(app)
      .post('/api/user/login')
      .send({ email: 'camille@exemple.fr', password: 'mauvais' });

    const unknownEmail = await request(app)
      .post('/api/user/login')
      .send({ email: 'inconnu@exemple.fr', password: 'motdepasse123' });

    // Deux réponses identiques : sinon la page de connexion devient un
    // annuaire des comptes existants.
    expect(wrongPassword.status).toBe(unknownEmail.status);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it('ne renvoie jamais le mot de passe sur un profil public', async () => {
    const user = await createUser({ pseudo: 'camille', email: 'camille@exemple.fr' });

    const response = await request(app).get(`/api/user/${user.id}`);

    expect(response.status).toBe(200);
    expect(response.body.password).toBeUndefined();
  });
});

describe('Audit 1.10 et 2.2 - le cookie de session', () => {
  it('est httpOnly : inaccessible au JavaScript de la page', async () => {
    const user = await createUser({ pseudo: 'camille', email: 'camille@exemple.fr' });

    expect(parseCookie(user.cookie).attributes).toContain('httponly');
  });

  it('porte un jeton valable trois jours et non huit ans', async () => {
    const user = await createUser({ pseudo: 'camille', email: 'camille@exemple.fr' });
    const { value } = parseCookie(user.cookie);

    const { iat, exp } = decodeJwt(value);
    const lifetimeDays = (exp - iat) / (24 * 60 * 60);

    // La version précédente passait une durée en millisecondes à `expiresIn`,
    // qui l'interprète en secondes : les jetons vivaient environ 3000 jours.
    expect(lifetimeDays).toBeCloseTo(3, 5);
  });

  /**
   * `secure` et `sameSite` sont les deux attributs que l'audit 2.2 reprochait
   * d'omettre, et ce sont justement les seuls que la suite ne pouvait pas
   * vérifier : leurs valeurs dépendent de NODE_ENV, qui vaut `test` ici.
   *
   * Le module est donc rechargé en se déclarant en production, le temps de
   * lire les options réellement posées. Sans cela, la correction la plus
   * exposée du cookie de session resterait la seule à n'être jamais exercée.
   */
  it('ajoute secure et sameSite une fois en production', () => {
    const precedent = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    let options;
    jest.isolateModules(() => {
      const faussesReponses = [];
      const controleur = require('../controllers/auth.controller');
      // `cookieOptions` n'est pas exporté : on l'observe à travers l'appel que
      // le contrôleur fait à `res.cookie` lors d'une déconnexion, qui réutilise
      // exactement les mêmes options.
      controleur.logout(
        {},
        {
          clearCookie: (nom, opts) => faussesReponses.push(opts),
          status: () => ({ json: () => undefined }),
        }
      );
      options = faussesReponses[0];
    });

    process.env.NODE_ENV = precedent;

    expect(options).toMatchObject({ httpOnly: true, secure: true, sameSite: 'none' });
  });
});

describe('Déconnexion', () => {
  it('confirme par un statut 200 au lieu de rediriger', async () => {
    const response = await request(app).get('/api/user/logout');

    expect(response.status).toBe(200);
  });
});

describe('Session courante', () => {
  it('renvoie le profil de la session sans le mot de passe', async () => {
    const user = await createUser({ pseudo: 'camille', email: 'camille@exemple.fr' });

    const response = await request(app).get('/api/user/me').set('Cookie', user.cookie);

    expect(response.status).toBe(200);
    expect(response.body.pseudo).toBe('camille');
    expect(response.body.password).toBeUndefined();
  });

  it('refuse un visiteur non connecté', async () => {
    const response = await request(app).get('/api/user/me');

    expect(response.status).toBe(401);
  });
});
