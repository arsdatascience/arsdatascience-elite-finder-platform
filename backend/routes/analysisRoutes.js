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

// ============================================
// FASE 2 SOCIAL - 4 Analyses
// ============================================

// 7. Instagram Performance
router.post('/instagram-performance', authenticateToken, analysisController.instagramPerformance);

// 8. TikTok Performance
router.post('/tiktok-performance', authenticateToken, analysisController.tiktokPerformance);

// 9. Social Comparison
router.post('/social-comparison', authenticateToken, analysisController.socialComparison);

// 10. Influencer ROI
router.post('/influencer-roi', authenticateToken, analysisController.influencerROI);

// ============================================
// FASE 3 FINANCIAL - 3 Analyses
// ============================================

// 11. Cashflow Forecast
router.post('/cashflow-forecast', authenticateToken, analysisController.cashflowForecast);

// 12. Profitability Analysis
router.post('/profitability', authenticateToken, analysisController.profitability);

// 13. Revenue Scenarios
router.post('/revenue-scenarios', authenticateToken, analysisController.revenueScenarios);

module.exports = router;
