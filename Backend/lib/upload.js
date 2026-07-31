const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALLOWED_MIME = new Set(['image/jpg', 'image/jpeg', 'image/png', 'image/webp']);
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
  if (!ALLOWED_MIME.has(file.mimetype)) throw new Error('invalid file');
  if (file.size > MAX_FILE_SIZE) throw new Error('max size');

  const directory = path.join(ROOT, folder);
  await fs.promises.mkdir(directory, { recursive: true });

  const fileName = `${crypto.randomUUID()}.jpg`;
  await fs.promises.writeFile(path.join(directory, fileName), file.buffer);

  return `uploads/${folder}/${fileName}`;
};

module.exports.MAX_FILE_SIZE = MAX_FILE_SIZE;
