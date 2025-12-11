const express = require('express');
const router = express.Router();
const adminController = require('../adminController');

// Clean DB
router.post('/cleanup', adminController.cleanupDatabase);

// Overview & System
router.get('/queue-status', adminController.getQueueStatus);
router.get('/usage-stats', adminController.getSystemUsage);

// Tenants
router.get('/tenants', adminController.getTenants);
router.post('/tenants', adminController.createTenant);
router.put('/tenants/:id', adminController.updateTenant);
router.delete('/tenants/:id', adminController.deleteTenant);

// Plans
router.get('/plans', adminController.getPlans);

module.exports = router;
