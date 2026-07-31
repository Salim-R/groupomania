const http = require('http');

const app = require('./app');

const port = Number.parseInt(process.env.PORT, 10) || 5000;
app.set('port', port);

const server = http.createServer(app);

server.on('error', (error) => {
  if (error.syscall !== 'listen') throw error;

  switch (error.code) {
    case 'EACCES':
      console.error(`Le port ${port} exige des privilèges élevés.`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`Le port ${port} est déjà utilisé.`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

server.on('listening', () => console.log(`API à l'écoute sur le port ${port}.`));

server.listen(port);

// Arrêt propre : sans cela, l'hébergeur coupe le processus au milieu des
// requêtes en cours lors d'un redéploiement.
const shutdown = (signal) => () => {
  console.log(`${signal} reçu, arrêt du serveur.`);
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));

module.exports = server;
