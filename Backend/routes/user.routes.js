const express = require('express');
const multer = require('multer');

const router = express.Router();
const authController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');
const uploadController = require('../controllers/upload.controller');
const { requireAuth } = require('../middleware/auth');
const { MAX_FILE_SIZE } = require('../lib/upload');

const upload = multer({ limits: { fileSize: MAX_FILE_SIZE } });

// Authentification
router.post('/register', authController.signup);
router.post('/login', authController.signIn);
router.get('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

// Lecture publique des profils d'artisans
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getOneUser);

// Écritures : l'utilisateur agit sur son propre compte, jamais sur celui d'un autre.
router.put('/:id', requireAuth, userController.updateUser);
router.delete('/:id', requireAuth, userController.deleteUser);

// L'abonné est toujours l'utilisateur du jeton : aucun identifiant d'abonné
// n'est accepté depuis le client.
router.put('/:id/follow', requireAuth, userController.follow);
router.delete('/:id/follow', requireAuth, userController.unfollow);

router.post('/me/picture', requireAuth, upload.single('file'), uploadController.uploadProfil);

module.exports = router;
