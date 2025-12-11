const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const authenticateToken = require('../middleware/auth');

/**
 * Analytics Routes
 * Base Path: /api/analytics
 */

// Get analytics results with filtering (segment, algorithm, type)
router.get('/results', authenticateToken, dataController.getAnalyticsResults);

// Get available industry segments
router.get('/segments', authenticateToken, dataController.getSegments);

// Get specific segment data and visualization
router.get('/segments/:code', authenticateToken, dataController.getSegmentData);

// Get available algorithms configuration
router.get('/algorithms', authenticateToken, dataController.getAlgorithms);

module.exports = router;
