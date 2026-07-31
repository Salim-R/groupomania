const path = require('path');

const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const { checkUser } = require('./middleware/auth');

const app = express();

// Derrière un hébergeur (Render, Railway), l'adresse réelle du client arrive
// dans X-Forwarded-For : sans cette option la limitation de débit compte tous
// les visiteurs comme un seul.
app.set('trust proxy', 1);

if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use(helmet());

/**
 * Une seule configuration CORS.
 *
 * La version précédente posait les en-têtes deux fois : un middleware manuel
 * les écrivait, puis le paquet `cors` les réécrivait. Les en-têtes `sessionId`
 * déclarés n'étaient par ailleurs jamais utilisés.
 */
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

/**
 * Limitation de débit sur l'authentification : sans elle, rien n'empêche
 * d'essayer des mots de passe en boucle.
 *
 * Désactivée en test : la suite crée plusieurs comptes par cas et atteindrait
 * le plafond, ce qui ferait échouer des tests pour une raison sans rapport
 * avec ce qu'ils vérifient. La limite est couverte par son propre test, qui
 * la réactive explicitement.
 */
if (process.env.NODE_ENV !== 'test') {
  /**
   * Le plafond est paramétrable et volontairement plus haut hors production.
   *
   * Une suite de bout en bout crée un compte par scénario et atteint sinon la
   * limite au bout de quelques minutes : les tests échouent alors sur un 429
   * sans rapport avec ce qu'ils vérifient. Relever le plafond en développement
   * garde la protection en place et testable, plutôt que de la désactiver et
   * de ne plus jamais l'exercer avant la mise en production.
   */
  const limit =
    Number.parseInt(process.env.AUTH_RATE_LIMIT, 10) ||
    (process.env.NODE_ENV === 'production' ? 20 : 500);

  app.use(
    ['/api/user/login', '/api/user/register'],
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { message: 'Trop de tentatives. Réessayez dans quelques minutes.' },
    })
  );
}

// Images déposées par les membres.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// `checkUser` était monté via app.get('*'), donc ignoré sur toutes les
// requêtes POST, PUT, PATCH et DELETE.
app.use(checkUser);

app.use('/api/user', userRoutes);
app.use('/api/project', projectRoutes);

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use((req, res) => res.status(404).json({ message: 'Ressource introuvable.' }));

/**
 * Gestionnaire d'erreurs central. Les contrôleurs transmettent leurs erreurs
 * via next(err) plutôt que de renvoyer l'objet brut au client, qui exposait
 * la structure interne de la base.
 */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Données invalides.' });
  }

  return res.status(500).json({ message: 'Une erreur est survenue.' });
});

module.exports = app;
