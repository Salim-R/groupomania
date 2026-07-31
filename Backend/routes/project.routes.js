const router = require('express').Router();
const multer = require('multer');

const projectController = require('../controllers/project.controller');
const stepController = require('../controllers/step.controller');
const { requireAuth } = require('../middleware/auth');
const { MAX_FILE_SIZE } = require('../lib/upload');

// Le fichier reste en mémoire : type et taille sont contrôlés avant toute
// écriture sur le disque.
const upload = multer({ limits: { fileSize: MAX_FILE_SIZE } });

// Lecture publique : un carnet de bord n'a d'intérêt que s'il se consulte
// sans compte.
router.get('/', projectController.readProjects);
router.get('/:id', projectController.readOneProject);

// Toute écriture exige une session valide. L'auteur est déduit du jeton.
router.post('/', requireAuth, upload.single('cover'), projectController.createProject);
router.put('/:id', requireAuth, projectController.updateProject);
router.delete('/:id', requireAuth, projectController.deleteProject);

router.put('/:id/like', requireAuth, projectController.likeProject);
router.delete('/:id/like', requireAuth, projectController.unlikeProject);

// Étapes du carnet
router.post('/:id/steps', requireAuth, upload.single('image'), stepController.addStep);
router.put('/:id/steps/:stepId', requireAuth, upload.single('image'), stepController.updateStep);
router.delete('/:id/steps/:stepId', requireAuth, stepController.deleteStep);
router.patch('/:id/steps/:stepId/position', requireAuth, stepController.reorderStep);

// Commentaires
router.post('/:id/comments', requireAuth, projectController.addComment);
router.put('/:id/comments/:commentId', requireAuth, projectController.updateComment);
router.delete('/:id/comments/:commentId', requireAuth, projectController.deleteComment);

module.exports = router;
