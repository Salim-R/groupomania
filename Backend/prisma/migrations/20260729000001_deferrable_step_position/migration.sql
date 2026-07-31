-- Rang des étapes : contrainte différable.
--
-- Le rang d'une étape doit rester unique au sein d'un projet. Mais tout
-- réordonnancement traverse nécessairement un état transitoire où deux étapes
-- portent le même rang : décaler l'étape 1 vers 2 alors que l'étape 2 existe
-- encore est inévitable.
--
-- PostgreSQL vérifie les index uniques ligne par ligne, pas en fin
-- d'instruction : un UPDATE en masse échoue dès la première ligne réécrite.
-- Contourner cela dans le code applicatif (positions négatives temporaires,
-- écritures ordonnées une à une) revient à compenser une contrainte trop
-- stricte par de la complexité et des allers-retours supplémentaires.
--
-- On remplace donc l'index unique par une véritable contrainte différable.
-- INITIALLY IMMEDIATE la laisse vérifiée à chaque instruction par défaut :
-- une insertion en doublon échoue toujours sur-le-champ, avec un diagnostic
-- clair. Seule la transaction de réordonnancement demande explicitement
-- SET CONSTRAINTS ... DEFERRED, ce qui repousse la vérification au COMMIT.
--
-- L'invariant reste garanti pour tout lecteur : aucune transaction ne peut
-- valider un état comportant deux rangs identiques.

DROP INDEX "Step_projectId_position_key";

ALTER TABLE "Step"
  ADD CONSTRAINT "Step_projectId_position_key"
  UNIQUE ("projectId", "position")
  DEFERRABLE INITIALLY IMMEDIATE;
