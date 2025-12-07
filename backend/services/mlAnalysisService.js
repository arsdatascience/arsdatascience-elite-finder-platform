/**
 * ML Analysis Service
 * Calls ML Service on VPS and handles database operations
 */

const axios = require('axios');
const db = require('../database');

class MLAnalysisService {
    constructor() {
        this.mlServiceUrl = process.env.ML_SERVICE_URL || 'https://arsanalytics.aiiam.com.br';
        this.mlApiKey = process.env.ML_API_KEY || '';
        this.timeout = 30000; // 30 seconds
    }

    /**
     * Helper to make ML Service requests
     */
    async callMLService(endpoint, payload) {
        try {
            const response = await axios.post(
                `${this.mlServiceUrl}${endpoint}`,
                payload,
                {
                    headers: {
                        'X-API-Key': this.mlApiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: this.timeout
                }
            );
            return response.data;
        } catch (error) {
            console.error(`ML Service Error (${endpoint}):`, error.message);
            throw new Error(`Erro ao conectar com serviço ML: ${error.message}`);
        }
    }

    /**
     * Previsão de Vendas
     * @param {number} clientId - ID do cliente
     * @param {Object} params - Parâmetros (days, historyDays)
     */
    async salesForecast(clientId, params = {}) {
        try {
            // 1. Buscar dados do cliente (Crossover DB)
            const clientResult = await db.query(
                'SELECT * FROM clients WHERE id = $1',
                [clientId]
            );

            if (clientResult.rows.length === 0) {
                throw new Error('Cliente não encontrado');
            }

            const client = clientResult.rows[0];

            // 2. Buscar métricas históricas
            const historyDays = params.historyDays || 365;
            const metricsResult = await db.query(`
        SELECT * FROM client_metrics 
        WHERE client_id = $1 
        ORDER BY date ASC 
        LIMIT $2
      `, [clientId, historyDays]);

            const metrics = metricsResult.rows;

            if (metrics.length < 30) {
                throw new Error('Dados insuficientes. Mínimo 30 dias de histórico necessário.');
            }

            // 3. Preparar payload para ML Service
            const payload = {
                client_id: String(clientId),
                client_type: client.segment || 'ecommerce',
                industry: client.industry || 'retail',
                historical_data: metrics.map(m => ({
                    date: m.date instanceof Date ? m.date.toISOString().split('T')[0] : m.date,
                    revenue: Number(m.revenue || 0),
                    visits: Number(m.visits || 0),
                    conversion_rate: Number(m.conversion_rate || 0),
                    avg_ticket: Number(m.avg_order_value || 0),
                    marketing_spend: Number(m.marketing_spend || 0)
                })),
                analysis_type: 'sales_forecast',
                time_horizon: params.days || 30,
                model_preference: 'xgboost'
            };

            // 4. Chamar ML Service
            const mlResponse = await this.callMLService('/analysis/sales-forecast', payload);

            // 5. Salvar resultado (Maglev/Ops DB)
            try {
                await db.opsQuery(`
          INSERT INTO ml_sales_analytics 
          (client_id, analysis_type, algorithm, primary_metric_name, primary_metric_value, secondary_metrics, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
                    clientId,
                    'sales_forecast',
                    mlResponse.model_used || 'xgboost',
                    'predicted_revenue',
                    mlResponse.predictions?.[0] || 0,
                    JSON.stringify({
                        confidence_score: mlResponse.confidence_score,
                        all_predictions: mlResponse.predictions,
                        insights: mlResponse.insights,
                        feature_importance: mlResponse.feature_importance
                    })
                ]);
            } catch (dbError) {
                console.warn('Erro ao salvar análise ML:', dbError.message);
                // Continuar mesmo se não conseguir salvar
            }

            return {
                success: true,
                predictions: mlResponse.predictions || [],
                insights: mlResponse.insights || [],
                confidence: mlResponse.confidence_score || 0.8,
                model: mlResponse.model_used || 'xgboost',
                feature_importance: mlResponse.feature_importance || {},
                historical_data: metrics.slice(-30)
            };

        } catch (error) {
            console.error('Erro em salesForecast:', error);
            throw error;
        }
    }

    /**
     * Análise de Instagram
     * @param {number} clientId - ID do cliente
     * @param {Object} params - Parâmetros (period)
     */
    async instagramAnalysis(clientId, params = {}) {
        try {
            const period = params.period || 7;

            const metricsResult = await db.query(`
        SELECT * FROM client_metrics 
        WHERE client_id = $1 
        ORDER BY date DESC 
        LIMIT $2
      `, [clientId, period]);

            const metrics = metricsResult.rows;

            if (metrics.length === 0) {
                throw new Error('Sem dados de Instagram disponíveis');
            }

            // Agregar métricas
            const summary = {
                followers_gain: metrics.reduce((sum, m) => sum + (Number(m.instagram_followers_gain) || 0), 0),
                total_reach: metrics.reduce((sum, m) => sum + (Number(m.instagram_reach) || 0), 0),
                total_engagement: metrics.reduce((sum, m) => sum + (Number(m.instagram_engagement) || 0), 0),
                total_likes: metrics.reduce((sum, m) => sum + (Number(m.instagram_likes) || 0), 0),
                total_comments: metrics.reduce((sum, m) => sum + (Number(m.instagram_comments) || 0), 0),
                total_shares: metrics.reduce((sum, m) => sum + (Number(m.instagram_shares) || 0), 0),
                total_saves: metrics.reduce((sum, m) => sum + (Number(m.instagram_saves) || 0), 0),
                reels_views: metrics.reduce((sum, m) => sum + (Number(m.instagram_reels_views) || 0), 0),
                stories_reach: metrics.reduce((sum, m) => sum + (Number(m.instagram_stories_reach) || 0), 0),
                avg_engagement_rate: metrics.reduce((sum, m) => sum + (Number(m.instagram_engagement_rate) || 0), 0) / metrics.length
            };

            // Calcular crescimento
            const oldMetrics = metrics[metrics.length - 1] || {};
            const newMetrics = metrics[0] || {};

            const oldFollowers = Number(oldMetrics.instagram_followers) || 1;
            const newFollowers = Number(newMetrics.instagram_followers) || 0;
            const oldReach = Number(oldMetrics.instagram_reach) || 1;

            const growth = {
                followers: (((newFollowers - oldFollowers) / oldFollowers) * 100).toFixed(1),
                reach: (((summary.total_reach / period - oldReach) / oldReach) * 100).toFixed(1)
            };

            return {
                success: true,
                period,
                summary,
                growth,
                latest: newMetrics,
                chart_data: [...metrics].reverse().map(m => ({
                    date: m.date,
                    reach: Number(m.instagram_reach) || 0,
                    engagement: Number(m.instagram_engagement) || 0,
                    followers: Number(m.instagram_followers) || 0
                }))
            };

        } catch (error) {
            console.error('Erro em instagramAnalysis:', error);
            throw error;
        }
    }

    /**
     * Análise de TikTok
     * @param {number} clientId - ID do cliente
     * @param {Object} params - Parâmetros (period)
     */
    async tiktokAnalysis(clientId, params = {}) {
        try {
            const period = params.period || 7;

            const metricsResult = await db.query(`
        SELECT * FROM client_metrics 
        WHERE client_id = $1 
        ORDER BY date DESC 
        LIMIT $2
      `, [clientId, period]);

            const metrics = metricsResult.rows;

            if (metrics.length === 0) {
                throw new Error('Sem dados de TikTok disponíveis');
            }

            const summary = {
                total_views: metrics.reduce((sum, m) => sum + (Number(m.tiktok_video_views) || 0), 0),
                total_likes: metrics.reduce((sum, m) => sum + (Number(m.tiktok_likes) || 0), 0),
                total_comments: metrics.reduce((sum, m) => sum + (Number(m.tiktok_comments) || 0), 0),
                total_shares: metrics.reduce((sum, m) => sum + (Number(m.tiktok_shares) || 0), 0),
                followers_gain: metrics.reduce((sum, m) => sum + (Number(m.tiktok_followers_gain) || 0), 0),
                avg_engagement_rate: metrics.reduce((sum, m) => sum + (Number(m.tiktok_engagement_rate) || 0), 0) / metrics.length
            };

            return {
                success: true,
                period,
                summary,
                chart_data: [...metrics].reverse().map(m => ({
                    date: m.date,
                    views: Number(m.tiktok_video_views) || 0,
                    engagement: Number(m.tiktok_engagement) || 0,
                    followers: Number(m.tiktok_followers) || 0
                }))
            };

        } catch (error) {
            console.error('Erro em tiktokAnalysis:', error);
            throw error;
        }
    }

    /**
     * Detecção de Anomalias
     * @param {number} clientId - ID do cliente
     * @param {Object} params - Parâmetros (days)
     */
    async anomalyDetection(clientId, params = {}) {
        try {
            const days = params.days || 30;

            const metricsResult = await db.query(`
        SELECT * FROM client_metrics 
        WHERE client_id = $1 
        ORDER BY date DESC 
        LIMIT $2
      `, [clientId, days]);

            const metrics = metricsResult.rows;

            if (metrics.length < 7) {
                throw new Error('Dados insuficientes para detecção de anomalias');
            }

            const payload = {
                client_id: String(clientId),
                historical_data: metrics.map(m => ({
                    date: m.date instanceof Date ? m.date.toISOString().split('T')[0] : m.date,
                    revenue: Number(m.revenue || 0),
                    orders: Number(m.orders || 0),
                    visits: Number(m.visits || 0),
                    conversion_rate: Number(m.conversion_rate || 0)
                }))
            };

            const mlResponse = await this.callMLService('/analysis/anomaly-detection', payload);

            return {
                success: true,
                anomalies: mlResponse.anomalies || [],
                insights: mlResponse.insights || [],
                affected_metrics: mlResponse.affected_metrics || []
            };

        } catch (error) {
            console.error('Erro em anomalyDetection:', error);
            throw error;
        }
    }

    /**
     * Dashboard Summary
     * @param {number} clientId - ID do cliente
     */
    async dashboardSummary(clientId) {
        try {
            const metricsResult = await db.query(`
        SELECT * FROM client_metrics 
        WHERE client_id = $1 
          AND date >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY date DESC
      `, [clientId]);

            const metrics = metricsResult.rows;

            if (metrics.length === 0) {
                throw new Error('Sem dados disponíveis para os últimos 7 dias');
            }

            const summary = {
                total_revenue: metrics.reduce((sum, m) => sum + Number(m.revenue || 0), 0),
                total_orders: metrics.reduce((sum, m) => sum + (Number(m.orders) || 0), 0),
                total_visits: metrics.reduce((sum, m) => sum + (Number(m.visits) || 0), 0),
                avg_conversion: metrics.reduce((sum, m) => sum + Number(m.conversion_rate || 0), 0) / metrics.length,
                instagram_followers_gain: metrics.reduce((sum, m) => sum + (Number(m.instagram_followers_gain) || 0), 0),
                tiktok_views: metrics.reduce((sum, m) => sum + (Number(m.tiktok_video_views) || 0), 0)
            };

            return {
                success: true,
                period: '7 dias',
                summary,
                metrics
            };

        } catch (error) {
            console.error('Erro em dashboardSummary:', error);
            throw error;
        }
    }

    /**
     * Marketing ROI Analysis
     * @param {number} clientId - ID do cliente
     * @param {Object} params - Parâmetros
     */
    async marketingROI(clientId, params = {}) {
        try {
            const days = params.days || 30;

            const metricsResult = await db.query(`
        SELECT * FROM client_metrics 
        WHERE client_id = $1 
        ORDER BY date DESC 
        LIMIT $2
      `, [clientId, days]);

            const metrics = metricsResult.rows;

            if (metrics.length === 0) {
                throw new Error('Sem dados de marketing disponíveis');
            }

            const totalSpend = metrics.reduce((sum, m) => sum + Number(m.marketing_spend || 0), 0);
            const totalRevenue = metrics.reduce((sum, m) => sum + Number(m.revenue || 0), 0);
            const totalOrders = metrics.reduce((sum, m) => sum + Number(m.orders || 0), 0);

            const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend * 100) : 0;
            const cac = totalOrders > 0 ? (totalSpend / totalOrders) : 0;

            return {
                success: true,
                period: `${days} dias`,
                metrics: {
                    total_spend: totalSpend,
                    total_revenue: totalRevenue,
                    total_orders: totalOrders,
                    roi: roi.toFixed(2),
                    cac: cac.toFixed(2),
                    roas: totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : 0
                }
            };

        } catch (error) {
            console.error('Erro em marketingROI:', error);
            throw error;
        }
    }

    /**
     * Customer Segmentation
     * @param {number} clientId - ID do cliente (unused, gets all customers)
     */
    async customerSegmentation(clientId) {
        try {
            // This would typically call the ML service for K-means clustering
            const payload = { client_id: String(clientId) };
            const mlResponse = await this.callMLService('/analysis/customer-segmentation', payload);

            return {
                success: true,
                segments: mlResponse.segments || [],
                insights: mlResponse.insights || []
            };

        } catch (error) {
            console.error('Erro em customerSegmentation:', error);
            throw error;
        }
    }
}

module.exports = new MLAnalysisService();
