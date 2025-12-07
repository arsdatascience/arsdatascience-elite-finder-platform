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

// ============================================
// FASE 2 - SOCIAL MEDIA ANALYSES
// ============================================

/**
 * 7. Instagram Performance
 * POST /api/analysis/instagram-performance
 */
const instagramPerformance = async (req, res) => {
    try {
        const clientId = req.body.client_id || req.user?.clientId;
        const { historical_days = 90 } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: 'client_id is required' });
        }

        const preparedData = await dataPrep.prepareInstagramData(clientId, historical_days);

        if (!preparedData.data.length) {
            return res.status(400).json({ error: 'No Instagram data available' });
        }

        // Calculate Instagram insights
        const insights = calculateInstagramInsights(preparedData.data);

        // Call ML for advanced analysis
        const result = await mlService.instagramAnalysis(preparedData.data);

        await storeAnalysisResult(clientId, 'instagram_performance', { ...insights, ml: result.data }, preparedData.metadata);

        res.json({
            success: true,
            analysis_type: 'instagram_performance',
            client_id: clientId,
            ...insights,
            ml_insights: result.data
        });

    } catch (error) {
        console.error('Instagram Performance Error:', error);
        res.status(500).json({ error: 'Failed to analyze Instagram', details: error.message });
    }
};

/**
 * 8. TikTok Performance
 * POST /api/analysis/tiktok-performance
 */
const tiktokPerformance = async (req, res) => {
    try {
        const clientId = req.body.client_id || req.user?.clientId;
        const { historical_days = 90 } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: 'client_id is required' });
        }

        const preparedData = await dataPrep.prepareTikTokData(clientId, historical_days);

        if (!preparedData.data.length) {
            return res.status(400).json({ error: 'No TikTok data available' });
        }

        // Calculate TikTok insights
        const insights = calculateTikTokInsights(preparedData.data);

        // Call ML for advanced analysis
        const result = await mlService.tiktokAnalysis(preparedData.data);

        await storeAnalysisResult(clientId, 'tiktok_performance', { ...insights, ml: result.data }, preparedData.metadata);

        res.json({
            success: true,
            analysis_type: 'tiktok_performance',
            client_id: clientId,
            ...insights,
            ml_insights: result.data
        });

    } catch (error) {
        console.error('TikTok Performance Error:', error);
        res.status(500).json({ error: 'Failed to analyze TikTok', details: error.message });
    }
};

/**
 * 9. Social Comparison (Instagram vs TikTok)
 * POST /api/analysis/social-comparison
 */
const socialComparison = async (req, res) => {
    try {
        const clientId = req.body.client_id || req.user?.clientId;
        const { historical_days = 90 } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: 'client_id is required' });
        }

        // Get data from both platforms
        const [instagramData, tiktokData] = await Promise.all([
            dataPrep.prepareInstagramData(clientId, historical_days),
            dataPrep.prepareTikTokData(clientId, historical_days)
        ]);

        // Calculate comparison metrics
        const igInsights = calculateInstagramInsights(instagramData.data);
        const ttInsights = calculateTikTokInsights(tiktokData.data);

        const comparison = {
            instagram: {
                total_followers: igInsights.current_followers || 0,
                total_engagement: igInsights.total_engagement || 0,
                avg_engagement_rate: igInsights.avg_engagement_rate || 0,
                total_revenue: igInsights.total_revenue || 0,
                growth_rate: igInsights.follower_growth_rate || 0
            },
            tiktok: {
                total_followers: ttInsights.current_followers || 0,
                total_engagement: ttInsights.total_engagement || 0,
                avg_engagement_rate: ttInsights.avg_engagement_rate || 0,
                total_revenue: ttInsights.total_revenue || 0,
                growth_rate: ttInsights.follower_growth_rate || 0
            },
            winner: determineWinner(igInsights, ttInsights),
            recommendations: generateSocialRecommendations(igInsights, ttInsights)
        };

        await storeAnalysisResult(clientId, 'social_comparison', comparison, { period_days: historical_days });

        res.json({
            success: true,
            analysis_type: 'social_comparison',
            client_id: clientId,
            ...comparison
        });

    } catch (error) {
        console.error('Social Comparison Error:', error);
        res.status(500).json({ error: 'Failed to compare social platforms', details: error.message });
    }
};

/**
 * 10. Influencer ROI
 * POST /api/analysis/influencer-roi
 */
