const express = require('express');
const router = express.Router();
const userController = require('../userController');
const authenticateToken = require('../middleware/auth');

// Authentication
router.post('/login', userController.login);
router.post('/register', userController.createUser); // Assuming createUser handles registration usually
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPasswordConfirm);

// Profile
// Note: server.js mounts this at /api/auth. 
// Some user routes might be here or in server.js directly.
// Checking server.js: app.use('/api/auth', authRoutes);

module.exports = router;
