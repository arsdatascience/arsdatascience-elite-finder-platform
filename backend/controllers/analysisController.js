/**
 * Analysis Controller
 * Handles all ML analysis endpoints
 * Fase 1 MVP: 6 core analyses
 */

const mlService = require('../services/mlService');
const dataPrep = require('../services/dataPreparation');
const { opsPool } = require('../database');

/**
 * 1. Sales Forecast
 * POST /api/analysis/sales-forecast
 */
const salesForecast = async (req, res) => {
    try {
        const clientId = req.body.client_id || req.user?.clientId;
        const { horizon = 30, historical_days = 90 } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: 'client_id is required' });
        }

        // Prepare data
        const preparedData = await dataPrep.prepareSalesForecastData(clientId, historical_days);

        if (preparedData.timeseries.length < 7) {
            return res.status(400).json({
                error: 'Insufficient data',
                message: 'At least 7 days of data required for forecast'
            });
        }

        // Call ML Service
        const result = await mlService.salesForecast(preparedData.timeseries, horizon);

        // Store analysis result
        await storeAnalysisResult(clientId, 'sales_forecast', result.data, preparedData.metadata);

        res.json({
            success: true,
            analysis_type: 'sales_forecast',
            client_id: clientId,
            forecast_horizon: horizon,
            ...result.data
        });

    } catch (error) {
        console.error('Sales Forecast Error:', error);
        res.status(500).json({ error: 'Failed to generate sales forecast', details: error.message });
    }
};

/**
 * 2. Churn Prediction
 * POST /api/analysis/churn-prediction
 */
const churnPrediction = async (req, res) => {
    try {
        const clientId = req.body.client_id || req.user?.clientId;
        const { historical_days = 180 } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: 'client_id is required' });
        }

        // Prepare data
        const preparedData = await dataPrep.prepareChurnData(clientId, historical_days);

        // Call ML Service
        const result = await mlService.churnPrediction([preparedData.features]);

        // Store result
        await storeAnalysisResult(clientId, 'churn_prediction', result.data, preparedData.metadata);

        res.json({
            success: true,
            analysis_type: 'churn_prediction',
            client_id: clientId,
            ...result.data
        });

    } catch (error) {
        console.error('Churn Prediction Error:', error);
        res.status(500).json({ error: 'Failed to predict churn', details: error.message });
    }
};

/**
 * 3. Customer Segmentation
 * POST /api/analysis/customer-segmentation
 */
const customerSegmentation = async (req, res) => {
    try {
        const clientId = req.body.client_id || req.user?.clientId;
        const { n_clusters = 5, historical_days = 365 } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: 'client_id is required' });
        }

        // Prepare data
        const preparedData = await dataPrep.prepareSegmentationData(clientId, historical_days);

        // Call ML Service
        const result = await mlService.customerSegmentation([preparedData.features], n_clusters);

        // Store result
        await storeAnalysisResult(clientId, 'customer_segmentation', result.data, preparedData.metadata);

        res.json({
            success: true,
            analysis_type: 'customer_segmentation',
            client_id: clientId,
            n_clusters,
            ...result.data
        });

    } catch (error) {
        console.error('Customer Segmentation Error:', error);
        res.status(500).json({ error: 'Failed to segment customers', details: error.message });
    }
};

/**
 * 4. Trend Analysis
 * POST /api/analysis/trend-analysis
 */
const trendAnalysis = async (req, res) => {
    try {
        const clientId = req.body.client_id || req.user?.clientId;
        const { metric = 'revenue', historical_days = 90 } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: 'client_id is required' });
        }

        // Prepare data
        const preparedData = await dataPrep.prepareTrendData(clientId, metric, historical_days);

        if (preparedData.timeseries.length < 14) {
            return res.status(400).json({
                error: 'Insufficient data',
                message: 'At least 14 days of data required for trend analysis'
            });
        }

        // Call ML Service
        const result = await mlService.trendAnalysis(preparedData.timeseries, metric);

        // Store result
        await storeAnalysisResult(clientId, 'trend_analysis', result.data, { ...preparedData.metadata, metric });

        res.json({
            success: true,
            analysis_type: 'trend_analysis',
            client_id: clientId,
            metric,
            ...result.data
        });

    } catch (error) {
        console.error('Trend Analysis Error:', error);
        res.status(500).json({ error: 'Failed to analyze trends', details: error.message });
    }
};

/**
 * 5. Anomaly Detection
 * POST /api/analysis/anomaly-detection
 */