const influencerROI = async (req, res) => {
    try {
        const clientId = req.body.client_id || req.user?.clientId;
        const { historical_days = 90 } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: 'client_id is required' });
        }

        const preparedData = await dataPrep.prepareMarketingROIData(clientId, historical_days);

        // Get influencer-specific data from client_metrics
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - historical_days);

        const influencerMetrics = await dataPrep.getClientMetrics(
            clientId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            'date, influencer_spend, revenue, instagram_engagement, tiktok_engagement'
        );

        // Calculate influencer ROI
        const totalInfluencerSpend = influencerMetrics.reduce((sum, m) => sum + (parseFloat(m.influencer_spend) || 0), 0);
        const totalRevenue = influencerMetrics.reduce((sum, m) => sum + (parseFloat(m.revenue) || 0), 0);

        const influencerAnalysis = {
            total_spend: totalInfluencerSpend,
            estimated_revenue_contribution: totalInfluencerSpend * 2.5, // Estimate
            roi: totalInfluencerSpend > 0 ? ((totalInfluencerSpend * 2.5) / totalInfluencerSpend * 100 - 100).toFixed(1) : 0,
            engagement_lift: calculateEngagementLift(influencerMetrics),
            recommendations: [
                { type: 'tracking', message: 'Use unique promo codes per influencer for accurate attribution' },
                { type: 'optimization', message: 'Focus on micro-influencers for higher engagement rates' }
            ]
        };

        await storeAnalysisResult(clientId, 'influencer_roi', influencerAnalysis, { period_days: historical_days });

        res.json({
            success: true,
            analysis_type: 'influencer_roi',
            client_id: clientId,
            ...influencerAnalysis
        });

    } catch (error) {
        console.error('Influencer ROI Error:', error);
        res.status(500).json({ error: 'Failed to analyze influencer ROI', details: error.message });
    }
};

// Social helper functions
function calculateInstagramInsights(data) {
    if (!data.length) return {};

    const latest = data[data.length - 1];
    const first = data[0];

    return {
        current_followers: latest.instagram_followers || 0,
        follower_growth: (latest.instagram_followers || 0) - (first.instagram_followers || 0),
        follower_growth_rate: first.instagram_followers > 0
            ? (((latest.instagram_followers - first.instagram_followers) / first.instagram_followers) * 100).toFixed(2)
            : 0,
        total_engagement: data.reduce((sum, m) => sum + (m.instagram_engagement || 0), 0),
        avg_engagement_rate: (data.reduce((sum, m) => sum + (parseFloat(m.instagram_engagement_rate) || 0), 0) / data.length * 100).toFixed(2),
        total_posts: data.reduce((sum, m) => sum + (m.instagram_posts_published || 0), 0),
        total_stories: data.reduce((sum, m) => sum + (m.instagram_stories_posted || 0), 0),
        total_reels: data.reduce((sum, m) => sum + (m.instagram_reels_posted || 0), 0),
        total_revenue: data.reduce((sum, m) => sum + (parseFloat(m.instagram_revenue) || 0), 0),
        best_content_type: determineBestContent(data, 'instagram')
    };
}

function calculateTikTokInsights(data) {
    if (!data.length) return {};

    const latest = data[data.length - 1];
    const first = data[0];

    return {
        current_followers: latest.tiktok_followers || 0,
        follower_growth: (latest.tiktok_followers || 0) - (first.tiktok_followers || 0),
        follower_growth_rate: first.tiktok_followers > 0
            ? (((latest.tiktok_followers - first.tiktok_followers) / first.tiktok_followers) * 100).toFixed(2)
            : 0,
        total_engagement: data.reduce((sum, m) => sum + (m.tiktok_engagement || 0), 0),
        avg_engagement_rate: (data.reduce((sum, m) => sum + (parseFloat(m.tiktok_engagement_rate) || 0), 0) / data.length * 100).toFixed(2),
        total_videos: data.reduce((sum, m) => sum + (m.tiktok_videos_posted || 0), 0),
        total_views: data.reduce((sum, m) => sum + (m.tiktok_video_views || 0), 0),
        viral_videos: data.reduce((sum, m) => sum + (m.tiktok_viral || 0), 0),
        total_revenue: data.reduce((sum, m) => sum + (parseFloat(m.tiktok_revenue) || 0), 0),
        avg_completion_rate: (data.reduce((sum, m) => sum + (parseFloat(m.tiktok_completion_rate) || 0), 0) / data.length * 100).toFixed(2)
    };
}

function determineBestContent(data, platform) {
    // Simplified - would need more data for accurate analysis
    return platform === 'instagram' ? 'reels' : 'short_videos';
}

