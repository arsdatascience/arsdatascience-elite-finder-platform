/**
 * Analysis Routes
 * All ML analysis endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const analysisController = require('../controllers/analysisController');

// ============================================
// FASE 1 MVP - 6 Core Analyses
// ============================================

// 1. Sales Forecast
router.post('/sales-forecast', authenticateToken, analysisController.salesForecast);

// 2. Churn Prediction
router.post('/churn-prediction', authenticateToken, analysisController.churnPrediction);

// 3. Customer Segmentation
router.post('/customer-segmentation', authenticateToken, analysisController.customerSegmentation);

// 4. Trend Analysis
router.post('/trend-analysis', authenticateToken, analysisController.trendAnalysis);

// 5. Anomaly Detection
router.post('/anomaly-detection', authenticateToken, analysisController.anomalyDetection);

// 6. Marketing ROI
router.post('/marketing-roi', authenticateToken, analysisController.marketingROI);

module.exports = router;