const anomalyDetection = async (req, res) => {
    try {
        const clientId = req.body.client_id || req.user?.clientId;
        const { historical_days = 90 } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: 'client_id is required' });
        }

        // Prepare data
        const preparedData = await dataPrep.prepareAnomalyData(clientId, historical_days);

        if (preparedData.data.length < 30) {
            return res.status(400).json({
                error: 'Insufficient data',
                message: 'At least 30 days of data required for anomaly detection'
            });
        }

        // Call ML Service
        const result = await mlService.anomalyDetection(preparedData.data);

        // Store result
        await storeAnalysisResult(clientId, 'anomaly_detection', result.data, preparedData.metadata);

        res.json({
            success: true,
            analysis_type: 'anomaly_detection',
            client_id: clientId,
            ...result.data
        });

    } catch (error) {
        console.error('Anomaly Detection Error:', error);
        res.status(500).json({ error: 'Failed to detect anomalies', details: error.message });
    }
};

/**
 * 6. Marketing ROI
 * POST /api/analysis/marketing-roi
 */
const marketingROI = async (req, res) => {
    try {
        const clientId = req.body.client_id || req.user?.clientId;
        const { historical_days = 90 } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: 'client_id is required' });
        }

        // Prepare data
        const preparedData = await dataPrep.prepareMarketingROIData(clientId, historical_days);

        // Calculate ROI metrics
        const roiMetrics = calculateROI(preparedData);

        // Call ML Service for advanced analysis
        const result = await mlService.marketingROI(preparedData.channels, { total_revenue: preparedData.total_revenue });

        // Store result
        await storeAnalysisResult(clientId, 'marketing_roi', { ...roiMetrics, ml_analysis: result.data }, preparedData.metadata);

        res.json({
            success: true,
            analysis_type: 'marketing_roi',
            client_id: clientId,
            ...roiMetrics,
            ml_insights: result.data
        });

    } catch (error) {
        console.error('Marketing ROI Error:', error);
        res.status(500).json({ error: 'Failed to calculate marketing ROI', details: error.message });
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Store analysis result in database
 */
async function storeAnalysisResult(clientId, analysisType, results, metadata) {
    try {
        await opsPool.query(`
            INSERT INTO ml_segment_analytics 
            (client_id, analysis_type, algorithm, primary_metric_name, primary_metric_value, 
             secondary_metrics, chart_data, sample_size)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            clientId,
            analysisType,
            results.model_used || 'ensemble',
            analysisType,
            results.metrics?.rmse || results.accuracy || 0,
            JSON.stringify(results.metrics || {}),
            JSON.stringify(results),
            metadata?.records || 0
        ]);
    } catch (error) {
        console.error('Failed to store analysis result:', error.message);
    }
}

/**
 * Calculate ROI metrics from channel data
 */
function calculateROI(data) {
    const { channels, total_revenue, total_spend } = data;
    const channelMetrics = {};

    for (const [channel, stats] of Object.entries(channels)) {
        if (stats.spend > 0) {
            channelMetrics[channel] = {
                spend: stats.spend,
                conversions: stats.conversions,
                cpa: stats.cpa,
                roas: total_revenue > 0 ? (total_revenue / stats.spend).toFixed(2) : 0,
                contribution_pct: ((stats.spend / total_spend) * 100).toFixed(1)
            };
        }
    }

    return {
        total_revenue,
        total_spend,
        overall_roas: total_spend > 0 ? (total_revenue / total_spend).toFixed(2) : 0,
        channels: channelMetrics,
        recommendations: generateROIRecommendations(channelMetrics)
    };
}

function generateROIRecommendations(channels) {
    const recommendations = [];
    let bestChannel = null;
    let bestROAS = 0;

    for (const [channel, metrics] of Object.entries(channels)) {
        const roas = parseFloat(metrics.roas);
        if (roas > bestROAS) {
            bestROAS = roas;
            bestChannel = channel;
        }
    }

    if (bestChannel) {
        recommendations.push({
            type: 'increase_budget',
            channel: bestChannel,
            reason: `Highest ROAS (${bestROAS}x). Consider increasing budget.`
        });
    }

    for (const [channel, metrics] of Object.entries(channels)) {
        const roas = parseFloat(metrics.roas);
        if (roas < 1 && parseFloat(metrics.spend) > 100) {
            recommendations.push({
                type: 'review_strategy',
                channel,
                reason: `ROAS below 1x (${roas}x). Review targeting and creatives.`
            });
        }
    }

    return recommendations;
}

module.exports = {
    salesForecast,
    churnPrediction,
    customerSegmentation,
    trendAnalysis,
    anomalyDetection,
    marketingROI
};
