const fs = require('fs');
const path = require('path');

const { storeImage, MAX_FILE_SIZE } = require('../lib/upload');
const { disconnect } = require('./setup');

/**
 * Écriture des images déposées.
 *
 * Le nom du fichier est généré côté serveur : c'est la correction de la faille
 * 2.1 de l'audit, où il était construit depuis le corps de la requête et
 * permettait d'écrire hors du dossier prévu.
 *
 * L'extension, elle, doit suivre le type réel. `express.static` choisit
 * l'en-tête `Content-Type` d'après elle, et un PNG servi sous une extension
 * .jpg annonce au navigateur un format qui n'est pas le sien.
 */
const DOSSIER = 'tests-upload';
const RACINE = path.join(__dirname, '..', 'uploads', DOSSIER);

const fichier = (mimetype, taille = 64) => ({
  mimetype,
  size: taille,
  buffer: Buffer.alloc(taille, 1),
});

afterAll(async () => {
  await fs.promises.rm(RACINE, { recursive: true, force: true });
  await disconnect();
});

describe('Écriture des images déposées', () => {
  it.each([
    ['image/jpeg', 'jpg'],
    ['image/jpg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
  ])('donne à un %s l’extension .%s', async (mimetype, attendue) => {
    const chemin = await storeImage(fichier(mimetype), DOSSIER);

    expect(path.extname(chemin)).toBe(`.${attendue}`);
    expect(fs.existsSync(path.join(__dirname, '..', chemin))).toBe(true);
  });

  it('refuse un type non autorisé', async () => {
    await expect(storeImage(fichier('image/svg+xml'), DOSSIER)).rejects.toThrow('invalid file');
    await expect(storeImage(fichier('application/pdf'), DOSSIER)).rejects.toThrow('invalid file');
  });

  it('refuse un fichier trop lourd', async () => {
    await expect(
      storeImage({ mimetype: 'image/png', size: MAX_FILE_SIZE + 1, buffer: Buffer.alloc(8) }, DOSSIER)
    ).rejects.toThrow('max size');
  });

  it('ne reprend aucune donnée du client dans le nom du fichier', async () => {
    const chemin = await storeImage(
      { ...fichier('image/png'), originalname: '../../evasion.png' },
      DOSSIER
    );

    expect(chemin.includes('..')).toBe(false);
    expect(path.basename(chemin, '.png')).toMatch(/^[0-9a-f-]{36}$/);
  });
});
