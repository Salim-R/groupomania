const prisma = require('../lib/prisma');
const { publicUser } = require('../lib/selectors');
const { storeImage } = require('../lib/upload');
const { uploadErrors } = require('../utils/errors.utils');

/**
 * Photo de profil.
 *
 * Deux corrections par rapport à la version précédente : le nom de fichier
 * était construit à partir de `req.body.name`, une donnée client permettant
 * d'écrire hors du dossier prévu ; et le compte mis à jour était désigné par
 * `req.body.userId`, ce qui laissait modifier la photo de n'importe quel membre.
 *
 * Les deux viennent désormais du serveur : nom généré, compte issu du jeton.
 */
exports.uploadProfil = async (req, res, next) => {
  let picture;

  try {
    picture = await storeImage(req.file, 'profils');
  } catch (err) {
    return res.status(400).json({ errors: uploadErrors(err, 'file') });
  }

  try {
    const user = await prisma.user.update({
      where: { id: res.locals.user.id },
      data: { picture },
      select: publicUser,
    });

    return res.status(200).json(user);
  } catch (err) {
    return next(err);
  }
};
