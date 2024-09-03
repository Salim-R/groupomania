const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.Controller');
const userController = require('../controllers/user.controller');
const uploadController = require('../controllers/upload.contoller');
const multer = require('multer');
const upload = multer();
router.post("/register", authController.signup);
router.post("/login", authController.signIn);
router.get("/logout", authController.logout);

router.get("/", userController.getAllUsers);
router.get('/:id', userController.getOneUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
router.patch("/follow/:id", userController.follow);
router.patch("/unfollow/:id", userController.unfollow);

//uploads
router.post('/upload', upload.single('file'), uploadController.uploadProfil);


module.exports = router;