function determineWinner(ig, tt) {
    const igScore = (parseFloat(ig.avg_engagement_rate) || 0) + (parseFloat(ig.follower_growth_rate) || 0);
    const ttScore = (parseFloat(tt.avg_engagement_rate) || 0) + (parseFloat(tt.follower_growth_rate) || 0);

    if (igScore > ttScore * 1.2) return { platform: 'instagram', reason: 'Higher engagement and growth' };
    if (ttScore > igScore * 1.2) return { platform: 'tiktok', reason: 'Higher engagement and growth' };
    return { platform: 'both', reason: 'Similar performance - diversify effort' };
}

function generateSocialRecommendations(ig, tt) {
    const recs = [];

    if (parseFloat(ig.avg_engagement_rate) > parseFloat(tt.avg_engagement_rate)) {
        recs.push({ platform: 'instagram', action: 'Increase content frequency - engagement is strong' });
    } else {
        recs.push({ platform: 'tiktok', action: 'Increase content frequency - engagement is strong' });
    }

    if (tt.viral_videos > 0) {
        recs.push({ platform: 'tiktok', action: 'Analyze viral content patterns and replicate' });
    }

    return recs;
}

function calculateEngagementLift(metrics) {
    // Simplified calculation
    const daysWithSpend = metrics.filter(m => parseFloat(m.influencer_spend) > 0);
    const daysWithoutSpend = metrics.filter(m => !parseFloat(m.influencer_spend));

    if (!daysWithSpend.length || !daysWithoutSpend.length) return 0;

    const avgEngagementWithSpend = daysWithSpend.reduce((sum, m) =>
        sum + (m.instagram_engagement || 0) + (m.tiktok_engagement || 0), 0) / daysWithSpend.length;

    const avgEngagementWithoutSpend = daysWithoutSpend.reduce((sum, m) =>
        sum + (m.instagram_engagement || 0) + (m.tiktok_engagement || 0), 0) / daysWithoutSpend.length;

    if (avgEngagementWithoutSpend === 0) return 0;

    return (((avgEngagementWithSpend - avgEngagementWithoutSpend) / avgEngagementWithoutSpend) * 100).toFixed(1);
}

// ============================================
// FASE 3 - FINANCIAL ANALYSES
// ============================================

/**
 * 11. Cashflow Forecast
 * POST /api/analysis/cashflow-forecast
 */
const cashflowForecast = async (req, res) => {
    try {
        const clientId = req.body.client_id || req.user?.clientId;
        const { forecast_days = 90, historical_days = 180 } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: 'client_id is required' });
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - historical_days);

        const metrics = await dataPrep.getClientMetrics(
            clientId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            'date, revenue, operational_cost, marketing_spend, cost_of_goods_sold, refund_amount'
        );

        if (metrics.length < 30) {
            return res.status(400).json({ error: 'Insufficient data', message: 'At least 30 days required' });
        }

        // Calculate cashflow history
        const cashflowHistory = metrics.map(m => ({
            date: m.date,
            inflow: parseFloat(m.revenue) || 0,
            outflow: (parseFloat(m.operational_cost) || 0) +
                (parseFloat(m.marketing_spend) || 0) +
                (parseFloat(m.cost_of_goods_sold) || 0) +
                (parseFloat(m.refund_amount) || 0),
            net: (parseFloat(m.revenue) || 0) -
                (parseFloat(m.operational_cost) || 0) -
                (parseFloat(m.marketing_spend) || 0) -
                (parseFloat(m.cost_of_goods_sold) || 0) -
                (parseFloat(m.refund_amount) || 0)
        }));

        // Generate forecast
        const avgDailyNet = cashflowHistory.reduce((sum, d) => sum + d.net, 0) / cashflowHistory.length;
        const trend = calculateTrend(cashflowHistory.map(d => d.net));

        const forecast = [];
        let cumulativeCashflow = cashflowHistory.reduce((sum, d) => sum + d.net, 0);

        for (let i = 1; i <= forecast_days; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const projected = avgDailyNet * (1 + trend * i * 0.01);
            cumulativeCashflow += projected;

            forecast.push({
                date: date.toISOString().split('T')[0],
                projected_net: Math.round(projected),
                cumulative: Math.round(cumulativeCashflow),
                lower_bound: Math.round(projected * 0.85),
                upper_bound: Math.round(projected * 1.15)
            });
        }

        const result = await mlService.cashflowForecast(cashflowHistory, forecast_days);

        const analysis = {
            historical_summary: {
                total_inflow: cashflowHistory.reduce((sum, d) => sum + d.inflow, 0),
                total_outflow: cashflowHistory.reduce((sum, d) => sum + d.outflow, 0),
                net_cashflow: cashflowHistory.reduce((sum, d) => sum + d.net, 0),
                avg_daily_net: avgDailyNet.toFixed(2),
                trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable'
            },
            forecast,
            alerts: generateCashflowAlerts(forecast)
        };

        await storeAnalysisResult(clientId, 'cashflow_forecast', analysis, { forecast_days, historical_days });

        res.json({
            success: true,
            analysis_type: 'cashflow_forecast',
            client_id: clientId,
            ...analysis,
            ml_insights: result.data
        });

    } catch (error) {
        console.error('Cashflow Forecast Error:', error);
        res.status(500).json({ error: 'Failed to forecast cashflow', details: error.message });
    }
};

