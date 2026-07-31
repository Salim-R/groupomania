const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Types acceptés et extension correspondante.
 *
 * L'extension est déduite du type déclaré plutôt que fixée : `express.static`
 * choisit l'en-tête `Content-Type` d'après elle, et un PNG servi comme JPEG
 * annonce au navigateur un format qui n'est pas le sien.
 *
 * `image/jpg` n'existe pas dans la nomenclature officielle, mais plusieurs
 * clients l'envoient : le refuser ferait échouer des dépôts valides.
 */
const EXTENSIONS = new Map([
  ['image/jpg', 'jpg'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ROOT = path.join(__dirname, '..', 'uploads');

/**
 * Écrit une image sous un nom généré côté serveur.
 *
 * Le nom de fichier ne reprend AUCUNE donnée fournie par le client. La version
 * précédente le construisait à partir de `req.body.posterId` et de `req.body.name`,
 * ce qui laissait un appelant choisir un chemin de destination arbitraire par
 * remontée de répertoire.
 */
module.exports.storeImage = async (file, folder) => {
  if (!file) throw new Error('invalid file');

  const extension = EXTENSIONS.get(file.mimetype);
  if (!extension) throw new Error('invalid file');

  if (file.size > MAX_FILE_SIZE) throw new Error('max size');

  const directory = path.join(ROOT, folder);
  await fs.promises.mkdir(directory, { recursive: true });

  const fileName = `${crypto.randomUUID()}.${extension}`;
  await fs.promises.writeFile(path.join(directory, fileName), file.buffer);

  return `uploads/${folder}/${fileName}`;
};

module.exports.MAX_FILE_SIZE = MAX_FILE_SIZE;
