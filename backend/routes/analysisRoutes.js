/**
 * Analysis Routes
 * All ML analysis endpoints
 */

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
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

// ============================================
// FASE 4 CUSTOM TRAINING - 4 Model Types
// ============================================

// 14. Train Regression Model
router.post('/train/regression', authenticateToken, analysisController.trainRegression);

// 15. Train Classification Model
router.post('/train/classification', authenticateToken, analysisController.trainClassification);

// 16. Train Clustering Model
router.post('/train/clustering', authenticateToken, analysisController.trainClustering);

// 17. Train Time Series Model
router.post('/train/timeseries', authenticateToken, analysisController.trainTimeseries);

// ============================================
// FASE 5 ADVANCED - 18 Analyses
// ============================================

// 18. Lead Forecast
router.post('/lead-forecast', authenticateToken, analysisController.leadForecast);
// 19. Budget Optimization
router.post('/budget-optimization', authenticateToken, analysisController.budgetOptimization);
// 20. Inventory Optimization
router.post('/inventory-optimization', authenticateToken, analysisController.inventoryOptimization);
// 21. Demand Forecast
router.post('/demand-forecast', authenticateToken, analysisController.demandForecast);
// 22. Return Analysis
router.post('/return-analysis', authenticateToken, analysisController.returnAnalysis);
// 23. LTV Prediction
router.post('/ltv-prediction', authenticateToken, analysisController.ltvPrediction);
// 24. RFM Analysis
router.post('/rfm-analysis', authenticateToken, analysisController.rfmAnalysis);
// 25. Purchase Propensity
router.post('/purchase-propensity', authenticateToken, analysisController.purchasePropensity);
// 26. Satisfaction Trends
router.post('/satisfaction-trends', authenticateToken, analysisController.satisfactionTrends);
// 27. Funnel Optimization
router.post('/funnel-optimization', authenticateToken, analysisController.funnelOptimization);
// 28. Cart Abandonment
router.post('/cart-abandonment', authenticateToken, analysisController.cartAbandonment);
// 29. A/B Test
router.post('/ab-test', authenticateToken, analysisController.abTestAnalysis);
// 30. Market Benchmark
router.post('/market-benchmark', authenticateToken, analysisController.marketBenchmark);
// 31. Competitor Analysis
router.post('/competitor-analysis', authenticateToken, analysisController.competitorAnalysis);
// 32. Seasonality Forecast
router.post('/seasonality-forecast', authenticateToken, analysisController.seasonalityForecast);
// 33. Event Impact
router.post('/event-impact', authenticateToken, analysisController.eventImpact);
// 34. Scenario Simulator
router.post('/scenario-simulator', authenticateToken, analysisController.scenarioSimulator);
// 35. Time Series Prophet
router.post('/time-series-prophet', authenticateToken, analysisController.timeSeriesProphet);

module.exports = router;
