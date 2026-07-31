-- La photo de profil devient facultative.
--
-- La valeur par défaut pointait vers « uploads/profils/default.png », un
-- fichier qui n'existe pas : chaque profil sans photo déclenchait une requête
-- en 404, et le client ne pouvait pas distinguer une absence de photo d'un
-- fichier introuvable. Le repli relève de l'interface, pas du stockage.
--
-- L'ordre compte : la colonne doit accepter NULL avant qu'on y écrive NULL.

ALTER TABLE "User" ALTER COLUMN "picture" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "picture" DROP NOT NULL;

UPDATE "User" SET "picture" = NULL WHERE "picture" = 'uploads/profils/default.png';
