const express = require('express');
const router = express.Router();
const oauthController = require('../controllers/oauthController');

// Start OAuth flow
router.get('/init', oauthController.initiateAuth);

// Callbacks
router.get('/:provider/callback', oauthController.handleCallback);

// Management
router.get('/list', oauthController.listIntegrations);
router.delete('/:id', oauthController.disconnect);

module.exports = router;