/**
 * 12. Profitability Analysis
 * POST /api/analysis/profitability
 */
const profitability = async (req, res) => {
    try {
        const clientId = req.body.client_id || req.user?.clientId;
        const { historical_days = 90 } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: 'client_id is required' });
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - historical_days);

        const metrics = await dataPrep.getClientMetrics(
            clientId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            `date, revenue, gross_revenue, net_revenue, gross_profit, net_profit,
             gross_margin, net_margin, cost_of_goods_sold, operational_cost, marketing_spend`
        );

        if (!metrics.length) {
            return res.status(400).json({ error: 'No financial data available' });
        }

        // Calculate profitability metrics
        const totals = {
            revenue: metrics.reduce((sum, m) => sum + (parseFloat(m.revenue) || 0), 0),
            gross_profit: metrics.reduce((sum, m) => sum + (parseFloat(m.gross_profit) || 0), 0),
            net_profit: metrics.reduce((sum, m) => sum + (parseFloat(m.net_profit) || 0), 0),
            cogs: metrics.reduce((sum, m) => sum + (parseFloat(m.cost_of_goods_sold) || 0), 0),
            operational_cost: metrics.reduce((sum, m) => sum + (parseFloat(m.operational_cost) || 0), 0),
            marketing_spend: metrics.reduce((sum, m) => sum + (parseFloat(m.marketing_spend) || 0), 0)
        };

        const analysis = {
            period_days: historical_days,
            totals,
            margins: {
                gross_margin: totals.revenue > 0 ? ((totals.gross_profit / totals.revenue) * 100).toFixed(2) : 0,
                net_margin: totals.revenue > 0 ? ((totals.net_profit / totals.revenue) * 100).toFixed(2) : 0,
                operating_margin: totals.revenue > 0 ? (((totals.revenue - totals.cogs - totals.operational_cost) / totals.revenue) * 100).toFixed(2) : 0
            },
            breakeven: {
                daily_revenue_needed: totals.operational_cost > 0 ? (totals.operational_cost / historical_days).toFixed(2) : 0,
                current_daily_revenue: (totals.revenue / historical_days).toFixed(2),
                status: totals.net_profit > 0 ? 'above_breakeven' : 'below_breakeven'
            },
            trends: {
                revenue_trend: calculateTrendFromMetrics(metrics, 'revenue'),
                profit_trend: calculateTrendFromMetrics(metrics, 'net_profit'),
                margin_trend: calculateTrendFromMetrics(metrics, 'net_margin')
            },
            recommendations: generateProfitabilityRecommendations(totals)
        };

        await storeAnalysisResult(clientId, 'profitability', analysis, { historical_days });

        res.json({
            success: true,
            analysis_type: 'profitability',
            client_id: clientId,
            ...analysis
        });

    } catch (error) {
        console.error('Profitability Error:', error);
        res.status(500).json({ error: 'Failed to analyze profitability', details: error.message });
    }
};

/**
 * 13. Revenue Scenarios
 * POST /api/analysis/revenue-scenarios
 */
