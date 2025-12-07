/**
 * ML Agent Routes
 * /api/ml-agent/*
 */

const express = require('express');
const router = express.Router();
const mlAgentController = require('../controllers/mlAgentController');
const authenticateToken = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// POST /api/ml-agent/analyze - Analyze natural language message
router.post('/analyze', mlAgentController.analyze);

// GET /api/ml-agent/history - Get analysis history
router.get('/history', mlAgentController.getHistory);

// GET /api/ml-agent/health - Check ML Service health
router.get('/health', mlAgentController.checkHealth);

// POST /api/ml-agent/test-intent - Test intent detection (dev)
router.post('/test-intent', mlAgentController.testIntent);

// GET /api/ml-agent/types - Get available analysis types
router.get('/types', mlAgentController.getAnalysisTypes);

module.exports = router;
