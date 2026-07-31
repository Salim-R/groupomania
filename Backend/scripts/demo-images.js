const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const sharp = require('sharp');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

/**
 * Visuels de démonstration générés.
 *
 * Aucune photographie n'est empruntée : chaque image est composée à la volée
 * depuis un SVG paramétré, puis encodée en JPEG. Le dépôt reste donc libre de
 * tout contenu dont on ne détiendrait pas les droits, et les fichiers ne sont
 * pas versionnés puisqu'ils se régénèrent.
 *
 * Les palettes reprennent la matière de chaque métier : le bois est chaud,
 * l'acier est froid, la pierre est claire. L'objectif n'est pas de simuler une
 * photo mais de donner au fil une texture crédible et cohérente.
 */
const palettes = {
  bois: ['#7a4a22', '#a9713c', '#3c2412'],
  acier: ['#41474d', '#7e878f', '#20242a'],
  terre: ['#8c4a32', '#c98862', '#3f1f14'],
  celadon: ['#6d8f7d', '#a9c4b3', '#33463c'],
  epicea: ['#b99a6b', '#dcc9a4', '#7a6340'],
  velours: ['#6d2334', '#a24a5c', '#38101c'],
  calcaire: ['#a89a83', '#d3c8b4', '#6f6353'],
  forge: ['#5a3220', '#96502a', '#1c1310'],
};

const WIDTH = 1200;
const HEIGHT = 800;

/**
 * Construit un SVG : dégradé de fond, bandes obliques évoquant le fil de la
 * matière, et grain léger. Le grain est indispensable : un dégradé pur se
 * repère immédiatement comme un aplat généré.
 */
const buildSvg = ([light, mid, dark], seed) => {
  const angle = 20 + (seed % 40);
  const bands = Array.from({ length: 14 }, (_, i) => {
    const y = (i * HEIGHT) / 14;
    const opacity = (0.04 + ((seed + i) % 5) * 0.012).toFixed(3);
    const height = 12 + ((seed + i * 7) % 26);
    return `<rect x="-200" y="${y.toFixed(0)}" width="${WIDTH + 400}" height="${height}" fill="${dark}" opacity="${opacity}" />`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="fond" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${mid}" />
      <stop offset="55%" stop-color="${light}" />
      <stop offset="100%" stop-color="${dark}" />
    </linearGradient>
    <radialGradient id="lumiere" cx="30%" cy="25%" r="75%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.28" />
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="${seed}" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#fond)" />
  <g transform="rotate(${angle} ${WIDTH / 2} ${HEIGHT / 2})">${bands}</g>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#lumiere)" />
  <rect width="${WIDTH}" height="${HEIGHT}" filter="url(#grain)" opacity="0.07" />
</svg>`;
};

/**
 * Génère une image et renvoie son chemin relatif, tel que stocké en base.
 * Le nom est déterministe pour une même clé : relancer le seed ne multiplie
 * pas les fichiers.
 */
module.exports.generateImage = async ({ palette, key, folder = 'projects' }) => {
  const colors = palettes[palette] ?? palettes.bois;
  const seed = Number.parseInt(crypto.createHash('md5').update(key).digest('hex').slice(0, 6), 16);

  const directory = path.join(UPLOAD_ROOT, folder);
  await fs.promises.mkdir(directory, { recursive: true });

  const fileName = `demo-${crypto.createHash('md5').update(key).digest('hex').slice(0, 12)}.jpg`;
  const target = path.join(directory, fileName);

  await sharp(Buffer.from(buildSvg(colors, seed % 100)))
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(target);

  return `uploads/${folder}/${fileName}`;
};

module.exports.palettes = palettes;