const revenueScenarios = async (req, res) => {
    try {
        const clientId = req.body.client_id || req.user?.clientId;
        const { forecast_days = 90, historical_days = 180 } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: 'client_id is required' });
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - historical_days);

        const metrics = await dataPrep.getClientMetrics(
            clientId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            'date, revenue, orders, marketing_spend'
        );

        if (metrics.length < 30) {
            return res.status(400).json({ error: 'Insufficient data' });
        }

        // Calculate base stats
        const avgRevenue = metrics.reduce((sum, m) => sum + (parseFloat(m.revenue) || 0), 0) / metrics.length;
        const stdDev = calculateStdDev(metrics.map(m => parseFloat(m.revenue) || 0));
        const trend = calculateTrend(metrics.map(m => parseFloat(m.revenue) || 0));

        // Generate 3 scenarios
        const scenarios = {
            pessimistic: generateScenario('pessimistic', avgRevenue, stdDev, trend, forecast_days),
            realistic: generateScenario('realistic', avgRevenue, stdDev, trend, forecast_days),
            optimistic: generateScenario('optimistic', avgRevenue, stdDev, trend, forecast_days)
        };

        const analysis = {
            historical_summary: {
                avg_daily_revenue: avgRevenue.toFixed(2),
                std_deviation: stdDev.toFixed(2),
                trend: trend > 0.02 ? 'growing' : trend < -0.02 ? 'declining' : 'stable',
                growth_rate: (trend * 100).toFixed(2) + '%'
            },
            scenarios,
            comparison: {
                pessimistic_total: scenarios.pessimistic.total_revenue,
                realistic_total: scenarios.realistic.total_revenue,
                optimistic_total: scenarios.optimistic.total_revenue,
                range: scenarios.optimistic.total_revenue - scenarios.pessimistic.total_revenue
            }
        };

        await storeAnalysisResult(clientId, 'revenue_scenarios', analysis, { forecast_days, historical_days });

        res.json({
            success: true,
            analysis_type: 'revenue_scenarios',
            client_id: clientId,
            ...analysis
        });

    } catch (error) {
        console.error('Revenue Scenarios Error:', error);
        res.status(500).json({ error: 'Failed to generate revenue scenarios', details: error.message });
    }
};

// Financial helper functions
function calculateTrend(values) {
    if (values.length < 2) return 0;
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope / (sumY / n); // Normalized trend
}

function calculateStdDev(values) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
}

function calculateTrendFromMetrics(metrics, field) {
    const values = metrics.map(m => parseFloat(m[field]) || 0);
    const trend = calculateTrend(values);
    return trend > 0.02 ? 'increasing' : trend < -0.02 ? 'decreasing' : 'stable';
}

function generateCashflowAlerts(forecast) {
    const alerts = [];
    const negativeDay = forecast.find(d => d.cumulative < 0);
    if (negativeDay) {
        alerts.push({ type: 'warning', message: `Negative cashflow projected by ${negativeDay.date}` });
    }
    const lowDays = forecast.filter(d => d.projected_net < 0).length;
    if (lowDays > 10) {
        alerts.push({ type: 'caution', message: `${lowDays} days with negative cashflow expected` });
    }
    return alerts;
}

function generateProfitabilityRecommendations(totals) {
    const recs = [];
    const grossMargin = totals.revenue > 0 ? (totals.gross_profit / totals.revenue) : 0;
    const netMargin = totals.revenue > 0 ? (totals.net_profit / totals.revenue) : 0;

    if (grossMargin < 0.3) {
        recs.push({ type: 'pricing', message: 'Gross margin below 30%. Consider price optimization or cost reduction.' });
    }
    if (netMargin < 0.1) {
        recs.push({ type: 'costs', message: 'Net margin below 10%. Review operational costs.' });
    }
    if (totals.marketing_spend > totals.revenue * 0.3) {
        recs.push({ type: 'marketing', message: 'Marketing spend exceeds 30% of revenue. Optimize campaigns.' });
    }
    return recs;
}

function generateScenario(type, avgRevenue, stdDev, trend, days) {
    const multipliers = { pessimistic: 0.7, realistic: 1.0, optimistic: 1.3 };
    const trendMultipliers = { pessimistic: 0.5, realistic: 1.0, optimistic: 1.5 };

    const dailyForecast = [];
    let total = 0;

    for (let i = 1; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const base = avgRevenue * multipliers[type];
        const trendEffect = base * trend * trendMultipliers[type] * i * 0.01;
        const value = Math.max(0, base + trendEffect);
        total += value;

        dailyForecast.push({
            date: date.toISOString().split('T')[0],
            revenue: Math.round(value)
        });
    }

    return {
        scenario: type,
        total_revenue: Math.round(total),
        avg_daily: Math.round(total / days),
        forecast: dailyForecast.slice(0, 30) // Only first 30 days in response
    };
}

module.exports = {
    // Fase 1 MVP
    salesForecast,
    churnPrediction,
    customerSegmentation,
    trendAnalysis,
    anomalyDetection,
    marketingROI,
    // Fase 2 Social
    instagramPerformance,
    tiktokPerformance,
    socialComparison,
    influencerROI,
    // Fase 3 Financial
    cashflowForecast,
    profitability,
    revenueScenarios
};
