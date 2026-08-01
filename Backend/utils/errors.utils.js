/**
 * Messages d'erreur des dépôts de fichiers.
 *
 * L'API indexe toutes ses erreurs par nom de champ : c'est la forme que `parse`
 * produit à partir de Zod, et celle que le client va chercher pour l'afficher
 * sous le champ fautif. Les dépôts doivent suivre la même convention, sans quoi
 * le message existe côté serveur mais n'atteint jamais l'écran.
 *
 * Ce fichier contenait aussi `signUpErrors` et `signInErrors`, deux rescapés de
 * la version MongoDB : ils inspectaient `err.code === 11000` et `err.keyValue`,
 * qui n'existent pas sous Prisma. Plus aucun contrôleur ne les appelait, la
 * violation d'unicité étant traitée par le code `P2002` dans
 * `auth.controller.js`.
 */

/**
 * `storeImage` lève des erreurs dont le message tient lieu de code. Le
 * rapprochement se fait donc sur ce message plutôt que sur une classe d'erreur,
 * ce qui évite à `lib/upload.js` de dépendre de la couche de présentation.
 */
const MESSAGES = new Map([
  ['invalid file', 'Format incompatible : JPEG, PNG ou WebP attendu.'],
  ['max size', 'Le fichier dépasse 5 Mo.'],
]);

module.exports.uploadErrors = (err, champ) => ({
  [champ]: MESSAGES.get(err && err.message) ?? 'Ce fichier ne peut pas être déposé.',
});
