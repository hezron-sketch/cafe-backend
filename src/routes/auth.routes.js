const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller'); 
const authMiddleware = require('../middlewares/auth.middleware');
// const validate = require('../middlewares/validate.middleware');
// const { loginSchema, registerSchema } = require('../validations/auth.validation');

// Public routes
// router.post('/register', authController.register);
//router.post('/register', authMiddleware, authController.register);
// router.post('/login', authController.login);
router.post('/login', authMiddleware, authController.login);


// Protected routes
// router.get('/me', authMiddleware, authController.getMe);

module.exports = router;