const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const sharp = require('sharp');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const ASSET_ROOT = path.join(__dirname, '..', 'demo-assets');

const sources = {
  bois: ['woodworking.jpg', 'upholstery.jpg'],
  acier: ['mechanic.jpg', 'workshop-tools.jpg'],
  terre: ['pottery-wheel.jpg', 'pottery-hands.jpg'],
  celadon: ['pottery-hands.jpg', 'pottery-wheel.jpg'],
  epicea: ['guitar.jpg', 'woodworking.jpg'],
  velours: ['upholstery.jpg', 'woodworking.jpg'],
  calcaire: ['workshop-tools.jpg', 'woodworking.jpg'],
  forge: ['forge.jpg', 'workshop-tools.jpg'],
};

const WIDTH = 1200;
const HEIGHT = 800;

/**
 * Prépare une photographie pour le jeu de démonstration et renvoie son chemin
 * relatif tel qu'il est stocké en base. Le choix de la source et du cadrage est
 * déterministe afin qu'un nouveau seed conserve les mêmes visuels.
 */
module.exports.generateImage = async ({ palette, key, folder = 'projects' }) => {
  const digest = crypto.createHash('md5').update(key).digest('hex');
  const availableSources = sources[palette] ?? sources.bois;
  const sourceName = availableSources[Number.parseInt(digest.slice(0, 2), 16) % availableSources.length];
  const source = path.join(ASSET_ROOT, sourceName);

  if (!fs.existsSync(source)) {
    throw new Error(`Photo de démonstration absente : ${sourceName}`);
  }

  const directory = path.join(UPLOAD_ROOT, folder);
  await fs.promises.mkdir(directory, { recursive: true });

  const fileName = `demo-${digest.slice(0, 12)}.jpg`;
  const target = path.join(directory, fileName);

  await sharp(source)
    .rotate()
    .resize(WIDTH, HEIGHT, {
      fit: 'cover',
      position: Number.parseInt(digest.slice(2, 4), 16) % 2 === 0 ? 'attention' : 'entropy',
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(target);

  return `uploads/${folder}/${fileName}`;
};
